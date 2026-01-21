import React, { useState } from 'react';
import { Search, X, Loader2, Check } from 'lucide-react';

interface MultiSearchableSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label: string;
  loading?: boolean;
  allowCustom?: boolean;
  excludeOptions?: string[];
  displayFormatter?: (value: string) => string;
}

export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  loading = false,
  allowCustom = true,
  excludeOptions = [],
  displayFormatter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to format display text
  const formatDisplay = (text: string) => displayFormatter ? displayFormatter(text) : text;

  // Filter out excluded options (like the main banca)
  const availableOptions = (options || []).filter(opt => opt && !excludeOptions.includes(opt));

  const filteredOptions = availableOptions.filter(opt => {
    if (!opt) return false;
    const searchLower = searchTerm.toLowerCase();
    const display = formatDisplay(opt).toLowerCase();
    return opt.toLowerCase().includes(searchLower) || display.includes(searchLower);
  });

  const handleSelect = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
    setSearchTerm('');
  };

  const handleRemove = (opt: string) => {
    onChange(value.filter(v => v !== opt));
  };

  const handleCustomValue = () => {
    if (searchTerm.trim() && allowCustom && !value.includes(searchTerm.trim())) {
      onChange([...value, searchTerm.trim()]);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>

      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-brand-yellow/20 text-brand-yellow text-sm rounded"
            >
              {formatDisplay(item)}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length > 0 ? 'Adicionar mais...' : placeholder}
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 pr-10 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
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
                {allowCustom && searchTerm.trim() && !value.includes(searchTerm.trim()) ? (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-3 py-2 text-brand-yellow hover:bg-white/5 rounded"
                  >
                    Adicionar "{searchTerm.trim()}"
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum resultado encontrado</p>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.slice(0, 50).map((opt) => {
                  const isSelected = value.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center justify-between ${
                        isSelected ? 'text-brand-yellow bg-brand-yellow/10' : 'text-white'
                      }`}
                    >
                      <span>{formatDisplay(opt)}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
                {filteredOptions.length > 50 && (
                  <p className="px-4 py-2 text-xs text-gray-500">
                    +{filteredOptions.length - 50} resultados. Digite para filtrar.
                  </p>
                )}
                {allowCustom && searchTerm.trim() && !filteredOptions.includes(searchTerm.trim()) && !value.includes(searchTerm.trim()) && (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-4 py-2 text-brand-yellow hover:bg-white/5 border-t border-white/5"
                  >
                    Adicionar "{searchTerm.trim()}"
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
