import React, { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, FileText, Image as ImageIcon, Lock, Presentation, Unlock, X } from 'lucide-react';
import type { CorporateDocument, DocumentFormat } from '../types/portal';
import { decryptSensitiveText } from '../utils/cryptoEngine';
import { MonogramLogo } from './MonogramLogo';
import { ImageProcessor } from './ImageProcessor';

interface EditorialDocumentViewerProps {
  documents: CorporateDocument[];
  completedIds: Set<string>;
  selectedDocument?: CorporateDocument | null;
  onSelectDocument?: (docItem: CorporateDocument | null) => void;
  onConfirmDocumentRead: (docItem: CorporateDocument) => Promise<void>;
  isAuthenticated: boolean;
  customLogoUrl?: string;
}

const FORMAT_LABELS: Record<DocumentFormat, string> = {
  pdf: 'PDF Institucional',
  docx: 'Documento Word (.docx)',
  xlsx: 'Planilha Executiva (.xlsx)',
  pptx: 'Apresentação (.pptx)',
  txt: 'Nota Técnica (.txt)',
  image: 'Prancha Visual 16:9',
};

function FormatIcon({ format }: { format: DocumentFormat }) {
  if (format === 'xlsx') return <FileSpreadsheet className="w-4 h-4 text-[#C5A467]" />;
  if (format === 'pptx') return <Presentation className="w-4 h-4 text-[#C5A467]" />;
  if (format === 'image') return <ImageIcon className="w-4 h-4 text-[#C5A467]" />;
  return <FileText className="w-4 h-4 text-[#C5A467]" />;
}

/**
 * Renderiza conteúdo extraído (títulos, parágrafos e tabelas Markdown geradas pelo motor universal)
 * dentro da coluna editorial de 65-75 caracteres da Cavalcante & Rolim.
 */
function EditorialBodyRenderer({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('# ')) {
          return (
            <h3
              key={idx}
              className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white pt-2"
            >
              {trimmed.slice(2)}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          const [headingLine, ...restLines] = trimmed.split('\n');
          return (
            <div key={idx} className="pt-2 space-y-2">
              <h4 className="font-serif text-xl font-semibold text-[#11382B] dark:text-[#D8BC83]">
                {headingLine.slice(3)}
              </h4>
              {restLines.length > 0 && (
                <EditorialBodyRenderer content={restLines.join('\n')} />
              )}
            </div>
          );
        }

        // Tabela Markdown gerada para planilhas .xlsx
        if (trimmed.includes('|') && trimmed.split('\n').length >= 2) {
          const lines = trimmed
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.startsWith('|'));
          if (lines.length >= 2) {
            const parseRow = (rowLine: string) =>
              rowLine
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map((cell) => cell.trim());

            const headers = parseRow(lines[0]);
            const dataRows = lines.slice(2).map(parseRow);

            return (
              <div
                key={idx}
                className="overflow-x-auto border border-[#1C2421]/15 dark:border-white/15 rounded-lg"
              >
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-[#11382B] text-[#D8BC83]">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2421]/10 dark:divide-white/10 bg-white dark:bg-[#0B1410]">
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-4 py-2.5 text-[#1C2421] dark:text-white/85 tabular-nums"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        return (
          <p
            key={idx}
            className="text-[15px] text-[#1C2421]/85 dark:text-white/85 leading-[1.78] whitespace-pre-line"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export const EditorialDocumentViewer: React.FC<EditorialDocumentViewerProps> = ({
  documents,
  completedIds,
  selectedDocument,
  onSelectDocument,
  onConfirmDocumentRead,
  isAuthenticated,
  customLogoUrl,
}) => {
  const [internalSelectedDoc, setInternalSelectedDoc] = useState<CorporateDocument | null>(null);
  const activeDoc = selectedDocument !== undefined ? selectedDocument : internalSelectedDoc;
  const setActiveDoc = (docItem: CorporateDocument | null) => {
    if (onSelectDocument) {
      onSelectDocument(docItem);
    } else {
      setInternalSelectedDoc(docItem);
    }
  };

  const [passphrase, setPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const openDocument = (docItem: CorporateDocument) => {
    setActiveDoc(docItem);
    setPassphrase('');
    setDecryptedText(null);
    setDecryptError(null);
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc?.encryptedEnvelope) return;
    setDecryptError(null);
    try {
      const plain = await decryptSensitiveText(activeDoc.encryptedEnvelope, passphrase);
      setDecryptedText(plain);
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : 'Falha ao decifrar documento.');
    }
  };

  const handleConfirm = async (docItem: CorporateDocument) => {
    setConfirming(true);
    try {
      await onConfirmDocumentRead(docItem);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section
      id="documentos"
      className="py-16 sm:py-20 bg-[#F8F7F4] dark:bg-[#0B1410] border-b border-[#1C2421]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-2">
              Template Editorial Padrão
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white">
              Acervo Documental &amp; Manuais
            </h2>
          </div>
          <p className="text-sm text-[#1C2421]/70 dark:text-white/70 max-w-md">
            Documentos PDF, Word, Excel, PowerPoint e pranchas visuais padronizados na estética editorial C&amp;R.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="py-14 text-center bg-white dark:bg-[#11241C] border border-[#C5A467]/30 rounded-xl">
            <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
              {isAuthenticated
                ? 'Nenhum documento corporativo publicado ainda.'
                : 'Entre com sua conta Google corporativa para consultar o acervo documental.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1C2421]/10 dark:divide-white/10 bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-xl overflow-hidden">
            {documents.map((docItem) => {
              const isRead = completedIds.has(docItem.id);
              return (
                <div
                  key={docItem.id}
                  onClick={() => openDocument(docItem)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8F7F4]/70 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-[#11382B] border border-[#C5A467]/60 flex items-center justify-center shrink-0">
                      {docItem.isEncrypted ? (
                        <Lock className="w-4 h-4 text-[#D8BC83]" />
                      ) : (
                        <FormatIcon format={docItem.sourceFormat} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1C2421]/60 dark:text-white/60 mb-1">
                        <span className="font-mono text-[#11382B] dark:text-[#D8BC83]">
                          {docItem.docCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{FORMAT_LABELS[docItem.sourceFormat]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{docItem.category}</span>
                        {docItem.isEncrypted && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#11382B] dark:text-[#D8BC83]">
                              Criptografado E2EE
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white truncate">
                        {docItem.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-mono text-[#1C2421]/70 dark:text-white/70 tabular-nums">
                      +{docItem.pointsReward} pts
                    </span>
                    {isRead && (
                      <span className="text-xs font-medium text-[#11382B] dark:text-[#D8BC83]">
                        Confirmado
                      </span>
                    )}
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B] hover:text-white transition-colors cursor-pointer"
                    >
                      Abrir Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Template Editorial Padrão da Cavalcante & Rolim */}
      {activeDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editorial-doc-title"
        >
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467] rounded-xl shadow-2xl">
            {/* Cabeçalho Oficial da Construtora no Documento */}
            <div className="px-6 sm:px-10 py-6 bg-[#11382B] text-white border-b border-[#C5A467] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <MonogramLogo customLogoUrl={customLogoUrl} onDarkSurface />
                <div className="hidden sm:block h-6 w-px bg-[#C5A467]/40" />
                <span className="hidden sm:inline text-xs tracking-widest uppercase text-[#D8BC83] truncate">
                  Signature Spaces · Documento Oficial
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="w-9 h-9 rounded-lg border border-[#C5A467]/60 flex items-center justify-center text-white hover:bg-[#0B241B] cursor-pointer"
                aria-label="Fechar documento editorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo Editorial */}
            <div className="px-6 sm:px-12 py-10 max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[#1C2421]/60 dark:text-white/60 mb-3">
                <span className="font-mono text-[#11382B] dark:text-[#D8BC83]">
                  {activeDoc.docCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeDoc.category}</span>
                <span aria-hidden="true">·</span>
                <span>{FORMAT_LABELS[activeDoc.sourceFormat]}</span>
              </div>

              <h3
                id="editorial-doc-title"
                className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white leading-tight pb-6 border-b border-[#C5A467]/40 mb-8"
              >
                {activeDoc.title}
              </h3>

              {activeDoc.imageDataUrl && (
                <div className="mb-8">
                  <ImageProcessor
                    src={activeDoc.imageDataUrl}
                    alt={activeDoc.title}
                    aspectRatio="16:9"
                    variant="modal"
                    roundedClassName="rounded-xl"
                    enableZoom
                  />
                </div>
              )}

              {activeDoc.isEncrypted && !decryptedText ? (
                <form
                  onSubmit={handleDecrypt}
                  className="p-6 rounded-xl bg-white dark:bg-[#0B1410] border border-[#C5A467]/60 space-y-4"
                >
                  <div className="flex items-center gap-3 text-[#11382B] dark:text-[#D8BC83]">
                    <Lock className="w-5 h-5 text-[#C5A467]" />
                    <h4 className="font-serif text-xl font-semibold">
                      Conteúdo Protegido por Criptografia E2EE (AES-GCM-256)
                    </h4>
                  </div>
                  <p className="text-sm text-[#1C2421]/75 dark:text-white/75">
                    Este documento foi cifrado ponta a ponta antes do armazenamento. Informe a chave criptográfica corporativa para decifrar localmente no navegador.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Chave criptográfica E2EE"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#11241C] text-sm text-[#1C2421] dark:text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-sm font-semibold cursor-pointer"
                    >
                      <Unlock className="w-4 h-4 text-[#C5A467]" />
                      <span>Decifrar Documento</span>
                    </button>
                  </div>
                  {decryptError && (
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      {decryptError}
                    </p>
                  )}
                </form>
              ) : (
                <EditorialBodyRenderer
                  content={decryptedText || activeDoc.extractedContent || ''}
                />
              )}

              {/* Rodapé Institucional do Template Editorial */}
              <div className="mt-12 pt-6 border-t border-[#C5A467]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#1C2421]/65 dark:text-white/65">
                  <p className="font-semibold text-[#11382B] dark:text-[#D8BC83]">
                    Cavalcante &amp; Rolim Empreendimentos — Padrão Editorial Signature Spaces
                  </p>
                  <p>Responsável: {activeDoc.authorName}</p>
                </div>

                {completedIds.has(activeDoc.id) ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A467]" />
                    Leitura Registrada
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={confirming || !isAuthenticated}
                    onClick={() => handleConfirm(activeDoc)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] disabled:opacity-50 text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {confirming
                        ? 'Registrando...'
                        : `Confirmar Ciência (+${activeDoc.pointsReward} pts)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
