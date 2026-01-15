import React from 'react';
import { Check } from 'lucide-react';

export interface FilterOptionProps {
  label: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}

export const FilterOption: React.FC<FilterOptionProps> = ({
  label,
  selected,
  available,
  onClick
}) => (
  <button
    onClick={onClick}
    disabled={!available && !selected}
    className={`flex items-center gap-2 w-full p-2 text-left text-sm transition-colors ${
      selected
        ? 'bg-brand-yellow/10 text-brand-yellow'
        : available
        ? 'text-gray-300 hover:bg-white/5 hover:text-white'
        : 'text-gray-600 cursor-not-allowed'
    }`}
  >
    <div className={`w-4 h-4 border flex items-center justify-center ${
      selected
        ? 'bg-brand-yellow border-brand-yellow'
        : 'border-gray-600'
    }`}>
      {selected && <Check className="w-3 h-3 text-brand-darker" />}
    </div>
    <span className="truncate">{label}</span>
  </button>
);
