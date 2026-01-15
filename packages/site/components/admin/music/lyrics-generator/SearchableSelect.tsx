import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, Search, Plus, Check } from 'lucide-react';
import { SearchableSelectProps } from './types';

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  items,
  value,
  onChange,
  placeholder = 'Selecionar...',
  isLoading = false,
  disabled = false,
  allowCustom = false,
  customLabel = 'Adicionar novo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter((item) => item.toLowerCase().includes(searchLower));
  }, [items, search]);

  const isNewValue = useMemo(() => {
    if (!search.trim() || !allowCustom) return false;
    const searchLower = search.toLowerCase().trim();
    return !items.some(item => item.toLowerCase() === searchLower);
  }, [items, search, allowCustom]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddCustom = () => {
    if (search.trim()) {
      onChange(search.trim());
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors text-left
          ${disabled
            ? 'bg-brand-dark/50 border-white/5 text-gray-500 cursor-not-allowed'
            : isOpen
              ? 'bg-brand-dark border-brand-yellow text-white'
              : 'bg-brand-dark border-white/10 text-white hover:border-white/20'
          }
        `}
      >
        <span className={!value ? 'text-gray-500' : 'text-white truncate'}>
          {value || placeholder}
        </span>
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-gray-400" />
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={allowCustom ? "Buscar ou digitar novo..." : "Buscar..."}
                  autoFocus
                  className="w-full bg-brand-dark border border-white/10 rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>

            {/* Add Custom Option */}
            {isNewValue && (
              <div className="p-2 border-b border-white/10">
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded transition-colors"
                >
                  <Plus size={14} />
                  <span>{customLabel}: <strong>"{search.trim()}"</strong></span>
                </button>
              </div>
            )}

            {/* Items List */}
            <div className="max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-brand-yellow" />
                  <span className="ml-2 text-gray-500 text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 && !isNewValue ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  {allowCustom ? 'Nenhum resultado. Digite para criar novo.' : 'Nenhum resultado'}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = value === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-white hover:bg-white/5'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-500'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer - limpar seleção */}
            {value && (
              <div className="p-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-red-400 text-xs hover:underline"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
