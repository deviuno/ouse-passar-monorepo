import React from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from 'lucide-react';
import { getBatteryPercentage, getBatteryColor, getTimeUntilRecharge } from '../../types/battery';

interface BatteryIndicatorProps {
  current: number;
  max: number;
  isPremium?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function BatteryIndicator({
  current,
  max,
  isPremium = false,
  onClick,
  compact = false,
}: BatteryIndicatorProps) {
  const percentage = getBatteryPercentage(current, max);
  const color = getBatteryColor(percentage);
  const { hours, minutes } = getTimeUntilRecharge();

  // Cores baseadas no nível
  const colorClasses = {
    green: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    yellow: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
  };

  const colors = isPremium
    ? {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
      }
    : colorClasses[color];

  // Ícone baseado no nível
  const BatteryIcon = isPremium
    ? Zap
    : percentage > 66
    ? BatteryFull
    : percentage > 33
    ? BatteryMedium
    : percentage > 0
    ? BatteryLow
    : Battery;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bgLight} ${colors.border} border transition-all hover:scale-105`}
      >
        <BatteryIcon className={`w-4 h-4 ${colors.text}`} />
        <span className={`text-xs font-bold ${colors.text}`}>
          {isPremium ? 'Ilimitada' : `${current}`}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl ${colors.bgLight} ${colors.border} border transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BatteryIcon className={`w-5 h-5 ${colors.text}`} />
          <span className={`text-sm font-bold ${colors.text}`}>
            {isPremium ? 'Ilimitada' : 'Bateria'}
          </span>
        </div>
        {isPremium ? (
          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
            PRO
          </span>
        ) : (
          <span className={`text-sm font-bold ${colors.text}`}>
            {current}/{max}
          </span>
        )}
      </div>

      {/* Barra de Progresso */}
      {!isPremium && (
        <div className="relative h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 ${colors.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Tempo até recarga */}
      {!isPremium && (
        <p className="text-[10px] text-[#6E6E6E] mt-1.5 text-center">
          Recarrega em {hours}h {minutes}min
        </p>
      )}
    </button>
  );
}

export default BatteryIndicator;
