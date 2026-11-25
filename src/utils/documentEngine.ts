import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { DocumentFormat } from '../types/portal';
import { standardizeMediaImage } from './mediaEngine';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedDocumentResult {
  title: string;
  sourceFormat: DocumentFormat;
  extractedContent: string;
  imageDataUrl?: string;
  wordCount: number;
  unitLabel: string;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Documento Corporativo';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function extractPdfText(file: File): Promise<{ content: string; pages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const sections: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (lines) {
      sections.push(`## Página ${pageNum}\n${lines}`);
    }
  }

  return {
    content: sections.join('\n\n') || 'Documento PDF importado sem camada de texto selecionável.',
    pages: pdf.numPages,
  };
}

async function extractDocxText(file: File): Promise<{ content: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const cleaned = result.value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n');
  return { content: cleaned || 'Documento Word vazio.' };
}

async function extractXlsxText(file: File): Promise<{ content: string; sheets: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(worksheet, {
      header: 1,
      defval: '',
    });

    const nonEmptyRows = rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
    if (nonEmptyRows.length === 0) continue;

    const maxCols = Math.min(8, Math.max(...nonEmptyRows.map((r) => r.length)));
    const headerRow = nonEmptyRows[0].slice(0, maxCols).map((c) => String(c || 'Coluna').replace(/\|/g, '/'));
    const separatorRow = headerRow.map(() => '---');
    const bodyRows = nonEmptyRows.slice(1, 60).map((r) => {
      const cells: string[] = [];
      for (let i = 0; i < maxCols; i += 1) {
        cells.push(String(r[i] ?? '').replace(/\|/g, '/').trim());
      }
      return `| ${cells.join(' | ')} |`;
    });

    const tableMd = [
      `## Planilha: ${sheetName}`,
      `| ${headerRow.join(' | ')} |`,
      `| ${separatorRow.join(' | ')} |`,
      ...bodyRows,
    ].join('\n');

    sections.push(tableMd);
  }

  return {
    content: sections.join('\n\n') || 'Planilha sem registros preenchidos.',
    sheets: workbook.SheetNames.length,
  };
}

async function extractPptxText(file: File): Promise<{ content: string; slides: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideKeys = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
      const numB = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
      return numA - numB;
    });

  const parser = new DOMParser();
  const slideBlocks: string[] = [];

  for (let i = 0; i < slideKeys.length; i += 1) {
    const xmlStr = await zip.files[slideKeys[i]].async('string');
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
    const textNodes = Array.from(xmlDoc.getElementsByTagName('a:t'));
    const texts = textNodes.map((n) => n.textContent?.trim() || '').filter(Boolean);
    if (texts.length > 0) {
      const [first, ...rest] = texts;
      slideBlocks.push(`## Slide ${i + 1}: ${first}\n${rest.join(' ')}`);
    } else {
      slideBlocks.push(`## Slide ${i + 1}\nConteúdo visual sem caixas de texto.`);
    }
  }

  return {
    content: slideBlocks.join('\n\n') || 'Apresentação sem slides extraíveis.',
    slides: slideKeys.length,
  };
}

export async function importUniversalDocument(file: File): Promise<ExtractedDocumentResult> {
  const lower = file.name.toLowerCase();
  const title = stripExtension(file.name);

  if (lower.endsWith('.pdf')) {
    const { content, pages } = await extractPdfText(file);
    return {
      title,
      sourceFormat: 'pdf',
      extractedContent: content,
      wordCount: countWords(content),
      unitLabel: `${pages} ${pages === 1 ? 'página' : 'páginas'}`,
    };
  }

  if (lower.endsWith('.docx')) {
    const { content } = await extractDocxText(file);
    return {
      title,
      sourceFormat: 'docx',
      extractedContent: content,
      wordCount: countWords(content),
      unitLabel: 'Documento Word (.docx)',
    };
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const { content, sheets } = await extractXlsxText(file);
    return {
      title,
      sourceFormat: 'xlsx',
      extractedContent: content,
      wordCount: countWords(content),
      unitLabel: `${sheets} ${sheets === 1 ? 'aba' : 'abas'}`,
    };
  }

  if (lower.endsWith('.pptx')) {
    const { content, slides } = await extractPptxText(file);
    return {
      title,
      sourceFormat: 'pptx',
      extractedContent: content,
      wordCount: countWords(content),
      unitLabel: `${slides} ${slides === 1 ? 'slide' : 'slides'}`,
    };
  }

  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv')) {
    const text = (await file.text()).trim();
    return {
      title,
      sourceFormat: 'txt',
      extractedContent: text || 'Arquivo de texto vazio.',
      wordCount: countWords(text),
      unitLabel: 'Texto Corporativo (.txt)',
    };
  }

  if (/\.(png|jpe?g|webp)$/i.test(lower)) {
    const standardized = await standardizeMediaImage(file, 'banner-16-9', 'auto');
    const modeNote =
      standardized.appliedFraming === 'contain-framed'
        ? 'enquadrada integralmente sem cortes dentro da moldura C&R'
        : 'padronizada em preenchimento 16:9';
    const summaryText = `## Registro Visual Padronizado\nArquivo original "${file.name}" (${standardized.originalWidth}×${standardized.originalHeight}px) ${modeNote} em ${standardized.width}×${standardized.height}px (${standardized.aspectRatioLabel}) com redução de ${standardized.compressionRatio}% no peso de armazenamento.`;
    return {
      title,
      sourceFormat: 'image',
      extractedContent: summaryText,
      imageDataUrl: standardized.dataUrl,
      wordCount: countWords(summaryText),
      unitLabel: 'Imagem 16:9 Adaptada',
    };
  }

  throw new Error(
    'Formato não suportado. Utilize arquivos .pdf, .docx, .xlsx, .pptx, .txt ou imagens (.png, .jpg, .webp).'
  );
}
