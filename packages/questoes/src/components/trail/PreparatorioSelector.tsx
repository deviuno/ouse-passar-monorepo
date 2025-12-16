import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Star, BookOpen } from 'lucide-react';
import { UserPreparatorio } from '../../types';

interface PreparatorioSelectorProps {
  preparatorios: UserPreparatorio[];
  selectedId: string | null;
  onSelect: (preparatorio: UserPreparatorio) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

export function PreparatorioSelector({
  preparatorios,
  selectedId,
  onSelect,
  onAddNew,
  isLoading = false,
}: PreparatorioSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Verificar se há scroll disponível
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [preparatorios]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-24 bg-[#252525] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Seta esquerda */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[#252525]/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-[#303030] transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      )}

      {/* Seta direita */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[#252525]/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-[#303030] transition-colors"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      )}

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Cards dos preparatórios do usuário */}
        {preparatorios.map((userPrep) => (
          <PreparatorioCard
            key={userPrep.id}
            userPreparatorio={userPrep}
            isSelected={selectedId === userPrep.id}
            onClick={() => onSelect(userPrep)}
          />
        ))}

        {/* Card de Novo Preparatório */}
        <AddNewCard onClick={onAddNew} />
      </div>
    </div>
  );
}

// Card de preparatório
function PreparatorioCard({
  userPreparatorio,
  isSelected,
  onClick,
}: {
  userPreparatorio: UserPreparatorio;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { preparatorio, progressPercent = 0, completedMissions = 0, totalMissions = 0 } = userPreparatorio;
  const iconeBg = preparatorio.cor || '#FFB800';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex-shrink-0 w-64 p-4 rounded-2xl text-left transition-all snap-start
        ${isSelected
          ? 'bg-gradient-to-br from-[#FFB800]/20 to-[#FFB800]/5 border-2 border-[#FFB800] shadow-lg shadow-[#FFB800]/20'
          : 'bg-[#252525] border-2 border-transparent hover:border-[#3A3A3A]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do preparatório */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconeBg}20` }}
        >
          {preparatorio.icone ? (
            <span className="text-2xl">{preparatorio.icone}</span>
          ) : (
            <BookOpen size={24} style={{ color: iconeBg }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">
            {preparatorio.nome}
          </h3>
          <p className="text-[#A0A0A0] text-xs truncate">
            {preparatorio.descricao || preparatorio.banca || 'Preparatório'}
          </p>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#6E6E6E]">Progresso</span>
              <span className="text-[#FFB800] font-medium">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-[#3A3A3A] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FFB800] to-[#FFC933] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Badge de selecionado */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center"
        >
          <Star size={14} className="text-black fill-black" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Card de adicionar novo preparatório
function AddNewCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-48 p-4 rounded-2xl snap-start
        bg-gradient-to-br from-[#252525] to-[#1E1E1E]
        border-2 border-dashed border-[#3A3A3A] hover:border-[#FFB800]/50
        flex flex-col items-center justify-center gap-2
        transition-all group"
    >
      <div className="w-12 h-12 rounded-full bg-[#3A3A3A] group-hover:bg-[#FFB800]/20 flex items-center justify-center transition-colors">
        <Plus size={24} className="text-[#6E6E6E] group-hover:text-[#FFB800] transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-white font-medium text-sm">Novo Preparatório</p>
        <p className="text-[#6E6E6E] text-xs">Adicionar curso</p>
      </div>
    </motion.button>
  );
}

export default PreparatorioSelector;
