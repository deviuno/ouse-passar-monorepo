import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, BookOpen, Check } from 'lucide-react';
import { UserPreparatorio } from '../../types';

interface PreparatorioDropdownProps {
  preparatorios: UserPreparatorio[];
  selectedId: string | null;
  onSelect: (preparatorio: UserPreparatorio) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

export function PreparatorioDropdown({
  preparatorios,
  selectedId,
  onSelect,
  onAddNew,
  isLoading = false,
}: PreparatorioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar preparatorio selecionado
  const selectedPrep = preparatorios.find((p) => p.id === selectedId);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (prep: UserPreparatorio) => {
    onSelect(prep);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-32 h-6 bg-[var(--color-bg-elevated)] rounded-lg animate-pulse" />
        <div className="w-5 h-5 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative" data-tour="preparatorio-selector">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group"
      >
        {/* Logo ou Icone do preparatorio */}
        {selectedPrep?.preparatorio.logo_url ? (
          <img
            src={selectedPrep.preparatorio.logo_url}
            alt=""
            className="w-8 h-8 object-contain rounded-lg"
          />
        ) : selectedPrep?.preparatorio.icone ? (
          <span className="text-xl">{selectedPrep.preparatorio.icone}</span>
        ) : null}

        {/* Nome do preparatorio */}
        <h1 className="text-[var(--color-text-main)] font-bold text-xl">
          {selectedPrep?.preparatorio.nome || 'Selecionar Trilha'}
        </h1>

        {/* Seta animada */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={24}
            className="text-[var(--color-brand)] group-hover:text-[var(--color-text-main)] transition-colors"
          />
        </motion.div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-3 z-50 overflow-hidden"
            style={{ minWidth: '320px' }}
          >
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-elevated)] overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <p className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
                  Seus Preparatorios
                </p>
              </div>

              {/* Lista de preparatorios */}
              <div className="max-h-[300px] overflow-y-auto">
                {preparatorios.map((prep) => {
                  const isSelected = selectedId === prep.id;
                  const iconeBg = prep.preparatorio.cor || 'var(--color-brand)';

                  return (
                    <motion.button
                      key={prep.id}
                      onClick={() => handleSelect(prep)}
                      whileHover={{ backgroundColor: 'var(--color-bg-elevated)' }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                        ${isSelected ? 'bg-[var(--color-bg-elevated)]' : 'hover:bg-[var(--color-bg-elevated)]'}
                      `}
                    >
                      {/* Logo ou Icone */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: `${iconeBg}20` }}
                      >
                        {prep.preparatorio.logo_url ? (
                          <img
                            src={prep.preparatorio.logo_url}
                            alt=""
                            className="w-8 h-8 object-contain"
                          />
                        ) : prep.preparatorio.icone ? (
                          <span className="text-xl">{prep.preparatorio.icone}</span>
                        ) : (
                          <BookOpen size={20} style={{ color: iconeBg }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isSelected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-main)]'}`}>
                          {prep.preparatorio.nome}
                        </p>
                        <p className="text-[var(--color-text-muted)] text-xs truncate">
                          {prep.preparatorio.banca || prep.preparatorio.descricao || 'Preparatorio'}
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[var(--color-brand)] text-sm font-medium">
                          {prep.progressPercent || 0}%
                        </p>
                      </div>

                      {/* Check se selecionado */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#ffac00] flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-black" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Adicionar novo */}
              <div className="border-t border-[var(--color-border)]">
                <motion.button
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left group hover:bg-[var(--color-bg-elevated)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-border)] group-hover:bg-[var(--color-brand)]/20 flex items-center justify-center transition-colors">
                    <Plus size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-colors" />
                  </div>
                  <div>
                    <p className="text-[var(--color-text-main)] font-medium group-hover:text-[var(--color-brand)] transition-colors">
                      Novo Preparatorio
                    </p>
                    <p className="text-[var(--color-text-muted)] text-xs">
                      Adquirir mais cursos
                    </p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay quando aberto */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
            style={{ top: '60px' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PreparatorioDropdown;
