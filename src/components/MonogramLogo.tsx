import React from 'react';
import { OFFICIAL_CR_LOGO_PATH } from '../data/seedData';
import { ImageProcessor } from './ImageProcessor';

interface MonogramLogoProps {
  customLogoUrl?: string;
  compact?: boolean;
  onDarkSurface?: boolean;
}

export const MonogramLogo: React.FC<MonogramLogoProps> = ({
  customLogoUrl,
  compact = false,
  onDarkSurface = false,
}) => {
  const logoSrc = customLogoUrl || OFFICIAL_CR_LOGO_PATH;

  return (
    <div className="inline-flex items-center gap-3 shrink-0 whitespace-nowrap select-none">
      <div className="w-10 h-10 shrink-0">
        <ImageProcessor
          src={logoSrc}
          alt="Monograma Cavalcante & Rolim | Signature Spaces"
          aspectRatio="1:1"
          variant="logo"
          roundedClassName="rounded-lg"
          fallbackText="CR"
        />
      </div>

      {!compact && (
        <span
          className={`font-serif text-base sm:text-lg font-semibold tracking-tight ${
            onDarkSurface
              ? 'text-white'
              : 'text-[#1C2421] dark:text-white'
          }`}
        >
          Cavalcante &amp; Rolim
        </span>
      )}
    </div>
  );
};
