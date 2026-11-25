import React from 'react';
import { Award, Crown, HardHat, Medal, ShieldCheck, Star } from 'lucide-react';
import type { BadgeIconKey } from '../types/portal';

interface BadgeIconProps {
  iconKey: BadgeIconKey;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ iconKey, className = 'w-5 h-5' }) => {
  switch (iconKey) {
    case 'crown':
      return <Crown className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'hardhat':
      return <HardHat className={className} />;
    case 'medal':
    default:
      return <Medal className={className} />;
  }
};
