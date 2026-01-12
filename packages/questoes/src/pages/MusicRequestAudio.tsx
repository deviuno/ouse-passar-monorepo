import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Music,
  Mic,
  Loader2,
  Send,
  Clock,
  CheckCircle,
  Search,
  ChevronDown,
  X,
  BookOpen,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { musicService, type CreateAudioRequestData } from '../services/musicService';
import { fetchFilterOptions } from '../services/questionsService';
import { questionsDb } from '../services/questionsDbClient';

// Estilos musicais disponiveis
const MUSIC_STYLES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'funk', label: 'Funk Melody' },
  { value: 'pagode', label: 'Pagode' },
  { value: 'samba', label: 'Samba' },
  { value: 'forro', label: 'Forro' },
  { value: 'mpb', label: 'MPB' },
  { value: 'bossa_nova', label: 'Bossa Nova' },
  { value: 'axe', label: 'Axe' },
  { value: 'rap', label: 'Rap/Hip-Hop' },
  { value: 'trap', label: 'Trap' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'country', label: 'Country' },
  { value: 'folk', label: 'Folk' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Eletronica' },
  { value: 'house', label: 'House' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'classical', label: 'Classica' },
];

// Duracoes de podcast disponiveis
const PODCAST_DURATIONS = [
  { value: 3, label: '3 min', description: 'Rapido e direto' },
  { value: 5, label: '5 min', description: 'Introducao ao tema' },
  { value: 10, label: '10 min', description: 'Episodio completo' },
];

// ==================== SEARCHABLE SELECT COMPONENT ====================

interface SearchableSelectProps {
  label: string;
  icon?: React.ReactNode;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  icon,
  items,
  value,
  onChange,
  placeholder = 'Selecione...',
  isLoading = false,
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalizar texto para busca (remover acentos)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar items pela busca
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchNorm = normalizeText(search);
    return items.filter((item) => normalizeText(item).includes(searchNorm));
  }, [items, search]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && '*'}
      </label>

      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer
          ${disabled
            ? 'bg-[#282828]/50 border-white/5 text-gray-500 cursor-not-allowed'
            : isOpen
              ? 'bg-[#282828] border-[#FFB800] text-white'
              : 'bg-[#282828] border-white/10 text-white hover:border-white/20'
          }
        `}
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className={`flex-1 truncate ${!value ? 'text-gray-500' : 'text-white'}`}>
          {value || placeholder}
        </span>
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-gray-400" />
        ) : value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X size={16} className="text-gray-400" />
          </span>
        ) : (
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-[#1E1E1E] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-[#282828] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB800]/50"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[#FFB800]" />
                <span className="ml-2 text-gray-500 text-sm">Carregando...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                {search ? 'Nenhum resultado encontrado' : 'Nenhum item disponivel'}
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
                      w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors
                      ${isSelected
                        ? 'bg-[#FFB800]/10 text-[#FFB800]'
                        : 'text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-[#FFB800] border-[#FFB800]' : 'border-gray-500'}
                      `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="p-2 border-t border-white/10 text-center">
              <span className="text-gray-500 text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
                {search && ` encontrado${filteredItems.length === 1 ? '' : 's'}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const MusicRequestAudio: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrail } = useTrailStore();

  const [audioType, setAudioType] = useState<'music' | 'podcast'>('music');
  const [materia, setMateria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [musicStyle, setMusicStyle] = useState('pop');
  const [podcastDuration, setPodcastDuration] = useState(5);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options state
  const [availableMaterias, setAvailableMaterias] = useState<string[]>([]);
  const [availableAssuntos, setAvailableAssuntos] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);

  const preparatorioId = currentTrail?.preparatorio_id || null;

  // Load materias on mount
  useEffect(() => {
    const loadMaterias = async () => {
      setLoadingMaterias(true);
      try {
        const filterOptions = await fetchFilterOptions();
        setAvailableMaterias(filterOptions.materias || []);
      } catch (err) {
        console.error('Erro ao carregar materias:', err);
        setAvailableMaterias([]);
      } finally {
        setLoadingMaterias(false);
      }
    };

    loadMaterias();
  }, []);

  // Load assuntos when materia changes
  useEffect(() => {
    const loadAssuntos = async () => {
      if (!materia) {
        setAvailableAssuntos([]);
        setAssunto('');
        return;
      }

      setLoadingAssuntos(true);
      try {
        // Query assuntos directly from the database
        const { data, error } = await questionsDb
          .from('questoes_concurso')
          .select('assunto')
          .eq('materia', materia)
          .eq('ativo', true)
          .not('assunto', 'is', null)
          .not('enunciado', 'is', null)
          .limit(5000);

        if (error) {
          console.error('Erro ao buscar assuntos:', error);
          setAvailableAssuntos([]);
          return;
        }

        // Get unique assuntos and sort
        const uniqueAssuntos = [...new Set((data || []).map(r => r.assunto))].sort();
        console.log('[MusicRequestAudio] Carregados:', uniqueAssuntos.length, 'assuntos para', materia);
        setAvailableAssuntos(uniqueAssuntos);

        // Clear selected assunto if it's not in the new list
        if (assunto && !uniqueAssuntos.includes(assunto)) {
          setAssunto('');
        }
      } catch (err) {
        console.error('Erro ao carregar assuntos:', err);
        setAvailableAssuntos([]);
      } finally {
        setLoadingAssuntos(false);
      }
    };

    loadAssuntos();
  }, [materia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('Voce precisa estar logado para solicitar audio.');
      return;
    }

    if (!materia.trim() || !assunto.trim()) {
      setError('Por favor, preencha a materia e o assunto.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData: CreateAudioRequestData = {
        audio_type: audioType,
        materia: materia.trim(),
        assunto: assunto.trim(),
        additional_info: additionalInfo.trim() || undefined,
      };

      if (audioType === 'music') {
        requestData.music_style = musicStyle;
      } else {
        requestData.podcast_duration = podcastDuration;
      }

      await musicService.createAudioRequest(user.id, preparatorioId, requestData);
      setSubmitted(true);
    } catch (err) {
      console.error('Erro ao criar solicitacao:', err);
      setError('Erro ao enviar solicitacao. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tela de sucesso
  if (submitted) {
    return (
      <div className="pb-24">
        <div className="p-8">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Solicitacao Enviada!
            </h1>
            <p className="text-gray-400 mb-8">
              Sua solicitacao de {audioType === 'music' ? 'musica' : 'podcast'} foi enviada com sucesso.
              Voce sera notificado quando o audio estiver pronto.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/music/solicitacoes"
                className="px-6 py-3 bg-[#FFB800] text-black font-bold rounded-full hover:scale-105 transition-transform"
              >
                Ver Minhas Solicitacoes
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMateria('');
                  setAssunto('');
                  setAdditionalInfo('');
                }}
                className="px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors"
              >
                Fazer Nova Solicitacao
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="p-8">
        <Link
          to="/music"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Solicitar Audio</h1>
        <p className="text-gray-400">
          Solicite uma musica ou podcast sobre um tema de sua escolha. Nossa equipe ira avaliar e gerar o audio para voce.
        </p>
      </div>

      <div className="px-8">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Tipo de Audio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Audio
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAudioType('music')}
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  audioType === 'music'
                    ? 'border-[#FFB800] bg-[#FFB800]/10 text-white'
                    : 'border-white/10 bg-[#282828] text-gray-400 hover:border-white/20'
                }`}
              >
                <Music className="w-6 h-6" />
                <span className="font-medium">Musica</span>
              </button>
              <button
                type="button"
                onClick={() => setAudioType('podcast')}
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  audioType === 'podcast'
                    ? 'border-[#FFB800] bg-[#FFB800]/10 text-white'
                    : 'border-white/10 bg-[#282828] text-gray-400 hover:border-white/20'
                }`}
              >
                <Mic className="w-6 h-6" />
                <span className="font-medium">Podcast</span>
              </button>
            </div>
          </div>

          {/* Materia - Searchable Dropdown */}
          <SearchableSelect
            label="Materia"
            icon={<BookOpen size={18} />}
            items={availableMaterias}
            value={materia}
            onChange={(value) => {
              setMateria(value);
              // Clear assunto when materia changes
              if (value !== materia) {
                setAssunto('');
              }
            }}
            placeholder="Selecione uma materia..."
            isLoading={loadingMaterias}
            required
          />

          {/* Assunto - Searchable Dropdown */}
          <SearchableSelect
            label="Assunto"
            icon={<FileText size={18} />}
            items={availableAssuntos}
            value={assunto}
            onChange={setAssunto}
            placeholder={materia ? 'Selecione um assunto...' : 'Selecione uma materia primeiro'}
            isLoading={loadingAssuntos}
            disabled={!materia}
            required
          />

          {/* Estilo Musical (apenas para musica) */}
          {audioType === 'music' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estilo Musical
              </label>
              <select
                value={musicStyle}
                onChange={(e) => setMusicStyle(e.target.value)}
                className="w-full px-4 py-3 bg-[#282828] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FFB800]/50"
              >
                {MUSIC_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duracao do Podcast (apenas para podcast) */}
          {audioType === 'podcast' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Duracao do Podcast
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PODCAST_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setPodcastDuration(d.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      podcastDuration === d.value
                        ? 'border-[#FFB800] bg-[#FFB800]/10 text-white'
                        : 'border-white/10 bg-[#282828] text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-medium mb-1">
                      <Clock className="w-4 h-4" />
                      {d.label}
                    </div>
                    <span className="text-xs opacity-70">{d.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Informacoes Adicionais */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Informacoes Adicionais (opcional)
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Descreva detalhes especificos que gostaria de incluir no audio..."
              rows={3}
              className="w-full px-4 py-3 bg-[#282828] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800]/50 resize-none"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Botao de Envio */}
          <button
            type="submit"
            disabled={submitting || !materia || !assunto}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FFB800] text-black font-bold rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Solicitacao
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-center text-gray-500 text-sm">
            Sua solicitacao sera analisada pela nossa equipe. Voce recebera uma notificacao quando o audio estiver pronto.
          </p>
        </form>
      </div>
    </div>
  );
};

export default MusicRequestAudio;
