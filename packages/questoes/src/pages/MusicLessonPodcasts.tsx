import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Clock, Mic2, Loader2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type MusicTrack } from '../services/musicService';
import { TrackRow } from '../components/music';

interface MateriaGroup {
  materia: string;
  count: number;
  tracks: MusicTrack[];
}

export const MusicLessonPodcasts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { currentTrail } = useTrailStore();
  const { setQueue, play, isPlaying, currentTrack } = useMusicPlayerStore();

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [materias, setMaterias] = useState<MateriaGroup[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<string | null>(
    searchParams.get('materia')
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const preparatorioId = currentTrail?.preparatorio_id;

  useEffect(() => {
    if (preparatorioId && !dataLoaded) {
      loadData();
    }
  }, [preparatorioId, dataLoaded]);

  useEffect(() => {
    setDataLoaded(false);
  }, [preparatorioId]);

  useEffect(() => {
    const materia = searchParams.get('materia');
    setSelectedMateria(materia);
  }, [searchParams]);

  useEffect(() => {
    if (user?.id && selectedMateria) {
      const materiaGroup = materias.find((m) => m.materia === selectedMateria);
      if (materiaGroup?.tracks.length) {
        checkFavorites(materiaGroup.tracks);
      }
    }
  }, [user?.id, selectedMateria, materias]);

  const loadData = async () => {
    if (!preparatorioId) return;

    setLoading(true);
    try {
      const materiasData = await musicService.getLessonPodcastsMaterias(preparatorioId);

      // Load tracks for each materia
      const materiasWithTracks = await Promise.all(
        materiasData.map(async ({ materia, count }) => {
          const tracks = await musicService.getLessonPodcasts(preparatorioId, materia);
          return { materia, count, tracks };
        })
      );

      setMaterias(materiasWithTracks);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading lesson podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorites = async (tracks: MusicTrack[]) => {
    if (!user?.id) return;

    const favSet = new Set<string>();
    for (const track of tracks) {
      const isFav = await musicService.isFavorite(user.id, track.id);
      if (isFav) favSet.add(track.id);
    }
    setFavorites(favSet);
  };

  const handleSelectMateria = (materia: string) => {
    setSearchParams({ materia });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  const handlePlayAll = () => {
    const materiaGroup = materias.find((m) => m.materia === selectedMateria);
    if (!materiaGroup?.tracks.length) return;

    setQueue(materiaGroup.tracks, 0);
    play(materiaGroup.tracks[0]);
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

  const selectedMateriaGroup = materias.find((m) => m.materia === selectedMateria);
  const totalDuration = selectedMateriaGroup?.tracks.reduce(
    (acc, track) => acc + track.duration_seconds,
    0
  ) || 0;

  const isCurrentMateriaPlaying =
    selectedMateriaGroup?.tracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  // Mostrar loading enquanto espera store hydrate ou carrega dados
  if (loading || (!dataLoaded && preparatorioId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  // Materia detail view
  if (selectedMateria && selectedMateriaGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-24">
        {/* Header */}
        <div className="relative p-6 pb-8 bg-gradient-to-b from-purple-900/30 to-transparent">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Icon */}
            <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg shadow-2xl flex-shrink-0 flex items-center justify-center">
              <Mic2 className="w-24 h-24 text-white/80" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <span className="text-white/70 text-sm uppercase flex items-center gap-2">
                <Mic2 className="w-4 h-4" />
                Podcasts das Aulas
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-4">
                {selectedMateria}
              </h1>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <span>{selectedMateriaGroup.count} podcasts</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTotalDuration(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {selectedMateriaGroup.tracks.length > 0 && (
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handlePlayAll}
                className="w-14 h-14 bg-[#FFB800] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isCurrentMateriaPlaying ? (
                  <Pause className="w-7 h-7 text-black" />
                ) : (
                  <Play className="w-7 h-7 text-black ml-1" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tracks */}
        <div className="px-6">
          {selectedMateriaGroup.tracks.length > 0 ? (
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
              {selectedMateriaGroup.tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isFavorite={favorites.has(track.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  tracks={selectedMateriaGroup.tracks}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Mic2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum podcast nesta materia</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Materias list view
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-24">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-purple-900/30 to-transparent">
        <Link
          to="/music"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Mic2 className="w-8 h-8 text-purple-400" />
          Podcasts das Aulas
        </h1>
        <p className="text-white/60 mt-2">
          Ouça os podcasts gerados das suas aulas, organizados por matéria
        </p>
      </div>

      <div className="px-6">
        {materias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materias.map(({ materia, count }) => (
              <button
                key={materia}
                onClick={() => handleSelectMateria(materia)}
                className="bg-gradient-to-br from-purple-600 to-purple-900 p-6 rounded-lg hover:scale-[1.02] transition-transform text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{materia}</h3>
                    <p className="text-white/70 mt-1">{count} podcasts</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Mic2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhum podcast disponivel</p>
            <p className="text-sm mt-2">
              Os podcasts serao gerados automaticamente a partir das suas aulas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicLessonPodcasts;
