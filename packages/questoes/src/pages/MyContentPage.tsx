import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Mic,
  FileText,
  Music,
  Play,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui';
import { AudioPlayer } from '../components/ui/AudioPlayer';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import { musicService, MusicTrack, AudioRequest } from '../services/musicService';

type TabId = 'podcasts' | 'resumos' | 'musicas';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'podcasts', label: 'Podcasts', icon: <Mic size={16} /> },
  { id: 'resumos', label: 'Resumos', icon: <FileText size={16} /> },
  { id: 'musicas', label: 'Músicas', icon: <Music size={16} /> },
];

export const MyContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabId>('podcasts');
  const [isLoading, setIsLoading] = useState(true);
  const [podcasts, setPodcasts] = useState<MusicTrack[]>([]);
  const [musics, setMusics] = useState<MusicTrack[]>([]);
  const [audioRequests, setAudioRequests] = useState<AudioRequest[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Load content on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const [favoritesData, requestsData] = await Promise.all([
          musicService.getFavorites(user.id),
          musicService.getUserAudioRequests(user.id),
        ]);

        // Separate podcasts and music from favorites
        setPodcasts(favoritesData.filter(t => t.is_podcast));
        setMusics(favoritesData.filter(t => !t.is_podcast));
        setAudioRequests(requestsData);
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

    return () => {
      clearHeaderOverride();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: AudioRequest['status']) => {
    const labels: Record<AudioRequest['status'], { text: string; color: string }> = {
      pending: { text: 'Pendente', color: 'text-yellow-500' },
      approved: { text: 'Aprovado', color: 'text-blue-500' },
      generating: { text: 'Gerando...', color: 'text-purple-500' },
      ready: { text: 'Pronto', color: 'text-green-500' },
      rejected: { text: 'Rejeitado', color: 'text-red-500' },
    };
    return labels[status];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-sec)]">Carregando seus conteúdos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center">
          <Sparkles size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
            Faça login para acessar
          </h2>
          <p className="text-[var(--color-text-sec)] mb-6">
            Você precisa estar logado para ver seus conteúdos.
          </p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'podcasts': {
        // Combine favorites podcasts with ready audio requests that are podcasts
        const readyPodcasts = audioRequests
          .filter(r => r.status === 'ready' && r.audio_type === 'podcast' && r.generated_track)
          .map(r => r.generated_track!);

        const allPodcasts = [...podcasts, ...readyPodcasts];

        if (allPodcasts.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Mic size={32} className="text-cyan-500" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">
                Nenhum podcast ainda
              </h3>
              <p className="text-[var(--color-text-sec)] text-sm mb-4">
                Gere podcasts ao tirar dúvidas nas questões ou solicite na área de músicas.
              </p>
              <Button
                onClick={() => navigate('/music/solicitar')}
                className="!bg-cyan-500 hover:!bg-cyan-600"
              >
                Solicitar Podcast
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {allPodcasts.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Mic size={24} className="text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--color-text-main)] truncate">
                      {track.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-sec)] mt-1">
                      {track.materia && <span>{track.materia}</span>}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(track.duration_seconds)}
                      </span>
                    </div>
                    {playingTrackId === track.id ? (
                      <div className="mt-3">
                        <AudioPlayer
                          src={track.audio_url}
                          type="podcast"
                                                  />
                      </div>
                    ) : (
                      <button
                        onClick={() => setPlayingTrackId(track.id)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium text-sm hover:bg-cyan-600 transition-colors"
                      >
                        <Play size={16} fill="currentColor" />
                        Ouvir
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );
      }

      case 'resumos': {
        // Show audio requests that generated summaries (for now, show pending/generating status)
        const summaryRequests = audioRequests.filter(r => r.audio_type === 'podcast');

        if (summaryRequests.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">
                Nenhum resumo ainda
              </h3>
              <p className="text-[var(--color-text-sec)] text-sm mb-4">
                Os resumos são gerados automaticamente quando você interage com o chat de dúvidas.
              </p>
              <Button
                onClick={() => navigate('/praticar?showFilters=true')}
                className="!bg-green-500 hover:!bg-green-600"
              >
                Praticar Questões
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {summaryRequests.map((request, index) => {
              const status = getStatusLabel(request.status);
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={24} className="text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--color-text-main)]">
                        {request.materia} - {request.assunto}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-sec)] mt-1">
                        <span className={`font-medium ${status.color}`}>{status.text}</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                      {request.additional_info && (
                        <p className="text-sm text-[var(--color-text-sec)] mt-2 line-clamp-2">
                          {request.additional_info}
                        </p>
                      )}
                      {request.status === 'ready' && request.generated_track && (
                        <div className="mt-3">
                          <AudioPlayer
                            src={request.generated_track.audio_url}
                            type="podcast"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      }

      case 'musicas': {
        // Combine favorites music with ready audio requests that are music
        const readyMusics = audioRequests
          .filter(r => r.status === 'ready' && r.audio_type === 'music' && r.generated_track)
          .map(r => r.generated_track!);

        const allMusics = [...musics, ...readyMusics];

        if (allMusics.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Music size={32} className="text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">
                Nenhuma música ainda
              </h3>
              <p className="text-[var(--color-text-sec)] text-sm mb-4">
                Explore a biblioteca de músicas ou solicite uma música personalizada.
              </p>
              <Button
                onClick={() => navigate('/music')}
                className="!bg-purple-500 hover:!bg-purple-600"
              >
                Ir para Músicas
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {allMusics.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music size={24} className="text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--color-text-main)] truncate">
                      {track.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-sec)] mt-1">
                      {track.artist && <span>{track.artist}</span>}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(track.duration_seconds)}
                      </span>
                    </div>
                    {playingTrackId === track.id ? (
                      <div className="mt-3">
                        <AudioPlayer
                          src={track.audio_url}
                          type="explanation"
                                                  />
                      </div>
                    ) : (
                      <button
                        onClick={() => setPlayingTrackId(track.id)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 transition-colors"
                      >
                        <Play size={16} fill="currentColor" />
                        Ouvir
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Count items per tab
  const readyPodcasts = audioRequests.filter(r => r.status === 'ready' && r.audio_type === 'podcast').length;
  const readyMusics = audioRequests.filter(r => r.status === 'ready' && r.audio_type === 'music').length;
  const summaryCount = audioRequests.filter(r => r.audio_type === 'podcast').length;

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-6 theme-transition">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            let count = 0;
            if (tab.id === 'podcasts') count = podcasts.length + readyPodcasts;
            if (tab.id === 'resumos') count = summaryCount;
            if (tab.id === 'musicas') count = musics.length + readyMusics;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-sec)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      activeTab === tab.id
                        ? 'bg-black/20 text-black'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-sec)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          {renderContent()}
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            Os conteúdos são gerados automaticamente quando você usa o chat de dúvidas ou solicita áudios
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyContentPage;
