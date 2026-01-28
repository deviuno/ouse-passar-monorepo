import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  loading?: boolean;
  allowCustom?: boolean;
  displayFormatter?: (value: string) => string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  loading = false,
  allowCustom = true,
  displayFormatter,
}) => {
  // Helper to format display text
  const formatDisplay = (text: string) => displayFormatter ? displayFormatter(text) : text;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = (options || []).filter(opt => {
    if (!opt) return false;
    const searchLower = searchTerm.toLowerCase();
    const display = formatDisplay(opt).toLowerCase();
    return opt.toLowerCase().includes(searchLower) || display.includes(searchLower);
  });

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomValue = () => {
    if (searchTerm.trim() && allowCustom) {
      onChange(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : formatDisplay(value)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 pr-10 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSearchTerm('');
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />
          <div className="absolute z-20 w-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3">
                {allowCustom && searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-3 py-2 text-brand-yellow hover:bg-white/5 rounded"
                  >
                    Usar "{searchTerm.trim()}"
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum resultado encontrado</p>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.slice(0, 50).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors ${opt === value ? 'text-brand-yellow bg-brand-yellow/10' : 'text-white'
                      }`}
                  >
                    {formatDisplay(opt)}
                  </button>
                ))}
                {filteredOptions.length > 50 && (
                  <p className="px-4 py-2 text-xs text-gray-500">
                    +{filteredOptions.length - 50} resultados. Digite para filtrar.
                  </p>
                )}
                {allowCustom && searchTerm.trim() && !filteredOptions.includes(searchTerm.trim()) && (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-4 py-2 text-brand-yellow hover:bg-white/5 border-t border-white/5"
                  >
                    Usar "{searchTerm.trim()}"
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
