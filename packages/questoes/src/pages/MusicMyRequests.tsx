import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Music,
  Mic,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  HourglassIcon,
  Sparkles,
  Play,
  Plus,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type AudioRequest, type MusicTrack } from '../services/musicService';

// Status labels e cores
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Aprovada',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  generating: {
    label: 'Gerando',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" />,
  },
  ready: {
    label: 'Pronto',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: 'Rejeitada',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getMusicStyleLabel = (value: string | null) => {
  const styles: Record<string, string> = {
    pop: 'Pop',
    rock: 'Rock',
    sertanejo: 'Sertanejo',
    funk: 'Funk Melody',
    pagode: 'Pagode',
    samba: 'Samba',
    forro: 'Forro',
    mpb: 'MPB',
    bossa_nova: 'Bossa Nova',
    axe: 'Axe',
    rap: 'Rap/Hip-Hop',
    trap: 'Trap',
    reggae: 'Reggae',
    gospel: 'Gospel',
    country: 'Country',
    folk: 'Folk',
    indie: 'Indie',
    electronic: 'Eletronica',
    house: 'House',
    jazz: 'Jazz',
    blues: 'Blues',
    classical: 'Classica',
  };
  return value ? styles[value] || value : '-';
};

export const MusicMyRequests: React.FC = () => {
  const { user } = useAuthStore();
  const { play, setQueue } = useMusicPlayerStore();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AudioRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready'>('all');

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await musicService.getUserAudioRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Erro ao carregar solicitacoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: MusicTrack) => {
    setQueue([track], 0);
    play(track);
  };

  // Filtrar solicitacoes
  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'approved', 'generating'].includes(req.status);
    if (filter === 'ready') return req.status === 'ready';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="p-6 md:p-8">
        <Link
          to="/music"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Minhas Solicitacoes</h1>
            <p className="text-gray-400 text-sm mt-1">
              Acompanhe o status das suas solicitacoes de audio
            </p>
          </div>
          <Link
            to="/music/solicitar"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full hover:bg-[#FFC933] hover:scale-105 transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Nova Solicitacao
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Todas ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'pending'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Em Andamento ({requests.filter((r) => ['pending', 'approved', 'generating'].includes(r.status)).length})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'ready'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Prontas ({requests.filter((r) => r.status === 'ready').length})
          </button>
        </div>
      </div>

      <div className="px-6 md:px-8">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-2xl border border-white/5">
            <HourglassIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">
              {filter === 'all'
                ? 'Voce ainda nao fez nenhuma solicitacao'
                : filter === 'pending'
                ? 'Nenhuma solicitacao em andamento'
                : 'Nenhuma solicitacao pronta'}
            </p>
            <Link
              to="/music/solicitar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFB800] text-black font-bold rounded-full hover:bg-[#FFC933] hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Fazer Solicitacao
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const isReady = request.status === 'ready' && request.generated_track;

              return (
                <div
                  key={request.id}
                  className={`bg-[#1a1a1a] border rounded-xl overflow-hidden transition-all hover:border-white/20 ${
                    isReady ? 'border-green-500/30' : 'border-white/5'
                  }`}
                >
                  {/* Card Content */}
                  <div className="p-4">
                    {/* Top Row: Type Icon + Title + Status */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Type Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          request.audio_type === 'music'
                            ? 'bg-gradient-to-br from-[#FFB800]/20 to-orange-500/20'
                            : 'bg-gradient-to-br from-purple-500/20 to-purple-900/20'
                        }`}
                      >
                        {request.audio_type === 'music' ? (
                          <Music className="w-5 h-5 text-[#FFB800]" />
                        ) : (
                          <Mic className="w-5 h-5 text-purple-400" />
                        )}
                      </div>

                      {/* Title & Assunto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base leading-tight truncate">
                          {request.materia}
                        </h3>
                        <p className="text-gray-400 text-sm truncate mt-0.5">
                          {request.assunto}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                      >
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        {request.audio_type === 'music' ? (
                          <Music className="w-3 h-3" />
                        ) : (
                          <Mic className="w-3 h-3" />
                        )}
                        {request.audio_type === 'music' ? 'Musica' : 'Podcast'}
                      </span>

                      {request.audio_type === 'music' && request.music_style && (
                        <span className="text-gray-400">
                          {getMusicStyleLabel(request.music_style)}
                        </span>
                      )}

                      {request.audio_type === 'podcast' && request.podcast_duration && (
                        <span>{request.podcast_duration} min</span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(request.created_at)}
                      </span>
                    </div>

                    {/* Additional Info */}
                    {request.additional_info && (
                      <p className="text-sm text-gray-500 italic bg-white/5 rounded-lg px-3 py-2 mb-3">
                        "{request.additional_info}"
                      </p>
                    )}

                    {/* Action Button for Ready items */}
                    {isReady && (
                      <button
                        onClick={() => handlePlayTrack(request.generated_track!)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-all hover:scale-[1.02]"
                      >
                        <Play className="w-5 h-5" fill="currentColor" />
                        Ouvir Agora
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicMyRequests;
