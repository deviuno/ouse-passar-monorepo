import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Timer,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Grid,
  X,
} from 'lucide-react';
import { Button, Modal } from '../components/ui';
import QuestionCard from '../components/question/QuestionCard';
import { useAuthStore, useUIStore } from '../stores';
import {
  startOrResumeSimuladoAttempt,
  saveSimuladoProgress,
  completeSimuladoAttempt,
  abandonSimuladoAttempt,
  getSimuladoById,
  getSimuladoSettings,
  SimuladoAttempt,
} from '../services/simuladosService';
import { ParsedQuestion } from '../types';

export default function SimuladoExecPage() {
  const navigate = useNavigate();
  const { id: simuladoId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const variationIndex = parseInt(searchParams.get('prova') || '0', 10);

  const { profile } = useAuthStore();
  const { addToast } = useUIStore();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simuladoName, setSimuladoName] = useState('');
  const [attempt, setAttempt] = useState<SimuladoAttempt | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refs
  const timeRemainingRef = useRef<number>(0); // Track time in ref for accurate saving
  const isSavingRef = useRef<boolean>(false); // Prevent concurrent saves
  const answersRef = useRef<Record<string, string>>({}); // Track answers in ref for accurate saving
  const currentIndexRef = useRef<number>(0); // Track current index in ref

  // Load attempt on mount
  useEffect(() => {
    loadAttempt();
  }, [simuladoId, variationIndex, profile?.id]);

  // Keep refs in sync with state
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Save progress to database - defined early so effects can use it
  const saveProgress = useCallback(async () => {
    if (!attempt?.id || isSavingRef.current) return;

    isSavingRef.current = true;

    try {
      const saved = await saveSimuladoProgress(attempt.id, {
        answers: answersRef.current,
        current_index: currentIndexRef.current,
        time_remaining_seconds: timeRemainingRef.current,
      });

      if (saved) {
        console.log('[SimuladoExecPage] Progress saved:', {
          answersCount: Object.keys(answersRef.current).length,
          currentIndex: currentIndexRef.current,
          timeRemaining: timeRemainingRef.current,
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [attempt?.id]);

  const loadAttempt = async () => {
    if (!simuladoId || !profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Get simulado name
      const simulado = await getSimuladoById(simuladoId);
      if (simulado) {
        setSimuladoName(simulado.nome);
      }

      // Start or resume attempt
      const result = await startOrResumeSimuladoAttempt(
        profile.id,
        simuladoId,
        variationIndex
      );

      if (!result.success || !result.attempt || !result.questions) {
        setError(result.error || 'Erro ao carregar prova');
        return;
      }

      setAttempt(result.attempt);
      setQuestions(result.questions);
      setCurrentIndex(result.attempt.current_index || 0);
      setAnswers(result.attempt.answers || {});

      // Restore time remaining from saved attempt
      const savedTime = result.attempt.time_remaining_seconds || 0;
      setTimeRemaining(savedTime);
      timeRemainingRef.current = savedTime;

      console.log('[SimuladoExecPage] Loaded attempt:', {
        currentIndex: result.attempt.current_index,
        answersCount: Object.keys(result.attempt.answers || {}).length,
        timeRemaining: savedTime,
      });
    } catch (err: any) {
      console.error('Error loading attempt:', err);
      setError(err.message || 'Erro ao carregar prova');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0 || loading) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, loading]);

  // Periodic auto-save every 30 seconds to keep timer synced
  useEffect(() => {
    if (!attempt?.id || loading) return;

    const autoSaveInterval = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [attempt?.id, loading, saveProgress]);

  // Save on page visibility change (user switching tabs or minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && attempt?.id) {
        saveProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt?.id, saveProgress]);

  // Save before unload (page refresh or close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (attempt?.id) {
        // Use synchronous storage as backup
        try {
          const progressData = {
            answers: answersRef.current,
            current_index: currentIndexRef.current,
            time_remaining_seconds: timeRemainingRef.current,
          };
          localStorage.setItem(`simulado_backup_${attempt.id}`, JSON.stringify(progressData));
        } catch (e) {
          console.warn('Failed to save backup:', e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt?.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeClass = () => {
    if (timeRemaining <= 300) return 'text-red-500 animate-pulse'; // 5 min
    if (timeRemaining <= 600) return 'text-orange-500'; // 10 min
    return 'text-white';
  };

  const handleAnswer = useCallback((letter: string) => {
    const questionId = String(questions[currentIndex].id);
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: letter,
      };
      // Update ref immediately for accurate saving
      answersRef.current = newAnswers;
      return newAnswers;
    });
    // Save progress after each answer
    saveProgress();
  }, [currentIndex, questions, saveProgress]);

  const finishAttempt = useCallback(async () => {
    if (!attempt?.id || !profile?.id || submitting) return;

    setSubmitting(true);

    try {
      const settings = await getSimuladoSettings();
      const totalTimeSeconds = settings.time_limit_minutes * 60;
      // Time spent is total time minus remaining time
      const timeSpent = totalTimeSeconds - timeRemainingRef.current;

      const result = await completeSimuladoAttempt(
        profile.id,
        attempt.id,
        answersRef.current, // Use ref for most accurate answers
        questions,
        Math.max(0, timeSpent)
      );

      if (result.success && result.result) {
        // Clear backup from localStorage
        localStorage.removeItem(`simulado_backup_${attempt.id}`);
        addToast('success', 'Prova finalizada com sucesso!');
        // Navigate to result page or back to detail
        navigate(`/simulados/${simuladoId}?finished=true&score=${result.result.score}`);
      } else {
        addToast('error', result.error || 'Erro ao finalizar prova');
      }
    } catch (err: any) {
      console.error('Error finishing attempt:', err);
      addToast('error', 'Erro ao finalizar prova');
    } finally {
      setSubmitting(false);
    }
  }, [attempt?.id, profile?.id, submitting, questions, simuladoId, addToast, navigate]);

  const handleFinish = useCallback(() => {
    // Check for unanswered questions
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const unanswered = questions.length - answeredCount;
      if (!window.confirm(`Voce tem ${unanswered} questao(oes) sem resposta. Deseja finalizar mesmo assim?`)) {
        return;
      }
    }
    finishAttempt();
  }, [answers, questions.length, finishAttempt]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      saveProgress();
    } else {
      handleFinish();
    }
  }, [currentIndex, questions.length, saveProgress, handleFinish]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      saveProgress();
    }
  }, [currentIndex, saveProgress]);

  const handleGoToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
    currentIndexRef.current = index;
    setShowGridModal(false);
    saveProgress();
  }, [saveProgress]);

  const handleTimeout = useCallback(async () => {
    addToast('info', 'Tempo esgotado! Finalizando prova...');
    await finishAttempt();
  }, [addToast, finishAttempt]);

  const handleExit = async () => {
    if (!attempt?.id) {
      navigate(`/simulados/${simuladoId}`);
      return;
    }

    // Save progress before exiting
    await saveProgress();
    navigate(`/simulados/${simuladoId}`);
  };

  const handleAbandon = async () => {
    if (!attempt?.id) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja abandonar esta prova? Voce podera iniciar novamente, mas seu progresso atual sera perdido.'
    );

    if (confirmed) {
      // Clear backup from localStorage
      localStorage.removeItem(`simulado_backup_${attempt.id}`);
      await abandonSimuladoAttempt(attempt.id);
      navigate(`/simulados/${simuladoId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FFB800] mx-auto mb-4" />
          <p className="text-white">Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar</h2>
          <p className="text-[#A0A0A0] mb-6">{error}</p>
          <Button onClick={() => navigate(`/simulados/${simuladoId}`)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-[#121212] z-30 border-b border-[#2A2A2A]">
        <div className="max-w-[1000px] mx-auto w-full">
          <div className="flex items-center justify-between p-3">
            {/* Left: Back button */}
            <button
              onClick={() => setShowExitModal(true)}
              className="p-2 rounded-full hover:bg-[#252525] transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>

            {/* Center: Question counter & progress */}
            <div className="flex-1 mx-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-white font-bold">
                  {currentIndex + 1}/{questions.length}
                </span>
                <span className="text-[#6E6E6E]">|</span>
                <span className="text-[#A0A0A0]">
                  {answeredCount} respondidas
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-[#2A2A2A] rounded-full mt-1 overflow-hidden">
                <motion.div
                  className="h-full bg-[#FFB800]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Right: Timer & Grid */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 font-mono font-bold ${getTimeClass()}`}>
                <Timer size={16} />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={() => setShowGridModal(true)}
                className="p-2 rounded-full hover:bg-[#252525] transition-colors"
              >
                <Grid size={20} className="text-[#FFB800]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1000px] mx-auto w-full h-full">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              isLastQuestion={currentIndex === questions.length - 1}
              onNext={handleNext}
              onPrevious={currentIndex > 0 ? handlePrevious : undefined}
              onOpenTutor={() => {}} // Disabled during simulado
              onAnswer={handleAnswer}
              studyMode="hard"
              initialTime={Math.ceil(timeRemaining / 60)}
              userId={profile?.id}
            />
          )}
        </div>
      </div>

      {/* Exit Modal */}
      <AnimatePresence>
        {showExitModal && (
          <Modal
            isOpen={showExitModal}
            onClose={() => setShowExitModal(false)}
            title="Sair da Prova"
          >
            <div className="p-4">
              <p className="text-[#A0A0A0] mb-6">
                O que deseja fazer? Seu progresso sera salvo automaticamente.
              </p>

              <div className="space-y-3">
                <Button
                  fullWidth
                  onClick={handleExit}
                  className="bg-[#2A2A2A] hover:bg-[#333]"
                >
                  Pausar e sair (salvar progresso)
                </Button>

                <Button
                  fullWidth
                  onClick={handleFinish}
                  className="bg-[#FFB800] text-black"
                >
                  Finalizar prova agora
                </Button>

                <button
                  onClick={handleAbandon}
                  className="w-full py-3 text-red-500 hover:text-red-400 text-sm"
                >
                  Abandonar prova (perder progresso)
                </button>

                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-2 text-[#A0A0A0] hover:text-white text-sm"
                >
                  Continuar prova
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Question Grid Modal */}
      <AnimatePresence>
        {showGridModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#1A1A1A] rounded-t-2xl max-h-[70vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
                <h3 className="text-white font-bold">Todas as Questoes</h3>
                <button
                  onClick={() => setShowGridModal(false)}
                  className="p-2 rounded-full hover:bg-[#252525]"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Grid */}
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                <div className="grid grid-cols-6 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[String(q.id)];
                    const isCurrent = idx === currentIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleGoToQuestion(idx)}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center font-bold text-sm
                          transition-all
                          ${isCurrent
                            ? 'bg-[#FFB800] text-black'
                            : isAnswered
                              ? 'bg-[#2ECC71]/20 border border-[#2ECC71] text-[#2ECC71]'
                              : 'bg-[#2A2A2A] text-[#6E6E6E] hover:bg-[#333]'
                          }
                        `}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#2ECC71]" />
                    <span className="text-[#A0A0A0]">Respondidas: {answeredCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#2A2A2A]" />
                    <span className="text-[#A0A0A0]">Pendentes: {questions.length - answeredCount}</span>
                  </div>
                </div>

                <Button
                  fullWidth
                  onClick={handleFinish}
                  disabled={submitting}
                >
                  {submitting ? 'Finalizando...' : 'Finalizar Prova'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
