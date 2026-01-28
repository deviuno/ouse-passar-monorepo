import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Caderno } from '../../types';

interface ViewNotebookFiltersModalProps {
  notebook: Caderno | null;
  onClose: () => void;
  onEdit: (notebook: Caderno) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ViewNotebookFiltersModal({
  notebook,
  onClose,
  onEdit,
  onDelete,
}: ViewNotebookFiltersModalProps) {
  if (!notebook) return null;

  const filters = notebook.filters;

  return (
    <AnimatePresence>
      {notebook && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[114px] left-0 right-0 mx-4 w-auto max-w-2xl bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] p-4 lg:p-6 z-50 shadow-2xl max-h-[calc(100vh-180px)] overflow-y-auto lg:left-1/2 lg:right-auto lg:-translate-x-1/2 theme-transition"
          >
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-base lg:text-xl font-bold text-[var(--color-text-main)] pr-2">Filtros de "{notebook.title}"</h3>
              <button
                onClick={onClose}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
              {/* Matérias */}
              {filters?.materia && filters.materia.length > 0 && (
                <FilterSection title="Matérias" items={filters.materia} />
              )}

              {/* Assuntos */}
              {filters?.assunto && filters.assunto.length > 0 && (
                <FilterSection title="Assuntos" items={filters.assunto} />
              )}

              {/* Bancas */}
              {filters?.banca && filters.banca.length > 0 && (
                <FilterSection title="Bancas" items={filters.banca} />
              )}

              {/* Órgãos */}
              {filters?.orgao && filters.orgao.length > 0 && (
                <FilterSection title="Órgãos" items={filters.orgao} />
              )}

              {/* Anos */}
              {filters?.ano && filters.ano.length > 0 && (
                <FilterSection title="Anos" items={filters.ano} />
              )}

              {/* Cargos */}
              {filters?.cargo && filters.cargo.length > 0 && (
                <FilterSection title="Cargos" items={filters.cargo} />
              )}

              {/* Escolaridade */}
              {filters?.escolaridade && filters.escolaridade.length > 0 && (
                <FilterSection title="Escolaridade" items={filters.escolaridade} />
              )}

              {/* Modalidade */}
              {filters?.modalidade && filters.modalidade.length > 0 && (
                <FilterSection title="Modalidade" items={filters.modalidade} />
              )}

              {/* Dificuldade */}
              {filters?.dificuldade && filters.dificuldade.length > 0 && (
                <FilterSection title="Dificuldade" items={filters.dificuldade} />
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                fullWidth
                size="lg"
                onClick={() => onEdit(notebook)}
                className="bg-[#ffac00] hover:bg-[#ffbc33] text-black font-bold text-sm lg:text-lg"
                leftIcon={<Edit size={16} className="lg:w-[18px] lg:h-[18px]" />}
              >
                Editar
              </Button>
              <button
                onClick={(e) => {
                  onDelete(notebook.id, e);
                  onClose();
                }}
                className="flex items-center justify-center w-12 h-12 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/50 transition-colors flex-shrink-0 theme-transition"
                title="Excluir caderno"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Componente auxiliar para seções de filtro
function FilterSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs lg:text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-2">
        {title} ({items.length})
      </h4>
      <div className="flex flex-wrap gap-1.5 lg:gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-[var(--color-text-main)] theme-transition"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
