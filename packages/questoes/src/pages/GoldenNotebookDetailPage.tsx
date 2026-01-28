import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  Loader2,
  Edit,
  Trash2,
  X,
  FileText,
  Building2,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Button, ConfirmModal } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import {
  getGoldenNotebook,
  getNotebookAnnotations,
  updateAnnotation,
  deleteAnnotation,
  GoldenNotebook,
  GoldenAnnotation,
} from '../services/goldenNotebookService';
import { fetchQuestionById } from '../services/questionsService';
import { ParsedQuestion } from '../types';
import { QuestionPreviewModal } from '../components/question/QuestionPreviewModal';

// Extended annotation with question data
interface AnnotationWithQuestion extends GoldenAnnotation {
  question?: ParsedQuestion | null;
}

export const GoldenNotebookDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [notebook, setNotebook] = useState<GoldenNotebook | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationWithQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [editingAnnotation, setEditingAnnotation] = useState<GoldenAnnotation | null>(null);
  const [deletingAnnotation, setDeletingAnnotation] = useState<GoldenAnnotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Question preview modal
  const [previewAnnotation, setPreviewAnnotation] = useState<AnnotationWithQuestion | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    conteudo: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load notebook and annotations
  useEffect(() => {
    if (!user?.id || !id) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [notebookData, annotationsData] = await Promise.all([
          getGoldenNotebook(id, user.id),
          getNotebookAnnotations(id, user.id),
        ]);

        if (!notebookData) {
          addToast('error', 'Caderno não encontrado');
          navigate('/minhas-anotacoes');
          return;
        }

        setNotebook(notebookData);

        // Fetch question data for annotations that have question_id
        const annotationsWithQuestions: AnnotationWithQuestion[] = await Promise.all(
          annotationsData.map(async (annotation) => {
            if (annotation.question_id) {
              try {
                const question = await fetchQuestionById(annotation.question_id);
                return { ...annotation, question };
              } catch {
                return { ...annotation, question: null };
              }
            }
            return { ...annotation, question: null };
          })
        );

        setAnnotations(annotationsWithQuestions);
      } catch (error) {
        console.error('Erro ao carregar caderno:', error);
        addToast('error', 'Erro ao carregar caderno');
        navigate('/minhas-anotacoes');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, id]);

  // Set up header when notebook is loaded
  useEffect(() => {
    if (notebook) {
      setHeaderOverride({
        title: notebook.nome,
        showBackButton: true,
        backPath: '/minhas-anotacoes',
        hideIcon: true,
      });
    }

    return () => {
      clearHeaderOverride();
    };
  }, [notebook?.nome]);

  const handleUpdateAnnotation = async () => {
    if (!user?.id || !editingAnnotation || !formData.conteudo.trim()) {
      addToast('error', 'Preencha o conteúdo da anotação');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateAnnotation(editingAnnotation.id, user.id, {
        conteudo: formData.conteudo,
      });
      setAnnotations((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...updated, question: a.question } : a))
      );
      setEditingAnnotation(null);
      setFormData({ conteudo: '' });
      addToast('success', 'Anotação atualizada!');
    } catch (error) {
      addToast('error', 'Erro ao atualizar anotação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!user?.id || !deletingAnnotation) return;

    setIsDeleting(true);
    try {
      await deleteAnnotation(deletingAnnotation.id, user.id);
      setAnnotations((prev) => prev.filter((a) => a.id !== deletingAnnotation.id));
      if (notebook) {
        setNotebook({ ...notebook, anotacoes_count: notebook.anotacoes_count - 1 });
      }
      setDeletingAnnotation(null);
      addToast('success', 'Anotação excluída');
    } catch (error) {
      addToast('error', 'Erro ao excluir anotação');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (annotation: GoldenAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      conteudo: annotation.conteudo,
    });
    setEditingAnnotation(annotation);
  };

  const closeEditModal = () => {
    setEditingAnnotation(null);
    setFormData({ conteudo: '' });
  };

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

  // Clean enunciado text for preview (remove images, URLs, markdown)
  const cleanEnunciadoForPreview = (text: string): string => {
    let cleaned = text
      // Remove markdown images: ![alt](url) including placeholder
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/!\[[^\]]*\]\(URL_DA_IMAGEM_AQUI\)/gi, '')
      // Remove broken markdown links that should be images: [Imagem](url)
      .replace(/\[Imagem[^\]]*\]\([^)]+\)/gi, '')
      // Remove "Disponível em:" followed by URL
      .replace(/Disponível em:\s*https?:\/\/[^\s]+/gi, '')
      // Remove raw image URLs with extensions
      .replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)[^\s]*/gi, '')
      // Remove TecConcursos CDN URLs (figuras without extension)
      .replace(/https?:\/\/cdn\.tecconcursos\.com\.br\/figuras\/[^\s<>")\]]+/gi, '')
      // Remove HTML img tags
      .replace(/<img[^>]*>/gi, '')
      // Remove bold markdown
      .replace(/\*\*/g, '')
      // Replace newlines with spaces
      .replace(/\n+/g, ' ')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const handleCardClick = (annotation: AnnotationWithQuestion) => {
    if (annotation.question) {
      setPreviewAnnotation(annotation);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-sec)]">Carregando anotações...</p>
        </div>
      </div>
    );
  }

  if (!user || !notebook) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center">
          <BookMarked size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
            Caderno não encontrado
          </h2>
          <Button onClick={() => navigate('/minhas-anotacoes')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-6 theme-transition">
      <div className="max-w-3xl mx-auto">
        {/* Annotations List */}
        {annotations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <FileText size={40} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
              Nenhuma anotação ainda
            </h2>
            <p className="text-[var(--color-text-sec)] text-center max-w-md">
              Salve anotações ao resolver questões na aba "Anotar".
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {annotations.map((annotation, index) => {
              const hasQuestion = !!annotation.question;

              return (
                <motion.div
                  key={annotation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleCardClick(annotation)}
                  className={`
                    bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden theme-transition
                    ${hasQuestion ? 'cursor-pointer hover:border-amber-500/40' : ''}
                  `}
                >
                  {/* Question Info Header - only if has question */}
                  {hasQuestion && annotation.question && (
                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
                      {/* Line 1: Matéria (left) + Ano (right) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                          {annotation.question.materia}
                        </span>
                        <div className="flex items-center gap-2">
                          {annotation.question.ano && (
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {annotation.question.ano}
                            </span>
                          )}
                          <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                        </div>
                      </div>
                      {/* Line 2: Banca */}
                      {annotation.question.banca && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[var(--color-text-sec)]">
                          <Building2 size={10} className="flex-shrink-0" />
                          <span>{annotation.question.banca}</span>
                        </div>
                      )}
                      {/* Line 3: Assunto */}
                      {annotation.question.assunto && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--color-text-sec)]">
                          <BookOpen size={10} className="flex-shrink-0" />
                          <span className="truncate">{annotation.question.assunto}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enunciado excerpt - only if has question */}
                  {hasQuestion && annotation.question && (
                    <div className="px-4 py-3 border-b border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-text-sec)] leading-relaxed line-clamp-2">
                        {truncateText(cleanEnunciadoForPreview(annotation.question.enunciado), 180)}
                      </p>
                    </div>
                  )}

                  {/* Annotation Content */}
                  <div className="p-4">
                    {/* Header with actions */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <BookMarked size={12} className="text-amber-500" />
                        </div>
                        <span className="text-sm text-[var(--color-text-muted)]">
                          Sua anotação
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => openEditModal(annotation, e)}
                          className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-md transition-colors"
                        >
                          <Edit size={14} className="text-[var(--color-text-sec)]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingAnnotation(annotation);
                          }}
                          className="p-1.5 hover:bg-[var(--color-error)]/10 rounded-md transition-colors"
                        >
                          <Trash2 size={14} className="text-[var(--color-error)]" />
                        </button>
                      </div>
                    </div>

                    {/* Annotation text */}
                    <p className="text-sm text-[var(--color-text-main)] whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {annotation.conteudo}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]">
                      {hasQuestion ? (
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          #{annotation.question_id}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          Anotação livre
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatDate(annotation.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingAnnotation && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeEditModal}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] z-50 overflow-hidden theme-transition flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                  <h3 className="font-bold text-[var(--color-text-main)]">
                    Editar Anotação
                  </h3>
                  <button
                    onClick={closeEditModal}
                    className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                  >
                    <X size={18} className="text-[var(--color-text-sec)]" />
                  </button>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* Content */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-sec)] mb-2">
                      Anotação
                    </label>
                    <textarea
                      placeholder="Escreva sua anotação aqui..."
                      value={formData.conteudo}
                      onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
                  <Button variant="secondary" fullWidth onClick={closeEditModal}>
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleUpdateAnnotation}
                    disabled={isSaving || !formData.conteudo.trim()}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deletingAnnotation}
          onClose={() => setDeletingAnnotation(null)}
          onConfirm={handleDeleteAnnotation}
          title="Excluir Anotação"
          message="Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="danger"
          isLoading={isDeleting}
        />

        {/* Question Preview Modal */}
        {previewAnnotation && previewAnnotation.question && (
          <QuestionPreviewModal
            isOpen={!!previewAnnotation}
            onClose={() => setPreviewAnnotation(null)}
            question={previewAnnotation.question}
            annotation={{
              id: previewAnnotation.id,
              titulo: previewAnnotation.titulo,
              conteudo: previewAnnotation.conteudo,
              created_at: previewAnnotation.created_at,
            }}
            onAnnotationUpdated={async (id, conteudo) => {
              if (!user?.id) return;
              const updated = await updateAnnotation(id, user.id, {
                conteudo,
              });
              setAnnotations((prev) =>
                prev.map((a) => (a.id === updated.id ? { ...updated, question: a.question } : a))
              );
              // Update the preview annotation state with new content
              setPreviewAnnotation((prev) =>
                prev ? { ...prev, conteudo } : null
              );
              addToast('success', 'Anotação atualizada!');
            }}
            onAnnotationDeleted={async (id) => {
              if (!user?.id) return;
              await deleteAnnotation(id, user.id);
              setAnnotations((prev) => prev.filter((a) => a.id !== id));
              if (notebook) {
                setNotebook({ ...notebook, anotacoes_count: notebook.anotacoes_count - 1 });
              }
              addToast('success', 'Anotação excluída');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GoldenNotebookDetailPage;
