import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter, Eye, Edit, Trash2, Play, Leaf, Flame } from 'lucide-react';
import { Caderno, PracticeMode } from '../../types';

export interface NotebookSettings {
  questionCount: number;
  studyMode: PracticeMode;
}

export interface NotebookCardProps {
  notebook: Caderno;
  settings: NotebookSettings;
  index?: number;
  onView: (notebook: Caderno) => void;
  onEdit: (notebook: Caderno) => void;
  onDelete: (notebook: Caderno) => void;
  onStart: (notebook: Caderno) => void;
  onSettingsChange: (notebookId: string, settings: Partial<NotebookSettings>) => void;
}

export function NotebookCard({
  notebook,
  settings,
  index = 0,
  onView,
  onEdit,
  onDelete,
  onStart,
  onSettingsChange,
}: NotebookCardProps) {
  // Count total filters
  const totalFilters =
    (notebook.filters?.materia?.length || 0) +
    (notebook.filters?.assunto?.length || 0) +
    (notebook.filters?.banca?.length || 0) +
    (notebook.filters?.orgao?.length || 0) +
    (notebook.filters?.cargo?.length || 0) +
    (notebook.filters?.ano?.length || 0);

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange(notebook.id, { questionCount: Number(e.target.value) });
  };

  const handleStudyModeToggle = () => {
    const newMode = settings.studyMode === 'zen' ? 'hard' : 'zen';
    onSettingsChange(notebook.id, { studyMode: newMode as PracticeMode });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-text-muted)] transition-colors theme-transition flex flex-col min-h-[320px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg">
            <BookOpen size={20} className="text-[var(--color-brand)]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--color-text-main)] truncate">
              {notebook.title}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {(notebook.saved_questions_count || 0) > 0 && (
                <span className="text-[var(--color-brand)]">
                  {notebook.saved_questions_count} salvas
                </span>
              )}
              {(notebook.saved_questions_count || 0) > 0 &&
                (notebook.questions_count || 0) > 0 &&
                ' + '}
              {(notebook.questions_count || 0) > 0 && (
                <span>
                  {(notebook.questions_count || 0).toLocaleString('pt-BR')} por filtros
                </span>
              )}
              {(notebook.saved_questions_count || 0) === 0 &&
                (notebook.questions_count || 0) === 0 && <span>Caderno vazio</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onView(notebook)}
            className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            title="Ver filtros"
          >
            <Eye size={16} className="text-[var(--color-text-sec)]" />
          </button>
          <button
            onClick={() => onEdit(notebook)}
            className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={16} className="text-[var(--color-text-sec)]" />
          </button>
          <button
            onClick={() => onDelete(notebook)}
            className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} className="text-[var(--color-error)]" />
          </button>
        </div>
      </div>

      {/* Content area - grows to fill space */}
      <div className="flex-1">
        {/* Description */}
        {notebook.description && (
          <p className="text-sm text-[var(--color-text-sec)] mb-4 line-clamp-2">
            {notebook.description}
          </p>
        )}

        {/* Filters badge */}
        {totalFilters > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              {totalFilters} filtros aplicados
            </span>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-3 mb-4">
          {/* Question count slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--color-text-sec)]">
                Questões por sessão
              </span>
              <span className="text-sm font-bold text-[var(--color-text-main)]">
                {settings.questionCount}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={settings.questionCount}
              onChange={handleQuestionCountChange}
              className="w-full h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
            />
          </div>

          {/* Study mode toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-sec)]">Modo de estudo</span>
            <button
              onClick={handleStudyModeToggle}
              className="relative inline-flex items-center h-7 rounded-full w-28 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] transition-colors"
            >
              <span
                className={`absolute inline-flex items-center justify-center gap-1 h-6 rounded-full text-xs font-bold transition-all duration-300 ${
                  settings.studyMode === 'zen'
                    ? 'left-0.5 w-[calc(50%-0.25rem)] bg-[var(--color-success)] text-black'
                    : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.25rem)] bg-[var(--color-error)] text-white'
                }`}
              >
                {settings.studyMode === 'zen' ? (
                  <>
                    <Leaf size={12} /> Zen
                  </>
                ) : (
                  <>
                    <Flame size={12} /> Hard
                  </>
                )}
              </span>
              <span
                className="absolute left-[25%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none"
                style={{ opacity: settings.studyMode === 'zen' ? 0 : 1 }}
              >
                Zen
              </span>
              <span
                className="absolute left-[75%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none"
                style={{ opacity: settings.studyMode === 'hard' ? 0 : 1 }}
              >
                Hard
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Start button - always at bottom */}
      <button
        onClick={() => onStart(notebook)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-black font-bold rounded-xl transition-colors"
      >
        <Play size={18} fill="currentColor" />
        Iniciar Prática
      </button>
    </motion.div>
  );
}

export default NotebookCard;
