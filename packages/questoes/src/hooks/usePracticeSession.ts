import { useState, useCallback, useEffect } from 'react';
import { ParsedQuestion, PracticeMode } from '../types';
import { FilterOptions, ToggleFilters } from '../utils/filterUtils';
import { MOCK_QUESTIONS } from '../constants';
import {
  fetchQuestions,
  parseRawQuestion,
} from '../services/questionsService';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
  getQuestionIdsByDifficulty,
} from '../services/questionFeedbackService';
import { createPracticeSession } from '../services/practiceSessionService';
import { isOuseQuestoesSubscriber } from '../services/subscriptionService';
import {
  GamificationSettings,
  getGamificationSettings,
} from '../services/gamificationSettingsService';
import { calculateXPReward, calculateCoinsReward } from '../utils/practiceUtils';

export type SessionMode = 'selection' | 'practicing' | 'results';

export interface SessionStats {
  correct: number;
  total: number;
}

export interface UsePracticeSessionOptions {
  userId?: string;
  questionCount: number;
  studyMode: PracticeMode;
  filters: FilterOptions;
  toggleFilters: ToggleFilters;
  usingMockData: boolean;
  isTrailMode: boolean;
  // Callbacks
  onIncrementStats: (stats: {
    correctAnswers: number;
    totalAnswered: number;
    xp: number;
    coins: number;
  }) => void;
  onAddToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onFetchProfile: () => Promise<void>;
  // Battery
  consumeBattery: (
    userId: string,
    preparatorioId: string,
    actionType: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  getPreparatorioId: () => string | undefined;
}

export interface UsePracticeSessionReturn {
  // State
  mode: SessionMode;
  questions: ParsedQuestion[];
  currentIndex: number;
  answers: Map<number, { letter: string; correct: boolean }>;
  sessionStats: SessionStats;
  isLoading: boolean;
  sessionStartTime: number | null;
  questionStartTime: number | null;
  gamificationSettings: GamificationSettings | null;
  isSubscriber: boolean;

  // Derived
  currentQuestion: ParsedQuestion | undefined;
  isLastQuestion: boolean;
  accuracy: number;

  // Actions
  startPractice: (
    overrideFilters?: FilterOptions,
    overrideToggleFilters?: ToggleFilters
  ) => Promise<void>;
  handleAnswer: (letter: string, clickX?: number, clickY?: number) => Promise<void>;
  handleRateDifficulty: (difficulty: DifficultyRating) => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  resetSession: () => void;
  setMode: React.Dispatch<React.SetStateAction<SessionMode>>;
  setQuestionStartTime: React.Dispatch<React.SetStateAction<number | null>>;

  // Subscriber
  checkSubscription: () => Promise<boolean>;
}

/**
 * Hook to manage practice session state and actions
 */
export function usePracticeSession(
  options: UsePracticeSessionOptions
): UsePracticeSessionReturn {
  const {
    userId,
    questionCount,
    studyMode,
    filters,
    toggleFilters,
    usingMockData,
    isTrailMode,
    onIncrementStats,
    onAddToast,
    onFetchProfile,
    consumeBattery,
    getPreparatorioId,
  } = options;

  // Session state
  const [mode, setMode] = useState<SessionMode>('selection');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(
    new Map()
  );
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Timing
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Settings
  const [gamificationSettings, setGamificationSettings] = useState<GamificationSettings | null>(
    null
  );
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Load gamification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getGamificationSettings();
        setGamificationSettings(settings);
      } catch (error) {
        console.error('[usePracticeSession] Error loading gamification settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Check subscriber status
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      const status = await isOuseQuestoesSubscriber(userId);
      setIsSubscriber(status);
      return status;
    } catch (error) {
      console.error('[usePracticeSession] Error checking subscription:', error);
      return false;
    }
  }, [userId]);

  // Check subscription on mount
  useEffect(() => {
    if (userId) {
      checkSubscription();
    }
  }, [userId, checkSubscription]);

  // Start question timer when practicing
  useEffect(() => {
    if (mode === 'practicing' && questions.length > 0) {
      setQuestionStartTime(Date.now());
    }
  }, [mode, currentIndex, questions.length]);

  // Derived values
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const accuracy = sessionStats.total > 0
    ? Math.round((sessionStats.correct / sessionStats.total) * 100)
    : 0;

  const startPractice = useCallback(
    async (overrideFilters?: FilterOptions, overrideToggleFilters?: ToggleFilters) => {
      setIsLoading(true);

      if (!userId) {
        setIsLoading(false);
        return;
      }

      const activeFilters = overrideFilters || filters;
      const activeToggleFilters = overrideToggleFilters || toggleFilters;

      try {
        // Check subscription if needed
        let subscriberStatus = isSubscriber;
        if (!subscriberStatus) {
          subscriberStatus = await checkSubscription();
        }

        // Consume battery for non-trail, non-subscriber
        if (!isTrailMode && !subscriberStatus) {
          const prepId = getPreparatorioId();
          if (userId && prepId) {
            const batteryResult = await consumeBattery(userId, prepId, 'practice_session', {
              question_count: questionCount,
            });
            if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
              setIsLoading(false);
              return;
            }
          }
        }

        let questionsToUse: ParsedQuestion[] = [];

        if (usingMockData) {
          let filtered = [...MOCK_QUESTIONS];
          if (activeFilters.materia.length > 0) {
            filtered = filtered.filter((q) => activeFilters.materia.includes(q.materia));
          }
          if (activeFilters.banca.length > 0) {
            filtered = filtered.filter((q) => activeFilters.banca.includes(q.banca));
          }
          if (activeFilters.ano.length > 0) {
            filtered = filtered.filter((q) => activeFilters.ano.includes(String(q.ano)));
          }
          if (filtered.length === 0) filtered = [...MOCK_QUESTIONS];
          const shuffled = filtered.sort(() => Math.random() - 0.5);
          questionsToUse = shuffled
            .slice(0, Math.min(questionCount, shuffled.length))
            .map(parseRawQuestion);
        } else {
          const dbQuestions = await fetchQuestions({
            materias: activeFilters.materia.length > 0 ? activeFilters.materia : undefined,
            assuntos: activeFilters.assunto.length > 0 ? activeFilters.assunto : undefined,
            bancas: activeFilters.banca.length > 0 ? activeFilters.banca : undefined,
            orgaos: activeFilters.orgao.length > 0 ? activeFilters.orgao : undefined,
            cargos: activeFilters.cargo.length > 0 ? activeFilters.cargo : undefined,
            anos: activeFilters.ano.length > 0 ? activeFilters.ano.map(Number) : undefined,
            escolaridade:
              activeFilters.escolaridade.length > 0 ? activeFilters.escolaridade : undefined,
            modalidade:
              activeFilters.modalidade.length > 0 ? activeFilters.modalidade : undefined,
            dificuldade:
              activeFilters.dificuldade.length > 0 ? activeFilters.dificuldade : undefined,
            apenasRevisadas: activeToggleFilters.apenasRevisadas || undefined,
            apenasComComentario: activeToggleFilters.apenasComComentario || undefined,
            apenasIneditasOuse: activeToggleFilters.apenasIneditasOuse || undefined,
            limit: isTrailMode ? 500 : questionCount,
            shuffle: true,
          });

          if (dbQuestions.length > 0) {
            // Apply difficulty filters
            const activeDifficultyFilters: DifficultyRating[] = [];
            if (activeToggleFilters.facil) activeDifficultyFilters.push('easy');
            if (activeToggleFilters.medio) activeDifficultyFilters.push('medium');
            if (activeToggleFilters.dificil) activeDifficultyFilters.push('hard');

            if (activeDifficultyFilters.length > 0 && userId) {
              const difficultyIds = await getQuestionIdsByDifficulty(
                userId,
                activeDifficultyFilters
              );
              const allDifficultyIds = [...difficultyIds.userRated, ...difficultyIds.communityRated];

              if (allDifficultyIds.length > 0) {
                const difficultyIdSet = new Set(allDifficultyIds);
                const filteredByDifficulty = dbQuestions.filter((q) => difficultyIdSet.has(q.id));

                const userRatedSet = new Set(difficultyIds.userRated);
                filteredByDifficulty.sort((a, b) => {
                  const aIsUserRated = userRatedSet.has(a.id) ? 0 : 1;
                  const bIsUserRated = userRatedSet.has(b.id) ? 0 : 1;
                  return aIsUserRated - bIsUserRated;
                });

                questionsToUse =
                  filteredByDifficulty.length > 0 ? filteredByDifficulty : dbQuestions;
              } else {
                questionsToUse = dbQuestions;
              }
            } else {
              questionsToUse = dbQuestions;
            }
          } else if (isTrailMode) {
            onAddToast(
              'error',
              'Nenhuma questão encontrada para este tópico. Verifique os filtros do edital.'
            );
            setIsLoading(false);
            return;
          } else {
            onAddToast('info', 'Nenhuma questao encontrada. Usando questoes de exemplo.');
            const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
            questionsToUse = shuffled.slice(0, questionCount).map(parseRawQuestion);
          }
        }

        setQuestions(questionsToUse);
        setCurrentIndex(0);
        setAnswers(new Map());
        setSessionStats({ correct: 0, total: 0 });
        setSessionStartTime(Date.now());
        setMode('practicing');
      } catch (error) {
        console.error('Erro ao carregar questoes:', error);
        if (isTrailMode) {
          onAddToast('error', 'Erro ao carregar questões. Tente novamente.');
          setIsLoading(false);
          return;
        }
        onAddToast('error', 'Erro ao carregar questoes. Usando questoes de exemplo.');
        const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, questionCount).map(parseRawQuestion));
        setCurrentIndex(0);
        setAnswers(new Map());
        setSessionStats({ correct: 0, total: 0 });
        setSessionStartTime(Date.now());
        setMode('practicing');
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      filters,
      toggleFilters,
      questionCount,
      usingMockData,
      isTrailMode,
      isSubscriber,
      checkSubscription,
      consumeBattery,
      getPreparatorioId,
      onAddToast,
    ]
  );

  const handleAnswer = useCallback(
    async (letter: string, clickX?: number, clickY?: number) => {
      const question = questions[currentIndex];
      if (!question) return;

      const isCorrect = letter === question.gabarito;
      const timeSpentSeconds = questionStartTime
        ? Math.round((Date.now() - questionStartTime) / 1000)
        : null;

      setAnswers((prev) => new Map(prev.set(question.id, { letter, correct: isCorrect })));
      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      // Consume battery for non-trail, non-subscriber
      if (!isTrailMode && !isSubscriber) {
        try {
          const prepId = getPreparatorioId();
          if (userId && prepId) {
            await consumeBattery(userId, prepId, 'question', {
              question_id: question.id.toString(),
              clickX,
              clickY,
            });
          }
        } catch (error) {
          console.error('[usePracticeSession] Erro ao consumir bateria:', error);
        }
      }

      // Calculate rewards
      const xpReward = calculateXPReward(isCorrect, studyMode, gamificationSettings);
      const coinsReward = calculateCoinsReward(isCorrect, studyMode, gamificationSettings);

      onIncrementStats({
        correctAnswers: isCorrect ? 1 : 0,
        totalAnswered: 1,
        xp: xpReward,
        coins: coinsReward,
      });

      // Save answer
      saveUserAnswer(
        {
          questionId: question.id,
          selectedAlternative: letter,
          isCorrect,
          timeSpentSeconds: timeSpentSeconds || undefined,
        },
        userId
      );
    },
    [
      questions,
      currentIndex,
      questionStartTime,
      isTrailMode,
      isSubscriber,
      userId,
      studyMode,
      gamificationSettings,
      consumeBattery,
      getPreparatorioId,
      onIncrementStats,
    ]
  );

  const handleRateDifficulty = useCallback(
    (difficulty: DifficultyRating) => {
      const question = questions[currentIndex];
      if (userId && question) {
        saveDifficultyRating(question.id, difficulty, userId);
      }
    },
    [questions, currentIndex, userId]
  );

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      const timeSpent = sessionStartTime
        ? Math.floor((Date.now() - sessionStartTime) / 1000)
        : 0;
      const isHardMode = studyMode === 'hard';
      const xpPerCorrect = gamificationSettings
        ? isHardMode
          ? gamificationSettings.xp_per_correct_hard_mode
          : gamificationSettings.xp_per_correct_answer
        : isHardMode
          ? 100
          : 50;
      const xpEarned = sessionStats.correct * xpPerCorrect;

      try {
        if (userId) {
          await createPracticeSession({
            user_id: userId,
            study_mode: studyMode,
            total_questions: sessionStats.total,
            correct_answers: sessionStats.correct,
            wrong_answers: sessionStats.total - sessionStats.correct,
            time_spent_seconds: timeSpent,
            filters: { ...filters, toggleFilters },
            xp_earned: xpEarned,
          });
          await onFetchProfile();
        }
      } catch (error) {
        console.error('[usePracticeSession] Erro ao salvar sessão:', error);
      }

      setMode('results');
    }
  }, [
    currentIndex,
    questions.length,
    sessionStartTime,
    studyMode,
    gamificationSettings,
    sessionStats,
    userId,
    filters,
    toggleFilters,
    onFetchProfile,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const resetSession = useCallback(() => {
    setMode('selection');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setSessionStats({ correct: 0, total: 0 });
    setSessionStartTime(null);
  }, []);

  return {
    // State
    mode,
    questions,
    currentIndex,
    answers,
    sessionStats,
    isLoading,
    sessionStartTime,
    questionStartTime,
    gamificationSettings,
    isSubscriber,

    // Derived
    currentQuestion,
    isLastQuestion,
    accuracy,

    // Actions
    startPractice,
    handleAnswer,
    handleRateDifficulty,
    handleNext,
    handlePrevious,
    resetSession,
    setMode,
    setQuestionStartTime,

    // Subscriber
    checkSubscription,
  };
}
