import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Filter, Edit, Trash2, Play, Leaf, Timer, MoreVertical } from 'lucide-react';
import { Caderno, PracticeMode } from '../../types';

export interface NotebookSettings {
  questionCount: number;
  studyMode: PracticeMode;
}

export interface NotebookCardProps {
  notebook: Caderno;
  settings: NotebookSettings;
  index?: number;
  onView?: (notebook: Caderno) => void;
  onEdit: (notebook: Caderno) => void;
  onDelete: (notebook: Caderno) => void;
  onStart: (notebook: Caderno) => void;
  onSettingsChange: (notebookId: string, settings: Partial<NotebookSettings>) => void;
}

export function NotebookCard({
  notebook,
  settings,
  index = 0,
  onEdit,
  onDelete,
  onStart,
  onSettingsChange,
}: NotebookCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

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

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit(notebook);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(notebook);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-text-muted)] transition-colors theme-transition flex flex-col min-h-[320px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg flex-shrink-0">
            <BookOpen size={20} className="text-[var(--color-brand)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[var(--color-text-main)] leading-tight">
              {notebook.title}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
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

        {/* Context Menu */}
        <div className="relative flex-shrink-0">
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            title="Opções"
          >
            <MoreVertical size={16} className="text-[var(--color-text-muted)]" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden"
              >
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  <Edit size={14} className="text-[var(--color-text-sec)]" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
              className="relative inline-flex items-center h-7 rounded-full w-[120px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] transition-colors"
            >
              {/* Background labels - same size as active, just not bold */}
              <span
                className={`absolute left-[calc(25%-2px)] -translate-x-1/2 text-xs transition-opacity duration-200 ${
                  settings.studyMode === 'zen' ? 'opacity-0' : 'opacity-100 text-[var(--color-text-muted)]'
                }`}
              >
                Zen
              </span>
              <span
                className={`absolute left-[calc(75%+2px)] -translate-x-1/2 text-xs transition-opacity duration-200 ${
                  settings.studyMode === 'hard' ? 'opacity-0' : 'opacity-100 text-[var(--color-text-muted)]'
                }`}
              >
                Simu
              </span>

              {/* Active pill - equal width for both states */}
              <span
                className={`absolute inline-flex items-center justify-center gap-1 h-6 w-[calc(50%-2px)] rounded-full text-xs font-bold transition-all duration-200 ${
                  settings.studyMode === 'zen'
                    ? 'left-0.5 bg-[var(--color-success)] text-black'
                    : 'left-[calc(50%+1px)] bg-[var(--color-error)] text-white'
                }`}
              >
                {settings.studyMode === 'zen' ? (
                  <>
                    <Leaf size={12} /> Zen
                  </>
                ) : (
                  <>
                    <Timer size={12} /> Simu
                  </>
                )}
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
