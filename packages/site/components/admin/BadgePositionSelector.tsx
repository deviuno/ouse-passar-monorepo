import React, { useState } from 'react';
import { Crown, Sparkles, Tag, DollarSign, Gift, X, Plus, Check } from 'lucide-react';
import { CourseBadge, CourseBadgeType, BadgePosition, CourseDisplayFormat } from '../../types/ead';

interface BadgePositionSelectorProps {
  badges: CourseBadge[];
  onChange: (badges: CourseBadge[]) => void;
  displayFormat: CourseDisplayFormat;
  thumbnailUrl?: string;
  posterImageUrl?: string;
  price?: number | null;
  disabled?: boolean;
}

const BADGE_TYPES: { type: CourseBadgeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'premium', label: 'Premium', icon: <Crown className="w-3 h-3" />, color: 'bg-amber-500' },
  { type: 'new', label: 'Novo', icon: <Sparkles className="w-3 h-3" />, color: 'bg-green-500' },
  { type: 'promo', label: 'Promo', icon: <Tag className="w-3 h-3" />, color: 'bg-red-500' },
  { type: 'price', label: 'Preço', icon: <DollarSign className="w-3 h-3" />, color: 'bg-blue-500' },
  { type: 'free', label: 'Grátis', icon: <Gift className="w-3 h-3" />, color: 'bg-purple-500' },
];

const POSITIONS: BadgePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

const POSITION_LABELS: Record<BadgePosition, string> = {
  'top-left': 'Superior Esquerdo',
  'top-right': 'Superior Direito',
  'bottom-left': 'Inferior Esquerdo',
  'bottom-right': 'Inferior Direito',
};

const POSITION_STYLES: Record<BadgePosition, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

export const BadgePositionSelector: React.FC<BadgePositionSelectorProps> = ({
  badges,
  onChange,
  displayFormat,
  thumbnailUrl,
  posterImageUrl,
  price,
  disabled = false,
}) => {
  const [activePosition, setActivePosition] = useState<BadgePosition | null>(null);

  const getBadgeAtPosition = (position: BadgePosition): CourseBadge | undefined => {
    return badges.find((b) => b.position === position && b.enabled);
  };

  const addBadge = (position: BadgePosition, type: CourseBadgeType) => {
    const existingIndex = badges.findIndex((b) => b.position === position);
    const newBadge: CourseBadge = {
      type,
      position,
      enabled: true,
      customText: type === 'promo' ? '-20% OFF' : undefined,
    };

    if (existingIndex >= 0) {
      const newBadges = [...badges];
      newBadges[existingIndex] = newBadge;
      onChange(newBadges);
    } else {
      onChange([...badges, newBadge]);
    }
    setActivePosition(null);
  };

  const removeBadge = (position: BadgePosition) => {
    onChange(badges.filter((b) => b.position !== position));
    setActivePosition(null);
  };

  const updateBadgeText = (position: BadgePosition, customText: string) => {
    const newBadges = badges.map((b) =>
      b.position === position ? { ...b, customText } : b
    );
    onChange(newBadges);
  };

  const renderBadgePreview = (badge: CourseBadge) => {
    const typeConfig = BADGE_TYPES.find((t) => t.type === badge.type);
    if (!typeConfig) return null;

    let displayText = typeConfig.label;
    if (badge.type === 'promo' && badge.customText) {
      displayText = badge.customText;
    } else if (badge.type === 'price' && price) {
      displayText = `R$ ${price.toFixed(2).replace('.', ',')}`;
    }

    return (
      <div
        className={`${typeConfig.color} text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-lg`}
      >
        {typeConfig.icon}
        <span>{displayText}</span>
      </div>
    );
  };

  const imageUrl = displayFormat === 'netflix' ? posterImageUrl : thumbnailUrl;
  const aspectRatio = displayFormat === 'netflix' ? 'aspect-[5/7]' : 'aspect-video';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-white text-sm font-bold">Badges do Card</label>
        <span className="text-gray-500 text-xs">
          {badges.filter((b) => b.enabled).length} / 4 badges
        </span>
      </div>

      {/* Card Preview */}
      <div className="flex justify-center">
        <div
          className={`relative ${aspectRatio} ${
            displayFormat === 'netflix' ? 'w-40' : 'w-64'
          } bg-brand-dark border border-white/10 rounded-lg overflow-hidden`}
        >
          {/* Background Image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
              Preview do Card
            </div>
          )}

          {/* Position Buttons */}
          {POSITIONS.map((position) => {
            const badge = getBadgeAtPosition(position);
            const isActive = activePosition === position;

            return (
              <div
                key={position}
                className={`absolute ${POSITION_STYLES[position]}`}
              >
                {badge ? (
                  <div className="relative group">
                    {renderBadgePreview(badge)}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeBadge(position)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  !disabled && (
                    <button
                      type="button"
                      onClick={() => setActivePosition(isActive ? null : position)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-brand-yellow text-black'
                          : 'bg-black/50 text-white/50 hover:bg-black/70 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Type Selector */}
      {activePosition && (
        <div className="bg-brand-dark border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">
              Adicionar badge em {POSITION_LABELS[activePosition]}
            </span>
            <button
              type="button"
              onClick={() => setActivePosition(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {BADGE_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => addBadge(activePosition, type)}
                className={`${color} hover:opacity-80 text-white p-2 rounded-lg flex flex-col items-center gap-1 transition-opacity`}
              >
                {icon}
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badge List for Custom Text Editing */}
      {badges.filter((b) => b.enabled && b.type === 'promo').length > 0 && (
        <div className="space-y-2">
          <label className="text-gray-400 text-xs">Texto Personalizado (Promo)</label>
          {badges
            .filter((b) => b.enabled && b.type === 'promo')
            .map((badge) => (
              <div key={badge.position} className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-24">
                  {POSITION_LABELS[badge.position]}:
                </span>
                <input
                  type="text"
                  value={badge.customText || ''}
                  onChange={(e) => updateBadgeText(badge.position, e.target.value)}
                  placeholder="-20% OFF"
                  disabled={disabled}
                  className="flex-1 bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600"
                />
              </div>
            ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-gray-500 text-xs">
        Clique nos + para adicionar badges em cada canto do card. Tipos disponíveis: Premium
        (coroa), Novo (verde), Promo (texto customizável), Preço e Grátis.
      </p>
    </div>
  );
};
