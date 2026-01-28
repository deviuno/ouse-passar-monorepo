import React from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { PracticeMode } from '../../types';

export interface StudySettingsCardProps {
  // Values
  filteredCount: number;
  totalFilters: number;
  questionCount: number;
  studyMode: PracticeMode;

  // Loading
  isLoadingCount?: boolean;

  // Actions
  onQuestionCountChange: (count: number) => void;
  onStudyModeChange: (mode: PracticeMode) => void;

  // Optional
  title?: string;
  className?: string;
}

export function StudySettingsCard({
  filteredCount,
  totalFilters,
  questionCount,
  studyMode,
  isLoadingCount = false,
  onQuestionCountChange,
  onStudyModeChange,
  title = 'Resumo do Treino',
  className = '',
}: StudySettingsCardProps) {
  return (
    <section
      className={`bg-[var(--color-bg-card)] border border-[var(--color-brand)]/20 rounded-2xl p-4 md:p-5 relative overflow-hidden theme-transition ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-brand)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative">
        <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <SlidersHorizontal size={14} /> {title}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-5">
          {/* Available Questions */}
          <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] theme-transition">
            <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">
              Disponíveis
            </p>
            {isLoadingCount ? (
              <Loader2
                size={20}
                className="animate-spin text-[var(--color-brand)]"
              />
            ) : (
              <p className="text-2xl font-bold text-[var(--color-text-main)]">
                {filteredCount.toLocaleString()}
              </p>
            )}
          </div>

          {/* Active Filters */}
          <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] theme-transition">
            <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">
              Filtros Ativos
            </p>
            <p className="text-2xl font-bold text-[var(--color-brand)]">
              {totalFilters}
            </p>
          </div>

          {/* Questions Per Session */}
          <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2 md:col-span-1 lg:col-span-2 theme-transition">
            <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">
              Questões por Sessão
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[var(--color-brand)] min-w-[3rem]">
                {questionCount}
              </span>
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={questionCount}
                onChange={(e) => onQuestionCountChange(Number(e.target.value))}
                className="flex-1 h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
              />
            </div>
          </div>

          {/* Study Mode */}
          <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2 theme-transition">
            <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">
              Modo de Estudo
            </p>
            <button
              onClick={() =>
                onStudyModeChange(studyMode === 'zen' ? 'hard' : 'zen')
              }
              className="relative inline-flex items-center h-8 rounded-full w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] transition-colors theme-transition"
            >
              <span
                className={`absolute inline-flex items-center justify-center h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                  studyMode === 'zen'
                    ? 'left-0.5 w-[calc(50%-0.25rem)] bg-[var(--color-success)] text-black'
                    : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.25rem)] bg-[var(--color-error)] text-black'
                }`}
              >
                {studyMode === 'zen' ? 'Zen' : 'Simulado'}
              </span>
              <span
                className="absolute left-[25%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none"
                style={{ opacity: studyMode === 'zen' ? 0 : 1 }}
              >
                Zen
              </span>
              <span
                className="absolute left-[75%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none"
                style={{ opacity: studyMode === 'hard' ? 0 : 1 }}
              >
                Simulado
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudySettingsCard;
