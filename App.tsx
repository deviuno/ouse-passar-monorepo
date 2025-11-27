
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Home, BookOpen, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import { COLORS, INITIAL_USER_STATS, MOCK_QUESTIONS, LOGO_URL } from './constants';
import { UserStats, Course, ParsedQuestion, Alternative, StudyMode, UserAnswer, StoreItem, Flashcard, ToastMessage, ToastType, ReviewItem } from './types';
import { fetchCoursesWithOwnership } from './services/coursesService';
import Dashboard from './components/Dashboard';
import QuestionCard from './components/QuestionCard';
import TutorChat from './components/TutorChat';
import PegadinhasView from './components/PegadinhasView';
import SimuladosView from './components/SimuladosView';
import ProfileView from './components/ProfileView';
import ModeSelectionModal from './components/ModeSelectionModal';
import SimuladoSummary from './components/SimuladoSummary';
import CadernoErrosView from './components/CadernoErrosView';
import FlashcardsView from './components/FlashcardsView';
import PvPGameView from './components/PvPGameView';
import RedacaoView from './components/RedacaoView';
import PaymentModal from './components/PaymentModal';
import FreeEnrollModal from './components/FreeEnrollModal';
import ReviewIntroModal from './components/ReviewIntroModal';
import ReviewCompletionModal from './components/ReviewCompletionModal';
import RankingView from './components/RankingView';
import GuideView from './components/GuideView';
import { ToastContainer } from './components/Toast';
import { generateFlashcards } from './services/geminiService';
import {
  saveUserAnswer,
  upsertUserReview,
  saveUserFlashcards,
  incrementUserStats,
  fetchUserProfile,
  transformProfileToStats,
  fetchUserAnswers,
  fetchUserReviews,
  fetchUserFlashcards,
  fetchUserCourses,
  purchaseUserCourse,
  supabase
} from './services';
import {
  fetchExternalQuestions,
  fetchRandomQuestions,
  fetchQuestionBlock,
  getExternalQuestionsStats,
  QuestionsStats,
} from './services/externalQuestionsService';
import { CourseQuestionFilters } from './services/questionsDbClient';
import { fetchCourseById, CourseWithFilters } from './services/coursesService';
import { fetchAllTimeRanking, WeeklyRankingUser } from './services/rankingService';

// --- Helper to parse the JSON string in alternatives ---
const parseQuestions = (rawQuestions: typeof MOCK_QUESTIONS): ParsedQuestion[] => {
    return rawQuestions.map(q => {
        let parsedAlts: Alternative[] = [];
        try {
            parsedAlts = JSON.parse(q.alternativas);
        } catch (e) {
            console.error(`Failed to parse alternatives for Q${q.id}`, e);
            parsedAlts = [];
        }
        return {
            ...q,
            parsedAlternativas: parsedAlts,
            isPegadinha: q.id % 2 === 0, // Mock logic for 'pegadinha'
        };
    });
};

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'home' | 'simulados' | 'study' | 'pegadinhas' | 'profile' | 'summary' | 'caderno_erros' | 'flashcards' | 'pvp' | 'redacao' | 'ranking' | 'guide'>('home');
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    // Auth State
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Persistent State: User Stats
    const [stats, setStats] = useState<UserStats>(() => {
        const saved = localStorage.getItem('ousepassar_stats');
        return saved ? JSON.parse(saved) : INITIAL_USER_STATS;
    });

    // Persistent State: Global Answer History
    const [globalAnswers, setGlobalAnswers] = useState<UserAnswer[]>(() => {
        const saved = localStorage.getItem('ousepassar_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistent State: Inventory
    const [inventory, setInventory] = useState<string[]>(() => {
        const saved = localStorage.getItem('ousepassar_inventory');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistent State: Owned Courses
    const [ownedCourseIds, setOwnedCourseIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('ousepassar_owned_courses');
        if (saved) return JSON.parse(saved);
        // Default free courses (will be updated when courses are loaded from Supabase)
        return [];
    });

    // Persistent State: Flashcards
    const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
        const saved = localStorage.getItem('ousepassar_flashcards');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistent State: Reviews (SRS)
    const [reviews, setReviews] = useState<ReviewItem[]>(() => {
        const saved = localStorage.getItem('ousepassar_reviews');
        return saved ? JSON.parse(saved) : [];
    });

    // External Questions State (from Scrapping project)
    const [externalQuestions, setExternalQuestions] = useState<ParsedQuestion[]>([]);
    const [questionsStats, setQuestionsStats] = useState<QuestionsStats | null>(null);
    const [currentCourseFilters, setCurrentCourseFilters] = useState<CourseQuestionFilters | null>(null);
    const [currentCourseBlockSize, setCurrentCourseBlockSize] = useState<number>(20);

    // Questões respondidas por curso (para rotação de blocos)
    const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Record<string, number[]>>(() => {
        const saved = localStorage.getItem('ousepassar_answered_by_course');
        return saved ? JSON.parse(saved) : {};
    });

    // Courses State (from Supabase)
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // Ranking State
    const [weeklyRanking, setWeeklyRanking] = useState<WeeklyRankingUser[]>([]);
    const [userRankPosition, setUserRankPosition] = useState<number | undefined>(undefined);
    const [userLeagueTier, setUserLeagueTier] = useState<string>('ferro');

    // UI State: Toasts & Modals
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [isReviewIntroOpen, setIsReviewIntroOpen] = useState(false);
    const [isReviewCompletionOpen, setIsReviewCompletionOpen] = useState(false);
    const [reviewSessionAnswers, setReviewSessionAnswers] = useState<UserAnswer[]>([]);
    const [reviewSessionQuestions, setReviewSessionQuestions] = useState<ParsedQuestion[]>([]);

    // Effects for Persistence (localStorage fallback)
    useEffect(() => { localStorage.setItem('ousepassar_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('ousepassar_history', JSON.stringify(globalAnswers)); }, [globalAnswers]);
    useEffect(() => { localStorage.setItem('ousepassar_inventory', JSON.stringify(inventory)); }, [inventory]);
    useEffect(() => { localStorage.setItem('ousepassar_owned_courses', JSON.stringify(ownedCourseIds)); }, [ownedCourseIds]);
    useEffect(() => { localStorage.setItem('ousepassar_flashcards', JSON.stringify(flashcards)); }, [flashcards]);
    useEffect(() => { localStorage.setItem('ousepassar_reviews', JSON.stringify(reviews)); }, [reviews]);
    useEffect(() => { localStorage.setItem('ousepassar_answered_by_course', JSON.stringify(answeredQuestionIds)); }, [answeredQuestionIds]);

    // Load user data from Supabase when authenticated
    const loadUserData = useCallback(async (uid: string) => {
        try {
            const [profile, answers, userReviews, userFlashcards, userCourses] = await Promise.all([
                fetchUserProfile(uid),
                fetchUserAnswers(uid),
                fetchUserReviews(uid),
                fetchUserFlashcards(uid),
                fetchUserCourses(uid),
            ]);

            if (profile) {
                setStats(transformProfileToStats(profile));
                // Set league tier from profile
                if (profile.league_tier) {
                    setUserLeagueTier(profile.league_tier);
                }
            }

            if (answers.length > 0) {
                setGlobalAnswers(answers);
            }

            if (userReviews.length > 0) {
                setReviews(userReviews);
            }

            if (userFlashcards.length > 0) {
                setFlashcards(userFlashcards);
            }

            // Set owned courses from database (no more hardcoded free courses)
            setOwnedCourseIds(userCourses);

        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }, []);

    // Load courses from Supabase
    const loadCourses = useCallback(async (uid: string | null) => {
        setCoursesLoading(true);
        try {
            const coursesData = await fetchCoursesWithOwnership(uid);
            setCourses(coursesData);

            // Update ownedCourseIds based on fetched courses
            const owned = coursesData.filter(c => c.isOwned).map(c => c.id);
            if (owned.length > 0) {
                setOwnedCourseIds(owned);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setCoursesLoading(false);
        }
    }, []);

    // Load ranking data
    const loadRanking = useCallback(async (uid: string | null) => {
        try {
            const ranking = await fetchAllTimeRanking(uid || undefined, 10);
            setWeeklyRanking(ranking);

            // Find current user's position
            if (uid) {
                const userEntry = ranking.find(r => r.user_id === uid);
                if (userEntry) {
                    setUserRankPosition(userEntry.rank);
                }
            }
        } catch (error) {
            console.error('Error loading ranking:', error);
        }
    }, []);

    // Initialize auth state and load questions from external DB
    useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);

            try {
                // Check for existing session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUserId(session.user.id);
                    await loadUserData(session.user.id);
                }

                // Load courses from Supabase
                await loadCourses(session?.user?.id || null);

                // Load ranking data
                await loadRanking(session?.user?.id || null);

                // Load questions stats from external DB (Scrapping project)
                const stats = await getExternalQuestionsStats();
                setQuestionsStats(stats);

                if (stats.total > 0) {
                    showToast(`Banco conectado: ${stats.total.toLocaleString()} questões disponíveis!`, 'success');
                } else {
                    showToast('Usando questões de exemplo.', 'info');
                }
            } catch (error) {
                console.error('Initialization error:', error);
                showToast('Usando modo offline.', 'info');
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setUserId(session.user.id);
                    await loadUserData(session.user.id);
                    await loadCourses(session.user.id);
                    await loadRanking(session.user.id);
                }

                if (event === 'SIGNED_OUT') {
                    setUserId(null);
                    setStats(INITIAL_USER_STATS);
                    setGlobalAnswers([]);
                    setReviews([]);
                    setFlashcards([]);
                    setWeeklyRanking([]);
                    setUserRankPosition(undefined);
                    // Reload courses without user (only free courses will be owned)
                    await loadCourses(null);
                    await loadRanking(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUserData, loadCourses, loadRanking]);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [isTutorOpen, setIsTutorOpen] = useState(false);

    // Mode Selection State
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [tempSelectedCourse, setTempSelectedCourse] = useState<Course | null>(null);
    const [studyMode, setStudyMode] = useState<StudyMode>('zen');
    const [simulatedTime, setSimulatedTime] = useState<number>(120);

    // Pegadinha Filtering State
    const [isPegadinhaSession, setIsPegadinhaSession] = useState(false);
    const [tempIsPegadinha, setTempIsPegadinha] = useState(false);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStoreCourse, setSelectedStoreCourse] = useState<Course | null>(null);

    // Free Enroll Modal State
    const [isFreeEnrollModalOpen, setIsFreeEnrollModalOpen] = useState(false);
    const [selectedFreeCourse, setSelectedFreeCourse] = useState<Course | null>(null);

    // Answers State for CURRENT Simulado Session
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

    // Memoize parsed questions - prioritize external DB, fallback to mock
    const allQuestions = useMemo(() => {
        if (externalQuestions.length > 0) {
            return externalQuestions;
        }
        return parseQuestions(MOCK_QUESTIONS);
    }, [externalQuestions]);

    // Filter questions based on session type (Pegadinha vs Normal vs Review)
    const activeQuestions = useMemo(() => {
        let q = allQuestions;

        if (studyMode === 'review') {
            const today = Date.now();
            const dueReviewIds = reviews.filter(r => r.nextReviewDate <= today).map(r => r.questionId);
            // Ensure we only review questions that actually exist in our mock list
            q = q.filter(item => dueReviewIds.includes(item.id));
        } else if (isPegadinhaSession) {
            q = q.filter(item => item.isPegadinha);
        }

        return q;
    }, [allQuestions, isPegadinhaSession, studyMode, reviews]);

    const currentQuestion = activeQuestions[questionIndex] || allQuestions[0];
    const isLastQuestion = questionIndex === activeQuestions.length - 1;

    // Calculate pending reviews for Dashboard
    const pendingReviewCount = useMemo(() => {
        const today = Date.now();
        return reviews.filter(r => r.nextReviewDate <= today).length;
    }, [reviews]);

    // --- Toast Helpers ---
    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleSelectCourse = (course: Course, isPegadinhaMode: boolean = false) => {
        setTempSelectedCourse(course);
        setTempIsPegadinha(isPegadinhaMode);
        setIsModeModalOpen(true);
    };

    const handleSelectStoreCourse = (course: Course) => {
        setSelectedStoreCourse(course);
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPurchase = async (course: Course) => {
        if (!ownedCourseIds.includes(course.id)) {
            setOwnedCourseIds(prev => [...prev, course.id]);

            // Save purchase to Supabase if authenticated
            if (userId) {
                purchaseUserCourse(userId, course.id)
                    .catch(err => console.error('Error saving course purchase:', err));
            }

            showToast(`Parabéns! Você desbloqueou: ${course.title}`, 'success');
        }
        setIsPaymentModalOpen(false);
        setSelectedStoreCourse(null);
    };

    const handleSelectFreeCourse = (course: Course) => {
        setSelectedFreeCourse(course);
        setIsFreeEnrollModalOpen(true);
    };

    const handleConfirmFreeEnroll = async (course: Course) => {
        if (!ownedCourseIds.includes(course.id)) {
            setOwnedCourseIds(prev => [...prev, course.id]);

            // Save enrollment to Supabase if authenticated
            if (userId) {
                purchaseUserCourse(userId, course.id)
                    .catch(err => console.error('Error saving free course enrollment:', err));
            }

            showToast(`Inscrição realizada! Acesse: ${course.title}`, 'success');
        }
        setIsFreeEnrollModalOpen(false);
        setSelectedFreeCourse(null);
    };

    const handleStartStudy = async (mode: StudyMode, time: number = 120) => {
        if (tempSelectedCourse) {
            setStudyMode(mode);
            setSimulatedTime(time);
            setActiveCourse(tempSelectedCourse);
            setIsPegadinhaSession(tempIsPegadinha);
            setQuestionIndex(0);
            setUserAnswers([]);
            setIsModeModalOpen(false);

            // Load questions from external DB based on course filters
            try {
                // Try to get course with filters from DB
                const courseData = await fetchCourseById(tempSelectedCourse.id) as CourseWithFilters | null;
                const filters: CourseQuestionFilters = courseData?.questionFilters || {};

                // Get block size from course or use default
                const blockSize = courseData?.blockSize || 20;
                setCurrentCourseBlockSize(blockSize);
                setCurrentCourseFilters(filters);

                // Get answered question IDs for this course
                const courseAnsweredIds = answeredQuestionIds[tempSelectedCourse.id] || [];

                // Fetch a block of questions, excluding already answered ones
                const { questions, didReset } = await fetchQuestionBlock(
                    filters,
                    blockSize,
                    courseAnsweredIds
                );

                if (didReset) {
                    // All questions were answered, starting fresh cycle
                    setAnsweredQuestionIds(prev => ({
                        ...prev,
                        [tempSelectedCourse.id]: []
                    }));
                    showToast('Parabéns! Você completou todas as questões. Reiniciando ciclo!', 'success');
                }

                if (questions.length > 0) {
                    setExternalQuestions(questions);
                    showToast(`${questions.length} questões carregadas para ${tempSelectedCourse.title}!`, 'success');
                } else {
                    // Fallback to mock questions if no external questions found
                    showToast('Usando questões de exemplo.', 'info');
                }
            } catch (error) {
                console.error('Error loading course questions:', error);
                showToast('Erro ao carregar questões. Usando modo offline.', 'error');
            }

            setCurrentView('study');
            setTempSelectedCourse(null);
        }
    };

    const handleStartReview = () => {
        setIsReviewIntroOpen(true);
    };

    const confirmStartReview = () => {
        setIsReviewIntroOpen(false);

        // Check if there are questions to review
        const today = Date.now();
        const dueReviewIds = reviews.filter(r => r.nextReviewDate <= today).map(r => r.questionId);
        const reviewQuestions = allQuestions.filter(item => dueReviewIds.includes(item.id));

        if (reviewQuestions.length === 0) {
            showToast('Nenhuma questão para revisar agora!', 'info');
            return;
        }

        setStudyMode('review');
        setIsPegadinhaSession(false);
        setQuestionIndex(0);
        setUserAnswers([]);

        // Just a mock object for context, title will be used in header
        setActiveCourse({
            id: 'review',
            title: 'Revisão Inteligente',
            subtitle: 'Foco nos Erros',
            icon: '🧠',
            isOwned: true
        });

        setCurrentView('study');
    };

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            handleFinishSimulado();
        } else {
            setQuestionIndex((prev) => prev + 1);
        }
    };

    const handleAnswer = async (letter: string) => {
        const isCorrect = letter === currentQuestion.gabarito;
        const answer: UserAnswer = {
            questionId: currentQuestion.id,
            selectedLetter: letter,
            correctLetter: currentQuestion.gabarito,
            isCorrect: isCorrect
        };

        setUserAnswers(prev => [...prev, answer]);
        setGlobalAnswers(prev => [...prev, answer]);

        // Save answer to Supabase if authenticated
        if (userId) {
            saveUserAnswer(userId, {
                questionId: currentQuestion.id,
                selectedLetter: letter,
                correctLetter: currentQuestion.gabarito,
                isCorrect,
                studyMode,
            }).catch(err => console.error('Error saving answer:', err));
        }

        // SRS Logic: If incorrect, schedule for TODAY (DEMO MODE)
        if (!isCorrect) {
            const nextDate = Date.now();
            const reviewData = {
                questionId: currentQuestion.id,
                nextReviewDate: nextDate,
                lastDifficulty: 'error' as const,
                interval: 0
            };

            setReviews(prev => {
                const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
                return [...filtered, reviewData];
            });

            // Save review to Supabase if authenticated
            if (userId) {
                upsertUserReview(userId, {
                    questionId: currentQuestion.id,
                    nextReviewDate: nextDate,
                    lastDifficulty: 'error',
                    intervalDays: 0,
                }).catch(err => console.error('Error saving review:', err));
            }
        }

        // Stats Updates for Zen/Reta/Review
        if (studyMode !== 'hard') {
            if (isCorrect) {
                setStats(prev => ({
                    ...prev,
                    xp: prev.xp + 50,
                    coins: prev.coins + 10,
                    correctAnswers: prev.correctAnswers + 1,
                    totalAnswered: prev.totalAnswered + 1
                }));

                // Sync stats to Supabase if authenticated
                if (userId) {
                    incrementUserStats(userId, {
                        xp: 50,
                        coins: 10,
                        correct_answers: 1,
                        total_answered: 1,
                    }).catch(err => console.error('Error updating stats:', err));
                }
            } else {
                setStats(prev => ({ ...prev, totalAnswered: prev.totalAnswered + 1 }));

                if (userId) {
                    incrementUserStats(userId, {
                        total_answered: 1,
                    }).catch(err => console.error('Error updating stats:', err));
                }
            }
        }
    };

    const handleRateDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
        // Simplified Spaced Repetition Algorithm
        // Easy: +7 days
        // Medium: +3 days
        // Hard: +1 day (original) -> NOW: 0 days (immediate for demo)

        let daysToAdd = 3;
        if (difficulty === 'easy') daysToAdd = 7;
        if (difficulty === 'hard') daysToAdd = 0; // DEMO: Immediate review for hard questions

        const nextDate = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);

        const reviewData = {
            questionId: currentQuestion.id,
            nextReviewDate: nextDate,
            lastDifficulty: difficulty,
            interval: daysToAdd
        };

        setReviews(prev => {
            const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
            return [...filtered, reviewData];
        });

        // Save review to Supabase if authenticated
        if (userId) {
            upsertUserReview(userId, {
                questionId: currentQuestion.id,
                nextReviewDate: nextDate,
                lastDifficulty: difficulty,
                intervalDays: daysToAdd,
            }).catch(err => console.error('Error saving review:', err));
        }

        showToast("Agendado para revisão!", "success");
    };

    const handleFinishSimulado = () => {
        // Handle Review Mode completion differently
        if (studyMode === 'review') {
            // Update SRS for correctly answered questions (increase interval)
            userAnswers.forEach(answer => {
                if (answer.isCorrect) {
                    // Find existing review item
                    const existingReview = reviews.find(r => r.questionId === answer.questionId);
                    const currentInterval = existingReview?.interval || 1;

                    // Increase interval: 1 -> 3 -> 7 -> 14 -> 30 days
                    let newInterval = 1;
                    if (currentInterval <= 1) newInterval = 3;
                    else if (currentInterval <= 3) newInterval = 7;
                    else if (currentInterval <= 7) newInterval = 14;
                    else newInterval = 30;

                    const nextDate = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

                    setReviews(prev => {
                        const filtered = prev.filter(r => r.questionId !== answer.questionId);
                        return [...filtered, {
                            questionId: answer.questionId,
                            nextReviewDate: nextDate,
                            lastDifficulty: 'easy' as const,
                            interval: newInterval
                        }];
                    });

                    // Save to Supabase if authenticated
                    if (userId) {
                        upsertUserReview(userId, {
                            questionId: answer.questionId,
                            nextReviewDate: nextDate,
                            lastDifficulty: 'easy',
                            intervalDays: newInterval,
                        }).catch(err => console.error('Error updating review:', err));
                    }
                }
                // Incorrect answers are already scheduled for immediate review in handleAnswer
            });

            // Save session data for completion modal
            setReviewSessionAnswers(userAnswers);
            setReviewSessionQuestions(activeQuestions);
            setIsReviewCompletionOpen(true);
            return;
        }

        if (studyMode === 'hard') {
            const correctCount = userAnswers.filter(a => a.isCorrect).length;
            const coinsEarned = correctCount * 20;
            const xpEarned = correctCount * 100;

            setStats(prev => ({
                ...prev,
                xp: prev.xp + xpEarned,
                coins: prev.coins + coinsEarned,
                correctAnswers: prev.correctAnswers + correctCount,
                totalAnswered: prev.totalAnswered + userAnswers.length
            }));

            // Sync with Supabase if authenticated
            if (userId) {
                incrementUserStats(userId, {
                    xp: xpEarned,
                    coins: coinsEarned,
                    correct_answers: correctCount,
                    total_answered: userAnswers.length,
                }).catch(err => console.error('Error updating simulado stats:', err));
            }
        }

        // Save answered question IDs for block rotation
        if (activeCourse && activeCourse.id !== 'review') {
            const answeredIds = userAnswers.map(a => a.questionId);
            setAnsweredQuestionIds(prev => ({
                ...prev,
                [activeCourse.id]: [...(prev[activeCourse.id] || []), ...answeredIds]
            }));
        }

        setCurrentView('summary');
    };

    // Handle starting a new simulado from the same course (block rotation)
    const handleNewSimulado = async () => {
        if (!activeCourse || !currentCourseFilters) {
            setCurrentView('home');
            return;
        }

        setQuestionIndex(0);
        setUserAnswers([]);

        try {
            // Get updated answered question IDs (including from the simulado we just finished)
            const courseAnsweredIds = answeredQuestionIds[activeCourse.id] || [];

            // Fetch next block of questions
            const { questions, didReset } = await fetchQuestionBlock(
                currentCourseFilters,
                currentCourseBlockSize,
                courseAnsweredIds
            );

            if (didReset) {
                // All questions were answered, starting fresh cycle
                setAnsweredQuestionIds(prev => ({
                    ...prev,
                    [activeCourse.id]: []
                }));
                showToast('Você completou todas as questões! Reiniciando ciclo.', 'success');
            }

            if (questions.length > 0) {
                setExternalQuestions(questions);
                showToast(`Novo simulado: ${questions.length} questões carregadas!`, 'success');
                setCurrentView('study');
            } else {
                showToast('Erro ao carregar novas questões.', 'error');
                setCurrentView('home');
            }
        } catch (error) {
            console.error('Error loading new simulado:', error);
            showToast('Erro ao carregar questões.', 'error');
            setCurrentView('home');
        }
    };

    // const handleBuyItem = ... REMOVED as Store is removed

    // const handleEquipItem = ... REMOVED as Store is removed (or kept if inventory persists, but view is gone)

    const handleGenerateFlashcards = async (targetQuestions: ParsedQuestion[]) => {
        setIsGeneratingFlashcards(true);
        const newCards = await generateFlashcards(targetQuestions);

        if (newCards && newCards.length > 0) {
            // Filter out duplicates
            const existingIds = new Set(flashcards.map(c => c.questionId));
            const uniqueNew = newCards.filter(c => !existingIds.has(c.questionId));

            if (uniqueNew.length > 0) {
                setFlashcards(prev => [...prev, ...uniqueNew]);

                // Save flashcards to Supabase if authenticated
                if (userId) {
                    saveUserFlashcards(userId, uniqueNew.map(card => ({
                        questionId: card.questionId,
                        front: card.front,
                        back: card.back,
                        materia: card.materia,
                        assunto: card.assunto,
                        masteryLevel: card.masteryLevel,
                    }))).catch(err => console.error('Error saving flashcards:', err));
                }
            }

            showToast(`${uniqueNew.length} Flashcards gerados!`, 'success');
            setCurrentView('flashcards');
        } else {
            showToast("Erro ao gerar flashcards.", 'error');
        }
        setIsGeneratingFlashcards(false);
    };

    const handlePvPFinish = (winner: boolean) => {
        const xpGain = winner ? 200 : 20;
        const coinsGain = winner ? 50 : 5;

        setStats(prev => ({
            ...prev,
            xp: prev.xp + xpGain,
            coins: prev.coins + coinsGain
        }));

        // Sync with Supabase if authenticated
        if (userId) {
            incrementUserStats(userId, {
                xp: xpGain,
                coins: coinsGain,
            }).catch(err => console.error('Error updating PvP stats:', err));
        }
    };

    const renderContent = () => {
        if (currentView === 'home') {
            return (
                <Dashboard
                    stats={stats}
                    courses={courses}
                    ownedCourseIds={ownedCourseIds}
                    pendingReviewCount={pendingReviewCount}
                    weeklyRanking={weeklyRanking}
                    userRankPosition={userRankPosition}
                    userLeagueTier={userLeagueTier}
                    onSelectCourse={handleSelectCourse}
                    onBuyCourse={handleSelectStoreCourse}
                    onEnrollFreeCourse={handleSelectFreeCourse}
                    onStartPvP={() => setCurrentView('pvp')}
                    onStartRedacao={() => setCurrentView('redacao')}
                    onStartReview={handleStartReview}
                    onNavigateToProfile={() => setCurrentView('profile')}
                    onViewRanking={() => setCurrentView('ranking')}
                    isLoading={coursesLoading}
                />
            );
        }
        // ... existing routing logic ...
        if (currentView === 'simulados') return <SimuladosView courses={courses} ownedCourseIds={ownedCourseIds} onSelectCourse={handleSelectCourse} onBack={() => setCurrentView('home')} isLoading={coursesLoading} />;
        if (currentView === 'pegadinhas') return <PegadinhasView courses={courses} onSelectCourse={handleSelectCourse} onBuyCourse={handleSelectStoreCourse} ownedCourseIds={ownedCourseIds} onBack={() => setCurrentView('home')} isLoading={coursesLoading} />;

        if (currentView === 'study' && activeCourse) {
            return (
                <QuestionCard
                    question={currentQuestion}
                    isLastQuestion={isLastQuestion}
                    onNext={handleNextQuestion}
                    onOpenTutor={() => setIsTutorOpen(true)}
                    onAnswer={handleAnswer}
                    onRateDifficulty={handleRateDifficulty}
                    onTimeout={handleFinishSimulado}
                    studyMode={studyMode}
                    initialTime={simulatedTime}
                    userId={userId}
                    onShowToast={showToast}
                />
            );
        }

        if (currentView === 'summary') return (
            <SimuladoSummary
                answers={userAnswers}
                questions={activeQuestions}
                onExit={() => setCurrentView('home')}
                onRestart={() => handleStartStudy(studyMode, simulatedTime)}
                onNewSimulado={activeCourse?.id !== 'review' ? handleNewSimulado : undefined}
            />
        );
        if (currentView === 'profile') return <ProfileView stats={stats} onOpenCadernoErros={() => setCurrentView('caderno_erros')} onOpenFlashcards={() => setCurrentView('flashcards')} onOpenGuide={() => setCurrentView('guide')} onBack={() => setCurrentView('home')} />;
        if (currentView === 'guide') return <GuideView onBack={() => setCurrentView('profile')} />;
        if (currentView === 'caderno_erros') return <CadernoErrosView answers={globalAnswers} questions={allQuestions} onBack={() => setCurrentView('profile')} onGenerateFlashcards={handleGenerateFlashcards} isGenerating={isGeneratingFlashcards} />;
        if (currentView === 'flashcards') return <FlashcardsView cards={flashcards} onBack={() => setCurrentView('profile')} onGoToCadernoErros={() => setCurrentView('caderno_erros')} />;
        if (currentView === 'pvp') return <PvPGameView questions={allQuestions} userStats={stats} onFinish={handlePvPFinish} onExit={() => setCurrentView('home')} />;
        if (currentView === 'redacao') return <RedacaoView onBack={() => setCurrentView('home')} onShowToast={showToast} />;
        if (currentView === 'ranking') return <RankingView onBack={() => setCurrentView('home')} />;

        return null;
    };

    const noHeaderViews = ['home', 'summary', 'caderno_erros', 'store', 'flashcards', 'pvp', 'redacao', 'simulados', 'pegadinhas', 'profile', 'ranking', 'guide'];
    const bottomNavViews = ['home', 'simulados', 'pegadinhas', 'profile'];

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white font-sans flex justify-center">
            <div className="w-full max-w-md bg-[#1A1A1A] h-[100dvh] flex flex-col relative shadow-2xl">
                <ToastContainer toasts={toasts} onClose={removeToast} />

                {/* Dynamic Header */}
                {!noHeaderViews.includes(currentView) && (
                    <header className="px-4 py-4 flex items-center justify-between border-b border-gray-800 bg-[#1A1A1A] z-10">
                        {currentView === 'study' ? (
                            <div className="flex items-center w-full">
                                <button onClick={() => setCurrentView('home')} className="mr-3 p-2 -ml-2 hover:bg-gray-800 rounded-full">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex-1">
                                    <h2 className="font-bold text-sm truncate">
                                        {activeCourse?.title}
                                        {isPegadinhaSession && <span className="text-orange-500 ml-1">(Pegadinhas)</span>}
                                    </h2>
                                    <div className="w-full h-1 bg-gray-800 rounded-full mt-1">
                                        <div
                                            className="h-full bg-[#FFB800] rounded-full transition-all duration-300"
                                            style={{ width: `${((questionIndex + 1) / activeQuestions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="ml-3 text-xs font-bold text-[#FFB800]">
                                    {questionIndex + 1}/{activeQuestions.length}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <img src={LOGO_URL} alt="Ouse Passar" className="h-8 w-auto object-contain" />
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold bg-yellow-900/30 text-[#FFB800] px-2 py-1 rounded">PRO</span>
                                </div>
                            </div>
                        )}
                    </header>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-hidden relative p-0">
                    {renderContent()}
                </main>

                {/* Bottom Nav */}
                {bottomNavViews.includes(currentView) && (
                    <nav className="border-t border-gray-800 bg-[#1A1A1A] px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] absolute bottom-0 w-full z-20">
                        <div className="flex justify-between items-center">
                            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center space-y-1 ${currentView === 'home' ? 'text-[#FFB800]' : 'text-gray-400'}`}>
                                <Home size={24} strokeWidth={currentView === 'home' ? 3 : 2} />
                                <span className="text-[10px] font-medium">Início</span>
                            </button>
                            <button onClick={() => setCurrentView('simulados')} className={`flex flex-col items-center space-y-1 ${currentView === 'simulados' || (currentView === 'study' && !isPegadinhaSession) ? 'text-[#FFB800]' : 'text-gray-400'}`}>
                                <BookOpen size={24} strokeWidth={currentView === 'simulados' || (currentView === 'study' && !isPegadinhaSession) ? 3 : 2} />
                                <span className="text-[10px] font-medium">Simulados</span>
                            </button>
                            <button onClick={() => setCurrentView('pegadinhas')} className={`flex flex-col items-center space-y-1 ${currentView === 'pegadinhas' || (currentView === 'study' && isPegadinhaSession) ? 'text-[#FFB800]' : 'text-gray-400'}`}>
                                <AlertTriangle size={24} strokeWidth={currentView === 'pegadinhas' || (currentView === 'study' && isPegadinhaSession) ? 3 : 2} />
                                <span className="text-[10px] font-medium">Pegadinhas</span>
                            </button>
                            <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center space-y-1 ${currentView === 'profile' ? 'text-[#FFB800]' : 'text-gray-400'}`}>
                                <User size={24} strokeWidth={currentView === 'profile' ? 3 : 2} />
                                <span className="text-[10px] font-medium">Perfil</span>
                            </button>
                        </div>
                    </nav>
                )}

                <TutorChat isOpen={isTutorOpen} onClose={() => setIsTutorOpen(false)} question={currentQuestion} />
                <ModeSelectionModal isOpen={isModeModalOpen} onClose={() => setIsModeModalOpen(false)} course={tempSelectedCourse} onSelectMode={handleStartStudy} />
                <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} course={selectedStoreCourse} onConfirm={handleConfirmPurchase} />
                <FreeEnrollModal isOpen={isFreeEnrollModalOpen} onClose={() => setIsFreeEnrollModalOpen(false)} course={selectedFreeCourse} onConfirm={handleConfirmFreeEnroll} />

                {/* New Review Intro Modal */}
                <ReviewIntroModal
                    isOpen={isReviewIntroOpen}
                    onClose={() => setIsReviewIntroOpen(false)}
                    onStart={confirmStartReview}
                    count={pendingReviewCount}
                    userName="Dhyêgo" // Could be dynamic from stats/profile
                />

                {/* Review Completion Modal */}
                <ReviewCompletionModal
                    isOpen={isReviewCompletionOpen}
                    onClose={() => {
                        setIsReviewCompletionOpen(false);
                        setCurrentView('home');
                    }}
                    answers={reviewSessionAnswers}
                    questions={reviewSessionQuestions}
                    nextReviewCount={pendingReviewCount}
                />
            </div>
        </div>
    );
};

export default App;
