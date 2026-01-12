import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Loader2, Copy, Check, Music, RefreshCw, ChevronDown, Search, Plus,
  Play, Pause, Download, AlertCircle, Volume2, ExternalLink, Sparkles,
  Trash2, CheckCircle, X
} from 'lucide-react';
import { musicAdminService } from '../../../services/musicAdminService';
import { questionGeneratorService } from '../../../services/questionGeneratorService';

// Estilos musicais disponíveis
const MUSIC_STYLES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'funk', label: 'Funk Melody' },
  { value: 'pagode', label: 'Pagode' },
  { value: 'samba', label: 'Samba' },
  { value: 'forro', label: 'Forró' },
  { value: 'mpb', label: 'MPB' },
  { value: 'bossa_nova', label: 'Bossa Nova' },
  { value: 'axe', label: 'Axé' },
  { value: 'rap', label: 'Rap/Hip-Hop' },
  { value: 'trap', label: 'Trap' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'country', label: 'Country' },
  { value: 'folk', label: 'Folk' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Eletrônica' },
  { value: 'house', label: 'House' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'classical', label: 'Clássica' },
  { value: 'opera', label: 'Ópera' },
  { value: 'musical', label: 'Musical/Teatro' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'jingle', label: 'Jingle/Comercial' },
];

// Suno Models
const SUNO_MODELS = [
  { value: 'V5', label: 'V5 (Recomendado)' },
  { value: 'V4_5ALL', label: 'V4.5 All (melhor estrutura)' },
  { value: 'V4_5PLUS', label: 'V4.5 Plus (tons ricos)' },
  { value: 'V4_5', label: 'V4.5 (até 8 min)' },
  { value: 'V4', label: 'V4 (até 4 min)' },
];

// ==================== TYPES ====================

interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

interface MusicStatusResponse {
  success: boolean;
  taskId: string;
  status: string;
  statusLabel: string;
  isComplete: boolean;
  isFailed: boolean;
  tracks: SunoTrack[];
  errorMessage: string | null;
}

// ==================== COMPONENTE SEARCHABLE SELECT ====================

interface SearchableSelectProps {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  items,
  value,
  onChange,
  placeholder = 'Selecionar...',
  isLoading = false,
  disabled = false,
  allowCustom = false,
  customLabel = 'Adicionar novo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter((item) => item.toLowerCase().includes(searchLower));
  }, [items, search]);

  const isNewValue = useMemo(() => {
    if (!search.trim() || !allowCustom) return false;
    const searchLower = search.toLowerCase().trim();
    return !items.some(item => item.toLowerCase() === searchLower);
  }, [items, search, allowCustom]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddCustom = () => {
    if (search.trim()) {
      onChange(search.trim());
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors text-left
          ${disabled
            ? 'bg-brand-dark/50 border-white/5 text-gray-500 cursor-not-allowed'
            : isOpen
              ? 'bg-brand-dark border-brand-yellow text-white'
              : 'bg-brand-dark border-white/10 text-white hover:border-white/20'
          }
        `}
      >
        <span className={!value ? 'text-gray-500' : 'text-white truncate'}>
          {value || placeholder}
        </span>
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-gray-400" />
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={allowCustom ? "Buscar ou digitar novo..." : "Buscar..."}
                  autoFocus
                  className="w-full bg-brand-dark border border-white/10 rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>

            {/* Add Custom Option */}
            {isNewValue && (
              <div className="p-2 border-b border-white/10">
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded transition-colors"
                >
                  <Plus size={14} />
                  <span>{customLabel}: <strong>"{search.trim()}"</strong></span>
                </button>
              </div>
            )}

            {/* Items List */}
            <div className="max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-brand-yellow" />
                  <span className="ml-2 text-gray-500 text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 && !isNewValue ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  {allowCustom ? 'Nenhum resultado. Digite para criar novo.' : 'Nenhum resultado'}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = value === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-white hover:bg-white/5'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-500'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer - limpar seleção */}
            {value && (
              <div className="p-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-red-400 text-xs hover:underline"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== AUDIO PLAYER COMPONENT ====================

interface AudioPlayerProps {
  track: SunoTrack;
  index: number;
  materia?: string;
  assunto?: string;
  preparatorioId?: string;
  onDelete?: (trackId: string) => void;
  onApprove?: (trackId: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  index,
  materia,
  assunto,
  preparatorioId,
  onDelete,
  onApprove,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 0);
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-brand-dark border border-white/10 rounded-lg p-4"
    >
      <audio
        ref={audioRef}
        src={track.audioUrl || track.streamAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-start gap-4">
        {/* Cover Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          {track.imageUrl && !imageError ? (
            <img
              src={track.imageUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30">
              <Music className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Track Info & Controls */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">
            {track.title || `Faixa ${index + 1}`}
          </h4>
          <p className="text-gray-500 text-sm mt-0.5">
            {track.modelName} - {formatTime(duration)}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:bg-brand-yellow
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{formatTime(duration)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={togglePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow text-brand-dark text-sm font-medium rounded-lg hover:bg-brand-yellow/90 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pausar' : 'Tocar'}
            </button>

            {track.audioUrl && (
              <a
                href={track.audioUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                <Download size={14} />
                Baixar
              </a>
            )}

            {/* Approve Button */}
            {onApprove && !approved && (
              <button
                onClick={async () => {
                  setApproving(true);
                  try {
                    await onApprove(track.id);
                    setApproved(true);
                  } finally {
                    setApproving(false);
                  }
                }}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 disabled:bg-green-600/50 transition-colors"
              >
                {approving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Aprovar
              </button>
            )}

            {approved && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 text-sm font-medium rounded-lg">
                <CheckCircle size={14} />
                Aprovada
              </span>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-card border border-white/10 rounded-lg p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Excluir Música</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Tem certeza que deseja excluir esta música? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDelete?.(track.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const MusicLyricsGenerator: React.FC = () => {
  // Form state
  const [materia, setMateria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [cargo, setCargo] = useState('');
  const [estilo, setEstilo] = useState('pop');
  const [customTopic, setCustomTopic] = useState('');
  const [sunoModel, setSunoModel] = useState('V5');
  const [musicTitle, setMusicTitle] = useState('');

  // Data state
  const [materias, setMaterias] = useState<string[]>([]);
  const [assuntos, setAssuntos] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);

  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Music generation state
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [musicTaskId, setMusicTaskId] = useState<string | null>(null);
  const [musicStatus, setMusicStatus] = useState<string>('');
  const [musicStatusLabel, setMusicStatusLabel] = useState<string>('');
  const [generatedTracks, setGeneratedTracks] = useState<SunoTrack[]>([]);
  const [musicError, setMusicError] = useState('');

  // Preparatorio state (for approving tracks)
  const [preparatorioId, setPreparatorioId] = useState<string | null>(null);

  // Polling ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

  // Load filters and preparatorioId on mount
  useEffect(() => {
    loadFilters();
    // Get preparatorioId from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const prepId = urlParams.get('preparatorio_id') || localStorage.getItem('selectedPreparatorioId');
    if (prepId) {
      setPreparatorioId(prepId);
    }
  }, []);

  // Load assuntos when materia changes
  useEffect(() => {
    if (materia) {
      loadAssuntos(materia);
    } else {
      setAssuntos([]);
      setAssunto('');
    }
  }, [materia]);

  // Auto-generate title based on materia/assunto
  useEffect(() => {
    if (!musicTitle && (materia || assunto)) {
      const title = assunto || materia;
      setMusicTitle(title ? `${title} - Estudando com Música` : '');
    }
  }, [materia, assunto, musicTitle]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      const result = await questionGeneratorService.getFilters();
      setMaterias(result.materias || []);
      setCargos(result.cargos || []);
    } catch (err) {
      console.error('Error loading filters:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadAssuntos = async (selectedMateria: string) => {
    try {
      setLoadingAssuntos(true);
      const result = await questionGeneratorService.getAssuntos(selectedMateria);
      setAssuntos(result.assuntos || []);
    } catch (err) {
      console.error('Error loading assuntos:', err);
      setAssuntos([]);
    } finally {
      setLoadingAssuntos(false);
    }
  };

  const handleGenerate = async () => {
    if (!materia && !customTopic) {
      setError('Selecione uma matéria ou informe um tópico personalizado.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedLyrics('');
    setGeneratedTracks([]);
    setMusicTaskId(null);
    setMusicError('');

    try {
      const response = await fetch(`${MASTRA_URL}/api/music/generate-lyrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materia: materia || undefined,
          assunto: assunto || undefined,
          cargo: cargo || undefined,
          estilo,
          customTopic: customTopic || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar letra');
      }

      const data = await response.json();
      setGeneratedLyrics(data.lyrics);
    } catch (err: any) {
      console.error('Error generating lyrics:', err);
      setError(err.message || 'Erro ao gerar letra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const checkMusicStatus = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`${MASTRA_URL}/api/music/status/${taskId}`);
      const data: MusicStatusResponse = await response.json();

      if (!data.success) {
        throw new Error(data.errorMessage || 'Erro ao verificar status');
      }

      setMusicStatus(data.status);
      setMusicStatusLabel(data.statusLabel);

      if (data.isComplete) {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setGeneratingMusic(false);

        if (data.isFailed) {
          setMusicError(data.errorMessage || `Geração falhou: ${data.status}`);
        } else {
          setGeneratedTracks(data.tracks);
        }
      }
    } catch (err: any) {
      console.error('Error checking music status:', err);
      setMusicError(err.message || 'Erro ao verificar status');
      setGeneratingMusic(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [MASTRA_URL]);

  const handleGenerateMusic = async () => {
    if (!generatedLyrics) {
      setMusicError('Gere a letra primeiro antes de criar a música.');
      return;
    }

    if (!musicTitle.trim()) {
      setMusicError('Informe um título para a música.');
      return;
    }

    setGeneratingMusic(true);
    setMusicError('');
    setGeneratedTracks([]);
    setMusicStatus('');
    setMusicStatusLabel('');

    try {
      // Get the style label
      const styleLabel = MUSIC_STYLES.find(s => s.value === estilo)?.label || 'Pop';

      const response = await fetch(`${MASTRA_URL}/api/music/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: generatedLyrics,
          style: styleLabel,
          title: musicTitle.trim(),
          model: sunoModel,
          instrumental: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar geração');
      }

      const data = await response.json();
      setMusicTaskId(data.taskId);
      setMusicStatusLabel('Iniciando geração...');

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        checkMusicStatus(data.taskId);
      }, 5000); // Poll every 5 seconds

      // Initial check
      setTimeout(() => checkMusicStatus(data.taskId), 2000);

    } catch (err: any) {
      console.error('Error generating music:', err);
      setMusicError(err.message || 'Erro ao gerar música. Tente novamente.');
      setGeneratingMusic(false);
    }
  };

  // Handle approving a track (save to music_tracks table)
  const handleApproveTrack = async (trackId: string) => {
    if (!preparatorioId) {
      setMusicError('Selecione um preparatório antes de aprovar músicas.');
      return;
    }

    const track = generatedTracks.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Get duration from audio
      const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
          });
          audio.addEventListener('error', () => resolve(0));
          audio.src = url;
        });
      };

      const duration = await getAudioDuration(track.audioUrl || track.streamAudioUrl);

      // Save to music_tracks table
      await musicAdminService.createTrack({
        title: track.title || musicTitle,
        artist: 'Ouse Passar IA',
        audio_url: track.audioUrl || track.streamAudioUrl,
        cover_url: track.imageUrl || null,
        duration_seconds: duration || track.duration || 0,
        preparatorio_id: preparatorioId,
        is_podcast: false,
        materia: materia || null,
        assunto: assunto || null,
        is_active: true,
      });

      console.log('[LyricsGenerator] Música aprovada e salva:', track.title);
    } catch (err: any) {
      console.error('Error approving track:', err);
      setMusicError(err.message || 'Erro ao aprovar música');
      throw err;
    }
  };

  // Handle deleting a track from the list
  const handleDeleteTrack = (trackId: string) => {
    setGeneratedTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleReset = () => {
    setMateria('');
    setAssunto('');
    setCargo('');
    setEstilo('pop');
    setCustomTopic('');
    setGeneratedLyrics('');
    setError('');
    setMusicTitle('');
    setGeneratedTracks([]);
    setMusicTaskId(null);
    setMusicError('');
    setMusicStatus('');
    setMusicStatusLabel('');

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wand2 className="w-7 h-7 text-brand-yellow" />
            Gerador de Músicas
          </h1>
          <p className="text-gray-400 mt-1">
            Gere letras de músicas educativas e transforme em áudio com IA usando o Suno.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-brand-card border border-white/5 rounded-lg p-6 space-y-5">
          <h2 className="text-lg font-bold text-white mb-4">Configurações</h2>

          {/* Matéria */}
          <SearchableSelect
            label="Matéria"
            items={materias}
            value={materia}
            onChange={(val) => {
              setMateria(val);
              setAssunto(''); // Reset assunto when materia changes
              setMusicTitle(''); // Reset title to regenerate
            }}
            placeholder="Selecione uma matéria..."
            isLoading={loadingFilters}
            allowCustom
            customLabel="Adicionar matéria"
          />

          {/* Assunto */}
          <SearchableSelect
            label="Assunto (opcional)"
            items={assuntos}
            value={assunto}
            onChange={(val) => {
              setAssunto(val);
              setMusicTitle(''); // Reset title to regenerate
            }}
            placeholder={materia ? "Selecione um assunto..." : "Selecione uma matéria primeiro"}
            isLoading={loadingAssuntos}
            disabled={!materia}
            allowCustom
            customLabel="Adicionar assunto"
          />

          {/* Cargo */}
          <SearchableSelect
            label="Cargo (opcional)"
            items={cargos}
            value={cargo}
            onChange={setCargo}
            placeholder="Selecione um cargo..."
            isLoading={loadingFilters}
            allowCustom
            customLabel="Adicionar cargo"
          />

          {/* Estilo Musical */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estilo Musical
            </label>
            <select
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50"
            >
              {MUSIC_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tópico Personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tópico Personalizado (opcional)
            </label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Descreva um tópico específico que deseja abordar na música..."
              rows={3}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow/50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || (!materia && !customTopic)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow/90 disabled:bg-brand-yellow/50 disabled:cursor-not-allowed text-brand-dark font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Letra...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Gerar Letra
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-6">
          {/* Lyrics Card */}
          <div className="bg-brand-card border border-white/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-brand-yellow" />
                Letra Gerada
              </h2>

              {generatedLyrics && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              )}
            </div>

            {generatedLyrics ? (
              <div className="bg-brand-dark border border-white/10 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedLyrics}
                </pre>
              </div>
            ) : (
              <div className="bg-brand-dark border border-white/10 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Configure as opções e clique em "Gerar Letra"</p>
                </div>
              </div>
            )}
          </div>

          {/* Music Generation Card */}
          {generatedLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card border border-white/5 rounded-lg p-6"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-brand-yellow" />
                Gerar Música com Suno IA
              </h2>

              {/* Music Generation Form */}
              <div className="space-y-4 mb-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título da Música
                  </label>
                  <input
                    type="text"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="Ex: Direito Constitucional - A Música"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modelo Suno
                  </label>
                  <select
                    value={sunoModel}
                    onChange={(e) => setSunoModel(e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50"
                  >
                    {SUNO_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Music Error */}
              {musicError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{musicError}</span>
                </div>
              )}

              {/* Generation Status */}
              {generatingMusic && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
                    <div>
                      <p className="text-brand-yellow font-medium">Gerando música...</p>
                      <p className="text-gray-400 text-sm mt-0.5">{musicStatusLabel}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-yellow"
                        initial={{ width: '10%' }}
                        animate={{
                          width: musicStatus === 'PENDING' ? '20%'
                            : musicStatus === 'TEXT_SUCCESS' ? '50%'
                            : musicStatus === 'FIRST_SUCCESS' ? '75%'
                            : '90%'
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Tempo estimado: 2-3 minutos. A página verificará automaticamente.
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Tracks */}
              {generatedTracks.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    Músicas geradas ({generatedTracks.length} faixas):
                  </h3>
                  {generatedTracks.map((track, index) => (
                    <AudioPlayer
                      key={track.id}
                      track={track}
                      index={index}
                      materia={materia}
                      assunto={assunto}
                      preparatorioId={preparatorioId || undefined}
                      onDelete={handleDeleteTrack}
                      onApprove={handleApproveTrack}
                    />
                  ))}
                </div>
              )}

              {/* Generate Button */}
              {!generatingMusic && generatedTracks.length === 0 && (
                <button
                  onClick={handleGenerateMusic}
                  disabled={!musicTitle.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  Gerar Música com IA
                </button>
              )}

              {/* Regenerate Button */}
              {generatedTracks.length > 0 && (
                <button
                  onClick={handleGenerateMusic}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Gerar Novas Versões
                </button>
              )}

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs">
                  <strong>Nota:</strong> Cada geração cria 2 versões da música. O processo leva cerca de 2-3 minutos.
                  Os arquivos ficam disponíveis por 15 dias.
                </p>
              </div>
            </motion.div>
          )}

          {/* Tip Card */}
          {generatedLyrics && !generatingMusic && generatedTracks.length === 0 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                <strong>Dica:</strong> Você pode copiar a letra e usar diretamente no{' '}
                <a
                  href="https://suno.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Suno <ExternalLink size={12} />
                </a>{' '}
                ou usar o botão acima para gerar automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicLyricsGenerator;
