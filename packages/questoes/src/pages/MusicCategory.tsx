import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Pause, Clock, Shuffle, Loader2, FolderOpen, X } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type MusicCategory as CategoryType, type MusicTrack } from '../services/musicService';
import { TrackRow } from '../components/music';

export const MusicCategory: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const { currentTrail } = useTrailStore();
  const { setQueue, play, isPlaying, currentTrack, toggleShuffle, isShuffled } = useMusicPlayerStore();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadedForSlug, setLoadedForSlug] = useState<string | null>(null);

  // Filtros para categoria de podcasts
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [selectedAssunto, setSelectedAssunto] = useState<string>('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const preparatorioId = currentTrail?.preparatorio_id;
  const isPodcastCategory = slug?.toLowerCase().includes('podcast');

  // Extrair matérias e assuntos únicos das tracks (só para podcasts)
  const availableMaterias = useMemo(() => {
    if (!isPodcastCategory) return [];
    const materias = new Set<string>();
    tracks.forEach(track => {
      if (track.materia) materias.add(track.materia);
    });
    return Array.from(materias).sort();
  }, [tracks, isPodcastCategory]);

  const availableAssuntos = useMemo(() => {
    if (!isPodcastCategory) return [];
    const assuntos = new Set<string>();
    tracks.forEach(track => {
      // Filtrar por matéria selecionada se houver
      if (selectedMateria && track.materia !== selectedMateria) return;
      if (track.assunto) assuntos.add(track.assunto);
    });
    return Array.from(assuntos).sort();
  }, [tracks, isPodcastCategory, selectedMateria]);

  // Filtrar tracks baseado nos filtros selecionados
  const filteredTracks = useMemo(() => {
    if (!isPodcastCategory) return tracks;

    return tracks.filter(track => {
      if (selectedMateria && track.materia !== selectedMateria) return false;
      if (selectedAssunto && track.assunto !== selectedAssunto) return false;
      return true;
    });
  }, [tracks, isPodcastCategory, selectedMateria, selectedAssunto]);

  // Paginação
  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);
  const paginatedTracks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTracks, currentPage]);

  useEffect(() => {
    if (slug && preparatorioId && loadedForSlug !== slug) {
      loadCategory();
    }
  }, [slug, preparatorioId, loadedForSlug]);

  useEffect(() => {
    if (user?.id && tracks.length > 0) {
      checkFavorites();
    }
  }, [user?.id, tracks]);

  // Resetar filtros e página quando mudar de categoria
  useEffect(() => {
    setSelectedMateria('');
    setSelectedAssunto('');
    setCurrentPage(1);
  }, [slug]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMateria, selectedAssunto]);

  const loadCategory = async () => {
    if (!slug || !preparatorioId) return;

    setLoading(true);
    try {
      // Carregar categoria e tracks
      const categoryData = await musicService.getCategoryBySlug(preparatorioId, slug);
      setCategory(categoryData);

      // Para categoria de podcasts, buscar todos os podcasts do preparatório
      let tracksData: MusicTrack[];
      if (slug.toLowerCase().includes('podcast')) {
        tracksData = await musicService.getPodcastsByMateria(preparatorioId);
      } else {
        tracksData = await musicService.getTracksByCategory(preparatorioId, slug);
      }

      setTracks(tracksData);
      setLoadedForSlug(slug);
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorites = async () => {
    if (!user?.id) return;

    const favSet = new Set<string>();
    for (const track of tracks) {
      const isFav = await musicService.isFavorite(user.id, track.id);
      if (isFav) favSet.add(track.id);
    }
    setFavorites(favSet);
  };

  const handlePlay = () => {
    if (filteredTracks.length === 0) return;

    setQueue(filteredTracks, 0);
    play(filteredTracks[0]);
  };

  const handleShufflePlay = () => {
    if (filteredTracks.length === 0) return;

    if (!isShuffled) toggleShuffle();

    const randomIndex = Math.floor(Math.random() * filteredTracks.length);
    setQueue(filteredTracks, randomIndex);
    play(filteredTracks[randomIndex]);
  };

  const clearFilters = () => {
    setSelectedMateria('');
    setSelectedAssunto('');
  };

  const handleFavoriteToggle = async (trackId: string) => {
    if (!user?.id) return;

    try {
      const isFav = await musicService.toggleFavorite(user.id, trackId);
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (isFav) {
          newSet.add(trackId);
        } else {
          newSet.delete(trackId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const totalDuration = filteredTracks.reduce((acc, track) => acc + track.duration_seconds, 0);
  const isCurrentCategoryPlaying = filteredTracks.some((t) => t.id === currentTrack?.id) && isPlaying;
  const hasActiveFilters = selectedMateria || selectedAssunto;

  // Mostrar loading enquanto carrega dados
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Categoria nao encontrada</h2>
          <Link to="/music" className="text-[#FFB800] hover:underline">
            Voltar para Music
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-24">
      {/* Header */}
      <div
        className="relative p-6 pb-8"
        style={{
          background: `linear-gradient(to bottom, ${category.color || '#3B82F6'}40, transparent)`,
        }}
      >
        <Link
          to="/music"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Category Icon */}
          <div
            className="w-48 h-48 rounded-lg shadow-2xl flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: category.color || '#3B82F6' }}
          >
            <FolderOpen className="w-24 h-24 text-white/80" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <span className="text-white/70 text-sm uppercase">Categoria</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-white/70 mb-4">{category.description}</p>
            )}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>{filteredTracks.length} faixas{hasActiveFilters && ` (de ${tracks.length})`}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTotalDuration(totalDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Filtros para categoria de podcasts */}
        {isPodcastCategory && (availableMaterias.length > 0 || availableAssuntos.length > 0) && (
          <div className="flex items-center gap-3 mt-6">
            {/* Filtro de Matéria */}
            {availableMaterias.length > 0 && (
              <select
                value={selectedMateria}
                onChange={(e) => {
                  setSelectedMateria(e.target.value);
                  setSelectedAssunto(''); // Reset assunto ao mudar matéria
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FFB800] transition-colors"
              >
                <option value="" className="bg-[#1a1a1a]">Todas as matérias</option>
                {availableMaterias.map((materia) => (
                  <option key={materia} value={materia} className="bg-[#1a1a1a]">
                    {materia}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro de Assunto - só aparece se tiver assuntos disponíveis */}
            {availableAssuntos.length > 0 && (
              <select
                value={selectedAssunto}
                onChange={(e) => setSelectedAssunto(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FFB800] transition-colors"
              >
                <option value="" className="bg-[#1a1a1a]">Todos os assuntos</option>
                {availableAssuntos.map((assunto) => (
                  <option key={assunto} value={assunto} className="bg-[#1a1a1a]">
                    {assunto}
                  </option>
                ))}
              </select>
            )}

            {/* Botão para limpar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        {filteredTracks.length > 0 && (
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handlePlay}
              className="w-14 h-14 bg-[#FFB800] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isCurrentCategoryPlaying ? (
                <Pause className="w-7 h-7 text-black" />
              ) : (
                <Play className="w-7 h-7 text-black ml-1" />
              )}
            </button>
            <button
              onClick={handleShufflePlay}
              className={`p-3 rounded-full transition-colors ${
                isShuffled ? 'text-[#FFB800]' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div className="px-6">
        {tracks.length > 0 ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-2 text-gray-400 text-sm uppercase border-b border-white/10 mb-2">
              <span className="w-8 text-center">#</span>
              <span className="w-10" />
              <span className="flex-1">Titulo</span>
              <span className="w-16 text-right">
                <Clock className="w-4 h-4 inline" />
              </span>
              <span className="w-8" />
            </div>

            {/* Track list */}
            {paginatedTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={(currentPage - 1) * ITEMS_PER_PAGE + index}
                isFavorite={favorites.has(track.id)}
                onFavoriteToggle={handleFavoriteToggle}
                tracks={filteredTracks}
              />
            ))}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar primeira, última, atual e adjacentes
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      // Adicionar ellipsis se houver gap
                      const showEllipsisBefore = idx > 0 && arr[idx - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-2 text-white/40">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-[#FFB800] text-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma faixa nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicCategory;
