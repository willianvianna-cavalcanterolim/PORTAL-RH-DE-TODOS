import React from 'react';
import { ImageProcessor } from './ImageProcessor';

interface AdaptiveMediaFrameProps {
  src?: string;
  alt: string;
  variant?: 'card' | 'modal';
  className?: string;
  enableZoom?: boolean;
}

/**
 * Wrapper compatível sobre ImageProcessor mantendo o padrão visual 16:9 com filete dourado.
 */
export const AdaptiveMediaFrame: React.FC<AdaptiveMediaFrameProps> = ({
  src,
  alt,
  variant = 'card',
  className = '',
  enableZoom = false,
}) => {
  return (
    <ImageProcessor
      src={src}
      alt={alt}
      aspectRatio="16:9"
      fitMode="auto"
      variant={variant}
      enableZoom={enableZoom}
      goldBorder
      roundedClassName={variant === 'modal' ? 'rounded-xl' : 'rounded-t-xl'}
      containerClassName={className}
      imgClassName={
        variant === 'card'
          ? 'transition-transform duration-300 group-hover:scale-[1.02]'
          : ''
      }
    />
  );
};
