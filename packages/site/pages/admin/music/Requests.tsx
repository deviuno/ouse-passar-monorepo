import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Mic,
  Loader2,
  Search,
  Check,
  X,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Wand2,
} from 'lucide-react';
import {
  musicAdminService,
  type AudioRequest,
  type AudioRequestFilters,
} from '../../../services/musicAdminService';
import { useAuth } from '../../../hooks/useAuth';

// Status config
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pendente',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    icon: <Clock className="w-4 h-4" />,
  },
  approved: {
    label: 'Aprovada',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  generating: {
    label: 'Gerando',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    icon: <Sparkles className="w-4 h-4" />,
  },
  ready: {
    label: 'Pronto',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  rejected: {
    label: 'Rejeitada',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export const MusicRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AudioRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AudioRequestFilters>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [filters, page]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const result = await musicAdminService.getAudioRequests(filters, page, 20);
      setRequests(result.requests);
      setTotal(result.total);
    } catch (error) {
      console.error('Erro ao carregar solicitacoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;
    setProcessing(requestId);
    try {
      await musicAdminService.approveAudioRequest(requestId, user.id);
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar solicitacao:', error);
      alert('Erro ao aprovar solicitacao.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) return;
    const reason = prompt('Motivo da rejeicao (opcional):');
    setProcessing(requestId);
    try {
      await musicAdminService.rejectAudioRequest(requestId, user.id, reason || undefined);
      loadRequests();
    } catch (error) {
      console.error('Erro ao rejeitar solicitacao:', error);
      alert('Erro ao rejeitar solicitacao.');
    } finally {
      setProcessing(null);
    }
  };

  const handleGenerate = (request: AudioRequest) => {
    // Navigate to LyricsGenerator with pre-filled data
    const params = new URLSearchParams({
      fromRequest: request.id,
      audioType: request.audio_type,
      materia: request.materia,
      assunto: request.assunto,
    });

    if (request.music_style) {
      params.set('estilo', request.music_style);
    }
    if (request.podcast_duration) {
      params.set('duracao', String(request.podcast_duration));
    }
    if (request.additional_info) {
      params.set('topico', request.additional_info);
    }

    navigate(`/admin/music/gerador?${params.toString()}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Solicitacoes de Audio
        </h1>
        <p className="text-gray-400 mt-1">
          Gerencie as solicitacoes de musicas e podcasts dos alunos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value || undefined })
          }
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="generating">Gerando</option>
          <option value="ready">Prontas</option>
          <option value="rejected">Rejeitadas</option>
        </select>

        <select
          value={filters.audio_type || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              audio_type: (e.target.value as 'music' | 'podcast') || undefined,
            })
          }
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="">Todos os tipos</option>
          <option value="music">Musicas</option>
          <option value="podcast">Podcasts</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="bg-brand-card border border-white/5 rounded-lg overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma solicitacao encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {requests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const isExpanded = expandedId === request.id;
              const isProcessing = processing === request.id;

              return (
                <div key={request.id} className="hover:bg-white/5 transition-colors">
                  {/* Main Row */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(request.id)}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        request.audio_type === 'music'
                          ? 'bg-brand-yellow/20 text-brand-yellow'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {request.audio_type === 'music' ? (
                        <Music className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {request.materia}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{request.assunto}</p>
                    </div>

                    {/* Type & Date */}
                    <div className="hidden md:block text-right">
                      <p className="text-gray-400 text-sm">
                        {request.audio_type === 'music' ? 'Musica' : 'Podcast'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(request.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request.id);
                            }}
                            disabled={isProcessing}
                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Aprovar"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(request.id);
                            }}
                            disabled={isProcessing}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Rejeitar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {request.status === 'approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(request);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow text-brand-darker font-bold text-sm rounded-lg hover:bg-brand-yellow/90 transition-colors"
                        >
                          <Wand2 className="w-4 h-4" />
                          Gerar Audio
                        </button>
                      )}

                      {request.status === 'ready' && request.generated_track && (
                        <a
                          href={request.generated_track.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 font-medium text-sm rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Ouvir
                        </a>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(request.id);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-white/5 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Tipo</p>
                          <p className="text-white">
                            {request.audio_type === 'music' ? 'Musica' : 'Podcast'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Materia</p>
                          <p className="text-white">{request.materia}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Assunto</p>
                          <p className="text-white">{request.assunto}</p>
                        </div>

                        {request.audio_type === 'music' && request.music_style && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">
                              Estilo Musical
                            </p>
                            <p className="text-white">
                              {getMusicStyleLabel(request.music_style)}
                            </p>
                          </div>
                        )}

                        {request.audio_type === 'podcast' && request.podcast_duration && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Duracao</p>
                            <p className="text-white">{request.podcast_duration} minutos</p>
                          </div>
                        )}

                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">
                            Data da Solicitacao
                          </p>
                          <p className="text-white">{formatDate(request.created_at)}</p>
                        </div>

                        {request.additional_info && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-gray-500 text-xs uppercase mb-1">
                              Informacoes Adicionais
                            </p>
                            <p className="text-white italic">"{request.additional_info}"</p>
                          </div>
                        )}

                        {request.admin_notes && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-gray-500 text-xs uppercase mb-1">
                              Notas do Admin
                            </p>
                            <p className="text-gray-300">{request.admin_notes}</p>
                          </div>
                        )}

                        {request.reviewed_at && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">
                              Revisado em
                            </p>
                            <p className="text-white">{formatDate(request.reviewed_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Mostrando {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white disabled:opacity-50 hover:border-white/20 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white disabled:opacity-50 hover:border-white/20 transition-colors"
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicRequests;
