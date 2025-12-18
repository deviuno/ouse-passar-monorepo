import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
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
  Sparkles
} from 'lucide-react';
import { useMissionStore, useTrailStore, useUserStore, useUIStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import { Button, Card, Progress, CircularProgress, SuccessCelebration, FadeIn, FloatingChatButton } from '../components/ui';
import { QuestionCard } from '../components/question';
import { ParsedQuestion, TrailMission, MissionStatus } from '../types';
import { TrailMap } from '../components/trail/TrailMap';
import { CompactTrailMap } from '../components/trail/CompactTrailMap';
import { MentorChat } from '../components/question/MentorChat';
import { XP_PER_CORRECT, COINS_PER_MISSION, PASSING_SCORE
} from '../constants';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
} from '../services/questionFeedbackService';
import {
  createMassificacao,
  isMassificacao,
  completarMassificacao,
  desbloquearProximaMissao,
} from '../services/massificacaoService';
import { getQuestoesParaMissao } from '../services/missaoQuestoesService';
import {
  getMissaoConteudo,
  gerarConteudoMissao,
  MissaoConteudo,
} from '../services/missaoConteudoService';

// URL do servidor Mastra para chamadas de background
const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_SERVER_URL || 'http://localhost:4000';

// Questions Loading Skeleton Component
function QuestionsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-4"
    >
      {/* Progress bar skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#2A2A2A] animate-pulse" />
        <div className="flex-1 h-3 bg-[#2A2A2A] rounded-full animate-pulse" />
        <div className="w-12 h-5 bg-[#2A2A2A] rounded animate-pulse" />
      </div>

      {/* Question card skeleton */}
      <div className="bg-[#252525] rounded-xl p-6 border border-[#3A3A3A] flex-1">
        {/* Question header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-24 bg-[#3A3A3A] rounded animate-pulse" />
          <div className="h-5 w-16 bg-[#3A3A3A] rounded animate-pulse" />
        </div>

        {/* Question text */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-[#3A3A3A] rounded animate-pulse w-full" />
          <div className="h-4 bg-[#3A3A3A] rounded animate-pulse w-11/12" />
          <div className="h-4 bg-[#3A3A3A] rounded animate-pulse w-4/5" />
        </div>

        {/* Options skeleton */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A]"
            >
              <div className="w-8 h-8 rounded-full bg-[#3A3A3A] animate-pulse flex-shrink-0" />
              <div className="flex-1 h-4 bg-[#3A3A3A] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Content Skeleton Component
function ContentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-4"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-[#2A2A2A] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-[#2A2A2A] rounded animate-pulse" />
        </div>
      </div>

      {/* Audio player skeleton */}
      <div className="bg-[#252525] rounded-xl p-4 mb-6 border border-[#3A3A3A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3A3A3A] animate-pulse" />
          <div className="flex-1">
            <div className="h-2 bg-[#3A3A3A] rounded-full animate-pulse" />
          </div>
          <div className="w-12 h-4 bg-[#3A3A3A] rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton - multiple paragraphs */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-11/12" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-4/5" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-10/12" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-3/4" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-5/6" />
        </div>
      </div>

      {/* Button skeleton */}
      <div className="mt-6 pt-4 border-t border-[#3A3A3A]">
        <div className="h-12 bg-[#3A3A3A] rounded-xl animate-pulse w-full" />
      </div>
    </motion.div>
  );
}

// Study Mode Selection Modal
function StudyModeModal({
  isOpen,
  onClose,
  onSelectMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'zen' | 'hard') => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Escolha o modo de estudo
          </h2>
          <p className="text-[#A0A0A0] text-sm text-center mb-6">
            Como voce quer praticar as questoes?
          </p>

          <div className="space-y-3">
            {/* Modo Zen */}
            <button
              onClick={() => onSelectMode('zen')}
              className="w-full p-4 bg-[#252525] hover:bg-[#2D2D2D] border border-[#3A3A3A] hover:border-[#4CAF50] rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4CAF50]/30 transition-colors">
                  <span className="text-2xl">🧘</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-[#4CAF50] transition-colors">
                    Modo Zen
                  </h3>
                  <p className="text-[#A0A0A0] text-sm mt-1">
                    Veja o gabarito e comentario apos cada questao. Ideal para aprender com calma.
                  </p>
                </div>
              </div>
            </button>

            {/* Modo Simulado (internamente 'hard') */}
            <button
              onClick={() => onSelectMode('hard')}
              className="w-full p-4 bg-[#252525] hover:bg-[#2D2D2D] border border-[#3A3A3A] hover:border-[#FFB800] rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFB800]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFB800]/30 transition-colors">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-[#FFB800] transition-colors">
                    Modo Simulado
                  </h3>
                  <p className="text-[#A0A0A0] text-sm mt-1">
                    Responda todas as questoes primeiro. Gabarito e comentarios so no final.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-[#6E6E6E] hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Content Phase Component
function ContentPhase({
  content,
  isLoading,
  isGenerating,
  generationStatus,
  onContinue,
  onBack,
}: {
  content: { texto_content?: string; audio_url?: string; title?: string } | null;
  isLoading: boolean;
  isGenerating: boolean;
  generationStatus: 'idle' | 'generating' | 'completed' | 'failed';
  onContinue: (mode: 'zen' | 'hard') => void;
  onBack: () => void;
}) {
  const [showModeModal, setShowModeModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
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
        <h2 className="text-xl font-bold text-white mb-2">
          Gerando conteudo personalizado...
        </h2>
        <p className="text-[#A0A0A0] mb-4 max-w-xs">
          Nossa IA esta preparando uma aula especial baseada nas questoes desta missao. Isso pode levar alguns segundos.
        </p>
        <div className="w-48 h-2 bg-[#3A3A3A] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FFB800]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 30, ease: 'linear' }}
          />
        </div>
        <p className="text-[#6E6E6E] text-xs mt-4">
          Voce e o primeiro a acessar esta missao!
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
        <h2 className="text-xl font-bold text-white mb-2">
          Ops! Algo deu errado
        </h2>
        <p className="text-[#A0A0A0] mb-6 max-w-xs">
          Nao foi possivel gerar o conteudo. Voce ainda pode praticar com as questoes!
        </p>
        <Button onClick={() => onContinue('zen')} rightIcon={<ChevronRight size={20} />}>
          Ir para as questoes
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
          className="fixed top-14 z-[100] bg-[#252525] border-b border-[#3A3A3A] py-2 px-4"
          style={{
            width: containerWidth,
            left: containerLeft,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-[#FFB800] hover:bg-[#E5A600] flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {isPlaying ? (
                <Pause size={16} className="text-black" />
              ) : (
                <Play size={16} className="text-black ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="h-1.5 bg-[#3A3A3A] rounded-full">
                <div
                  className="h-full rounded-full bg-[#FFB800] transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
            <span className="text-[#A0A0A0] text-xs flex-shrink-0 text-right">
              {formatTime(audioRef.current?.currentTime || 0)}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStickySpeedMenu(!showStickySpeedMenu);
                }}
                className="px-2 py-1 bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded text-xs font-bold text-[#FFB800] flex-shrink-0 transition-colors min-w-[40px]"
              >
                {playbackRate}x
              </button>
              {showStickySpeedMenu && (
                <div className="absolute top-full right-0 mt-1 bg-[#2D2D2D] border border-[#3A3A3A] rounded-lg shadow-xl overflow-hidden z-[110]">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeedSelect(speed);
                      }}
                      className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors whitespace-nowrap ${
                        playbackRate === speed
                          ? 'bg-[#FFB800] text-black'
                          : 'text-white hover:bg-[#3A3A3A]'
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
          <div>
            <h2 className="text-white font-semibold">{content?.title || 'Conteudo Teorico'}</h2>
            <p className="text-[#6E6E6E] text-sm">Leia com atencao antes de praticar</p>
          </div>
        </div>

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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                  audioLoading || audioError
                    ? 'bg-[#3A3A3A] cursor-not-allowed'
                    : 'bg-[#FFB800] hover:bg-[#E5A600]'
                }`}
              >
                {audioLoading ? (
                  <Loader2 size={20} className="text-[#A0A0A0] animate-spin" />
                ) : audioError ? (
                  <Volume2 size={20} className="text-[#E74C3C]" />
                ) : isPlaying ? (
                  <Pause size={20} className="text-black" />
                ) : (
                  <Play size={20} className="text-black ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-white text-sm">
                    {audioLoading ? 'Carregando audio...' : audioError ? 'Erro ao carregar' : 'Ouvir conteudo'}
                  </p>
                  {audioDuration > 0 && !audioError && (
                    <span className="text-[#6E6E6E] text-xs">
                      {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(audioDuration)}
                    </span>
                  )}
                </div>
                <div className="h-1 bg-[#3A3A3A] rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${audioError ? 'bg-[#E74C3C]' : 'bg-[#FFB800]'}`}
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
                    className="px-2 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded text-xs font-bold text-[#FFB800] flex-shrink-0 transition-colors min-w-[44px]"
                    title="Velocidade de reproducao"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-[#2D2D2D] border border-[#3A3A3A] rounded-lg shadow-xl overflow-hidden z-50">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeedSelect(speed);
                          }}
                          className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors whitespace-nowrap ${
                            playbackRate === speed
                              ? 'bg-[#FFB800] text-black'
                              : 'text-white hover:bg-[#3A3A3A]'
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

        {/* Text Content with Markdown */}
        <Card className="p-0 overflow-hidden">
          <div className="mission-content p-6">
            <ReactMarkdown>
              {content?.texto_content || 'Conteudo nao disponivel para esta missao.'}
            </ReactMarkdown>
          </div>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="p-4 border-t border-[#3A3A3A]">
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
              <p className="text-2xl font-bold text-[#FFB800]">+{COINS_PER_MISSION}</p>
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
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-6xl mb-6"
      >
        🔄
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Massificação Ativada!
      </h2>
      <p className="text-[#A0A0A0] mb-2">
        Seu score foi <span className="text-[#E74C3C] font-bold">{Math.round(score)}%</span>
      </p>
      {tentativa && tentativa > 1 && (
        <p className="text-[#FFB800] text-sm mb-2">
          Tentativa #{tentativa}
        </p>
      )}
      <p className="text-[#6E6E6E] text-sm mb-4 max-w-xs">
        Você precisará refazer <strong>todas</strong> as questões desta missão para fixar o conteúdo.
      </p>

      {/* Info box */}
      <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-4 mb-6 max-w-xs">
        <p className="text-[#A0A0A0] text-xs mb-2">
          📌 <strong>Regras da Massificação:</strong>
        </p>
        <ul className="text-[#6E6E6E] text-xs text-left space-y-1">
          <li>• Refaça todas as questões</li>
          <li>• Revise o conteúdo antes</li>
          <li>• Atinja pelo menos {PASSING_SCORE}% para continuar</li>
          <li>• Sem recompensas (XP/moedas)</li>
        </ul>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <Button
          size="lg"
          fullWidth
          onClick={onRetry}
          leftIcon={isCreating ? undefined : <RefreshCw size={20} />}
          disabled={isCreating}
        >
          {isCreating ? 'Preparando...' : 'Iniciar Massificação'}
        </Button>
        <Button
          size="lg"
          fullWidth
          variant="ghost"
          onClick={onGoHome}
          leftIcon={<Home size={20} />}
          disabled={isCreating}
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
  const { missionId, prepSlug, roundNum, missionNum } = useParams<{
    missionId?: string;
    prepSlug?: string;
    roundNum?: string;
    missionNum?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
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
  } = useTrailStore();

  // Resolve mission ID from URL params (supports both old and new URL formats)
  const resolvedMissionId = useMemo(() => {
    // Old format: /missao/:missionId
    if (missionId) return missionId;

    // New format: /trilha/:prepSlug/r/:roundNum/m/:missionNum
    if (prepSlug && roundNum && missionNum) {
      const mission = getMissionByUrlParams({
        prepSlug,
        roundNum: parseInt(roundNum, 10),
        missionNum: parseInt(missionNum, 10),
      });
      return mission?.id || null;
    }

    return null;
  }, [missionId, prepSlug, roundNum, missionNum, getMissionByUrlParams]);

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
    if (mission.id === resolvedMissionId) return; // Já estamos aqui

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
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isCreatingMassificacao, setIsCreatingMassificacao] = useState(false);
  const [massificacaoId, setMassificacaoId] = useState<string | null>(null);
  const [selectedStudyMode, setSelectedStudyMode] = useState<'zen' | 'hard'>('zen');

  // Content generation state
  const [missaoConteudo, setMissaoConteudo] = useState<MissaoConteudo | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true); // Loading existing content from DB
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentStatus, setContentStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');

  // Retrieve current mission info for display (moved up to be available earlier)
  const currentMission = useMemo(() => {
    return allMissions.find(m => m.id === resolvedMissionId);
  }, [allMissions, resolvedMissionId]);

  // Verificar se a missão atual é uma massificação
  const isMissaoMassificacao = currentMission ? isMassificacao(currentMission) : false;
  const tentativaMassificacao = currentMission?.tentativa_massificacao || 0;

  // Reset state when mission changes
  React.useEffect(() => {
    setPhase('content');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setShowCelebration(false);
    setShowMentorChat(false);
    setMissaoConteudo(null);
    setIsLoadingContent(true);
    setIsGeneratingContent(false);
    setContentStatus('idle');
    setSelectedStudyMode('zen');
    // Clear phase from URL
    setSearchParams({}, { replace: true });
  }, [resolvedMissionId, setSearchParams]);

  // Update URL when phase changes to questions
  React.useEffect(() => {
    if (phase === 'questions') {
      setSearchParams({ fase: 'questoes' }, { replace: true });
    } else {
      // Remove fase param when not in questions phase
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('fase');
      setSearchParams(newParams, { replace: true });
    }
  }, [phase, setSearchParams]);

  // Load or generate content for the mission
  useEffect(() => {
    async function loadOrGenerateContent() {
      if (!resolvedMissionId || !user?.id) return;

      console.log('[MissionPage] Verificando conteudo para missao:', resolvedMissionId);
      setIsLoadingContent(true);

      try {
        // 1. Check if content already exists
        const existingContent = await getMissaoConteudo(resolvedMissionId);

        if (existingContent) {
          console.log('[MissionPage] Conteudo encontrado:', existingContent.status);
          setMissaoConteudo(existingContent);
          setContentStatus(existingContent.status as 'generating' | 'completed' | 'failed');
          setIsLoadingContent(false);

          // Se o conteúdo já está pronto, disparar geração da próxima missão em background (silencioso)
          if (existingContent.status === 'completed') {
            // Fire-and-forget: não esperamos resposta nem mostramos erro
            fetch(`${MASTRA_SERVER_URL}/api/missao/trigger-proxima`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ missao_id: resolvedMissionId }),
            }).catch(() => {
              // Silencioso - ignora erros
            });
          }

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
          return;
        }

        // 2. No content exists - generate it
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
  }, [resolvedMissionId, user?.id, getSelectedPreparatorio]);

  // Load questions for this mission
  useEffect(() => {
    async function loadQuestions() {
      if (!resolvedMissionId) {
        setQuestions(DEMO_QUESTIONS);
        setIsLoadingQuestions(false);
        return;
      }

      setIsLoadingQuestions(true);
      try {
        // Obter quantidade de questões do preparatório selecionado
        const preparatorio = getSelectedPreparatorio();
        const questoesPorMissao = preparatorio?.questoes_por_missao || 20;

        console.log('[MissionPage] Carregando questoes para missao:', resolvedMissionId, '- Quantidade:', questoesPorMissao);
        const fetchedQuestions = await getQuestoesParaMissao(resolvedMissionId, questoesPorMissao);

        if (fetchedQuestions.length > 0) {
          console.log('[MissionPage] Questoes carregadas:', fetchedQuestions.length);
          setQuestions(fetchedQuestions);
        } else {
          console.warn('[MissionPage] Nenhuma questao encontrada, usando demo');
          setQuestions(DEMO_QUESTIONS);
          addToast('info', 'Usando questoes de demonstracao');
        }
      } catch (error) {
        console.error('[MissionPage] Erro ao carregar questoes:', error);
        setQuestions(DEMO_QUESTIONS);
        addToast('error', 'Erro ao carregar questoes');
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, [resolvedMissionId, getSelectedPreparatorio]);

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
  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calcular score
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;

      if (score >= PASSING_SCORE) {
        setShowCelebration(true);

        // Se for massificação, não dá recompensas
        if (!isMissaoMassificacao) {
          const xpEarned = correctCount * XP_PER_CORRECT;
          incrementStats({
            xp: xpEarned,
            coins: COINS_PER_MISSION,
            correctAnswers: correctCount,
            totalAnswered: questions.length,
          });
        } else {
          // Apenas registrar as respostas, sem XP/moedas
          incrementStats({
            xp: 0,
            coins: 0,
            correctAnswers: correctCount,
            totalAnswered: questions.length,
          });

          // Completar a massificação
          if (resolvedMissionId) {
            await completarMassificacao(resolvedMissionId, score);

            // Desbloquear próxima missão
            if (currentMission?.round_id) {
              await desbloquearProximaMissao(currentMission.round_id, currentMission.ordem);
            }
          }
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
    if (!currentMission || !user?.id) {
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

      // Criar missão de massificação
      const novaMissao = await createMassificacao(
        user.id,
        currentMission,
        score,
        questoesIds
      );

      if (novaMissao) {
        setMassificacaoId(novaMissao.id);
        addToast('info', `Massificação criada - Tentativa #${novaMissao.tentativa_massificacao}`);
        // Navegar para a nova missão de massificação
        navigate(`/missao/${novaMissao.id}`);
      } else {
        // Fallback: refazer localmente se falhar a criação
        addToast('error', 'Não foi possível criar massificação. Refazendo localmente...');
        setPhase('content');
        setCurrentQuestionIndex(0);
        setAnswers(new Map());
      }
    } catch (error) {
      console.error('[MissionPage] Erro ao criar massificação:', error);
      addToast('error', 'Erro ao criar massificação');
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

  const handleContinue = () => {
    if (resolvedMissionId) {
      const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
      const score = (correctCount / questions.length) * 100;
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

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#1A1A1A]">
      <div className={`flex flex-col min-w-0 relative transition-all duration-300 ${isMapExpanded ? 'xl:mr-[400px]' : 'xl:mr-[72px]'}`}>
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="w-full max-w-[800px] mx-auto flex flex-col min-h-full">
            {/* Celebration */}
            <SuccessCelebration isActive={showCelebration} />

            {/* Header - só aparece na fase de questões */}
            {phase === 'questions' && (
              <div className="p-4 border-b border-[#3A3A3A] bg-[#1A1A1A]">
                {/* Badge de massificação */}
                {isMissaoMassificacao && (
                  <div className="flex justify-center mb-2">
                    <span className="bg-[#E74C3C]/20 text-[#E74C3C] text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <RefreshCw size={12} />
                      Massificação #{tentativaMassificacao}
                    </span>
                  </div>
                )}
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
                {/* Fase de conteúdo - ContentPhase já lida com loading internamente */}
                {phase === 'content' && (
                  <ContentPhase
                    key="content"
                    content={missaoConteudo ? {
                      title: currentMission?.assunto?.nome || 'Conteudo Teorico',
                      texto_content: missaoConteudo.texto_content,
                      audio_url: missaoConteudo.audio_url || undefined,
                    } : {
                      title: currentMission?.assunto?.nome || 'Conteudo Teorico',
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
                  />
                )}

                {phase === 'questions' && questions.length === 0 && (
                  <motion.div
                    key="no-questions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      Sem questoes disponiveis
                    </h2>
                    <p className="text-[#A0A0A0] mb-6 max-w-xs">
                      Nao foram encontradas questoes para esta missao. Tente novamente mais tarde.
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Voltar para Trilha
                    </Button>
                  </motion.div>
                )}

                {phase === 'questions' && questions.length > 0 && currentQuestion && (
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
                      studyMode={selectedStudyMode}
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

      {/* Right Column: Map Sidebar - Fixed positioning like left sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isMapExpanded ? 400 : 72, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="hidden xl:block fixed right-0 top-0 bottom-0 bg-[#252525] border-l border-[#3A3A3A] z-40 shadow-2xl overflow-hidden"
      >
        {/* Toggle Button */}


        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Header - same height as main header (h-14 = 56px) */}
          <div
            className="sticky top-0 bg-[#252525]/95 backdrop-blur-sm z-30 border-b border-[#3A3A3A] h-14 flex items-center px-3"
          >
            {isMapExpanded ? (
              <div className="flex items-center w-full">
                {/* Collapse button */}
                <button
                  onClick={() => setIsMapExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors flex-shrink-0"
                  title="Recolher trilha"
                >
                  <ChevronRight size={18} className="text-[#A0A0A0]" />
                </button>
                {/* Round navigation - centered */}
                <div className="flex-1 flex items-center justify-center gap-1">
                  <button
                    onClick={() => {
                      if (viewingRoundIndex > 0) setViewingRoundIndex(viewingRoundIndex - 1);
                    }}
                    disabled={viewingRoundIndex === 0}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewingRoundIndex > 0
                        ? 'hover:bg-[#3A3A3A] text-[#A0A0A0]'
                        : 'text-[#3A3A3A] cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-white px-2 min-w-[80px] text-center">
                    Rodada {viewingRoundIndex + 1}
                  </span>
                  <button
                    onClick={() => {
                      if (viewingRoundIndex < displayRounds.length - 1) setViewingRoundIndex(viewingRoundIndex + 1);
                    }}
                    disabled={viewingRoundIndex >= displayRounds.length - 1}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewingRoundIndex < displayRounds.length - 1
                        ? 'hover:bg-[#3A3A3A] text-[#A0A0A0]'
                        : 'text-[#3A3A3A] cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Spacer to balance the collapse button */}
                <div className="w-[30px] flex-shrink-0" />
              </div>
            ) : (
              <button
                onClick={() => setIsMapExpanded(true)}
                className="w-full flex justify-center p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors"
                title="Expandir Trilha"
              >
                <ChevronLeft size={18} className="text-[#A0A0A0]" />
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
                    viewingRoundIndex={viewingRoundIndex}
                    onViewingRoundChange={setViewingRoundIndex}
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
                    viewingRoundIndex={viewingRoundIndex}
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
