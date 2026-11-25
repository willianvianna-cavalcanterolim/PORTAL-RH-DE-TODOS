/**
 * Motor Inteligente de Leitura, Adaptação e Padronização de Mídia
 * ------------------------------------------------------------------
 * Analisa automaticamente as dimensões e proporções de qualquer imagem enviada:
 * - Imagens paisagem compatíveis (16:9, 3:2, 4:3): recorte inteligente preenchido.
 * - Cartazes verticais, retratos, flyers, prints quadrados ou panorâmicos extremos:
 *   enquadramento integral ("contain-framed") centralizado sobre moldura arquitetônica
 *   Verde Esmeralda (#11382B) e filete Dourado (#C5A467), preservando 100% do conteúdo
 *   sem cortar textos, cabeçalhos ou QR Codes.
 * - Avatares 1:1: foco no terço superior para nunca cortar rostos.
 * - Logotipos 1:1: preservação integral sem cortes nas extremidades.
 */

export type MediaPreset = 'banner-16-9' | 'avatar-1-1' | 'card-4-3' | 'logo-1-1';
export type MediaFramingMode = 'auto' | 'contain-framed' | 'cover';

export interface StandardizedMediaResult {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatioLabel: string;
  originalWidth: number;
  originalHeight: number;
  detectedOrientation: 'landscape' | 'portrait' | 'square';
  appliedFraming: 'cover' | 'contain-framed';
  originalBytes: number;
  optimizedBytes: number;
  compressionRatio: number;
}

export const PRESET_SPECS: Record<
  MediaPreset,
  { width: number; height: number; aspectLabel: string; maxChars: number }
> = {
  'banner-16-9': { width: 1280, height: 720, aspectLabel: '16:9', maxChars: 270000 },
  'card-4-3': { width: 960, height: 720, aspectLabel: '4:3', maxChars: 240000 },
  'avatar-1-1': { width: 480, height: 480, aspectLabel: '1:1', maxChars: 180000 },
  'logo-1-1': { width: 320, height: 320, aspectLabel: '1:1', maxChars: 140000 },
};

function loadImageElement(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

export function resolveAppliedFraming(
  preset: MediaPreset,
  sourceRatio: number,
  targetRatio: number,
  requestedMode: MediaFramingMode
): 'cover' | 'contain-framed' {
  if (requestedMode === 'contain-framed') return 'contain-framed';
  if (requestedMode === 'cover') return 'cover';

  // Modo 'auto': analisa a geometria da imagem ao ler o arquivo
  if (preset === 'logo-1-1') {
    return 'contain-framed';
  }

  if (preset === 'avatar-1-1') {
    // Retratos/fotos comuns preenchem o quadrado 1:1; banners extremos preservam o todo
    return sourceRatio < 0.55 || sourceRatio > 2.2 ? 'contain-framed' : 'cover';
  }

  // Para banners 16:9 e cartões 4:3:
  // Imagens verticais (cartazes/infográficos), quadradas ou muito estreitas seriam cortadas
  // em >35% no recorte cover; adaptamos automaticamente para moldura integral sem cortes.
  const ratioMismatch = Math.max(sourceRatio / targetRatio, targetRatio / sourceRatio);
  if (sourceRatio < 1.25 || ratioMismatch > 1.42) {
    return 'contain-framed';
  }

  return 'cover';
}

export interface CanvasRenderOptions {
  preset: MediaPreset;
  framingMode?: MediaFramingMode;
  targetCanvas?: HTMLCanvasElement | null;
  quality?: number;
  maxChars?: number;
}

export interface CanvasRenderOutput {
  dataUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  detectedOrientation: 'landscape' | 'portrait' | 'square';
  appliedFraming: 'cover' | 'contain-framed';
}

export function renderImageOnCanvas(
  img: HTMLImageElement,
  options: CanvasRenderOptions
): CanvasRenderOutput {
  const { preset, framingMode = 'auto', targetCanvas } = options;
  const spec = PRESET_SPECS[preset];
  const maxChars = options.maxChars ?? spec.maxChars;
  const initialQuality = options.quality ?? 0.88;

  const naturalWidth = Math.max(1, img.naturalWidth);
  const naturalHeight = Math.max(1, img.naturalHeight);
  const sourceRatio = naturalWidth / naturalHeight;
  const targetRatio = spec.width / spec.height;

  const detectedOrientation: CanvasRenderOutput['detectedOrientation'] =
    Math.abs(sourceRatio - 1) <= 0.08
      ? 'square'
      : sourceRatio > 1
      ? 'landscape'
      : 'portrait';

  const appliedFraming = resolveAppliedFraming(preset, sourceRatio, targetRatio, framingMode);

  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto gráfico indisponível para padronização.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (appliedFraming === 'cover') {
    let sx = 0;
    let sy = 0;
    let sWidth = naturalWidth;
    let sHeight = naturalHeight;

    if (sourceRatio > targetRatio) {
      sWidth = naturalHeight * targetRatio;
      sx = (naturalWidth - sWidth) / 2;
    } else {
      sHeight = naturalWidth / targetRatio;
      // Para avatares 1:1 verticais, prioriza o terço superior (rosto) em vez do centro exato
      const verticalBias = preset === 'avatar-1-1' ? 0.25 : 0.5;
      sy = (naturalHeight - sHeight) * verticalBias;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, spec.width, spec.height);
  } else {
    // Enquadramento integral (contain-framed): preserva 100% da imagem dentro do padrão C&R
    ctx.fillStyle = '#0B241B';
    ctx.fillRect(0, 0, spec.width, spec.height);

    // Fundo atmosférico suave derivado da própria imagem + véu Verde Esmeralda
    ctx.save();
    let bgW = spec.width;
    let bgH = spec.height;
    let bgX = 0;
    let bgY = 0;
    if (sourceRatio > targetRatio) {
      bgW = spec.height * sourceRatio;
      bgX = (spec.width - bgW) / 2;
    } else {
      bgH = spec.width / sourceRatio;
      bgY = (spec.height - bgH) / 2;
    }
    ctx.filter = 'blur(26px) brightness(0.45)';
    ctx.drawImage(img, bgX - 24, bgY - 24, bgW + 48, bgH + 48);
    ctx.restore();

    const grad = ctx.createLinearGradient(0, 0, spec.width, spec.height);
    grad.addColorStop(0, 'rgba(11, 36, 27, 0.72)');
    grad.addColorStop(0.5, 'rgba(17, 56, 43, 0.58)');
    grad.addColorStop(1, 'rgba(11, 36, 27, 0.76)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, spec.width, spec.height);

    // Área útil central com respiro arquitetônico
    const padX = preset === 'logo-1-1' ? 18 : 34;
    const padY = preset === 'logo-1-1' ? 18 : 22;
    const availW = spec.width - padX * 2;
    const availH = spec.height - padY * 2;

    let drawW = availW;
    let drawH = drawW / sourceRatio;
    if (drawH > availH) {
      drawH = availH;
      drawW = drawH * sourceRatio;
    }
    const drawX = Math.round((spec.width - drawW) / 2);
    const drawY = Math.round((spec.height - drawH) / 2);

    // Sombra sutil e filete dourado Cavalcante & Rolim (#C5A467)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#11382B';
    ctx.fillRect(drawX, drawY, Math.round(drawW), Math.round(drawH));
    ctx.restore();

    ctx.drawImage(img, drawX, drawY, Math.round(drawW), Math.round(drawH));

    ctx.strokeStyle = 'rgba(197, 164, 103, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, drawY, Math.round(drawW), Math.round(drawH));
  }

  // Compressão adaptativa garantindo integridade dentro dos limites do banco de dados
  const mime = preset === 'logo-1-1' ? 'image/webp' : 'image/jpeg';
  let quality = initialQuality;
  let outputUrl = canvas.toDataURL(mime, quality);

  while (outputUrl.length > maxChars && quality > 0.44) {
    quality -= 0.08;
    outputUrl = canvas.toDataURL(mime, quality);
  }

  if (outputUrl.length > maxChars) {
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = Math.round(spec.width * 0.78);
    scaleCanvas.height = Math.round(spec.height * 0.78);
    const sCtx = scaleCanvas.getContext('2d');
    if (sCtx) {
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
      outputUrl = scaleCanvas.toDataURL(mime, 0.78);
    }
  }

  return {
    dataUrl: outputUrl,
    width: spec.width,
    height: spec.height,
    originalWidth: naturalWidth,
    originalHeight: naturalHeight,
    detectedOrientation,
    appliedFraming,
  };
}

export async function standardizeImageUrl(
  src: string,
  options: CanvasRenderOptions
): Promise<CanvasRenderOutput> {
  const isRemoteHttp = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
  const img = await loadImageElement(src, isRemoteHttp);

  const spec = PRESET_SPECS[options.preset];
  const maxChars = options.maxChars ?? spec.maxChars;
  const naturalRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const targetRatio = spec.width / spec.height;

  // Evita re-compressão redundante se o dataUrl já veio padronizado no tamanho exato do preset
  if (
    src.startsWith('data:image/') &&
    img.naturalWidth === spec.width &&
    img.naturalHeight === spec.height &&
    src.length <= maxChars &&
    options.framingMode !== 'cover'
  ) {
    if (options.targetCanvas) {
      const ctx = options.targetCanvas.getContext('2d');
      options.targetCanvas.width = spec.width;
      options.targetCanvas.height = spec.height;
      ctx?.drawImage(img, 0, 0, spec.width, spec.height);
    }
    return {
      dataUrl: src,
      width: spec.width,
      height: spec.height,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
      detectedOrientation:
        Math.abs(naturalRatio - 1) <= 0.08
          ? 'square'
          : naturalRatio > 1
          ? 'landscape'
          : 'portrait',
      appliedFraming: resolveAppliedFraming(
        options.preset,
        naturalRatio,
        targetRatio,
        options.framingMode || 'auto'
      ),
    };
  }

  return renderImageOnCanvas(img, options);
}

export async function standardizeMediaImage(
  file: File,
  preset: MediaPreset,
  framingMode: MediaFramingMode = 'auto'
): Promise<StandardizedMediaResult> {
  const spec = PRESET_SPECS[preset];
  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(rawDataUrl, false);
  const rendered = renderImageOnCanvas(img, { preset, framingMode });

  const optimizedBytes = Math.round((rendered.dataUrl.length * 3) / 4);
  const originalBytes = file.size || optimizedBytes;
  const compressionRatio = Math.max(
    0,
    Math.round(((originalBytes - optimizedBytes) / Math.max(1, originalBytes)) * 100)
  );

  return {
    dataUrl: rendered.dataUrl,
    width: rendered.width,
    height: rendered.height,
    aspectRatioLabel: spec.aspectLabel,
    originalWidth: rendered.originalWidth,
    originalHeight: rendered.originalHeight,
    detectedOrientation: rendered.detectedOrientation,
    appliedFraming: rendered.appliedFraming,
    originalBytes,
    optimizedBytes,
    compressionRatio,
  };
}
