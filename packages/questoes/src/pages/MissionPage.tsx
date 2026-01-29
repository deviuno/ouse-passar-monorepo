import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  RefreshCw,
  Home,
  Play,
  Check,
  Lock,
  Loader2,
  Pause,
  Sparkles,
  Target,
  BookOpen,
  Zap,
  Flame
} from 'lucide-react';
import { useMissionStore, useTrailStore, useUserStore, useUIStore, useBatteryStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import { Button, Card, Progress, CircularProgress, SuccessCelebration, FadeIn, FloatingChatButton, MarkdownContent, ConfirmModal } from '../components/ui';
import { FloatingPracticeButton } from '../components/ui/FloatingPracticeButton';
import { BatteryEmptyModal } from '../components/battery';
import { QuestionCard } from '../components/question';
import { QuestionNavigator } from '../components/question/QuestionNavigator';
import { ParsedQuestion, TrailMission, MissionStatus, StudyMode } from '../types';
import { TrailMap } from '../components/trail/TrailMap';
import { CompactTrailMap } from '../components/trail/CompactTrailMap';
import { RoundSelector } from '../components/trail/RoundSelector';
import { MentorChat } from '../components/question/MentorChat';
import { QuestionsSkeleton, ContentSkeleton, StudyModeModal } from '../components/mission';
import { PASSING_SCORE, XP_PER_CORRECT, COINS_PER_CORRECT } from '../constants';
import { calculateXpReward, calculateCoinsReward } from '../services/gamificationSettingsService';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
} from '../services/questionFeedbackService';
import {
  marcarNeedsMassificacao,
  isMassificacao,
  completarMassificacao,
  getQuestoesIdsMassificacao,
  getMassificacaoAttempts,
} from '../services/massificacaoService';
import { getQuestoesFixasDaMissao } from '../services/missaoQuestoesFixasService';
import {
  getMissionProgress,
  saveMissionProgress,
  saveMissionProgressImmediate,
  clearMissionProgress,
  flushPendingSave,
  MissionProgressData,
} from '../services/missionProgressService';
import {
  getMissaoConteudo,
  gerarConteudoMissao,
  getConteudoEfetivo,
  MissaoConteudo,
  ConteudoEfetivo,
} from '../services/missaoConteudoService';
import {
  userPreparatoriosService,
  getRodadasComProgresso,
  rodadasToTrailRounds,
  updateMissaoProgress,
} from '../services';
import { RETA_FINAL_THEME } from '../services/retaFinalService';

// URL do servidor Mastra para chamadas de background
const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';


// Content Phase Component
function ContentPhase({
  content,
  isLoading,
  isGenerating,
  generationStatus,
  onContinue,
  onBack,
  isRetaFinal = false,
  mission,
}: {
  content: { texto_content?: string; audio_url?: string; title?: string } | null;
  isLoading: boolean;
  isGenerating: boolean;
  generationStatus: 'idle' | 'generating' | 'completed' | 'failed';
  onContinue: (mode: 'zen' | 'hard') => void;
  onBack: () => void;
  isRetaFinal?: boolean;
  mission?: TrailMission;
}) {
  const [showModeModal, setShowModeModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerLeft, setContainerLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showStickyPlayer, setShowStickyPlayer] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showStickySpeedMenu, setShowStickySpeedMenu] = useState(false);

  const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  // Handle scroll to show/hide sticky player and measure container
  useEffect(() => {
    const playerElement = playerRef.current;
    const containerElement = contentContainerRef.current;

    const updateContainerDimensions = () => {
      if (containerElement) {
        const rect = containerElement.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerLeft(rect.left);
      }
    };

    const handleScroll = () => {
      if (!isPlaying || !playerElement) {
        setShowStickyPlayer(false);
        return;
      }

      updateContainerDimensions();

      const playerRect = playerElement.getBoundingClientRect();
      // Show sticky player when original player is scrolled above the header (top-14 = 56px)
      const isOutOfView = playerRect.bottom < 70;
      setShowStickyPlayer(isOutOfView);
    };

    // Initial measurement
    updateContainerDimensions();

    // Listen to scroll on window and any scrollable parent
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updateContainerDimensions);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateContainerDimensions);
    };
  }, [isPlaying]);

  // Update playback rate when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Close speed menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSpeedMenu(false);
      setShowStickySpeedMenu(false);
    };

    if (showSpeedMenu || showStickySpeedMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSpeedMenu, showStickySpeedMenu]);

  const handleSpeedSelect = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    setShowStickySpeedMenu(false);
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      console.error('[Audio] audioRef not available');
      return;
    }

    console.log('[Audio] handlePlayPause called, isPlaying:', isPlaying, 'src:', audioRef.current.src);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[Audio] Error playing:', error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setAudioProgress(progress);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state - fetching existing content from database
  if (isLoading) {
    return <ContentSkeleton />;
  }

  // Generating state - AI is creating new content
  if (isGenerating || generationStatus === 'generating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Sparkles size={48} className="text-[#FFB800]" />
        </motion.div>
        <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
          Gerando conteúdo personalizado...
        </h2>
        <p className="text-[var(--color-text-sec)] mb-4 max-w-xs">
          Nossa IA está preparando uma aula especial baseada nas questões desta missão. Isso pode levar alguns segundos.
        </p>
        <div className="w-48 h-2 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#ffac00]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 30, ease: 'linear' }}
          />
        </div>
        <p className="text-[var(--color-text-muted)] text-xs mt-4">
          Você é o primeiro a acessar esta missão!
        </p>
      </motion.div>
    );
  }

  // Error state
  if (generationStatus === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
          Ops! Algo deu errado
        </h2>
        <p className="text-[var(--color-text-sec)] mb-6 max-w-xs">
          Não foi possível gerar o conteúdo. Você ainda pode praticar com as questões!
        </p>
        <Button onClick={() => onContinue('zen')} rightIcon={<ChevronRight size={20} />}>
          Ir para as questões
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full relative"
    >
      {/* Sticky Mini Player - fixed with same width as content container */}
      {showStickyPlayer && content?.audio_url && containerWidth > 0 && (
        <div
          className="fixed top-14 z-[100] bg-[var(--color-bg-card)] border-b border-[var(--color-border)] py-2 px-4"
          style={{
            width: containerWidth,
            left: containerLeft,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-[#ffac00] hover:bg-[#ffbc33] flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {isPlaying ? (
                <Pause size={28} strokeWidth={3} className="text-black" />
              ) : (
                <Play size={28} strokeWidth={3} className="text-black ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full">
                <div
                  className="h-full rounded-full bg-[#ffac00] transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
            <span className="text-[var(--color-text-sec)] text-xs flex-shrink-0 text-right">
              {formatTime(audioRef.current?.currentTime || 0)}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStickySpeedMenu(!showStickySpeedMenu);
                }}
                className="px-2 py-1 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-main)] rounded text-xs font-bold text-[var(--color-brand)] flex-shrink-0 transition-colors min-w-[40px]"
              >
                {playbackRate}x
              </button>
              {showStickySpeedMenu && (
                <div className="absolute top-full right-0 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-[110]">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeedSelect(speed);
                      }}
                      className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors whitespace-nowrap ${playbackRate === speed
                        ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
                        : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-main)]'
                        }`}
                    >
                      {speed}x {speed === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={contentContainerRef} className="flex-1 overflow-y-auto p-4">
        {/* Audio Player */}
        {content?.audio_url && (
          <div ref={playerRef}>
            <Card className="mb-4">
              <audio
                ref={audioRef}
                src={content.audio_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  handleLoadedMetadata();
                  setAudioLoading(false);
                  setAudioError(false);
                }}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('[Audio] Error loading audio:', e, content.audio_url);
                  setAudioError(true);
                  setAudioLoading(false);
                }}
                onCanPlay={() => {
                  console.log('[Audio] Can play:', content.audio_url);
                  setAudioLoading(false);
                }}
                onLoadStart={() => setAudioLoading(true)}
                preload="auto"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  disabled={audioLoading || audioError}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 p-0 ${audioLoading || audioError
                    ? 'bg-[var(--color-bg-elevated)] cursor-not-allowed'
                    : 'bg-[#ffac00] hover:bg-[#ffbc33]'
                    }`}
                >
                  {audioLoading ? (
                    <Loader2 size={27} strokeWidth={1.8} className="text-[#A0A0A0] animate-spin" />
                  ) : audioError ? (
                    <Volume2 size={27} strokeWidth={1.8} className="text-[#E74C3C]" />
                  ) : isPlaying ? (
                    <Pause size={27} strokeWidth={1.8} className="text-black" />
                  ) : (
                    <Play size={27} strokeWidth={1.8} className="text-black ml-1" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[var(--color-text-main)] text-sm">
                      {audioLoading ? 'Carregando áudio...' : audioError ? 'Erro ao carregar' : 'Ouvir conteúdo'}
                    </p>
                    {audioDuration > 0 && !audioError && (
                      <span className="text-[var(--color-text-muted)] text-xs">
                        {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(audioDuration)}
                      </span>
                    )}
                  </div>
                  <div className="h-1 bg-[var(--color-bg-elevated)] rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${audioError ? 'bg-[#E74C3C]' : 'bg-[#ffac00]'}`}
                      style={{ width: audioError ? '100%' : `${audioProgress}%` }}
                    />
                  </div>
                </div>
                {/* Speed Control Dropdown */}
                {!audioLoading && !audioError && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSpeedMenu(!showSpeedMenu);
                      }}
                      className="px-2 py-1.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-main)] rounded text-xs font-bold text-[var(--color-brand)] flex-shrink-0 transition-colors min-w-[44px]"
                      title="Velocidade de reprodução"
                    >
                      {playbackRate}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute top-full right-0 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-50">
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <button
                            key={speed}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeedSelect(speed);
                            }}
                            className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors whitespace-nowrap ${playbackRate === speed
                              ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
                              : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-main)]'
                              }`}
                          >
                            {speed}x {speed === 1 && '(Normal)'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Text Content with Markdown and Mermaid diagrams */}
        <Card className="p-0 overflow-hidden">
          <div className="mission-content px-3 py-4 md:p-6">
            <MarkdownContent
              content={content?.texto_content || 'Conteúdo não disponível para esta missão.'}
            />
          </div>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="px-3 py-3 md:p-4 border-t border-[var(--color-border)]">
        <Button
          fullWidth
          size="lg"
          onClick={() => setShowModeModal(true)}
          rightIcon={<ChevronRight size={20} />}
        >
          Entendi, vamos praticar!
        </Button>
      </div>

      {/* Study Mode Selection Modal */}
      <StudyModeModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={(mode) => {
          setShowModeModal(false);
          onContinue(mode);
        }}
      />
    </motion.div>
  );
}

// Result Phase Component
function ResultPhase({
  score,
  correct,
  total,
  xpEarned,
  isMassificacao,
  onContinue,
}: {
  score: number;
  correct: number;
  total: number;
  xpEarned: number;
  isMassificacao?: boolean;
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
          {isMassificacao ? 'Massificação Concluída!' : (passed ? 'Parabéns!' : 'Quase lá!')}
        </h2>
        <p className="text-[#A0A0A0] mb-6">
          Você acertou {correct} de {total} questões
        </p>

        {/* Só mostra recompensas se NÃO for massificação */}
        {passed && !isMassificacao && (
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FFB800]">+{xpEarned}</p>
              <p className="text-[#6E6E6E] text-sm">XP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FFB800]">+{correct * COINS_PER_CORRECT}</p>
              <p className="text-[#6E6E6E] text-sm">Moedas</p>
            </div>
          </div>
        )}

        {/* Mensagem especial para massificação */}
        {isMassificacao && passed && (
          <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-lg p-4 mb-6 max-w-xs mx-auto">
            <p className="text-[#2ECC71] text-sm">
              Você fixou o conteúdo! Agora pode continuar sua jornada.
            </p>
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
  tentativa,
  isCreating,
  onRetry,
  onGoHome,
}: {
  score: number;
  tentativa?: number;
  isCreating?: boolean;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="w-20 h-20 rounded-2xl bg-[#E74C3C]/20 flex items-center justify-center mb-6"
      >
        <RefreshCw className="w-10 h-10 text-[#E74C3C]" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Hora de Reforçar!
      </h2>

      <p className="text-[#A0A0A0] mb-1">
        Seu score foi <span className="text-[#E74C3C] font-bold">{Math.round(score)}%</span>
      </p>
      <p className="text-[#6E6E6E] text-sm mb-6 max-w-xs">
        Você precisa de pelo menos <span className="text-[#FFB800] font-semibold">{PASSING_SCORE}%</span> para avançar.
      </p>

      {/* Info cards */}
      <div className="space-y-3 mb-6 w-full max-w-xs">
        <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg text-left">
          <Target className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Mesmas questões</p>
            <p className="text-[#6E6E6E] text-xs">Você refará exatamente as mesmas questões para fixar o conteúdo.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg text-left">
          <BookOpen className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Conteúdo disponível</p>
            <p className="text-[#6E6E6E] text-xs">Acesso ao material teórico para revisar antes de responder.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg text-left">
          <Zap className="w-5 h-5 text-[#6E6E6E] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Sem recompensas</p>
            <p className="text-[#6E6E6E] text-xs">Não ganha XP ou moedas, mas desbloqueia a próxima missão.</p>
          </div>
        </div>
      </div>

      {tentativa && tentativa > 1 && (
        <p className="text-[#FFB800] text-sm mb-4">
          Tentativa #{tentativa}
        </p>
      )}

      <div className="w-full max-w-xs">
        <Button
          size="lg"
          fullWidth
          onClick={onRetry}
          disabled={isCreating}
          className="bg-[#E74C3C] hover:bg-[#C0392B]"
        >
          {isCreating ? 'Salvando...' : 'Entendi'}
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
  const { missionId, prepSlug, roundNum, missionNum } = useParams<{
    missionId?: string;
    prepSlug?: string;
    roundNum?: string;
    missionNum?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile: userProfile } = useAuthStore();
  const { addToast, setTutorOpen } = useUIStore();
  const { incrementStats, stats } = useUserStore();
  const {
    completeMission,
    rounds,
    setSelectedMissionId,
    viewingRoundIndex,
    setViewingRoundIndex,
    getSelectedPreparatorio,
    getMissionUrl,
    getMissionByUrlParams,
    userPreparatorios,
    setUserPreparatorios,
    setRounds,
    setPreparatorio,
    setCurrentTrail,
    isLoading: isStoreLoading,
    setLoading: setStoreLoading,
    selectedPreparatorioId,
  } = useTrailStore();

  // Battery store
  const {
    batteryStatus,
    isEmptyModalOpen,
    closeEmptyModal,
    consumeBattery,
    fetchBatteryStatus,
  } = useBatteryStore();

  // Ref para rastrear missoes que ja consumiram bateria (evita consumir multiplas vezes)
  const batteryConsumedMissions = useRef<Set<string>>(new Set());

  // Ref para o container de questões (scroll)
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  // Estado local para controle independente do sidebar
  const [sidebarViewingRoundIndex, setSidebarViewingRoundIndex] = useState(viewingRoundIndex || 0);

  // Sincronizar sidebar com visualização global apenas quando muda externamente
  useEffect(() => {
    if (typeof viewingRoundIndex === 'number') {
      setSidebarViewingRoundIndex(viewingRoundIndex);
    }
  }, [viewingRoundIndex]);

  // Estado local para controlar se os dados foram carregados
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Carregar dados do store se estiverem vazios (acesso direto à página)
  useEffect(() => {
    async function loadDataIfNeeded() {
      // Se já tem rounds carregados, não precisa carregar novamente
      if (rounds.length > 0) {
        setIsDataLoaded(true);
        return;
      }

      // Se não tem usuário, não pode carregar
      if (!user?.id) {
        setIsDataLoaded(true);
        return;
      }

      // Carregar preparatórios e rodadas
      setStoreLoading(true);
      try {
        // Carregar preparatórios
        const preparatorios = await userPreparatoriosService.getUserPreparatorios(user.id);

        if (preparatorios.length === 0) {
          setIsDataLoaded(true);
          setStoreLoading(false);
          return;
        }

        setUserPreparatorios(preparatorios);

        // Encontrar o preparatório pelo slug da URL (se disponível)
        let selectedPrep = preparatorios[0];
        if (prepSlug) {
          const matchingPrep = preparatorios.find(p => p.preparatorio?.slug === prepSlug);
          if (matchingPrep) {
            selectedPrep = matchingPrep;
          }
        }

        // Carregar rodadas
        const rodadasComProgresso = await getRodadasComProgresso(
          user.id,
          selectedPrep.preparatorio_id
        );
        const roundsData = rodadasToTrailRounds(rodadasComProgresso);
        setRounds(roundsData);

        // Sincronizar viewingRoundIndex com a URL
        if (roundNum && roundsData.length > 0) {
          const roundIndex = roundsData.findIndex(r => r.round_number === parseInt(roundNum, 10));
          if (roundIndex >= 0) {
            setViewingRoundIndex(roundIndex);
          }
        }

        // Atualizar dados do preparatório
        setPreparatorio(selectedPrep.preparatorio);
        setCurrentTrail({
          id: selectedPrep.id,
          user_id: selectedPrep.user_id,
          preparatorio_id: selectedPrep.preparatorio_id,
          nivel_usuario: selectedPrep.nivel_usuario,
          current_round: selectedPrep.current_round,
          created_at: selectedPrep.created_at,
        });

        setIsDataLoaded(true);
      } catch (err) {
        console.error('[MissionPage] Erro ao carregar dados:', err);
        setIsDataLoaded(true);
      } finally {
        setStoreLoading(false);
      }
    }

    loadDataIfNeeded();
  }, [user?.id, rounds.length, prepSlug]);

  // Sincronizar viewingRoundIndex com a URL quando os rounds estão carregados
  useEffect(() => {
    if (roundNum && rounds.length > 0) {
      const targetRoundNum = parseInt(roundNum, 10);
      const roundIndex = rounds.findIndex(r => r.round_number === targetRoundNum);
      if (roundIndex >= 0 && roundIndex !== viewingRoundIndex) {
        setViewingRoundIndex(roundIndex);
      }
    }
  }, [roundNum, rounds, viewingRoundIndex, setViewingRoundIndex]);

  // Resolve mission ID from URL params (supports both old and new URL formats)
  // Depende de 'rounds' para recalcular quando os dados são carregados (acesso direto)
  const resolvedMissionId = useMemo(() => {
    console.log('[MissionPage] Resolving mission ID:', {
      missionId,
      prepSlug,
      roundNum,
      missionNum,
      roundsLength: rounds.length,
      userPreparatoriosLength: userPreparatorios.length,
    });

    // Old format: /missao/:missionId
    if (missionId) return missionId;

    // New format: /trilha/:prepSlug/r/:roundNum/m/:missionNum
    if (prepSlug && roundNum && missionNum && rounds.length > 0) {
      const mission = getMissionByUrlParams({
        prepSlug,
        roundNum: parseInt(roundNum, 10),
        missionNum: parseInt(missionNum, 10),
      });
      console.log('[MissionPage] getMissionByUrlParams result:', mission?.id);
      return mission?.id || null;
    }

    return null;
  }, [missionId, prepSlug, roundNum, missionNum, getMissionByUrlParams, rounds, userPreparatorios]);

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
    // Só bloquear se a missão está trancada
    if (mission.status === 'locked') return;
    if (mission.id === resolvedMissionId) return; // Já estamos aqui

    // Permitir navegação para missões disponíveis, em progresso, completadas ou em massificação
    setSelectedMissionId(mission.id);
    const url = getMissionUrl(mission);
    navigate(url);
  };

  // Local state for this page
  const [phase, setPhase] = useState<'content' | 'questions' | 'result' | 'massification'>('content');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(new Map());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isCreatingMassificacao, setIsCreatingMassificacao] = useState(false);
  const [massificacaoId, setMassificacaoId] = useState<string | null>(null);
  const [selectedStudyMode, setSelectedStudyMode] = useState<'zen' | 'hard'>('zen');
  const [isRestoringProgress, setIsRestoringProgress] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  // Function to check if a mission has saved progress (for TrailMap)
  const checkMissionProgress = useCallback(async (missionId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const progress = await getMissionProgress(user.id, missionId);
      return progress !== null && Object.keys(progress.answers || {}).length > 0;
    } catch {
      return false;
    }
  }, [user?.id]);

  // Content generation state
  const [missaoConteudo, setMissaoConteudo] = useState<MissaoConteudo | null>(null);
  const [conteudoEfetivo, setConteudoEfetivo] = useState<ConteudoEfetivo | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true); // Loading existing content from DB
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentStatus, setContentStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');

  // Get current trail mode from preparatorio
  const currentTrailMode: StudyMode = useMemo(() => {
    const prep = getSelectedPreparatorio();
    return prep?.current_mode ?? 'normal';
  }, [getSelectedPreparatorio, userPreparatorios]);

  // Retrieve current mission info for display (moved up to be available earlier)
  const currentMission = useMemo(() => {
    return allMissions.find(m => m.id === resolvedMissionId);
  }, [allMissions, resolvedMissionId]);

  // Verificar se a missão atual é uma massificação
  const isMissaoMassificacao = currentMission ? isMassificacao(currentMission) : false;
  const tentativaMassificacao = currentMission?.tentativa_massificacao || 0;

  // Reset state when mission changes
  React.useEffect(() => {
    // Read tab parameter from URL to set initial phase
    const tabParam = searchParams.get('tab');

    // Set phase based on tab parameter, or default to content
    if (tabParam === 'questoes') {
      setPhase('questions');
    } else if (tabParam === 'teoria') {
      setPhase('content');
    } else {
      setPhase('content');
    }

    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setShowCelebration(false);
    setShowMentorChat(false);
    setMissaoConteudo(null);
    setConteudoEfetivo(null);
    setIsLoadingContent(true);
    setIsGeneratingContent(false);
    setContentStatus('idle');
    setSelectedStudyMode('zen');

    // Only clear search params if there's no tab parameter
    if (!tabParam) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMissionId]); // Removido setSearchParams para evitar loop

  // Update URL when phase changes to questions
  React.useEffect(() => {
    if (phase === 'questions') {
      setSearchParams({ fase: 'questoes' }, { replace: true });
    }
    // Não remove o param quando não está em questions - isso evita o loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // Removido setSearchParams para evitar loop

  // Load or generate content for the mission
  useEffect(() => {
    async function loadOrGenerateContent() {
      if (!resolvedMissionId || !user?.id) {
        setIsLoadingContent(false);
        return;
      }

      console.log('[MissionPage] Verificando conteudo para missao:', resolvedMissionId);
      setIsLoadingContent(true);

      try {
        // SEMPRE disparar pré-geração da missão N+2 em background (silencioso)
        // Exemplo: Aluno na missão 1 → gera missão 3 | Aluno na missão 2 → gera missão 4
        fetch(`${MASTRA_SERVER_URL}/api/missao/trigger-proxima`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missao_id: resolvedMissionId }),
        }).catch(() => {
          // Silencioso - ignora erros
        });

        // 1. Check if content already exists
        const existingContent = await getMissaoConteudo(resolvedMissionId);

        if (existingContent) {
          console.log('[MissionPage] Conteudo encontrado:', existingContent.status, 'audio:', !!existingContent.audio_url, 'mode:', currentTrailMode);
          setMissaoConteudo(existingContent);
          setContentStatus(existingContent.status as 'generating' | 'completed' | 'failed');

          // Get effective content based on mode
          const efetivo = await getConteudoEfetivo(resolvedMissionId, currentTrailMode);
          if (efetivo) {
            setConteudoEfetivo(efetivo);
            console.log('[MissionPage] Conteudo efetivo:', efetivo.isRetaFinal ? 'Reta Final' : 'Normal');
          }

          setIsLoadingContent(false);

          // If still generating, poll for updates
          if (existingContent.status === 'generating') {
            const pollInterval = setInterval(async () => {
              const updated = await getMissaoConteudo(resolvedMissionId);
              if (updated && updated.status !== 'generating') {
                setMissaoConteudo(updated);
                setContentStatus(updated.status as 'completed' | 'failed');
                clearInterval(pollInterval);
              }
            }, 3000);

            // Cleanup on unmount
            return () => clearInterval(pollInterval);
          }

          // If completed but no audio, poll for audio updates (regeneration in background)
          if (existingContent.status === 'completed' && !existingContent.audio_url && existingContent.texto_content) {
            console.log('[MissionPage] Conteúdo sem áudio, polling para atualização...');
            let pollCount = 0;
            const maxPolls = 60; // Max 3 minutes (60 * 3s)

            const audioPollInterval = setInterval(async () => {
              pollCount++;
              const updated = await getMissaoConteudo(resolvedMissionId);

              if (updated?.audio_url) {
                console.log('[MissionPage] Áudio disponível:', updated.audio_url);
                setMissaoConteudo(updated);
                clearInterval(audioPollInterval);
              } else if (pollCount >= maxPolls) {
                console.log('[MissionPage] Timeout aguardando áudio');
                clearInterval(audioPollInterval);
              }
            }, 3000);

            // Cleanup on unmount
            return () => clearInterval(audioPollInterval);
          }
          return;
        }

        // 2. No content exists - double check before generating
        console.log('[MissionPage] Conteudo nao encontrado, verificando novamente...');

        // Espera breve e verifica novamente para evitar race conditions
        await new Promise(resolve => setTimeout(resolve, 500));
        const doubleCheck = await getMissaoConteudo(resolvedMissionId);

        if (doubleCheck) {
          console.log('[MissionPage] Conteudo encontrado na segunda verificacao:', doubleCheck.status);
          setMissaoConteudo(doubleCheck);
          setContentStatus(doubleCheck.status as 'generating' | 'completed' | 'failed');
          setIsLoadingContent(false);
          return;
        }

        // Confirmado: conteúdo realmente não existe, iniciar geração
        console.log('[MissionPage] Iniciando geracao de conteudo...');
        setIsLoadingContent(false);
        setIsGeneratingContent(true);
        setContentStatus('generating');

        // Get questions count from preparatorio
        const preparatorio = getSelectedPreparatorio();
        const questoesPorMissao = preparatorio?.questoes_por_missao || 20;

        const generatedContent = await gerarConteudoMissao({
          missaoId: resolvedMissionId,
          userId: user.id,
          questoesPorMissao,
        });

        if (generatedContent) {
          console.log('[MissionPage] Conteudo gerado com sucesso!');
          setMissaoConteudo(generatedContent);
          setContentStatus(generatedContent.status as 'completed' | 'failed');
        } else {
          console.error('[MissionPage] Falha na geracao de conteudo');
          setContentStatus('failed');
        }
      } catch (error) {
        console.error('[MissionPage] Erro ao carregar/gerar conteudo:', error);
        setContentStatus('failed');
        setIsLoadingContent(false);
      } finally {
        setIsGeneratingContent(false);
      }
    }

    loadOrGenerateContent();
  }, [resolvedMissionId, user?.id, getSelectedPreparatorio, currentTrailMode]);

  // Load questions for this mission (with progress restoration)
  useEffect(() => {
    async function loadQuestions() {
      if (!resolvedMissionId) {
        setQuestions(DEMO_QUESTIONS);
        setIsLoadingQuestions(false);
        return;
      }

      setIsLoadingQuestions(true);
      setIsRestoringProgress(false);

      try {
        // Obter quantidade de questões do preparatório selecionado
        const preparatorio = getSelectedPreparatorio();
        const questoesPorMissao = preparatorio?.questoes_por_missao || 20;

        // Verificar e consumir bateria se necessario (apenas uma vez por missao)
        const actualPreparatorioId = preparatorio?.preparatorio_id;
        if (user?.id && actualPreparatorioId && !batteryConsumedMissions.current.has(resolvedMissionId)) {
          const batteryResult = await consumeBattery(
            user.id,
            actualPreparatorioId,
            'mission_start',
            { mission_id: resolvedMissionId }
          );

          if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
            console.log('[MissionPage] Bateria insuficiente');
            setIsLoadingQuestions(false);
            return; // Modal sera aberto automaticamente pelo store
          }

          // Marcar esta missao como ja cobrada
          batteryConsumedMissions.current.add(resolvedMissionId);
        }

        // 1. Carregar questões FIXAS da missão (mesmas para todos os usuários)
        console.log('[MissionPage] Carregando questões fixas para missão:', resolvedMissionId);
        const fixedQuestions = await getQuestoesFixasDaMissao(resolvedMissionId, questoesPorMissao, currentTrailMode);

        if (fixedQuestions.length === 0) {
          console.warn('[MissionPage] Nenhuma questão encontrada, usando demo');
          setQuestions(DEMO_QUESTIONS);
          addToast('info', 'Usando questões de demonstração');
        } else {
          console.log('[MissionPage] Questões fixas carregadas:', fixedQuestions.length);
          setQuestions(fixedQuestions);

          // 2. Verificar se há progresso salvo (respostas do usuário)
          if (user?.id) {
            const savedProgress = await getMissionProgress(user.id, resolvedMissionId);

            if (savedProgress && Object.keys(savedProgress.answers || {}).length > 0) {
              console.log('[MissionPage] Progresso encontrado! Restaurando respostas...', {
                answersCount: Object.keys(savedProgress.answers).length,
                currentIndex: savedProgress.currentQuestionIndex,
              });
              setIsRestoringProgress(true);
              setHasRestoredProgress(true);

              // Restaurar respostas
              const restoredAnswers = new Map<number, { letter: string; correct: boolean }>();
              Object.entries(savedProgress.answers).forEach(([questionId, answer]) => {
                restoredAnswers.set(Number(questionId), answer);
              });
              setAnswers(restoredAnswers);

              // Calcular a próxima questão não respondida para quando o usuário clicar em Praticar
              const nextUnansweredIndex = fixedQuestions.findIndex(
                q => !savedProgress.answers[q.id]
              );
              const targetIndex = nextUnansweredIndex >= 0
                ? nextUnansweredIndex
                : Math.min(savedProgress.currentQuestionIndex, fixedQuestions.length - 1);
              setCurrentQuestionIndex(targetIndex);

              // Restaurar modo de estudo salvo
              if (savedProgress.studyMode) {
                setSelectedStudyMode(savedProgress.studyMode);
                console.log('[MissionPage] Modo de estudo restaurado:', savedProgress.studyMode);
              }

              // NÃO ir automaticamente para questões!
              // Usuário verá o botão flutuante "Praticar Questões" para pular para questões
              console.log('[MissionPage] Progresso restaurado. Botão flutuante visível.');
            }
          }
        }
      } catch (error) {
        console.error('[MissionPage] Erro ao carregar questoes:', error);
        setQuestions(DEMO_QUESTIONS);
        addToast('error', 'Erro ao carregar questões');
      } finally {
        setIsLoadingQuestions(false);
        setIsRestoringProgress(false);
      }
    }

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMissionId, getSelectedPreparatorio, currentTrailMode, user?.id, selectedPreparatorioId]);

  const currentQuestion = questions[currentQuestionIndex];

  // Scroll to top when question changes
  useEffect(() => {
    if (phase === 'questions' && questions.length > 0) {
      // Scroll do container interno (não da window)
      if (questionsContainerRef.current) {
        questionsContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  }, [currentQuestionIndex, phase, questions.length]);

  // Salvar progresso pendente ao sair da página (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Flush qualquer progresso pendente antes de sair
      flushPendingSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Também flush ao desmontar o componente
      flushPendingSave();
      // Reset tutor state on unmount
      setTutorOpen(false);
    };
  }, [setTutorOpen]);

  // Sync showMentorChat with global tutor state (for MobileNav visibility)
  useEffect(() => {
    setTutorOpen(showMentorChat);
  }, [showMentorChat, setTutorOpen]);

  // Handler quando o usuário responde
  const handleAnswer = async (letter: string, clickX?: number, clickY?: number) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = letter === question.gabarito;

    // Consumir bateria por responder a questão
    const prep = getSelectedPreparatorio();
    if (user?.id && prep?.preparatorio_id) {
      const batteryResult = await consumeBattery(
        user.id,
        prep.preparatorio_id,
        'question',
        { question_id: question.id.toString(), clickX, clickY }
      );

      if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
        console.log('[MissionPage] Bateria insuficiente para responder questão');
        return; // Modal será aberto automaticamente pelo store
      }
    }

    // Atualizar respostas localmente
    const newAnswers = new Map(answers);
    newAnswers.set(question.id, { letter, correct: isCorrect });
    setAnswers(newAnswers);

    // Salvar progresso no banco IMEDIATAMENTE (sem debounce - crítico)
    if (user?.id && resolvedMissionId) {
      const answersRecord: Record<number, { letter: string; correct: boolean }> = {};
      newAnswers.forEach((value, key) => {
        answersRecord[key] = value;
      });

      console.log('[MissionPage] handleAnswer - Salvando progresso:', {
        userId: user.id,
        missionId: resolvedMissionId,
        answersCount: Object.keys(answersRecord).length,
        currentIndex: currentQuestionIndex,
      });

      // Usar save imediato para garantir que a resposta seja salva
      // Não precisa enviar questoesIds - questões são fixas por missão
      saveMissionProgressImmediate(user.id, {
        missionId: resolvedMissionId,
        answers: answersRecord,
        currentQuestionIndex: currentQuestionIndex,
        status: 'in_progress',
        studyMode: selectedStudyMode,
      }).then(result => {
        if (result.success) {
          console.log('[MissionPage] Progresso salvo com sucesso!');
        } else {
          console.error('[MissionPage] Erro ao salvar progresso:', result.error);
        }
      }).catch(err => {
        console.error('[MissionPage] Exceção ao salvar progresso:', err);
      });
    } else {
      console.warn('[MissionPage] handleAnswer - Não salvando (userId ou missionId ausente):', {
        userId: user?.id,
        missionId: resolvedMissionId,
      });
    }

    // Scroll é gerenciado pelo QuestionCard (navigationButtonsRef)

    // Save answer to database for statistics
    saveUserAnswer({
      questionId: question.id,
      selectedAlternative: letter,
      isCorrect: isCorrect,
    }, user?.id);

    // Dar XP e moedas POR RESPOSTA CORRETA (não apenas no final da missão)
    // Só dá recompensa se NÃO for missão de massificação
    if (isCorrect && !isMissaoMassificacao) {
      const isHardMode = selectedStudyMode === 'hard';
      const xpReward = await calculateXpReward(isHardMode ? 'correct_hard_mode' : 'correct_answer');
      const coinsReward = await calculateCoinsReward(isHardMode ? 'correct_hard_mode' : 'correct_answer');

      console.log(`[MissionPage] Resposta correta! XP: +${xpReward}, Coins: +${coinsReward}`);

      incrementStats({
        xp: xpReward,
        coins: coinsReward,
        correctAnswers: 1,
        totalAnswered: 1,
      });
    } else if (!isCorrect) {
      // Resposta errada - só contabiliza a resposta, sem recompensa
      incrementStats({
        xp: 0,
        coins: 0,
        correctAnswers: 0,
        totalAnswered: 1,
      });
    }
  };

  // Handler para rating de dificuldade
  const handleRateDifficulty = (difficulty: DifficultyRating) => {
    const question = questions[currentQuestionIndex];
    if (user?.id) {
      saveDifficultyRating(question.id, difficulty, user.id);
    }
  };

  // Handler para voltar para questão anterior
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handler para navegar para uma questão específica (via QuestionNavigator)
  const handleNavigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Handler para próxima questão ou finalizar
  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calcular score
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;

      if (score >= PASSING_SCORE) {
        setShowCelebration(true);

        // XP e moedas já foram dados POR RESPOSTA no handleAnswer
        // Aqui só precisamos completar a missão e mostrar celebração
        console.log(`[MissionPage] Mission completed! Score: ${score.toFixed(1)}% (${correctCount}/${questions.length})`);

        // Se for massificação, completar o desbloqueio
        if (isMissaoMassificacao && resolvedMissionId && user?.id) {
          await completarMassificacao(user.id, resolvedMissionId, score);
        }

        setTimeout(() => {
          setShowCelebration(false);
          setPhase('result');
        }, 2000);
      } else {
        // Score abaixo de PASSING_SCORE - precisa de massificação
        setPhase('massification');
      }
    }
  };

  const handleRetry = async () => {
    if (!currentMission || !user?.id || !resolvedMissionId) {
      // Fallback para refazer localmente se não tiver dados
      setPhase('content');
      setCurrentQuestionIndex(0);
      setAnswers(new Map());
      return;
    }

    setIsCreatingMassificacao(true);

    try {
      // Calcular score atual
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;

      // Coletar IDs das questões atuais
      const questoesIds = questions.map(q => String(q.id));

      // Marcar missão como precisando de massificação
      const sucesso = await marcarNeedsMassificacao(
        user.id,
        resolvedMissionId,
        score,
        questoesIds
      );

      if (sucesso) {
        addToast('info', 'Você precisa refazer esta missão. Vamos lá!');
        // Limpar rounds para forçar reload da trilha com novo status
        setRounds([]);
        // Voltar para a trilha - o node vermelho aparecerá
        navigate('/');
      } else {
        // Fallback: refazer localmente se falhar
        addToast('error', 'Erro ao salvar. Refazendo localmente...');
        setPhase('content');
        setCurrentQuestionIndex(0);
        setAnswers(new Map());
      }
    } catch (error) {
      console.error('[MissionPage] Erro ao marcar massificação:', error);
      addToast('error', 'Erro ao salvar progresso');
      setPhase('content');
      setCurrentQuestionIndex(0);
      setAnswers(new Map());
    } finally {
      setIsCreatingMassificacao(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContinue = async () => {
    if (resolvedMissionId && user?.id) {
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;

      // Salvar no banco de dados ANTES de atualizar o store local
      // Isso garante que quando o HomePage carregar, os dados estarão atualizados
      try {
        const success = await updateMissaoProgress(user.id, resolvedMissionId, 'completed', score);
        if (!success) {
          console.error('[MissionPage] Falha ao salvar progresso no banco');
        }

        // Limpar progresso salvo (marcar como completed)
        await clearMissionProgress(user.id, resolvedMissionId, 'completed', score);
      } catch (err) {
        console.error('[MissionPage] Erro ao salvar progresso:', err);
      }

      // Atualizar store local (para animação e UI)
      completeMission(resolvedMissionId, score);
    }
    navigate('/');
    addToast('success', 'Missão concluída! Próxima missão desbloqueada.');
  };

  const handleShowToast = (message: string, type: 'success' | 'error' | 'info') => {
    addToast(type, message);
  };

  // Calcular score atual
  const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
  const currentScore = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  // Se os dados ainda estão sendo carregados (acesso direto à página), mostra skeleton
  // Também mostra skeleton se temos parâmetros de URL mas ainda não resolvemos o ID
  const isWaitingForData = !isDataLoaded || isStoreLoading ||
    (prepSlug && roundNum && missionNum && rounds.length === 0);

  if (isWaitingForData) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[var(--color-bg-main)] p-4">
        <ContentSkeleton />
      </div>
    );
  }

  // Se não conseguiu resolver o mission ID após carregar os dados, mostra erro
  if (!resolvedMissionId && isDataLoaded && rounds.length > 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[var(--color-bg-main)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Missão não encontrada</h2>
          <p className="text-[var(--color-text-muted)] mb-6">Não foi possível encontrar esta missão.</p>
          <Button onClick={() => navigate('/')}>Voltar para Trilha</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--color-bg-main)]">
      <div className={`flex flex-col min-w-0 relative transition-all duration-300 ${isMapExpanded ? 'xl:mr-[400px]' : 'xl:mr-[72px]'}`}>
        <div ref={questionsContainerRef} className="flex-1 relative overflow-y-auto px-0 md:px-4 py-4 md:py-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="w-full md:max-w-[900px] mx-auto flex flex-col min-h-full">
            {/* Celebration */}
            <SuccessCelebration isActive={showCelebration} />

            {/* Header - só aparece na fase de questões */}
            {phase === 'questions' && (
              <div className="px-4 py-2 bg-[var(--color-bg-main)]">
                {/* Badges de modo */}
                <div className="flex justify-center gap-2">
                  {/* Badge de Reta Final */}
                  {currentTrailMode === 'reta_final' && (
                    <span
                      className="text-xs px-3 py-1 rounded-full flex items-center gap-1 font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary}30 0%, ${RETA_FINAL_THEME.colors.accent}30 100%)`,
                        color: RETA_FINAL_THEME.colors.primary,
                        border: `1px solid ${RETA_FINAL_THEME.colors.primary}50`,
                      }}
                    >
                      <Flame size={12} />
                      RETA FINAL
                    </span>
                  )}
                  {/* Badge de massificação */}
                  {isMissaoMassificacao && (
                    <span className="bg-[#E74C3C]/20 text-[#E74C3C] text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <RefreshCw size={12} />
                      Massificação #{tentativaMassificacao}
                    </span>
                  )}
                </div>
                {/* Navegador de questões - só aparece no modo zen */}
                {questions.length > 0 && (
                  <QuestionNavigator
                    totalQuestions={questions.length}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    questionIds={questions.map(q => q.id)}
                    onNavigate={handleNavigateToQuestion}
                    studyMode={selectedStudyMode}
                  />
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Fase de conteúdo - ContentPhase já lida com loading internamente */}
                {phase === 'content' && (
                  <ContentPhase
                    key="content"
                    content={conteudoEfetivo ? {
                      title: currentMission?.assunto?.nome || 'Conteúdo Teórico',
                      texto_content: conteudoEfetivo.texto,
                      audio_url: conteudoEfetivo.audioUrl || undefined,
                    } : missaoConteudo ? {
                      title: currentMission?.assunto?.nome || 'Conteúdo Teórico',
                      texto_content: missaoConteudo.texto_content,
                      audio_url: missaoConteudo.audio_url || undefined,
                    } : {
                      title: currentMission?.assunto?.nome || 'Conteúdo Teórico',
                      texto_content: undefined,
                    }}
                    isLoading={isLoadingContent || isLoadingQuestions}
                    isGenerating={isGeneratingContent}
                    generationStatus={contentStatus}
                    onContinue={(mode) => {
                      setSelectedStudyMode(mode);
                      setPhase('questions');
                    }}
                    onBack={() => navigate('/')}
                    isRetaFinal={conteudoEfetivo?.isRetaFinal || currentTrailMode === 'reta_final'}
                    mission={currentMission}
                  />
                )}

                {phase === 'questions' && isLoadingQuestions && (
                  <QuestionsSkeleton key="questions-loading" />
                )}

                {phase === 'questions' && !isLoadingQuestions && questions.length === 0 && (
                  <motion.div
                    key="no-questions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      Sem questões disponíveis
                    </h2>
                    <p className="text-[#A0A0A0] mb-6 max-w-xs">
                      Não foram encontradas questões para esta missão. Tente novamente mais tarde.
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Voltar para Trilha
                    </Button>
                  </motion.div>
                )}

                {phase === 'questions' && !isLoadingQuestions && questions.length > 0 && currentQuestion && (
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
                      onPrevious={currentQuestionIndex > 0 ? handlePrevious : undefined}
                      onOpenTutor={() => setShowMentorChat(true)}
                      onAnswer={handleAnswer}
                      onRateDifficulty={handleRateDifficulty}
                      studyMode={selectedStudyMode}
                      userId={user?.id}
                      userRole={userProfile?.role}
                      showCorrectAnswers={userProfile?.show_answers || false}
                      onShowToast={handleShowToast}
                      previousAnswer={answers.get(currentQuestion.id) || null}
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
                    isMassificacao={isMissaoMassificacao}
                    onContinue={handleContinue}
                  />
                )}

                {phase === 'massification' && (
                  <MassificationPhase
                    key="massification"
                    score={currentScore}
                    tentativa={tentativaMassificacao}
                    isCreating={isCreatingMassificacao}
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
                text: `QUESTÃO:\n${currentQuestion.enunciado}\n\nALTERNATIVAS:\n${currentQuestion.parsedAlternativas?.map(a => `${a.letter}) ${a.text}`).join('\n') || ''}\n\nGABARITO: ${currentQuestion.gabarito}\n\nCOMENTÁRIO:\n${currentQuestion.comentario || 'Sem comentário disponível'}`,
                question: currentQuestion
              }
              : {
                // Extrair título: assunto pode ser objeto (TrailMission) ou string (Missao)
                // Usamos 'as any' porque a missão pode ter campos extras vindos de _missaoOriginal
                title: (typeof currentMission?.assunto === 'string' ? currentMission?.assunto : currentMission?.assunto?.nome)
                  || (currentMission as any)?.tema
                  || (typeof currentMission?.materia === 'string' ? currentMission?.materia : currentMission?.materia?.materia)
                  || 'Aula',
                text: missaoConteudo?.texto_content || `Conteúdo sobre ${(typeof currentMission?.assunto === 'string' ? currentMission?.assunto : currentMission?.assunto?.nome) || (currentMission as any)?.tema || 'o tema'}`
              }
          }
          userContext={{
            name: user?.user_metadata?.name,
            level: stats.level,
            xp: stats.xp,
            streak: stats.streak
          }}
          userId={user?.id}
          preparatorioId={getSelectedPreparatorio()?.preparatorio_id}
          checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes}
        />
      </div>

      {/* Right Column: Map Sidebar - Fixed positioning like left sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isMapExpanded ? 400 : 72, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="hidden xl:block fixed right-0 top-0 bottom-0 bg-[var(--color-bg-card)] border-l border-[var(--color-border)] z-40 shadow-2xl overflow-hidden"
      >
        {/* Toggle Button */}


        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Header - same height as main header (h-14 = 56px) */}
          <div
            className="sticky top-0 bg-[var(--color-bg-card)]/95 backdrop-blur-sm z-30 border-b border-[var(--color-border)] h-14 flex items-center px-3"
          >
            {isMapExpanded ? (
              <div className="flex items-center w-full">
                {/* Collapse button */}
                <button
                  onClick={() => setIsMapExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors flex-shrink-0"
                  title="Recolher trilha"
                >
                  <ChevronRight size={18} className="text-[var(--color-text-sec)]" />
                </button>
                {/* Round navigation - centered */}
                {/* Round navigation - centered */}
                <div className="flex-1 flex justify-center">
                  <RoundSelector
                    currentRoundIndex={sidebarViewingRoundIndex}
                    totalRounds={displayRounds.length}
                    onRoundChange={setSidebarViewingRoundIndex}
                  />
                </div>
                {/* Spacer to balance the collapse button */}
                <div className="w-[30px] flex-shrink-0" />
              </div>
            ) : (
              <button
                onClick={() => setIsMapExpanded(true)}
                className="w-full flex justify-center p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
                title="Expandir Trilha"
              >
                <ChevronLeft size={18} className="text-[var(--color-text-sec)]" />
              </button>
            )}
          </div>

          {/* Map Content - with top margin to account for sticky header (h-14 = 56px) */}
          <div className={isMapExpanded ? 'mt-14 pb-20' : 'mt-14 pb-20'}>
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
                    rounds={displayRounds}
                    onMissionClick={handleMissionClick}
                    userAvatar={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"}
                    viewingRoundIndex={sidebarViewingRoundIndex}
                    onViewingRoundChange={setSidebarViewingRoundIndex}
                    checkMissionProgress={checkMissionProgress}
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
                    rounds={displayRounds}
                    onMissionClick={handleMissionClick}
                    viewingRoundIndex={sidebarViewingRoundIndex}
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
        isChatVisible={showMentorChat}
      />

      {/* Floating Practice Button - appears only when user has progress */}
      <FloatingPracticeButton
        isVisible={phase === 'content' && !isLoadingContent && hasRestoredProgress}
        onClick={() => setPhase('questions')}
      />

      {/* Mentor Chat - controlled by FloatingChatButton */}

      {/* Battery Empty Modal */}
      <BatteryEmptyModal
        isOpen={isEmptyModalOpen}
        onClose={closeEmptyModal}
        checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes}
        price={getSelectedPreparatorio()?.preparatorio?.price_questoes}
        preparatorioNome={getSelectedPreparatorio()?.preparatorio?.nome}
      />

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={async () => {
          // Salvar progresso imediatamente antes de sair
          if (user?.id && resolvedMissionId && answers.size > 0) {
            const answersRecord: Record<number, { letter: string; correct: boolean }> = {};
            answers.forEach((value, key) => {
              answersRecord[key] = value;
            });

            await saveMissionProgressImmediate(user.id, {
              missionId: resolvedMissionId,
              odaId: '',
              questoesIds: questions.map(q => q.id),
              answers: answersRecord,
              currentQuestionIndex: currentQuestionIndex,
              status: 'in_progress',
              studyMode: selectedStudyMode,
            });
          }
          navigate('/');
        }}
        title="Sair da Missão?"
        message="Seu progresso será salvo. Quando voltar, você continuará de onde parou."
        confirmText="Sair e Salvar"
        cancelText="Continuar"
        variant="warning"
        icon="exit"
      />
    </div>
  );
}