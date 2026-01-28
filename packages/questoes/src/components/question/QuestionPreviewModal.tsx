import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookMarked, Building2, Calendar, BookOpen, FileText, Pencil, Trash2, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ParsedQuestion } from '../../types';
import { getOptimizedImageUrl } from '../../utils/image';
import { ConfirmModal } from '../ui/ConfirmModal';

interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: ParsedQuestion;
  annotation: {
    id: string;
    titulo?: string;
    conteudo: string;
    created_at: string;
  };
  onAnnotationUpdated?: (id: string, conteudo: string) => Promise<void>;
  onAnnotationDeleted?: (id: string) => Promise<void>;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  isOpen,
  onClose,
  question,
  annotation,
  onAnnotationUpdated,
  onAnnotationDeleted,
}) => {
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editConteudo, setEditConteudo] = useState(annotation.conteudo);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format relative date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('pt-BR');
  };

  // Preprocess image URLs in enunciado
  const preprocessImageUrls = (text: string, imagensEnunciado?: string | null): string => {
    if (!text) return '';

    let processed = text;

    // Primeiro: substituir placeholders por URLs reais do campo imagens_enunciado
    if (imagensEnunciado) {
      const urlMatches = imagensEnunciado.match(/https?:\/\/[^\s,}]+/g);
      if (urlMatches && urlMatches.length > 0) {
        let urlIndex = 0;
        processed = processed.replace(
          /!\[([^\]]*)\]\(URL_DA_IMAGEM_AQUI\)/gi,
          () => {
            const url = urlMatches[urlIndex] || urlMatches[0];
            urlIndex++;
            return `![Imagem](${url})`;
          }
        );
      }
    }

    // Padrão 0: Corrigir markdown de link que deveria ser imagem [Imagem](url) -> ![Imagem](url)
    processed = processed.replace(
      /(?<!!)\[Imagem[^\]]*\]\((https?:\/\/[^)]+)\)/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    // Padrão 1: "Disponível em: URL" com extensão de imagem
    processed = processed.replace(
      /Disponível em:\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))[^\n]*/gi,
      '\n\n![Imagem da questão]($1)\n\n'
    );

    // Padrão 2: "Disponível em: URL" para CDNs conhecidos
    processed = processed.replace(
      /Disponível em:\s*(https?:\/\/cdn\.tecconcursos\.com\.br\/[^\s\)]+)[^\n]*/gi,
      '\n\n![Imagem da questão]($1)\n\n'
    );

    // Padrão 3: URLs diretas de imagem com extensão
    processed = processed.replace(
      /(?<!\]\()(?<!\!)\b(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))\b(?!\))/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    // Padrão 4: URLs do CDN TecConcursos (figuras sem extensão)
    processed = processed.replace(
      /(?<!\]\()(?<!\!)\b(https?:\/\/cdn\.tecconcursos\.com\.br\/figuras\/[^\s<>")\]]+)\b(?!\))/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    // Padrão 5: Tags HTML <img src="...">
    processed = processed.replace(
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    return processed;
  };

  // Handle edit start
  const handleStartEdit = () => {
    setEditConteudo(annotation.conteudo);
    setIsEditing(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editConteudo.trim() || !onAnnotationUpdated) return;

    setIsSaving(true);
    try {
      await onAnnotationUpdated(annotation.id, editConteudo.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating annotation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditConteudo(annotation.conteudo);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onAnnotationDeleted) return;

    setIsDeleting(true);
    try {
      await onAnnotationDeleted(annotation.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting annotation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

            {/* Modal Container - Flex centering */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="w-full max-w-2xl max-h-[85vh] bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex flex-col overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                      {question.materia}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors flex-shrink-0"
                  >
                    <X size={18} className="text-[var(--color-text-sec)]" />
                  </button>
                </div>

                {/* Content - scrollable */}
                <div className="flex-1 overflow-y-auto">
                  {/* Question metadata */}
                  <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-sec)]">
                      {question.banca && (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-[var(--color-text-muted)]" />
                          <span>{question.banca}</span>
                        </div>
                      )}
                      {question.ano && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--color-text-muted)]" />
                          <span>{question.ano}</span>
                        </div>
                      )}
                      {question.assunto && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={12} className="text-[var(--color-text-muted)]" />
                          <span className="truncate max-w-[200px]">{question.assunto}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                        <FileText size={12} />
                        <span>#{question.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Annotation */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-start gap-2 p-3 bg-amber-500/5 border-l-2 border-amber-500/40 rounded-r-lg">
                      <BookMarked size={14} className="text-amber-500/70 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <textarea
                              value={editConteudo}
                              onChange={(e) => setEditConteudo(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editConteudo.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#FFB800] text-black rounded-lg hover:bg-[#FFC933] transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-medium text-amber-600/80">
                                Sua anotação
                              </span>
                              {/* Edit/Delete buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={handleStartEdit}
                                  className="p-1 hover:bg-[#FFB800]/10 rounded transition-colors"
                                  title="Editar anotação"
                                >
                                  <Pencil size={12} className="text-amber-500/70" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                  title="Excluir anotação"
                                >
                                  <Trash2 size={12} className="text-red-400/70" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-[var(--color-text-sec)] whitespace-pre-wrap leading-relaxed">
                              {annotation.conteudo}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Enunciado */}
                  <div className="px-4 pb-4">
                    <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                      Enunciado
                    </h4>
                    <div className="text-sm leading-relaxed text-[var(--color-text-main)] prose prose-sm max-w-none [&_strong]:text-[var(--color-text-main)] [&_p]:text-[var(--color-text-main)]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="mb-3 leading-relaxed text-[var(--color-text-main)]">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-[var(--color-text-main)]">
                              {children}
                            </strong>
                          ),
                          img: ({ src, alt }) => (
                            <img
                              src={getOptimizedImageUrl(src, 600, 85)}
                              alt={alt || 'Imagem da questão'}
                              className="max-w-full h-auto rounded-lg my-3 border border-[var(--color-border)]"
                              loading="lazy"
                            />
                          ),
                        }}
                      >
                        {preprocessImageUrls(question.enunciado || '', question.imagens_enunciado)}
                      </ReactMarkdown>
                    </div>

                    {/* Alternatives */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                        Alternativas
                      </h4>
                      {question.parsedAlternativas.map((alt) => {
                        const isCorrect = alt.letter === question.gabarito;
                        return (
                          <div
                            key={alt.letter}
                            className={`
                              p-3 rounded-lg border transition-colors
                              ${isCorrect
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
                              }
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`
                                  font-semibold text-sm w-5 flex-shrink-0
                                  ${isCorrect ? 'text-emerald-500' : 'text-[var(--color-text-sec)]'}
                                `}
                              >
                                {alt.letter}
                              </span>
                              <span className="text-sm text-[var(--color-text-main)] flex-1">
                                {alt.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-main)] transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir anotação"
        message="Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
        isLoading={isDeleting}
      />
    </>
  );
};

export default QuestionPreviewModal;
