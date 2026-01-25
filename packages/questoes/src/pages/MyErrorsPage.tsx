import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import { getUserErrors, UserErrorsStats, MateriaErrorStats } from '../services/userErrorsService';

export const MyErrorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [errorsData, setErrorsData] = useState<UserErrorsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());
  const [expandedReviewedMaterias, setExpandedReviewedMaterias] = useState<Set<string>>(new Set());

  // Load errors on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadErrors = async () => {
      try {
        const data = await getUserErrors(user.id);
        setErrorsData(data);
      } catch (error) {
        console.error('Erro ao carregar erros:', error);
        addToast('error', 'Erro ao carregar questões erradas');
      } finally {
        setIsLoading(false);
      }
    };

    loadErrors();
  }, [user?.id]);

  // Set up header
  useEffect(() => {
    setHeaderOverride({
      title: 'Meus Erros',
      showBackButton: true,
      backPath: '/questoes',
      hideIcon: true,
    });

    return () => {
      clearHeaderOverride();
    };
  }, []);

  const toggleMateria = (materia: string) => {
    setExpandedMaterias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materia)) {
        newSet.delete(materia);
      } else {
        newSet.add(materia);
      }
      return newSet;
    });
  };

  const toggleReviewedMateria = (materia: string) => {
    setExpandedReviewedMaterias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materia)) {
        newSet.delete(materia);
      } else {
        newSet.add(materia);
      }
      return newSet;
    });
  };

  const handlePracticeAll = () => {
    if (!errorsData || errorsData.questionIds.length === 0) return;

    const idsParam = errorsData.questionIds.join(',');
    navigate(`/praticar?ids=${idsParam}&source=errors`);
  };

  const handlePracticeMateria = (materia: MateriaErrorStats) => {
    const ids = materia.assuntos.flatMap(a => a.questionIds);
    if (ids.length === 0) return;

    const idsParam = ids.join(',');
    navigate(`/praticar?ids=${idsParam}&source=errors`);
  };

  const handlePracticeAssunto = (questionIds: number[]) => {
    if (questionIds.length === 0) return;

    const idsParam = questionIds.join(',');
    navigate(`/praticar?ids=${idsParam}&source=errors`);
  };

  const handlePracticeAllReviewed = () => {
    if (!errorsData || errorsData.reviewedQuestionIds.length === 0) return;

    const idsParam = errorsData.reviewedQuestionIds.join(',');
    navigate(`/praticar?ids=${idsParam}&source=reviewed`);
  };

  const handlePracticeReviewedMateria = (materia: MateriaErrorStats) => {
    const ids = materia.assuntos.flatMap(a => a.questionIds);
    if (ids.length === 0) return;

    const idsParam = ids.join(',');
    navigate(`/praticar?ids=${idsParam}&source=reviewed`);
  };

  const handlePracticeReviewedAssunto = (questionIds: number[]) => {
    if (questionIds.length === 0) return;

    const idsParam = questionIds.join(',');
    navigate(`/praticar?ids=${idsParam}&source=reviewed`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-sec)]">Analisando seus erros...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center">
          <XCircle size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
            Faça login para acessar
          </h2>
          <p className="text-[var(--color-text-sec)] mb-6">
            Você precisa estar logado para ver seus erros.
          </p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-6 theme-transition">
      <div className="max-w-4xl mx-auto">
        {/* Practice All Button */}
        {errorsData && errorsData.totalErrors > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={handlePracticeAll}
              className="w-full p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl flex items-center justify-between hover:border-red-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Play size={24} className="text-red-500" fill="currentColor" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[var(--color-text-main)]">
                    Praticar Todas as Questões Erradas
                  </h3>
                  <p className="text-sm text-[var(--color-text-sec)]">
                    {errorsData.totalErrors} questões para revisar
                  </p>
                </div>
              </div>
              <ChevronRight size={24} className="text-red-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Empty State - only show if no errors AND no reviewed */}
        {(!errorsData || (errorsData.totalErrors === 0 && errorsData.totalReviewed === 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
              Nenhum erro encontrado!
            </h2>
            <p className="text-[var(--color-text-sec)] text-center max-w-md mb-6">
              Você ainda não errou nenhuma questão. Continue praticando para manter seu desempenho!
            </p>
            <Button onClick={() => navigate('/praticar?showFilters=true')}>
              Praticar Questões
            </Button>
          </motion.div>
        )}

        {/* Materias List */}
        {errorsData && errorsData.materias.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-[var(--color-text-main)] mb-4">
              Agrupado por Matéria
            </h2>

            <div className="space-y-3">
              {errorsData.materias.map((materia, index) => {
                const isExpanded = expandedMaterias.has(materia.materia);

                return (
                  <motion.div
                    key={materia.materia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden theme-transition"
                  >
                    {/* Materia Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
                      onClick={() => toggleMateria(materia.materia)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <BookOpen size={20} className="text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--color-text-main)]">
                              {materia.materia}
                            </h3>
                            <p className="text-sm text-[var(--color-text-sec)]">
                              {materia.totalErrors} {materia.totalErrors === 1 ? 'erro' : 'erros'} • {materia.assuntos.length} {materia.assuntos.length === 1 ? 'assunto' : 'assuntos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePracticeMateria(materia);
                            }}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            <Play size={14} fill="currentColor" />
                            Praticar
                          </button>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={20} className="text-[var(--color-text-sec)]" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Assuntos List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {materia.assuntos.map((assunto) => (
                              <div
                                key={assunto.assunto}
                                className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-red-500">
                                      {assunto.errorCount}
                                    </span>
                                  </div>
                                  <span className="text-sm text-[var(--color-text-main)]">
                                    {assunto.assunto}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handlePracticeAssunto(assunto.questionIds)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                                >
                                  <Play size={14} fill="currentColor" />
                                  Praticar
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Tips */}
        {errorsData && errorsData.totalErrors > 0 && (
          <div className="mt-8 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              Dica: Focar nos assuntos com mais erros pode melhorar significativamente seu desempenho
            </p>
          </div>
        )}

        {/* Reviewed Questions Section */}
        {errorsData && errorsData.totalReviewed > 0 && (
          <>
            <div className="mt-12 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-[var(--color-text-main)]">
                  Questões Revisadas
                </h2>
              </div>
              <p className="text-sm text-[var(--color-text-sec)]">
                Questões que você errou anteriormente, mas acertou depois. Continue praticando para reforçar o aprendizado!
              </p>
            </div>

            {/* Practice All Reviewed Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <button
                onClick={handlePracticeAllReviewed}
                className="w-full p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-between hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Play size={24} className="text-emerald-500" fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[var(--color-text-main)]">
                      Reforçar Questões Revisadas
                    </h3>
                    <p className="text-sm text-[var(--color-text-sec)]">
                      {errorsData.totalReviewed} questões para reforçar
                    </p>
                  </div>
                </div>
                <ChevronRight size={24} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Reviewed Materias List */}
            <div className="space-y-3">
              {errorsData.reviewedMaterias.map((materia, index) => {
                const isExpanded = expandedReviewedMaterias.has(materia.materia);

                return (
                  <motion.div
                    key={`reviewed-${materia.materia}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden theme-transition"
                  >
                    {/* Materia Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
                      onClick={() => toggleReviewedMateria(materia.materia)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--color-text-main)]">
                              {materia.materia}
                            </h3>
                            <p className="text-sm text-[var(--color-text-sec)]">
                              {materia.totalErrors} {materia.totalErrors === 1 ? 'questão revisada' : 'questões revisadas'} • {materia.assuntos.length} {materia.assuntos.length === 1 ? 'assunto' : 'assuntos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePracticeReviewedMateria(materia);
                            }}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                          >
                            <Play size={14} fill="currentColor" />
                            Reforçar
                          </button>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={20} className="text-[var(--color-text-sec)]" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Assuntos List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {materia.assuntos.map((assunto) => (
                              <div
                                key={`reviewed-assunto-${assunto.assunto}`}
                                className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-emerald-500">
                                      {assunto.errorCount}
                                    </span>
                                  </div>
                                  <span className="text-sm text-[var(--color-text-main)]">
                                    {assunto.assunto}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handlePracticeReviewedAssunto(assunto.questionIds)}
                                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                                >
                                  <Play size={14} fill="currentColor" />
                                  Reforçar
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyErrorsPage;
