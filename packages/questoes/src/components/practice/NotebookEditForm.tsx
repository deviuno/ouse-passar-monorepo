import React from 'react';
import { PenLine } from 'lucide-react';

export interface NotebookEditFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  className?: string;
}

export function NotebookEditForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  className = '',
}: NotebookEditFormProps) {
  return (
    <section className={className}>
      <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <PenLine size={14} /> Dados do Caderno
      </h3>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-5 theme-transition">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[var(--color-text-main)] text-sm font-medium mb-2 block">
              Nome do Caderno
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Nome do caderno"
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors theme-transition"
            />
          </div>
          <div>
            <label className="text-[var(--color-text-main)] text-sm font-medium mb-2 block">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Descrição do caderno"
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors theme-transition"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default NotebookEditForm;
