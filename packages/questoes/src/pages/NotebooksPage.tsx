import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Coffee,
  Zap,
  X,
  Filter,
} from 'lucide-react';
import { Button, Card, ConfirmModal } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import { getUserNotebooks, deleteNotebook, getNotebookSavedQuestionIds } from '../services/notebooksService';
import { fetchQuestions, fetchQuestionsByIds, parseRawQuestion } from '../services/questionsService';
import { Caderno, PracticeMode, ParsedQuestion, RawQuestion } from '../types';

// Tipo para configurações de notebook
interface NotebookSettings {
  questionCount: number;
  studyMode: PracticeMode;
}

export const NotebooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [notebooks, setNotebooks] = useState<Caderno[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notebookSettings, setNotebookSettings] = useState<Record<string, NotebookSettings>>({});
  const [viewingNotebook, setViewingNotebook] = useState<Caderno | null>(null);
  const [deletingNotebook, setDeletingNotebook] = useState<Caderno | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState<string | null>(null);

  // Load notebooks on mount
  useEffect(() => {
    setIsLoading(true);
    
    const loadNotebooks = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }


      try {
        const userNotebooks = await getUserNotebooks(user.id);
        setNotebooks(userNotebooks);

        // Initialize settings for each notebook
        const defaultSettings: Record<string, NotebookSettings> = {};
        userNotebooks.forEach((nb) => {
          defaultSettings[nb.id] = {
            questionCount: nb.settings?.questionCount || 120,
            studyMode: (nb.settings?.studyMode as PracticeMode) || 'zen',
          };
        });
        setNotebookSettings(defaultSettings);
      } catch (error) {
        console.error('Erro ao carregar cadernos:', error);
        addToast('error', 'Erro ao carregar cadernos');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotebooks();
  }, [user?.id]);

  // Set up header
  useEffect(() => {
    setHeaderOverride({
      title: 'Meus Cadernos',
      showBackButton: true,
      backPath: '/questoes',
      hideIcon: true,
    });

    return () => {
      clearHeaderOverride();
    };
  }, []);

  const handleStartFromNotebook = async (notebook: Caderno) => {
    setIsStarting(notebook.id);

    try {
      const settings = notebookSettings[notebook.id];
      const filters = notebook.filters || {};
      const hasSavedQuestions = (notebook.saved_questions_count || 0) > 0;
      const hasFilters = Object.values(filters).some(
        (v) => Array.isArray(v) && v.length > 0
      );

      console.log('notebook ->', notebook, { hasSavedQuestions, hasFilters });

      let allQuestions: ParsedQuestion[] = [];

      // Fetch saved questions if any
      if (hasSavedQuestions) {
        const savedQuestionIds = await getNotebookSavedQuestionIds(notebook.id);
        if (savedQuestionIds.length > 0) {
          const savedQuestions = await fetchQuestionsByIds(savedQuestionIds);
          allQuestions = [...savedQuestions];
          console.log('Saved questions:', savedQuestions.length);
        }
      }

      // Fetch filter-based questions if there are filters
      if (hasFilters) {
        // Calculate how many more questions we need from filters
        const remainingCount = Math.max(0, settings.questionCount - allQuestions.length);

        if (remainingCount > 0) {
          const filterQuestions = await fetchQuestions({
            materias: filters.materia?.length > 0 ? filters.materia : undefined,
            assuntos: filters.assunto?.length > 0 ? filters.assunto : undefined,
            bancas: filters.banca?.length > 0 ? filters.banca : undefined,
            orgaos: filters.orgao?.length > 0 ? filters.orgao : undefined,
            cargos: filters.cargo?.length > 0 ? filters.cargo : undefined,
            anos: filters.ano?.length > 0 ? filters.ano.map(Number) : undefined,
            escolaridade: filters.escolaridade?.length > 0 ? filters.escolaridade : undefined,
            modalidade: filters.modalidade?.length > 0 ? filters.modalidade : undefined,
            dificuldade: filters.dificuldade?.length > 0 ? filters.dificuldade : undefined,
            limit: remainingCount + allQuestions.length, // Fetch extra to filter duplicates
            shuffle: true,
          });

          // Remove duplicates (questions already in saved list)
          const savedIds = new Set(allQuestions.map((q) => q.id));
          const uniqueFilterQuestions = filterQuestions.filter((q) => !savedIds.has(q.id));

          // Take only what we need
          allQuestions = [...allQuestions, ...uniqueFilterQuestions.slice(0, remainingCount)];
          console.log('Filter questions added:', uniqueFilterQuestions.slice(0, remainingCount).length);
        }
      }

      console.log('Total questions:', allQuestions.length);

      if (allQuestions.length === 0) {
        addToast('info', 'Nenhuma questão encontrada neste caderno');
        setIsStarting(null);
        return;
      }

      // Shuffle the final list
      allQuestions = allQuestions.sort(() => Math.random() - 0.5);

      // Limit to configured question count
      const finalQuestions = allQuestions.slice(0, settings.questionCount);

      // Store in sessionStorage for the practice page
      sessionStorage.setItem('practiceQuestions', JSON.stringify(finalQuestions));
      sessionStorage.setItem('practiceMode', settings.studyMode);
      sessionStorage.setItem('practiceSource', 'notebook');
      sessionStorage.setItem('practiceNotebookId', notebook.id);

      // Navigate to practice page
      navigate(`/praticar?start=true&notebook_id=${notebook.id}`);
    } catch (error) {
      console.error('Erro ao iniciar prática:', error);
      addToast('error', 'Erro ao iniciar prática');
    } finally {
      setIsStarting(null);
    }
  };

  const handleEditNotebook = (notebook: Caderno) => {
    // Navigate to practice page with notebook for editing (filters open)
    const params = new URLSearchParams();
    params.set('editNotebook', notebook.id);
    params.set('showFilters', 'true');
    navigate(`/praticar?${params.toString()}`);
  };

  const handleDeleteNotebook = async () => {
    if (!deletingNotebook) return;

    setIsDeleting(true);
    try {
      await deleteNotebook(deletingNotebook.id);
      setNotebooks((prev) => prev.filter((nb) => nb.id !== deletingNotebook.id));
      // addToast('success', 'Caderno excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir caderno:', error);
      // addToast('error', 'Erro ao excluir caderno');
    } finally {
      setIsDeleting(false);
      setDeletingNotebook(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[var(--color-brand)] mx-auto mb-4" />
          <p className="text-[var(--color-text-sec)]">Carregando cadernos...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center">
          <BookOpen size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Faça login para acessar seus cadernos</h2>
          <p className="text-[var(--color-text-sec)] mb-6">Você precisa estar logado para ver seus cadernos salvos.</p>
          <Button onClick={() => navigate('/login')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-6 theme-transition">
      <div className="max-w-6xl mx-auto">
        {/* Top Action Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => navigate('/praticar?showFilters=true')}
            leftIcon={<Plus size={18} />}
          >
            Novo Caderno
          </Button>
        </div>

        {/* Empty state */}
        {notebooks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Nenhum caderno ainda</h2>
            <p className="text-[var(--color-text-sec)] text-center max-w-md mb-6">
              Crie seu primeiro caderno configurando filtros na página de prática e salvando para
              acessar rapidamente.
            </p>
            <Button onClick={() => navigate('/praticar?showFilters=true')}>
              Criar meu primeiro caderno
            </Button>
          </motion.div>
        ) : (
          /* Notebooks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map((notebook, index) => {
              const settings = notebookSettings[notebook.id] || {
                questionCount: 120,
                studyMode: 'zen' as PracticeMode,
              };

              // Count total filters
              const totalFilters =
                (notebook.filters?.materia?.length || 0) +
                (notebook.filters?.assunto?.length || 0) +
                (notebook.filters?.banca?.length || 0) +
                (notebook.filters?.orgao?.length || 0) +
                (notebook.filters?.cargo?.length || 0) +
                (notebook.filters?.ano?.length || 0);

              return (
                <motion.div
                  key={notebook.id}
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
                        <h3 className="font-bold text-[var(--color-text-main)] truncate">{notebook.title}</h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {(notebook.saved_questions_count || 0) > 0 && (
                            <span className="text-[var(--color-brand)]">
                              {notebook.saved_questions_count} salvas
                            </span>
                          )}
                          {(notebook.saved_questions_count || 0) > 0 && (notebook.questions_count || 0) > 0 && ' + '}
                          {(notebook.questions_count || 0) > 0 && (
                            <span>{(notebook.questions_count || 0).toLocaleString('pt-BR')} por filtros</span>
                          )}
                          {(notebook.saved_questions_count || 0) === 0 && (notebook.questions_count || 0) === 0 && (
                            <span>Caderno vazio</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewingNotebook(notebook)}
                        className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                        title="Ver filtros"
                      >
                        <Eye size={16} className="text-[var(--color-text-sec)]" />
                      </button>
                      <button
                        onClick={() => handleEditNotebook(notebook)}
                        className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} className="text-[var(--color-text-sec)]" />
                      </button>
                      <button
                        onClick={() => setDeletingNotebook(notebook)}
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
                      <p className="text-sm text-[var(--color-text-sec)] mb-4 line-clamp-2">{notebook.description}</p>
                    )}

                    {/* Filters badge */}
                    {totalFilters > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <Filter size={14} className="text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)]">{totalFilters} filtros aplicados</span>
                      </div>
                    )}

                    {/* Settings */}
                    <div className="space-y-3 mb-4">
                      {/* Question count slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--color-text-sec)]">Questões por sessão</span>
                          <span className="text-sm font-bold text-[var(--color-text-main)]">{settings.questionCount}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="240"
                          step="5"
                          value={settings.questionCount}
                          onChange={(e) => {
                            const newCount = Number(e.target.value);
                            setNotebookSettings((prev) => ({
                              ...prev,
                              [notebook.id]: { ...prev[notebook.id], questionCount: newCount },
                            }));
                          }}
                          className="w-full h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
                        />
                      </div>

                      {/* Study mode toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-sec)]">Modo de estudo</span>
                        <button
                          onClick={() => {
                            const newMode = settings.studyMode === 'zen' ? 'hard' : 'zen';
                            setNotebookSettings((prev) => ({
                              ...prev,
                              [notebook.id]: {
                                ...prev[notebook.id],
                                studyMode: newMode as PracticeMode,
                              },
                            }));
                          }}
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
                                <Coffee size={12} /> Zen
                              </>
                            ) : (
                              <>
                                <Zap size={12} /> Sim
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Start button - pinned to bottom */}
                  <Button
                    className="mt-auto"
                    fullWidth
                    onClick={() => handleStartFromNotebook(notebook)}
                    disabled={isStarting === notebook.id}
                    rightIcon={
                      isStarting === notebook.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )
                    }
                  >
                    {isStarting === notebook.id ? 'Iniciando...' : 'Iniciar Prática'}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View Notebook Filters Modal */}
        <AnimatePresence>
          {viewingNotebook && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingNotebook(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] z-50 overflow-hidden theme-transition"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                  <h3 className="font-bold text-[var(--color-text-main)]">{viewingNotebook.title}</h3>
                  <button
                    onClick={() => setViewingNotebook(null)}
                    className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                  >
                    <X size={18} className="text-[var(--color-text-sec)]" />
                  </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {viewingNotebook.description && (
                    <p className="text-[var(--color-text-sec)] text-sm mb-4">{viewingNotebook.description}</p>
                  )}
                  <div className="space-y-3">
                    {viewingNotebook.filters?.materia &&
                      viewingNotebook.filters.materia.length > 0 && (
                        <div>
                          <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                            Matérias
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {viewingNotebook.filters.materia.map((m) => (
                              <span
                                key={m}
                                className="px-2 py-1 bg-[var(--color-bg-elevated)] rounded text-xs text-[var(--color-text-main)]"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {viewingNotebook.filters?.assunto &&
                      viewingNotebook.filters.assunto.length > 0 && (
                        <div>
                          <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                            Assuntos
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {viewingNotebook.filters.assunto.map((a) => (
                              <span
                                key={a}
                                className="px-2 py-1 bg-[var(--color-bg-elevated)] rounded text-xs text-[var(--color-text-main)]"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {viewingNotebook.filters?.banca && viewingNotebook.filters.banca.length > 0 && (
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                          Bancas
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewingNotebook.filters.banca.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-1 bg-[var(--color-bg-elevated)] rounded text-xs text-[var(--color-text-main)]"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingNotebook.filters?.orgao && viewingNotebook.filters.orgao.length > 0 && (
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                          Órgãos
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewingNotebook.filters.orgao.map((o) => (
                            <span
                              key={o}
                              className="px-2 py-1 bg-[var(--color-bg-elevated)] rounded text-xs text-[var(--color-text-main)]"
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingNotebook.filters?.ano && viewingNotebook.filters.ano.length > 0 && (
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Anos</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewingNotebook.filters.ano.map((a) => (
                            <span
                              key={a}
                              className="px-2 py-1 bg-[var(--color-bg-elevated)] rounded text-xs text-[var(--color-text-main)]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t border-[var(--color-border)]">
                  <Button
                    fullWidth
                    onClick={() => {
                      setViewingNotebook(null);
                      handleEditNotebook(viewingNotebook);
                    }}
                    leftIcon={<Edit size={16} />}
                  >
                    Editar Filtros
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deletingNotebook}
          onClose={() => setDeletingNotebook(null)}
          onConfirm={handleDeleteNotebook}
          title="Excluir Caderno"
          message={`Tem certeza que deseja excluir o caderno "${deletingNotebook?.title}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default NotebooksPage;
