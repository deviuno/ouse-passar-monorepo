
import React, { useState, useMemo, useEffect } from 'react';
import { Home, BookOpen, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import { COLORS, INITIAL_USER_STATS, MOCK_QUESTIONS, LOGO_URL, COURSES } from './constants';
import { UserStats, Course, ParsedQuestion, Alternative, StudyMode, UserAnswer, StoreItem, Flashcard, ToastMessage, ToastType } from './types';
import Dashboard from './components/Dashboard';
import QuestionCard from './components/QuestionCard';
import TutorChat from './components/TutorChat';
import PegadinhasView from './components/PegadinhasView';
import SimuladosView from './components/SimuladosView';
import ProfileView from './components/ProfileView';
import ModeSelectionModal from './components/ModeSelectionModal';
import SimuladoSummary from './components/SimuladoSummary';
import CadernoErrosView from './components/CadernoErrosView';
import StoreView from './components/StoreView';
import FlashcardsView from './components/FlashcardsView';
import PvPGameView from './components/PvPGameView';
import RedacaoView from './components/RedacaoView';
import PaymentModal from './components/PaymentModal';
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
  const [currentView, setCurrentView] = useState<'home' | 'simulados' | 'study' | 'pegadinhas' | 'profile' | 'summary' | 'caderno_erros' | 'store' | 'flashcards' | 'pvp' | 'redacao'>('home');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
  // Persistent State: User Stats
  const [stats, setStats] = useState<UserStats>(() => {
      const saved = localStorage.getItem('ousepassar_stats');
      return saved ? JSON.parse(saved) : INITIAL_USER_STATS;
  });

  // Persistent State: Global Answer History (for Caderno de Erros)
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
      // Initialize with default owned courses from constants
      return COURSES.filter(c => c.isOwned).map(c => c.id);
  });

  // Persistent State: Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
      const saved = localStorage.getItem('ousepassar_flashcards');
      return saved ? JSON.parse(saved) : [];
  });

  // UI State: Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // Effects for Persistence
  useEffect(() => {
      localStorage.setItem('ousepassar_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
      localStorage.setItem('ousepassar_history', JSON.stringify(globalAnswers));
  }, [globalAnswers]);

  useEffect(() => {
      localStorage.setItem('ousepassar_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
      localStorage.setItem('ousepassar_owned_courses', JSON.stringify(ownedCourseIds));
  }, [ownedCourseIds]);

  useEffect(() => {
      localStorage.setItem('ousepassar_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  
  // Mode Selection State
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [tempSelectedCourse, setTempSelectedCourse] = useState<Course | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('zen');
  const [simulatedTime, setSimulatedTime] = useState<number>(120); // Default 120 minutes

  // Pegadinha Filtering State
  const [isPegadinhaSession, setIsPegadinhaSession] = useState(false);
  const [tempIsPegadinha, setTempIsPegadinha] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStoreCourse, setSelectedStoreCourse] = useState<Course | null>(null);

  // Answers State for CURRENT Simulado Session
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // Memoize parsed questions to avoid re-parsing on render
  const allQuestions = useMemo(() => parseQuestions(MOCK_QUESTIONS), []);

  // Filter questions based on session type (Pegadinha vs Normal)
  // In a real app, this would also filter by course ID
  const activeQuestions = useMemo(() => {
    let q = allQuestions;
    if (isPegadinhaSession) {
        q = q.filter(item => item.isPegadinha);
    }
    // In a real DB scenario, we would also filter: item.courseId === activeCourse.id
    return q;
  }, [allQuestions, isPegadinhaSession, activeCourse]);

  const currentQuestion = activeQuestions[questionIndex] || allQuestions[0];
  const isLastQuestion = questionIndex === activeQuestions.length - 1;

  // --- Toast Helpers ---
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Logic: When user clicks a course (Simulado or Pegadinha view)
  const handleSelectCourse = (course: Course, isPegadinhaMode: boolean = false) => {
    setTempSelectedCourse(course);
    setTempIsPegadinha(isPegadinhaMode);
    setIsModeModalOpen(true);
  };

  // Logic: When user clicks a locked store course
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

  // Logic: User confirmed mode, start the session
  const handleStartStudy = (mode: StudyMode, time: number = 120) => {
    if (tempSelectedCourse) {
        setStudyMode(mode);
        setSimulatedTime(time);
        setActiveCourse(tempSelectedCourse);
        setIsPegadinhaSession(tempIsPegadinha); // Commit the filter
        setQuestionIndex(0); // Reset progress
        setUserAnswers([]); // Reset answers for this session
        setCurrentView('study');
        setIsModeModalOpen(false);
        setTempSelectedCourse(null);
    }
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

    // Update current session
    setUserAnswers(prev => [...prev, answer]);
    
    // Update global history
    setGlobalAnswers(prev => [...prev, answer]);

    // In Zen/Reta Final, we update stats immediately
    if (studyMode !== 'hard') {
       if (isCorrect) {
          setStats(prev => ({
              ...prev,
              xp: prev.xp + 50,
              coins: prev.coins + 10, // Earn coins per question in Zen
              correctAnswers: prev.correctAnswers + 1,
              totalAnswered: prev.totalAnswered + 1
          }));
       } else {
          setStats(prev => ({
              ...prev,
              totalAnswered: prev.totalAnswered + 1
          }));
       }
    }
  };

  const handleFinishSimulado = () => {
      // In Simulado mode, stats are updated in bulk
      if (studyMode === 'hard') {
          const correctCount = userAnswers.filter(a => a.isCorrect).length;
          const coinsEarned = correctCount * 20; // 20 coins per correct in Simulado (harder)
          
          setStats(prev => ({
              ...prev,
              xp: prev.xp + (correctCount * 100), // Double XP for Simulado
              coins: prev.coins + coinsEarned,
              correctAnswers: prev.correctAnswers + correctCount,
              totalAnswered: prev.totalAnswered + userAnswers.length
          }));
      }
      setCurrentView('summary');
  };

  const handleBuyItem = (item: StoreItem) => {
      if (stats.coins >= item.price && !inventory.includes(item.id)) {
          setStats(prev => ({
              ...prev,
              coins: prev.coins - item.price
          }));
          setInventory(prev => [...prev, item.id]);
          showToast(`Você comprou: ${item.name}!`, 'success');
      } else {
          showToast('Saldo insuficiente!', 'error');
      }
  };

  const handleEquipItem = (item: StoreItem) => {
      if (item.type === 'avatar') {
          setStats(prev => ({
              ...prev,
              avatarId: item.id
          }));
          showToast('Avatar equipado!', 'success');
      }
      // Future expansion: Theme or Powerups logic
  };

  const handleGenerateFlashcards = async (targetQuestions: ParsedQuestion[]) => {
      setIsGeneratingFlashcards(true);
      const newCards = await generateFlashcards(targetQuestions);
      
      if (newCards && newCards.length > 0) {
          // Prevent duplicates by ID check (simple implementation)
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
          setStats(prev => ({
              ...prev,
              xp: prev.xp + 200,
              coins: prev.coins + 50
          }));
      } else {
          setStats(prev => ({
              ...prev,
              xp: prev.xp + 20,
              coins: prev.coins + 5
          }));
      }
      // REMOVED: setCurrentView('home'); 
      // Allows PvPGameView to show the Result screen and "Rematch" options.
      // User must explicitly click "Voltar" in PvPGameView to go home.
  };

  const renderContent = () => {
    if (currentView === 'home') {
      return (
          <Dashboard 
            stats={stats} 
            ownedCourseIds={ownedCourseIds}
            onSelectCourse={handleSelectCourse} 
            onBuyCourse={handleSelectStoreCourse}
            onStartPvP={() => setCurrentView('pvp')}
            onStartRedacao={() => setCurrentView('redacao')}
          />
      );
    }

    if (currentView === 'simulados') {
        return (
            <SimuladosView 
                onSelectCourse={handleSelectCourse} 
                onBack={() => setCurrentView('home')} 
            />
        );
    }

    if (currentView === 'pegadinhas') {
      return (
          <PegadinhasView 
            onSelectCourse={handleSelectCourse} 
            onBuyCourse={handleSelectStoreCourse}
            ownedCourseIds={ownedCourseIds}
            onBack={() => setCurrentView('home')} 
          />
      );
    }
    
    if (currentView === 'study' && activeCourse) {
      return (
        <QuestionCard 
            question={currentQuestion}
            isLastQuestion={isLastQuestion} 
            onNext={handleNextQuestion}
            onOpenTutor={() => setIsTutorOpen(true)}
            onAnswer={handleAnswer}
            onTimeout={handleFinishSimulado}
            studyMode={studyMode}
            initialTime={simulatedTime}
        />
      );
    }

    if (currentView === 'summary') {
        return (
            <SimuladoSummary 
                answers={userAnswers}
                questions={activeQuestions}
                onExit={() => setCurrentView('home')}
                onRestart={() => handleStartStudy(studyMode, simulatedTime)}
            />
        );
    }

    if (currentView === 'profile') {
        return (
            <ProfileView 
                stats={stats} 
                onOpenCadernoErros={() => setCurrentView('caderno_erros')} 
                onOpenStore={() => setCurrentView('store')}
                onOpenFlashcards={() => setCurrentView('flashcards')}
                onBack={() => setCurrentView('home')} 
            />
        );
    }

    if (currentView === 'caderno_erros') {
        return (
            <CadernoErrosView 
                answers={globalAnswers} 
                questions={allQuestions} 
                onBack={() => setCurrentView('profile')} 
                onGenerateFlashcards={handleGenerateFlashcards}
                isGenerating={isGeneratingFlashcards}
            />
        );
    }

    if (currentView === 'store') {
        return (
            <StoreView 
                stats={stats}
                inventory={inventory}
                onBack={() => setCurrentView('profile')}
                onBuy={handleBuyItem}
                onEquip={handleEquipItem}
            />
        );
    }

    if (currentView === 'flashcards') {
        return (
            <FlashcardsView 
                cards={flashcards}
                onBack={() => setCurrentView('profile')}
            />
        );
    }

    if (currentView === 'pvp') {
        return (
            <PvPGameView 
                questions={allQuestions}
                userStats={stats}
                onFinish={handlePvPFinish}
                onExit={() => setCurrentView('home')}
            />
        );
    }

    if (currentView === 'redacao') {
        return (
            <RedacaoView 
                onBack={() => setCurrentView('home')}
                onShowToast={showToast}
            />
        );
    }

    return null;
  };

  // Views that should NOT show the global top header
  const noHeaderViews = ['home', 'summary', 'caderno_erros', 'store', 'flashcards', 'pvp', 'redacao', 'simulados', 'pegadinhas', 'profile'];

  // Views that SHOULD show the bottom navigation
  const bottomNavViews = ['home', 'simulados', 'pegadinhas', 'profile'];

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans flex justify-center">
      <div className="w-full max-w-md bg-[#1A1A1A] h-screen flex flex-col relative shadow-2xl">
        
        {/* Toast Container - Global Overlay */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* Header (Dynamic) */}
        {!noHeaderViews.includes(currentView) && (
            <header className="px-4 py-4 flex items-center justify-between border-b border-gray-800 bg-[#1A1A1A] z-10">
            {currentView === 'study' ? (
                <div className="flex items-center w-full">
                    <button onClick={() => setCurrentView('simulados')} className="mr-3 p-2 -ml-2 hover:bg-gray-800 rounded-full">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative p-0">
           {renderContent()}
        </main>

        {/* Bottom Navigation */}
        {bottomNavViews.includes(currentView) && (
            <nav className="border-t border-gray-800 bg-[#1A1A1A] px-6 py-4 absolute bottom-0 w-full z-20">
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => setCurrentView('home')}
                    className={`flex flex-col items-center space-y-1 ${currentView === 'home' ? 'text-[#FFB800]' : 'text-gray-600'}`}
                >
                <Home size={24} strokeWidth={currentView === 'home' ? 3 : 2} />
                <span className="text-[10px] font-medium">Início</span>
                </button>
                
                <button 
                    onClick={() => setCurrentView('simulados')}
                    className={`flex flex-col items-center space-y-1 ${currentView === 'simulados' || (currentView === 'study' && !isPegadinhaSession) ? 'text-[#FFB800]' : 'text-gray-600'}`}
                >
                <BookOpen size={24} strokeWidth={currentView === 'simulados' || (currentView === 'study' && !isPegadinhaSession) ? 3 : 2} />
                <span className="text-[10px] font-medium">Simulados</span>
                </button>

                <button 
                    onClick={() => setCurrentView('pegadinhas')}
                    className={`flex flex-col items-center space-y-1 ${currentView === 'pegadinhas' || (currentView === 'study' && isPegadinhaSession) ? 'text-[#FFB800]' : 'text-gray-600'}`}
                >
                <AlertTriangle size={24} strokeWidth={currentView === 'pegadinhas' || (currentView === 'study' && isPegadinhaSession) ? 3 : 2} />
                <span className="text-[10px] font-medium">Pegadinhas</span>
                </button>

                <button 
                    onClick={() => setCurrentView('profile')}
                    className={`flex flex-col items-center space-y-1 ${currentView === 'profile' ? 'text-[#FFB800]' : 'text-gray-600'}`}
                >
                <User size={24} strokeWidth={currentView === 'profile' ? 3 : 2} />
                <span className="text-[10px] font-medium">Perfil</span>
                </button>
            </div>
            </nav>
        )}

        {/* AI Tutor Modal */}
        <TutorChat 
            isOpen={isTutorOpen} 
            onClose={() => setIsTutorOpen(false)} 
            question={currentQuestion} 
        />

        {/* Mode Selection Modal */}
        <ModeSelectionModal 
            isOpen={isModeModalOpen}
            onClose={() => setIsModeModalOpen(false)}
            course={tempSelectedCourse}
            onSelectMode={handleStartStudy}
        />

        {/* Payment Modal */}
        <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            course={selectedStoreCourse}
            onConfirm={handleConfirmPurchase}
        />
      </div>
    </div>
  );
};

export default App;
