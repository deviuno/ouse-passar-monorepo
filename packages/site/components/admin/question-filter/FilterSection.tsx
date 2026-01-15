import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  selectedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  expanded,
  onToggle,
  selectedCount,
  totalCount,
  children
}) => (
  <div className="bg-brand-dark/50 border border-white/10 rounded-sm overflow-hidden">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-3 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-yellow">{icon}</span>
        <span className="text-white font-medium">{title}</span>
        {selectedCount > 0 && (
          <span className="bg-brand-yellow text-brand-darker text-xs px-2 py-0.5 font-bold">
            {selectedCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">{totalCount} opcoes</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>
    </button>
    {expanded && (
      <div className="p-3 pt-0 border-t border-white/5">
        {children}
      </div>
    )}
  </div>
);
