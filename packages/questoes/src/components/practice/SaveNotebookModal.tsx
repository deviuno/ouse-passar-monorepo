import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../ui';

interface SaveNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  notebookName: string;
  onNotebookNameChange: (value: string) => void;
  notebookDescription: string;
  onNotebookDescriptionChange: (value: string) => void;
  totalFilters: number;
  filteredCount: number;
  questionCount: number;
  isSaving: boolean;
  isLoadingCount: boolean;
}

export function SaveNotebookModal({
  isOpen,
  onClose,
  onSave,
  notebookName,
  onNotebookNameChange,
  notebookDescription,
  onNotebookDescriptionChange,
  totalFilters,
  filteredCount,
  questionCount,
  isSaving,
  isLoadingCount,
}: SaveNotebookModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 pb-20 md:pb-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl p-6 md:p-8 shadow-2xl border border-[var(--color-border)] theme-transition pointer-events-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[var(--color-brand)]/10 rounded-xl">
                  <Save size={24} className="text-[var(--color-brand)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-text-main)]">Salvar Caderno</h3>
              </div>

              <div className="mb-4">
                <label className="text-[var(--color-text-sec)] text-sm font-bold uppercase tracking-wider mb-2 block">Nome do Caderno</label>
                <input
                  type="text"
                  value={notebookName}
                  onChange={(e) => onNotebookNameChange(e.target.value)}
                  placeholder="Ex: Constitucional - Revisão CPC"
                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors theme-transition"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="text-[var(--color-text-sec)] text-sm font-bold uppercase tracking-wider mb-2 block">Descrição (opcional)</label>
                <textarea
                  value={notebookDescription}
                  onChange={(e) => onNotebookDescriptionChange(e.target.value)}
                  placeholder="Ex: Questões de revisão para a prova da PF"
                  rows={2}
                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none theme-transition"
                />
              </div>

              <div className="bg-[var(--color-bg-main)] rounded-xl p-4 mb-6 space-y-2 border border-[var(--color-border)] theme-transition">
                <div className="flex justify-between text-xs text-[var(--color-text-sec)]">
                  <span>Filtros ativos:</span>
                  <span className="text-[var(--color-text-main)]">{totalFilters}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-sec)]">
                  <span>Questões disponíveis:</span>
                  <span className="text-[var(--color-text-main)]">{filteredCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-sec)]">
                  <span>Questões por sessão:</span>
                  <span className="text-[var(--color-text-main)]">{questionCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={onClose}
                  className="rounded-xl py-3 border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]"
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  onClick={onSave}
                  disabled={!notebookName.trim() || isSaving || isLoadingCount}
                  className="rounded-xl py-3 bg-[var(--color-brand)] text-black font-bold hover:bg-[var(--color-brand-hover)]"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Caderno'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
