import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

export interface InlineDropdownProps {
  value: string[];
  options?: string[];
  loadOptions?: () => Promise<string[]>;
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  single?: boolean;
}

export const InlineDropdown: React.FC<InlineDropdownProps> = ({
  value,
  options: staticOptions,
  loadOptions,
  onChange,
  placeholder,
  disabled = false,
  single = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<string[]>(staticOptions || []);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualizar options quando staticOptions mudar
  useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  // Carregar opções quando abrir (se tiver loadOptions)
  useEffect(() => {
    if (isOpen && loadOptions && options.length === 0) {
      setIsLoading(true);
      loadOptions()
        .then(data => {
          setOptions(data);
        })
        .catch(err => {
          console.error('Erro ao carregar opções:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, loadOptions]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchNorm = normalizeText(search.trim());
    return options.filter(opt => normalizeText(opt).includes(searchNorm));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    if (single) {
      onChange(value.includes(opt) ? [] : [opt]);
      // Fechar dropdown automaticamente quando single select
      setIsOpen(false);
      setSearch('');
    } else {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    }
  };

  const displayValue = value.length === 0
    ? placeholder
    : value.length === 1
      ? (value[0].length > 25 ? value[0].substring(0, 25) + '...' : value[0])
      : `${value.length} selecionados`;

  return (
    <div ref={dropdownRef} className="relative min-w-[200px]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors
          ${disabled
            ? 'bg-transparent text-gray-600 cursor-not-allowed'
            : isOpen
              ? 'bg-brand-dark border border-brand-yellow text-white'
              : value.length > 0
                ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:border-green-500/50'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
          }
        `}
      >
        <span className="truncate">{displayValue}</span>
        {!disabled && (
          <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 w-96 mt-1 bg-brand-dark border border-white/10 rounded shadow-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded pl-7 pr-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[250px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={14} className="animate-spin text-brand-yellow" />
                <span className="ml-2 text-xs text-gray-400">Carregando...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">
                {options.length === 0 ? 'Nenhuma opção disponível' : 'Nenhum resultado'}
              </p>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`
                      w-full flex items-start gap-2 px-3 py-2 text-left text-xs transition-colors
                      ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    <div className={`
                      w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-600'}
                    `}>
                      {isSelected && <Check size={8} className="text-black" />}
                    </div>
                    <span className="break-words whitespace-normal leading-relaxed">{opt}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div className="p-2 border-t border-white/10 flex justify-between items-center">
              <span className="text-gray-500 text-xs">{value.length} selecionado(s)</span>
              <button
                onClick={() => onChange([])}
                className="text-red-400 text-xs hover:underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
