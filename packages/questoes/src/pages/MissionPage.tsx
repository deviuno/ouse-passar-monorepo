import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Book,
  Volume2,
  RefreshCw,
  Home,
  Star,
  Play,
  Check,
  Lock
} from 'lucide-react';
import { useMissionStore, useTrailStore, useUserStore, useUIStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import { Button, Card, Progress, CircularProgress, SuccessCelebration, FadeIn, FloatingChatButton } from '../components/ui';
import { QuestionCard } from '../components/question';
import { ParsedQuestion, TrailMission, MissionStatus } from '../types';
import { TrailMap } from '../components/trail/TrailMap';
import { CompactTrailMap } from '../components/trail/CompactTrailMap';
import { MentorChat } from '../components/question/MentorChat';
import { XP_PER_CORRECT, COINS_PER_MISSION, PASSING_SCORE } from '../constants';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
} from '../services/questionFeedbackService';

// Content Phase Component
function ContentPhase({
  content,
  onContinue,
  onBack,
}: {
  content: { texto_content?: string; audio_url?: string; title?: string };
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-10 h-10 rounded-full bg-[#3498DB]/20 flex items-center justify-center">
            <Book size={20} className="text-[#3498DB]" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{content.title || 'Conteúdo Teórico'}</h2>
            <p className="text-[#6E6E6E] text-sm">Leia com atenção antes de praticar</p>
          </div>
        </div>

        {/* Audio Player */}
        {content.audio_url && (
          <Card className="mb-4">
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-[#FFB800] flex items-center justify-center">
                <Volume2 size={20} className="text-black" />
              </button>
              <div className="flex-1">
                <p className="text-white text-sm">Ouvir conteúdo</p>
                <div className="h-1 bg-[#3A3A3A] rounded-full mt-1">
                  <div className="h-full w-0 bg-[#FFB800] rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Text Content */}
        <Card>
          <div className="prose prose-invert max-w-none">
            <div
              className="text-[#E0E0E0] leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: content.texto_content || 'Conteúdo não disponível para esta missão.',
              }}
            />
          </div>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="p-4 border-t border-[#3A3A3A]">
        <Button
          fullWidth
          size="lg"
          onClick={onContinue}
          rightIcon={<ChevronRight size={20} />}
        >
          Entendi, vamos praticar!
        </Button>
      </div>
    </motion.div>
  );
}

// Result Phase Component
function ResultPhase({
  score,
  correct,
  total,
  xpEarned,
  onContinue,
}: {
  score: number;
  correct: number;
  total: number;
  xpEarned: number;
  onContinue: () => void;
}) {
  const passed = score >= PASSING_SCORE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="mb-6"
      >
        <CircularProgress
          value={score}
          size={150}
          strokeWidth={12}
          color={passed ? 'success' : 'error'}
        >
          <div className="text-center">
            <span className="text-3xl font-bold text-white">{Math.round(score)}%</span>
          </div>
        </CircularProgress>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {passed ? 'Parabéns!' : 'Quase lá!'}
        </h2>
        <p className="text-[#A0A0A0] mb-6">
          Você acertou {correct} de {total} questões
        </p>

        {passed && (
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FFB800]">+{xpEarned}</p>
              <p className="text-[#6E6E6E] text-sm">XP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FFB800]">+{COINS_PER_MISSION}</p>
              <p className="text-[#6E6E6E] text-sm">Moedas</p>
            </div>
          </div>
        )}

        <Button
          size="lg"
          fullWidth
          variant={passed ? 'primary' : 'secondary'}
          onClick={onContinue}
        >
          {passed ? 'Continuar' : 'Voltar para Trilha'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Massification Phase Component
function MassificationPhase({
  score,
  onRetry,
  onGoHome,
}: {
  score: number;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-6xl mb-6"
      >
        📚
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Você precisa revisar!
      </h2>
      <p className="text-[#A0A0A0] mb-2">
        Seu score foi <span className="text-[#E74C3C] font-bold">{Math.round(score)}%</span>
      </p>
      <p className="text-[#6E6E6E] text-sm mb-8 max-w-xs">
        Para desbloquear a próxima missão, você precisa atingir pelo menos {PASSING_SCORE}% de acerto.
      </p>

      <div className="space-y-3 w-full max-w-xs">
        <Button
          size="lg"
          fullWidth
          onClick={onRetry}
          leftIcon={<RefreshCw size={20} />}
        >
          Refazer Missão
        </Button>
        <Button
          size="lg"
          fullWidth
          variant="ghost"
          onClick={onGoHome}
          leftIcon={<Home size={20} />}
        >
          Voltar para Trilha
        </Button>
      </div>
    </motion.div>
  );
}

// Demo Questions (com dados mais completos para o QuestionCard avançado)
const DEMO_QUESTIONS: ParsedQuestion[] = [
  {
    id: 1,
    materia: 'Língua Portuguesa',
    assunto: 'Concordância Verbal',
    concurso: 'Demo',
    enunciado: 'Assinale a alternativa em que a concordância verbal está correta:',
    alternativas: '[]',
    parsedAlternativas: [
      { letter: 'A', text: 'Fazem dois anos que não o vejo.' },
      { letter: 'B', text: 'Houveram muitos problemas na reunião.' },
      { letter: 'C', text: 'Existem, naquela cidade, muitas pessoas honestas.' },
      { letter: 'D', text: 'Haviam chegado cedo todos os convidados.' },
    ],
    gabarito: 'C',
    comentario: 'O verbo "existir" concorda normalmente com o sujeito. Neste caso, "muitas pessoas honestas" é o sujeito, portanto o verbo fica no plural.',
    orgao: 'Demo',
    banca: 'CEBRASPE',
    ano: 2024,
  },
  {
    id: 2,
    materia: 'Língua Portuguesa',
    assunto: 'Concordância Verbal',
    concurso: 'Demo',
    enunciado: 'Em qual alternativa o verbo está flexionado **incorretamente**?',
    alternativas: '[]',
    parsedAlternativas: [
      { letter: 'A', text: 'Os Estados Unidos são uma potência mundial.' },
      { letter: 'B', text: 'Minas Gerais possui belas paisagens.' },
      { letter: 'C', text: 'Os Lusíadas foi escrito por Camões.' },
      { letter: 'D', text: 'Vassouradas é o nome de um documentário.' },
    ],
    gabarito: 'A',
    comentario: 'Nomes de países, quando acompanhados de artigo no plural, podem concordar no plural. Porém, "Estados Unidos" geralmente é tratado como singular quando se refere ao país como unidade.',
    orgao: 'Demo',
    banca: 'FGV',
    ano: 2024,
    isPegadinha: true,
    explicacaoPegadinha: 'A pegadinha está na palavra "incorretamente". Muitos candidatos procuram a alternativa correta e marcam a C, que é uma flexão correta. A questão pede a INCORRETA, que é a alternativa A.',
  },
];

// Demo Trail Data (Copiado do HomePage para garantir consistência visual se a store estiver vazia)
const DEMO_ROUNDS = [
  {
    id: 'round-1',
    trail_id: 'demo',
    round_number: 1,
    status: 'active' as const,
    tipo: 'normal' as const,
    created_at: new Date().toISOString(),
    missions: [
      { id: 'm1', round_id: 'round-1', materia_id: '1', ordem: 1, status: 'completed' as MissionStatus, tipo: 'normal' as const, score: 85, attempts: 1, created_at: '', assunto: { id: '1', materia_id: '1', nome: 'Concordância Verbal', ordem: 1, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm2', round_id: 'round-1', materia_id: '2', ordem: 2, status: 'completed' as MissionStatus, tipo: 'normal' as const, score: 72, attempts: 1, created_at: '', assunto: { id: '2', materia_id: '2', nome: 'Números Naturais', ordem: 1, nivel_dificuldade: 'iniciante' as const, created_at: '' } },
      { id: 'm3', round_id: 'round-1', materia_id: '1', ordem: 3, status: 'available' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '3', materia_id: '1', nome: 'Regência Verbal', ordem: 2, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm4', round_id: 'round-1', materia_id: '2', ordem: 4, status: 'locked' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '4', materia_id: '2', nome: 'Frações', ordem: 2, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm5', round_id: 'round-1', materia_id: '1', ordem: 5, status: 'locked' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '5', materia_id: '1', nome: 'Crase', ordem: 3, nivel_dificuldade: 'avancado' as const, created_at: '' } },
    ],
  },
  {
    id: 'round-2',
    trail_id: 'demo',
    round_number: 2,
    status: 'locked' as const,
    tipo: 'normal' as const,
    created_at: new Date().toISOString(),
    missions: [
      { id: 'm6', round_id: 'round-2', materia_id: '1', ordem: 1, status: 'locked' as MissionStatus, tipo: 'revisao' as const, attempts: 0, created_at: '', assunto: { id: '6', materia_id: '1', nome: 'Revisão Geral', ordem: 1, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm7', round_id: 'round-2', materia_id: '1', ordem: 2, status: 'locked' as MissionStatus, tipo: 'revisao' as const, attempts: 0, created_at: '', assunto: { id: '7', materia_id: '1', nome: 'Simulado Final', ordem: 2, nivel_dificuldade: 'avancado' as const, created_at: '' } },
    ],
  },
];

export default function MissionPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { incrementStats, stats } = useUserStore();
  const { completeMission, rounds, setSelectedMissionId } = useTrailStore();

  // Trail Logic
  const displayRounds = rounds.length > 0 ? rounds : DEMO_ROUNDS;

  const allMissions = useMemo(() => {
    return displayRounds.flatMap(r => r.missions) as TrailMission[];
  }, [displayRounds]);

  const currentMissionIndex = useMemo(() => {
    const idx = allMissions.findIndex(m => m.status === 'available' || m.status === 'in_progress');
    if (idx === -1) {
      if (allMissions.length > 0 && allMissions[allMissions.length - 1].status === 'completed') {
        return allMissions.length - 1;
      }
      return 0;
    }
    return idx;
  }, [allMissions]);

  const handleMissionClick = (mission: TrailMission) => {
    if (mission.status === 'locked') return;
    if (mission.id === missionId) return; // Já estamos aqui

    setSelectedMissionId(mission.id);
    navigate(`/missao/${mission.id}`);
  };

  // Local state for this page
  const [phase, setPhase] = useState<'content' | 'questions' | 'result' | 'massification'>('content');
  const [questions] = useState<ParsedQuestion[]>(DEMO_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(new Map());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Reset state when mission changes
  React.useEffect(() => {
    setPhase('content');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setShowCelebration(false);
    setShowMentorChat(false);
  }, [missionId]);

  const currentQuestion = questions[currentQuestionIndex];

  // Handler quando o usuário responde
  const handleAnswer = (letter: string) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = letter === question.gabarito;
    setAnswers(new Map(answers.set(question.id, { letter, correct: isCorrect })));

    // Save answer to database for statistics
    saveUserAnswer({
      questionId: question.id,
      selectedAlternative: letter,
      isCorrect: isCorrect,
    }, user?.id);
  };

  // Handler para rating de dificuldade
  const handleRateDifficulty = (difficulty: DifficultyRating) => {
    const question = questions[currentQuestionIndex];
    if (user?.id) {
      saveDifficultyRating(question.id, difficulty, user.id);
    }
  };

  // Handler para próxima questão ou finalizar
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calcular score
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;

      if (score >= PASSING_SCORE) {
        setShowCelebration(true);
        const xpEarned = correctCount * XP_PER_CORRECT;
        incrementStats({
          xp: xpEarned,
          coins: COINS_PER_MISSION,
          correctAnswers: correctCount,
          totalAnswered: questions.length,
        });
        setTimeout(() => {
          setShowCelebration(false);
          setPhase('result');
        }, 2000);
      } else {
        setPhase('massification');
      }
    }
  };

  const handleRetry = () => {
    setPhase('content');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContinue = () => {
    if (missionId) {
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;
      completeMission(missionId, score);
    }
    navigate('/');
    addToast('success', 'Missão concluída! Próxima missão desbloqueada.');
  };

  const handleShowToast = (message: string, type: 'success' | 'error' | 'info') => {
    addToast(type, message);
  };

  // Calcular score atual
  // Retrieve current mission info for display
  const currentMission = useMemo(() => {
    return allMissions.find(m => m.id === missionId);
  }, [allMissions, missionId]);

  const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
  const currentScore = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#1A1A1A]">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="w-full max-w-[800px] mx-auto flex flex-col min-h-full">
            {/* Celebration */}
            <SuccessCelebration isActive={showCelebration} />

            {/* Header - só aparece na fase de questões */}
            {phase === 'questions' && (
              <div className="p-4 border-b border-[#3A3A3A] bg-[#1A1A1A]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (answers.size > 0) {
                        if (confirm('Tem certeza que deseja sair? Seu progresso será perdido.')) {
                          navigate('/');
                        }
                      } else {
                        navigate('/');
                      }
                    }}
                    className="p-2 rounded-full hover:bg-[#252525] transition-colors"
                  >
                    <ChevronLeft size={24} className="text-[#A0A0A0]" />
                  </button>
                  <Progress
                    value={((currentQuestionIndex + 1) / questions.length) * 100}
                    size="md"
                    className="flex-1"
                  />
                  <span className="text-[#A0A0A0] text-sm font-medium">
                    {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </div>
                {/* Stats da missão */}
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className="text-[#2ECC71]">✓ {correctCount}</span>
                  <span className="text-[#E74C3C]">✗ {answers.size - correctCount}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {phase === 'content' && (
                  <ContentPhase
                    key="content"
                    content={{
                      title: currentMission?.assunto?.nome ? `📖 ${currentMission.assunto.nome}` : undefined,
                      texto_content: `<h3 style="color: #FFB800; margin-bottom: 12px;">${currentMission?.assunto?.nome || 'Conteúdo'}</h3>

<p>A <strong>${currentMission?.assunto?.nome || 'matéria'}</strong> é fundamental para seu aprendizado. Estude com atenção!</p>

<h4 style="color: #3498DB; margin-top: 16px;">Conceitos fundamentais:</h4>
<ul>
  <li>Conceito A: definição importante.</li>
  <li>Conceito B: aplicação prática.</li>
</ul>

<h4 style="color: #E74C3C; margin-top: 16px;">⚠️ Pontos de atenção:</h4>
<p>Fique atento às exceções e regras especiais deste tópico.</p>

<p style="margin-top: 16px; padding: 12px; background: rgba(255,184,0,0.1); border-radius: 8px; border-left: 3px solid #FFB800;">
  💡 <strong>Dica:</strong> Revise este conteúdo periodicamente.
</p>`
                    }}
                    onContinue={() => setPhase('questions')}
                    onBack={() => navigate('/')}
                  />
                )}

                {phase === 'questions' && currentQuestion && (
                  <motion.div
                    key={`question-${currentQuestionIndex}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full"
                  >
                    <QuestionCard
                      question={currentQuestion}
                      isLastQuestion={currentQuestionIndex === questions.length - 1}
                      onNext={handleNext}
                      onOpenTutor={() => setShowMentorChat(true)}
                      onAnswer={handleAnswer}
                      onRateDifficulty={handleRateDifficulty}
                      studyMode="zen"
                      userId={user?.id}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}

                {phase === 'result' && (
                  <ResultPhase
                    key="result"
                    score={currentScore}
                    correct={correctCount}
                    total={questions.length}
                    xpEarned={correctCount * XP_PER_CORRECT}
                    onContinue={handleContinue}
                  />
                )}

                {phase === 'massification' && (
                  <MassificationPhase
                    key="massification"
                    score={currentScore}
                    onRetry={handleRetry}
                    onGoHome={handleGoHome}
                  />
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
        {/* Mentor Chat - positioned absolute within this column */}
        <MentorChat
          isVisible={showMentorChat}
          onClose={() => setShowMentorChat(false)}
          contentContext={
            phase === 'questions' && currentQuestion
              ? {
                  title: currentQuestion.assunto || currentQuestion.materia,
                  text: currentQuestion.enunciado,
                  question: currentQuestion
                }
              : {
                  title: currentMission?.assunto?.nome,
                  text: `Conteudo sobre ${currentMission?.assunto?.nome || 'o tema'}`
                }
          }
          userContext={{
            name: user?.user_metadata?.name,
            level: stats.level,
            xp: stats.xp,
            streak: stats.streak
          }}
        />
      </div>

      {/* Right Column: Map Sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isMapExpanded ? 400 : 72, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="hidden xl:block h-full bg-[#252525] border-l border-[#3A3A3A] relative z-20 shadow-2xl overflow-hidden"
      >
        {/* Toggle Button */}


        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20">
          {/* Header */}
          {/* Header */}
          <div
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className={`sticky top-0 bg-[#252525]/95 backdrop-blur-sm z-30 border-b border-[#3A3A3A] mb-2 ${isMapExpanded ? 'p-4' : 'p-3'} cursor-pointer hover:bg-[#2A2A2A] transition-colors`}
          >
            {isMapExpanded ? (
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Star size={18} className="text-[#FFB800]" />
                  Sua Jornada
                </h3>
                <ChevronRight size={20} className="text-[#A0A0A0]" />
              </div>
            ) : (
              <div className="flex justify-center" title="Expandir Jornada">
                <ChevronLeft size={20} className="text-[#A0A0A0]" />
              </div>
            )}
          </div>

          {/* Map Content */}
          <div className={isMapExpanded ? 'pt-2' : 'pt-0'}>
            <AnimatePresence mode="wait">
              {isMapExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrailMap
                    missions={allMissions}
                    currentMissionIndex={currentMissionIndex}
                    onMissionClick={handleMissionClick}
                    userAvatar={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="compact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CompactTrailMap
                    missions={allMissions}
                    currentMissionIndex={currentMissionIndex}
                    onMissionClick={handleMissionClick}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>


      {/* Floating Chat Button - appears on all mission phases */}
      <FloatingChatButton
        isOpen={showMentorChat}
        onClick={() => setShowMentorChat(!showMentorChat)}
        sidebarWidth={isMapExpanded ? 400 : 72}
      />

      {/* Mentor Chat - controlled by FloatingChatButton */}

    </div>
  );
}
