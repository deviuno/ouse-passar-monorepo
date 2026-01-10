import React from 'react';
import { Crown, Sparkles, Tag, DollarSign, Gift } from 'lucide-react';

export type CourseBadgeType = 'premium' | 'new' | 'promo' | 'price' | 'free';
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CourseBadgeData {
  type: CourseBadgeType;
  position: BadgePosition;
  enabled: boolean;
  customText?: string;
}

interface CourseBadgeProps {
  type: CourseBadgeType;
  customText?: string;
  price?: number | null;
  className?: string;
}

const BADGE_CONFIG: Record<CourseBadgeType, { icon: React.ReactNode; label: string; color: string }> = {
  premium: { icon: <Crown className="w-3 h-3" />, label: 'Premium', color: 'bg-amber-500' },
  new: { icon: <Sparkles className="w-3 h-3" />, label: 'Novo', color: 'bg-green-500' },
  promo: { icon: <Tag className="w-3 h-3" />, label: 'Promo', color: 'bg-red-500' },
  price: { icon: <DollarSign className="w-3 h-3" />, label: '', color: 'bg-blue-500' },
  free: { icon: <Gift className="w-3 h-3" />, label: 'Grátis', color: 'bg-purple-500' },
};

export const CourseBadge: React.FC<CourseBadgeProps> = ({ type, customText, price, className = '' }) => {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  let displayText = config.label;
  if (type === 'promo' && customText) {
    displayText = customText;
  } else if (type === 'price' && price) {
    displayText = `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  return (
    <div
      className={`${config.color} text-white text-xs font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-lg ${className}`}
    >
      {config.icon}
      {displayText && <span>{displayText}</span>}
    </div>
  );
};

// Position styles
const POSITION_STYLES: Record<BadgePosition, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

interface CourseBadgesOverlayProps {
  badges: CourseBadgeData[];
  price?: number | null;
}

export const CourseBadgesOverlay: React.FC<CourseBadgesOverlayProps> = ({ badges, price }) => {
  const enabledBadges = badges.filter((b) => b.enabled);

  if (enabledBadges.length === 0) return null;

  return (
    <>
      {enabledBadges.map((badge) => (
        <div
          key={badge.position}
          className={`absolute ${POSITION_STYLES[badge.position]} z-10`}
        >
          <CourseBadge type={badge.type} customText={badge.customText} price={price} />
        </div>
      ))}
    </>
  );
};

export default CourseBadge;
