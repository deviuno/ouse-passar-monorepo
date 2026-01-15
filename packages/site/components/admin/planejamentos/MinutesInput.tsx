import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface MinutesInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const MinutesInput: React.FC<MinutesInputProps> = ({ label, value, onChange }) => {
  const handleIncrement = () => {
    onChange(Math.min(480, value + 15)); // Max 8 horas
  };

  const handleDecrement = () => {
    onChange(Math.max(0, value - 15));
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm">
      <label className="block text-gray-400 text-xs font-bold uppercase mb-2 text-center">{label}</label>

      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-8 h-8 rounded-full bg-brand-dark border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/5 hover:text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xl font-mono font-bold text-white min-w-[72px] text-center">
          {formatTime(value)}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-8 h-8 rounded-full bg-brand-dark border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/5 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <input
        type="range"
        min="0"
        max="480"
        step="15"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
      />
    </div>
  );
};
