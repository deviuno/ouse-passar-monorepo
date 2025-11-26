
import React, { useState, useMemo, useEffect } from 'react';
import { Home, BookOpen, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import { COLORS, INITIAL_USER_STATS, MOCK_QUESTIONS, LOGO_URL, COURSES } from './constants';
import { UserStats, Course, ParsedQuestion, Alternative, StudyMode, UserAnswer, StoreItem, Flashcard, ToastMessage, ToastType, ReviewItem } from './types';
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
import ReviewIntroModal from './components/ReviewIntroModal';
import RankingView from './components/RankingView';
import { ToastContainer } from './components/Toast';
import { generateFlashcards } from './services/geminiService';

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
  const [currentView, setCurrentView] = useState<'home' | 'simulados' | 'study' | 'pegadinhas' | 'profile' | 'summary' | 'caderno_erros' | 'flashcards' | 'pvp' | 'redacao' | 'ranking'>('home');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
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
      return COURSES.filter(c => c.isOwned).map(c => c.id);
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

  // UI State: Toasts & Modals
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isReviewIntroOpen, setIsReviewIntroOpen] = useState(false);

  // Effects for Persistence
  useEffect(() => { localStorage.setItem('ousepassar_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('ousepassar_history', JSON.stringify(globalAnswers)); }, [globalAnswers]);
  useEffect(() => { localStorage.setItem('ousepassar_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('ousepassar_owned_courses', JSON.stringify(ownedCourseIds)); }, [ownedCourseIds]);
  useEffect(() => { localStorage.setItem('ousepassar_flashcards', JSON.stringify(flashcards)); }, [flashcards]);
  useEffect(() => { localStorage.setItem('ousepassar_reviews', JSON.stringify(reviews)); }, [reviews]);

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

  // Answers State for CURRENT Simulado Session
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // Memoize parsed questions
  const allQuestions = useMemo(() => parseQuestions(MOCK_QUESTIONS), []);

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

  const handleConfirmPurchase = (course: Course) => {
      if (!ownedCourseIds.includes(course.id)) {
          setOwnedCourseIds(prev => [...prev, course.id]);
          showToast(`Parabéns! Você desbloqueou: ${course.title}`, 'success');
      }
      setIsPaymentModalOpen(false);
      setSelectedStoreCourse(null);
  };

  const handleStartStudy = (mode: StudyMode, time: number = 120) => {
    if (tempSelectedCourse) {
        setStudyMode(mode);
        setSimulatedTime(time);
        setActiveCourse(tempSelectedCourse);
        setIsPegadinhaSession(tempIsPegadinha);
        setQuestionIndex(0);
        setUserAnswers([]);
        setCurrentView('study');
        setIsModeModalOpen(false);
        setTempSelectedCourse(null);
    }
  };

  const handleStartReview = () => {
      setIsReviewIntroOpen(true);
  };

  const confirmStartReview = () => {
      setIsReviewIntroOpen(false);
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

  const handleAnswer = (letter: string) => {
    const isCorrect = letter === currentQuestion.gabarito;
    const answer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedLetter: letter,
        correctLetter: currentQuestion.gabarito,
        isCorrect: isCorrect
    };

    setUserAnswers(prev => [...prev, answer]);
    setGlobalAnswers(prev => [...prev, answer]);

    // SRS Logic: If incorrect, schedule for TODAY (DEMO MODE)
    // Originally: 1 day interval. Now: 0 days (immediate)
    if (!isCorrect) {
        // DEMO MODE: Set to Date.now() instead of +1 day to appear immediately in dashboard
        const nextDate = Date.now();
        setReviews(prev => {
            // Remove existing review for this question if any
            const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
            return [...filtered, { 
                questionId: currentQuestion.id, 
                nextReviewDate: nextDate, 
                lastDifficulty: 'error', 
                interval: 0 
            }];
        });
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
       } else {
          setStats(prev => ({ ...prev, totalAnswered: prev.totalAnswered + 1 }));
       }
    }
  };

  const handleRateDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
      // Simplified Spaced Repetition Algorithm
      // Easy: +7 days
      // Medium: +3 days
      // Hard: +1 day (original) -> NOW: 0 days (immediate for demo)
      
      let daysToAdd = 3;
      if (difficulty === 'easy') daysToAdd = 7;
      if (difficulty === 'hard') daysToAdd = 0; // DEMO: Immediate review for hard questions

      const nextDate = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);

      setReviews(prev => {
          // Keep only the latest review schedule for this question
          const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
          return [...filtered, {
              questionId: currentQuestion.id,
              nextReviewDate: nextDate,
              lastDifficulty: difficulty,
              interval: daysToAdd
          }];
      });
      
      showToast("Agendado para revisão!", "success");
  };

  const handleFinishSimulado = () => {
      if (studyMode === 'hard') {
          const correctCount = userAnswers.filter(a => a.isCorrect).length;
          const coinsEarned = correctCount * 20;
          
          setStats(prev => ({
              ...prev,
              xp: prev.xp + (correctCount * 100),
              coins: prev.coins + coinsEarned,
              correctAnswers: prev.correctAnswers + correctCount,
              totalAnswered: prev.totalAnswered + userAnswers.length
          }));
      }
      setCurrentView('summary');
  };

  // const handleBuyItem = ... REMOVED as Store is removed

  // const handleEquipItem = ... REMOVED as Store is removed (or kept if inventory persists, but view is gone)

  const handleGenerateFlashcards = async (targetQuestions: ParsedQuestion[]) => {
      setIsGeneratingFlashcards(true);
      const newCards = await generateFlashcards(targetQuestions);
      
      if (newCards && newCards.length > 0) {
          setFlashcards(prev => {
              const ids = new Set(prev.map(c => c.questionId));
              const uniqueNew = newCards.filter(c => !ids.has(c.questionId));
              return [...prev, ...uniqueNew];
          });
          showToast(`${newCards.length} Flashcards gerados!`, 'success');
          setCurrentView('flashcards');
      } else {
          showToast("Erro ao gerar flashcards.", 'error');
      }
      setIsGeneratingFlashcards(false);
  };

  const handlePvPFinish = (winner: boolean) => {
      if (winner) {
          setStats(prev => ({ ...prev, xp: prev.xp + 200, coins: prev.coins + 50 }));
      } else {
          setStats(prev => ({ ...prev, xp: prev.xp + 20, coins: prev.coins + 5 }));
      }
  };

  const renderContent = () => {
    if (currentView === 'home') {
      return (
          <Dashboard 
            stats={stats} 
            ownedCourseIds={ownedCourseIds}
            pendingReviewCount={pendingReviewCount}
            onSelectCourse={handleSelectCourse} 
            onBuyCourse={handleSelectStoreCourse}
            onStartPvP={() => setCurrentView('pvp')}
            onStartRedacao={() => setCurrentView('redacao')}
            onStartReview={handleStartReview}
            onNavigateToProfile={() => setCurrentView('profile')}
            onViewRanking={() => setCurrentView('ranking')}
          />
      );
    }
    // ... existing routing logic ...
    if (currentView === 'simulados') return <SimuladosView onSelectCourse={handleSelectCourse} onBack={() => setCurrentView('home')} />;
    if (currentView === 'pegadinhas') return <PegadinhasView onSelectCourse={handleSelectCourse} onBuyCourse={handleSelectStoreCourse} ownedCourseIds={ownedCourseIds} onBack={() => setCurrentView('home')} />;
    
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
        />
      );
    }

    if (currentView === 'summary') return <SimuladoSummary answers={userAnswers} questions={activeQuestions} onExit={() => setCurrentView('home')} onRestart={() => handleStartStudy(studyMode, simulatedTime)} />;
    if (currentView === 'profile') return <ProfileView stats={stats} onOpenCadernoErros={() => setCurrentView('caderno_erros')} onOpenFlashcards={() => setCurrentView('flashcards')} onBack={() => setCurrentView('home')} />;
    if (currentView === 'caderno_erros') return <CadernoErrosView answers={globalAnswers} questions={allQuestions} onBack={() => setCurrentView('profile')} onGenerateFlashcards={handleGenerateFlashcards} isGenerating={isGeneratingFlashcards} />;
    if (currentView === 'flashcards') return <FlashcardsView cards={flashcards} onBack={() => setCurrentView('profile')} onGoToCadernoErros={() => setCurrentView('caderno_erros')} />;
    if (currentView === 'pvp') return <PvPGameView questions={allQuestions} userStats={stats} onFinish={handlePvPFinish} onExit={() => setCurrentView('home')} />;
    if (currentView === 'redacao') return <RedacaoView onBack={() => setCurrentView('home')} onShowToast={showToast} />;
    if (currentView === 'ranking') return <RankingView onBack={() => setCurrentView('home')} />;
    
    return null;
  };

  const noHeaderViews = ['home', 'summary', 'caderno_erros', 'store', 'flashcards', 'pvp', 'redacao', 'simulados', 'pegadinhas', 'profile', 'ranking'];
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
        
        {/* New Review Intro Modal */}
        <ReviewIntroModal 
            isOpen={isReviewIntroOpen} 
            onClose={() => setIsReviewIntroOpen(false)}
            onStart={confirmStartReview}
            count={pendingReviewCount}
            userName="Dhyêgo" // Could be dynamic from stats/profile
        />
      </div>
    </div>
  );
};

export default App;
