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
        <div className="w-32 h-6 bg-[#252525] rounded-lg animate-pulse" />
        <div className="w-5 h-5 bg-[#252525] rounded animate-pulse" />
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
        {/* Icone do preparatorio */}
        {selectedPrep?.preparatorio.icone && (
          <span className="text-xl">{selectedPrep.preparatorio.icone}</span>
        )}

        {/* Nome do preparatorio */}
        <h1 className="text-white font-bold text-xl">
          {selectedPrep?.preparatorio.nome || 'Selecionar Trilha'}
        </h1>

        {/* Seta animada */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={24}
            className="text-[#FFB800] group-hover:text-white transition-colors"
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
            <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#3A3A3A]">
                <p className="text-[#6E6E6E] text-xs font-medium uppercase tracking-wider">
                  Seus Preparatorios
                </p>
              </div>

              {/* Lista de preparatorios */}
              <div className="max-h-[300px] overflow-y-auto">
                {preparatorios.map((prep) => {
                  const isSelected = selectedId === prep.id;
                  const iconeBg = prep.preparatorio.cor || '#FFB800';

                  return (
                    <motion.button
                      key={prep.id}
                      onClick={() => handleSelect(prep)}
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                        ${isSelected ? 'bg-black/30' : 'hover:bg-black/20'}
                      `}
                    >
                      {/* Icone */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${iconeBg}20` }}
                      >
                        {prep.preparatorio.icone ? (
                          <span className="text-xl">{prep.preparatorio.icone}</span>
                        ) : (
                          <BookOpen size={20} style={{ color: iconeBg }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>
                          {prep.preparatorio.nome}
                        </p>
                        <p className="text-[#6E6E6E] text-xs truncate">
                          {prep.preparatorio.banca || prep.preparatorio.descricao || 'Preparatorio'}
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#FFB800] text-sm font-medium">
                          {prep.progressPercent || 0}%
                        </p>
                      </div>

                      {/* Check se selecionado */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#FFB800] flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-black" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Adicionar novo */}
              <div className="border-t border-[#3A3A3A]">
                <motion.button
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left group hover:bg-black/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3A3A3A] group-hover:bg-[#FFB800]/20 flex items-center justify-center transition-colors">
                    <Plus size={20} className="text-[#6E6E6E] group-hover:text-[#FFB800] transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-[#FFB800] transition-colors">
                      Novo Preparatorio
                    </p>
                    <p className="text-[#6E6E6E] text-xs">
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
