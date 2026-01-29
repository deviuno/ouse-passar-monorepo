import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Loader2,
  Mic,
  FileText,
  Music,
  Play,
  Pause,
  Clock,
  Headphones,
  Trash2,
  X,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';
import { AudioPlayer } from '../components/ui/AudioPlayer';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import { userContentService, UserGeneratedContent, ContentType } from '../services/userContentService';
import { musicService, MusicTrack } from '../services/musicService';
import { fetchQuestionById } from '../services/questionsService';
import { ParsedQuestion } from '../types';

type TabId = 'audio_explanation' | 'podcast' | 'text_summary' | 'musicas';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'audio_explanation', label: 'Áudios', icon: <Headphones size={15} /> },
  { id: 'podcast', label: 'Podcasts', icon: <Mic size={15} /> },
  { id: 'text_summary', label: 'Resumos', icon: <FileText size={15} /> },
  { id: 'musicas', label: 'Músicas', icon: <Music size={15} /> },
];

type ModalTabId = 'content' | 'question';

// Content Detail Modal with Tabs
const ContentDetailModal: React.FC<{
  content: UserGeneratedContent | null;
  onClose: () => void;
  onNavigateToQuestion: (questionId: number) => void;
}> = ({ content, onClose, onNavigateToQuestion }) => {
  const [activeModalTab, setActiveModalTab] = useState<ModalTabId>('content');
  const [question, setQuestion] = useState<ParsedQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Fetch question when modal opens and has question_id
  useEffect(() => {
    if (!content?.question_id) {
      setQuestion(null);
      return;
    }

    const loadQuestion = async () => {
      setLoadingQuestion(true);
      try {
        const q = await fetchQuestionById(content.question_id!);
        setQuestion(q);
      } catch (error) {
        console.error('Erro ao carregar questão:', error);
      } finally {
        setLoadingQuestion(false);
      }
    };

    loadQuestion();
  }, [content?.question_id]);

  // Reset tab when content changes
  useEffect(() => {
    setActiveModalTab('content');
  }, [content?.id]);

  if (!content) return null;

  const hasQuestion = !!content.question_id;

  const renderContentTab = () => (
    <div className="p-5">
      {/* Audio Player */}
      {content.audio_url && (
        <div className="mb-5">
          <AudioPlayer
            src={content.audio_url}
            type={content.content_type === 'podcast' ? 'podcast' : 'explanation'}
          />
        </div>
      )}

      {/* Text Content */}
      {content.text_content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-[var(--color-text-sec)] text-sm leading-relaxed whitespace-pre-wrap">
            {content.text_content}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-text-muted)]">
          {content.duration_seconds && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {Math.floor(content.duration_seconds / 60)}:{(content.duration_seconds % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span>
            Criado em {new Date(content.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );

  const renderQuestionTab = () => {
    if (loadingQuestion) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
        </div>
      );
    }

    if (!question) {
      return (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Questão não encontrada
          </p>
        </div>
      );
    }

    return (
      <div className="p-5">
        {/* Question metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {question.materia && (
            <span className="px-2.5 py-1 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/30 rounded-md text-xs text-[var(--color-brand)] font-medium">
              {question.materia}
            </span>
          )}
          {question.assunto && (
            <span className="px-2.5 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-sec)]">
              {question.assunto}
            </span>
          )}
          {question.banca && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-sec)]">
              <Building2 size={12} />
              {question.banca}
            </span>
          )}
          {question.ano && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-sec)]">
              <Calendar size={12} />
              {question.ano}
            </span>
          )}
        </div>

        {/* Question text */}
        <div className="mb-5">
          <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--color-text-main)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {question.enunciado}
            </ReactMarkdown>
          </div>
        </div>

        {/* Alternatives */}
        {question.parsedAlternativas && question.parsedAlternativas.length > 0 && (
          <div className="space-y-2 mb-5">
            {question.parsedAlternativas.map((alt) => {
              const isCorrect = alt.letter === question.gabarito;
              return (
                <div
                  key={alt.letter}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isCorrect
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)]'
                  }`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-[var(--color-bg-main)] text-[var(--color-text-sec)] border border-[var(--color-border)]'
                  }`}>
                    {alt.letter}
                  </span>
                  <span className={`flex-1 text-sm pt-0.5 ${
                    isCorrect ? 'text-green-400' : 'text-[var(--color-text-sec)]'
                  }`}>
                    {alt.text}
                  </span>
                  {isCorrect && (
                    <CheckCircle2 size={18} className="flex-shrink-0 text-green-500 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Comment */}
        {question.comentario && (
          <div className="p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Comentário
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--color-text-sec)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.comentario}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* CTA to practice */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => onNavigateToQuestion(question.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand)] text-black font-medium text-sm rounded-lg hover:brightness-110 transition-all"
          >
            <Play size={16} fill="currentColor" />
            Praticar esta questão
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--color-border)]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1.5 font-medium uppercase tracking-wide">
                {content.content_type === 'audio_explanation' && <><Headphones size={12} /> Resumo em Áudio</>}
                {content.content_type === 'podcast' && <><Mic size={12} /> Podcast</>}
                {content.content_type === 'text_summary' && <><FileText size={12} /> Resumo em Texto</>}
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-main)] leading-tight">
                {content.title}
              </h2>
              {content.materia && (
                <p className="text-sm text-[var(--color-text-sec)] mt-1">
                  {content.materia}{content.assunto && ` · ${content.assunto}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs (only show if has question) */}
          {hasQuestion && (
            <div className="flex border-b border-[var(--color-border)]">
              <button
                onClick={() => setActiveModalTab('content')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeModalTab === 'content'
                    ? 'text-[var(--color-text-main)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-sec)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {content.content_type === 'audio_explanation' && <Headphones size={14} />}
                  {content.content_type === 'podcast' && <Mic size={14} />}
                  {content.content_type === 'text_summary' && <FileText size={14} />}
                  Conteúdo Gerado
                </span>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)] transition-opacity duration-150 ${
                    activeModalTab === 'content' ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
              <button
                onClick={() => setActiveModalTab('question')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeModalTab === 'question'
                    ? 'text-[var(--color-text-main)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-sec)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <BookOpen size={14} />
                  Questão Original
                </span>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)] transition-opacity duration-150 ${
                    activeModalTab === 'question' ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeModalTab === 'content' ? renderContentTab() : renderQuestionTab()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const MyContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabId>('audio_explanation');
  const [isLoading, setIsLoading] = useState(true);
  const [userContent, setUserContent] = useState<UserGeneratedContent[]>([]);
  const [musicFavorites, setMusicFavorites] = useState<MusicTrack[]>([]);
  const [counts, setCounts] = useState<Record<ContentType, number>>({
    audio_explanation: 0,
    podcast: 0,
    text_summary: 0,
    music: 0,
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<UserGeneratedContent | null>(null);

  // Load content on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const [contentData, countsData, favoritesData] = await Promise.all([
          userContentService.getAll(user.id),
          userContentService.countByType(user.id),
          musicService.getFavorites(user.id),
        ]);

        setUserContent(contentData);
        setCounts(countsData);
        setMusicFavorites(favoritesData.filter(t => !t.is_podcast));
      } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        addToast('error', 'Erro ao carregar conteúdos');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [user?.id]);

  // Set up header
  useEffect(() => {
    setHeaderOverride({
      title: 'Meus Conteúdos',
      showBackButton: true,
      backPath: '/questoes',
      hideIcon: true,
    });

    return () => clearHeaderOverride();
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user?.id) return;

    setDeletingId(id);
    try {
      await userContentService.delete(id, user.id);
      setUserContent(prev => prev.filter(c => c.id !== id));
      setCounts(prev => {
        const item = userContent.find(c => c.id === id);
        if (item) {
          return { ...prev, [item.content_type]: Math.max(0, prev[item.content_type] - 1) };
        }
        return prev;
      });
      addToast('success', 'Conteúdo removido');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      addToast('error', 'Erro ao remover conteúdo');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlayToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPlayingId(playingId === id ? null : id);
  };

  const handleNavigateToQuestion = (questionId: number) => {
    setSelectedContent(null);
    navigate(`/praticar?ids=${questionId}&start=true`);
  };

  const getTabCount = (tabId: TabId): number => {
    if (tabId === 'musicas') return musicFavorites.length;
    return counts[tabId as ContentType] || 0;
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0) + musicFavorites.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto mb-4">
            <BookOpen size={20} className="text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-text-main)] mb-2">
            Faça login para acessar
          </h2>
          <p className="text-sm text-[var(--color-text-sec)] mb-5">
            Seus conteúdos gerados por IA ficam salvos aqui.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2.5 bg-[var(--color-brand)] text-black font-medium text-sm rounded-lg hover:brightness-110 transition-all"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const renderEmptyState = (tabId: TabId) => {
    const messages: Record<TabId, { title: string; cta: string; path: string }> = {
      audio_explanation: {
        title: 'Nenhum áudio gerado ainda',
        cta: 'Gerar primeiro áudio',
        path: '/praticar?showFilters=true',
      },
      podcast: {
        title: 'Nenhum podcast gerado ainda',
        cta: 'Gerar primeiro podcast',
        path: '/praticar?showFilters=true',
      },
      text_summary: {
        title: 'Nenhum resumo gerado ainda',
        cta: 'Gerar primeiro resumo',
        path: '/praticar?showFilters=true',
      },
      musicas: {
        title: 'Nenhuma música salva',
        cta: 'Explorar músicas',
        path: '/music',
      },
    };

    const msg = messages[tabId];

    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{msg.title}</p>
        <button
          onClick={() => navigate(msg.path)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded-lg transition-colors"
        >
          {msg.cta}
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderContentItem = (item: UserGeneratedContent, index: number) => {
    const isPlaying = playingId === item.id;
    const isDeleting = deletingId === item.id;
    const hasAudio = !!item.audio_url;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        data-tour={index === 0 ? "tour-content-item" : undefined}
        onClick={() => setSelectedContent(item)}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
      >
        {/* Play/Type Icon */}
        {hasAudio ? (
          <button
            onClick={(e) => handlePlayToggle(e, item.id)}
            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-[var(--color-brand)] text-black'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-sec)] group-hover:bg-[var(--color-brand)]/20 group-hover:text-[var(--color-brand)]'
            }`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
        ) : (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-muted)]">
            <FileText size={18} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--color-text-main)] truncate">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-muted)]">
            {item.materia && <span className="truncate max-w-[120px]">{item.materia}</span>}
            {item.materia && item.duration_seconds && <span>·</span>}
            {item.duration_seconds && <span>{formatDuration(item.duration_seconds)}</span>}
          </div>
        </div>

        {/* Date & Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
            {formatRelativeDate(item.created_at)}
          </span>
          <button
            onClick={(e) => handleDelete(e, item.id)}
            disabled={isDeleting}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            title="Remover"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderMusicItem = (track: MusicTrack, index: number) => {
    const isPlaying = playingId === track.id;

    return (
      <motion.div
        key={track.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        {/* Cover/Play */}
        <button
          onClick={() => setPlayingId(isPlaying ? null : track.id)}
          className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden ${
            isPlaying ? 'ring-2 ring-[var(--color-brand)]' : ''
          }`}
        >
          {track.cover_url ? (
            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <Music size={16} className="text-[var(--color-text-muted)]" />
            </div>
          )}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {isPlaying ? <Pause size={16} className="text-white" fill="white" /> : <Play size={16} className="text-white ml-0.5" fill="white" />}
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--color-text-main)] truncate">
            {track.title}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] truncate">
            {track.artist || 'Ouse Passar'}
          </p>
        </div>

        {/* Duration */}
        <span className="text-xs text-[var(--color-text-muted)] tabular-nums flex-shrink-0">
          {formatDuration(track.duration_seconds)}
        </span>
      </motion.div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'musicas') {
      if (musicFavorites.length === 0) return renderEmptyState('musicas');
      return (
        <div className="divide-y divide-[var(--color-border)]">
          {musicFavorites.map((track, index) => renderMusicItem(track, index))}
        </div>
      );
    }

    const filteredContent = userContent.filter(c => c.content_type === activeTab);
    if (filteredContent.length === 0) return renderEmptyState(activeTab);

    return (
      <div className="divide-y divide-[var(--color-border)]">
        {filteredContent.map((item, index) => renderContentItem(item, index))}
      </div>
    );
  };

  // Inline audio player when playing
  const playingContent = playingId ? userContent.find(c => c.id === playingId) : null;
  const playingMusic = playingId ? musicFavorites.find(t => t.id === playingId) : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] theme-transition">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats Header */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-2xl font-semibold text-[var(--color-text-main)] tabular-nums">{totalCount}</span>
            <span className="text-sm text-[var(--color-text-muted)] ml-2">conteúdos salvos</span>
          </div>
        </div>

        {/* Tabs */}
        <div data-tour="tour-content-tabs" className="flex gap-1 p-1 mb-4 bg-[var(--color-bg-elevated)] rounded-lg">
          {TABS.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPlayingId(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-sm'
                    : 'text-[var(--color-text-sec)] hover:text-[var(--color-text-main)]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs tabular-nums ${
                    isActive ? 'bg-[var(--color-bg-elevated)]' : 'bg-[var(--color-bg-main)]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Now Playing Bar */}
        <AnimatePresence>
          {(playingContent || playingMusic) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center">
                    {playingContent?.content_type === 'podcast' ? (
                      <Mic size={14} className="text-[var(--color-brand)]" />
                    ) : playingMusic ? (
                      <Music size={14} className="text-[var(--color-brand)]" />
                    ) : (
                      <Headphones size={14} className="text-[var(--color-brand)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Reproduzindo</p>
                    <p className="text-sm font-medium text-[var(--color-text-main)] truncate">
                      {playingContent?.title || playingMusic?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setPlayingId(null)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
                <AudioPlayer
                  src={playingContent?.audio_url || playingMusic?.audio_url || ''}
                  type={playingContent?.content_type === 'podcast' ? 'podcast' : 'explanation'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content List */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer Hint */}
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Conteúdos são gerados ao usar o chat de dúvidas nas questões
        </p>
      </div>

      {/* Content Detail Modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onNavigateToQuestion={handleNavigateToQuestion}
        />
      )}

    </div>
  );
};

export default MyContentPage;
