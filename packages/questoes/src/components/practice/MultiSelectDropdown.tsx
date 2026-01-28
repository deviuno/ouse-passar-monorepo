import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

export interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  displayFormatter?: (item: string) => string;
}

// Normaliza texto para busca: remove acentos, espaços extras e converte para minúsculas
const normalizeSearchText = (text: string): string => {
  return text
    .normalize('NFD') // Separa caracteres base dos diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .toLowerCase()
    .replace(/\s+/g, ' ') // Múltiplos espaços → um espaço
    .trim();
};

export function MultiSelectDropdown({
  label,
  icon,
  items,
  selected,
  onToggle,
  onClear,
  placeholder = 'Selecionar...',
  isLoading = false,
  disabled = false,
  displayFormatter,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Função para formatar item para exibição
  const formatItem = (item: string) => displayFormatter ? displayFormatter(item) : item;

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
    const searchNormalized = normalizeSearchText(search);
    // Buscar tanto no valor original quanto no formatado, com normalização
    return items.filter((item) => {
      const itemNormalized = normalizeSearchText(item);
      const formattedNormalized = normalizeSearchText(formatItem(item));
      return itemNormalized.includes(searchNormalized) ||
        formattedNormalized.includes(searchNormalized);
    });
  }, [items, search, displayFormatter]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[var(--color-brand)]">{icon}</span>
        <span className="text-[var(--color-text-main)] text-sm font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 bg-[#ffac00] text-black text-xs font-bold rounded">
            {selected.length}
          </span>
        )}
        <span className="text-[var(--color-text-muted)] text-xs">({items.length})</span>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors theme-transition
          ${disabled
            ? 'bg-[var(--color-bg-main)] border-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-not-allowed'
            : isOpen
              ? 'bg-[var(--color-bg-card)] border-[var(--color-brand)] text-[var(--color-text-main)]'
              : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-text-muted)]'
          }
        `}
      >
        <span className={selected.length === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-main)] truncate'}>
          {selected.length === 0
            ? placeholder
            : selected.length === 1
              ? formatItem(selected[0])
              : `${selected.length} selecionados`
          }
        </span>
        <ChevronDown size={16} className={`text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden theme-transition"
          >
            {/* Search */}
            <div className="p-2 border-b border-[var(--color-border)]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded pl-8 pr-3 py-1.5 text-[var(--color-text-main)] text-sm placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />
                  <span className="ml-2 text-[var(--color-text-muted)] text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-xs text-center py-4">Nenhum resultado</p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selected.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => onToggle(item)}
                      className={`
                        w-full flex items-start gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)]'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected ? 'bg-[#ffac00] border-[#ffac00]' : 'border-[var(--color-text-muted)]'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="break-words whitespace-normal leading-tight">{formatItem(item)}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-[var(--color-border)] flex justify-between items-center">
                <span className="text-[var(--color-text-muted)] text-xs">{selected.length} selecionado(s)</span>
                <button
                  onClick={() => { onClear(); setSearch(''); }}
                  className="text-[var(--color-error)] text-xs hover:underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
