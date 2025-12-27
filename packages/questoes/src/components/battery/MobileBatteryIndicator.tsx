import React from 'react';
import { Zap } from 'lucide-react';

interface MobileBatteryIndicatorProps {
  current: number;
  max: number;
  isPremium?: boolean;
  onClick?: () => void;
}

/**
 * Indicador de bateria minimalista vertical estilo celular para mobile
 */
export function MobileBatteryIndicator({
  current,
  max,
  isPremium = false,
  onClick,
}: MobileBatteryIndicatorProps) {
  const percentage = Math.min(100, Math.round((current / max) * 100));

  // Cor baseada na porcentagem (verde -> amarelo -> vermelho)
  const getColor = () => {
    if (isPremium) return '#FFB800';
    if (percentage > 50) return '#22C55E';
    if (percentage > 20) return '#EAB308';
    return '#EF4444';
  };

  const color = getColor();

  if (isPremium) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 transition-all active:scale-95"
        title="Bateria Ilimitada"
      >
        <Zap size={16} className="text-[#FFB800]" fill="#FFB800" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center transition-all active:scale-95 p-1"
      title={`Bateria: ${percentage}%`}
    >
      {/* Bateria vertical minimalista */}
      <div className="relative flex flex-col items-center">
        {/* Terminal da bateria (topo) */}
        <div
          className="w-1.5 h-0.5 rounded-t-sm"
          style={{ backgroundColor: color }}
        />
        {/* Corpo da bateria */}
        <div
          className="w-3 h-5 rounded-sm border relative overflow-hidden"
          style={{ borderColor: color }}
        >
          {/* Barra de progresso (de baixo para cima) */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-300"
            style={{
              height: `${percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default MobileBatteryIndicator;
