import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Maximize2, X } from 'lucide-react';
import {
  standardizeImageUrl,
  type MediaFramingMode,
  type MediaPreset,
} from '../utils/mediaEngine';

export type ImageProcessorAspectRatio = '16:9' | '1:1';
export type ImageProcessorVariant = 'card' | 'modal' | 'avatar' | 'logo' | 'hero';

export interface ImageProcessorProps {
  src?: string;
  alt: string;
  aspectRatio?: ImageProcessorAspectRatio;
  fitMode?: MediaFramingMode;
  variant?: ImageProcessorVariant;
  quality?: number;
  maxTargetBytes?: number;
  goldBorder?: boolean;
  roundedClassName?: string;
  containerClassName?: string;
  imgClassName?: string;
  fillContainer?: boolean;
  enableZoom?: boolean;
  fallbackText?: string;
}

interface CachedProcessedEntry {
  dataUrl: string;
  appliedFraming: 'cover' | 'contain-framed';
}

const PROCESSED_CACHE = new Map<string, CachedProcessedEntry>();

function resolvePreset(
  aspectRatio: ImageProcessorAspectRatio,
  variant: ImageProcessorVariant
): MediaPreset {
  if (aspectRatio === '1:1') {
    return variant === 'logo' ? 'logo-1-1' : 'avatar-1-1';
  }
  return 'banner-16-9';
}

/**
 * ImageProcessor — Componente Utilitário Oficial Cavalcante & Rolim
 * -----------------------------------------------------------------
 * Envolve todas as imagens do portal aplicando processamento via HTML5 <canvas>:
 * - Redimensionamento padronizado para proporções travadas 16:9 ou 1:1
 * - Enquadramento `object-fit: cover` (ou moldura integral automática sem cortes em cartazes verticais)
 * - Compressão adaptativa automática com cache em memória
 * - Padrão visual com borda filete dourado (#C5A467) e política Zero-Broken-Image
 */
export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  src,
  alt,
  aspectRatio = '16:9',
  fitMode = 'auto',
  variant = 'card',
  quality = 0.86,
  maxTargetBytes,
  goldBorder = true,
  roundedClassName = 'rounded-xl',
  containerClassName = '',
  imgClassName = '',
  fillContainer = false,
  enableZoom = false,
  fallbackText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preset = resolvePreset(aspectRatio, variant);

  // Para fotos de capa hero / avatares quando caller pedir cover estrito vs auto
  const effectiveFitMode: MediaFramingMode =
    variant === 'hero' && fitMode === 'auto' ? 'cover' : fitMode;

  const cacheKey = src
    ? `${src}::${preset}::${effectiveFitMode}::${Math.round(quality * 100)}::${maxTargetBytes || 'def'}`
    : '';

  const [processedSrc, setProcessedSrc] = useState<string | null>(() => {
    if (!src) return null;
    return PROCESSED_CACHE.get(cacheKey)?.dataUrl || null;
  });
  const [appliedFraming, setAppliedFraming] = useState<'cover' | 'contain-framed'>(() => {
    if (!src) return 'cover';
    return PROCESSED_CACHE.get(cacheKey)?.appliedFraming || 'cover';
  });
  const [hasError, setHasError] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (!src) {
      setProcessedSrc(null);
      setHasError(false);
      return;
    }

    const cached = PROCESSED_CACHE.get(cacheKey);
    if (cached) {
      setProcessedSrc(cached.dataUrl);
      setAppliedFraming(cached.appliedFraming);
      setHasError(false);
      return;
    }

    setHasError(false);

    standardizeImageUrl(src, {
      preset,
      framingMode: effectiveFitMode,
      targetCanvas: canvasRef.current,
      quality,
      maxChars: maxTargetBytes,
    })
      .then((res) => {
        if (!active) return;
        const entry: CachedProcessedEntry = {
          dataUrl: res.dataUrl,
          appliedFraming: res.appliedFraming,
        };
        if (PROCESSED_CACHE.size > 120) {
          const oldestKey = PROCESSED_CACHE.keys().next().value;
          if (oldestKey) PROCESSED_CACHE.delete(oldestKey);
        }
        PROCESSED_CACHE.set(cacheKey, entry);
        setProcessedSrc(res.dataUrl);
        setAppliedFraming(res.appliedFraming);
      })
      .catch(() => {
        // Fallback elegante: caso imagem externa (ex. Google Photo) bloqueie CORS no Canvas,
        // mantém renderização direta padronizada via <img> + object-fit: cover sem quebrar layout.
        if (!active) return;
        setProcessedSrc(src);
        setAppliedFraming(effectiveFitMode === 'contain-framed' ? 'contain-framed' : 'cover');
      });

    return () => {
      active = false;
    };
  }, [src, cacheKey, preset, effectiveFitMode, quality, maxTargetBytes]);

  const aspectClass = fillContainer
    ? 'w-full h-full'
    : aspectRatio === '1:1'
    ? 'aspect-square w-full'
    : 'aspect-video w-full';

  const borderClass = goldBorder ? 'border border-[#C5A467]' : '';
  const displaySrc = processedSrc || src;

  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0B241B] via-[#11382B] to-[#0B241B] flex flex-col items-center justify-center gap-1.5 text-center ${aspectClass} ${roundedClassName} ${borderClass} ${containerClassName}`}
      >
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        {fallbackText ? (
          <span className="font-serif font-semibold text-[#D8BC83] select-none">
            {fallbackText}
          </span>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl border border-[#C5A467]/50 bg-[#0B241B] flex items-center justify-center text-[#D8BC83]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="px-4 text-xs font-medium text-[#D8BC83] line-clamp-2 max-w-xs">
              {alt}
            </p>
          </>
        )}
      </div>
    );
  }

  const objectPositionClass =
    variant === 'avatar' ? 'object-cover object-top' : 'object-cover object-center';

  const resolvedImgClass =
    appliedFraming === 'contain-framed' && displaySrc === src
      ? variant === 'logo'
        ? 'w-full h-full object-contain object-center'
        : 'w-full h-full object-contain object-center p-1.5'
      : `w-full h-full ${objectPositionClass}`;

  const positionClass = containerClassName.includes('absolute') ? '' : 'relative';

  return (
    <>
      <div
        className={`${positionClass} overflow-hidden bg-[#0B241B] ${aspectClass} ${roundedClassName} ${borderClass} ${containerClassName}`}
      >
        {/* Canvas dedicado de processamento, redimensionamento e compressão */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        <img
          src={displaySrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`${resolvedImgClass} ${imgClassName}`}
        />

        {enableZoom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(true);
            }}
            className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11382B]/90 text-[#D8BC83] border border-[#C5A467]/60 hover:bg-[#0B241B] text-[11px] font-semibold cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Ampliar Imagem</span>
          </button>
        )}
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Visualização ampliada: ${alt}`}
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="fixed top-5 right-5 w-10 h-10 rounded-lg bg-[#11382B] text-white border border-[#C5A467] flex items-center justify-center hover:bg-[#0B241B] cursor-pointer"
            aria-label="Fechar visualização ampliada"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl border border-[#C5A467] shadow-2xl bg-[#0B241B]"
          />
        </div>
      )}
    </>
  );
};
