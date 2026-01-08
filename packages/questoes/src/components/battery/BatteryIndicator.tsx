import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Battery, BatteryCharging } from 'lucide-react';
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
  const { hours, minutes } = getTimeUntilRecharge();

  // Configuração de cores e brilho neon
  const getStatusColor = (pct: number) => {
    if (isPremium) return {
      text: 'text-purple-400',
      bg: 'bg-purple-500',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.6)]',
      border: 'border-purple-500/50'
    };
    if (pct > 60) return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      glow: 'shadow-[0_0_10px_rgba(52,211,153,0.6)]',
      border: 'border-emerald-500/50'
    };
    if (pct > 30) return {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500',
      glow: 'shadow-[0_0_10px_rgba(250,204,21,0.6)]',
      border: 'border-yellow-500/50'
    };
    return {
      text: 'text-red-400',
      bg: 'bg-red-500',
      glow: 'shadow-[0_0_10px_rgba(248,113,113,0.6)]',
      border: 'border-red-500/50'
    };
  };

  const status = getStatusColor(percentage);

  // Renderiza a barra segmentada (10 blocos)
  const renderSegments = () => {
    const segments = 10;
    const filledSegments = Math.ceil((percentage / 100) * segments);

    return (
      <div className="flex gap-1 h-3 w-full mt-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[2px] transition-all duration-300 ${isPremium || i < filledSegments
              ? `${status.bg} ${status.glow}`
              : 'bg-[var(--color-bg-elevated)]'
              } ${!isPremium && i < filledSegments && percentage <= 30 ? 'animate-pulse' : ''
              }`}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-card)]/80 border ${status.border} transition-all hover:bg-[var(--color-bg-elevated)] theme-transition`}
      >
        <Zap className={`w-3.5 h-3.5 ${status.text} ${isPremium ? 'animate-pulse' : ''}`} fill="currentColor" />
        <span className={`text-xs font-bold ${status.text} tracking-wider`}>
          {isPremium ? '∞' : `${current}`}
        </span>
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={onClick}
        className={`w-full group relative p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-all theme-transition`}
      >
        {/* Header com Ícone e Texto */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md bg-[var(--color-bg-main)]/50 border border-[var(--color-border)] ${status.text}`}>
              {isPremium ? (
                <Zap className="w-4 h-4" fill="currentColor" />
              ) : (
                <BatteryCharging className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-bold text-[var(--color-text-sec)] uppercase tracking-wider">
              Bateria
            </span>
          </div>

          <div className={`text-sm font-mono font-bold ${status.text}`}>
            {isPremium ? 'ILIMITADA' : `${percentage}%`}
          </div>
        </div>

        {/* Barra de Progresso Segmentada */}
        {renderSegments()}

        {/* Info de Recarga (apenas se não for premium) */}
        {!isPremium && (
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wide">
              Recarga
            </span>
            <span className="text-[10px] text-[var(--color-text-sec)] font-mono">
              {hours}h {minutes}m
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

export default BatteryIndicator;

