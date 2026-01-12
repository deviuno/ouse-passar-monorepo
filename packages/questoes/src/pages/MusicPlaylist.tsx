import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Clock, Heart, Shuffle, Loader2, ListMusic } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type MusicPlaylist as PlaylistType, type MusicTrack } from '../services/musicService';
import { TrackRow } from '../components/music';

export const MusicPlaylist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { setQueue, play, isPlaying, currentTrack, toggleShuffle, isShuffled } = useMusicPlayerStore();

  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadPlaylist();
    }
  }, [id]);

  useEffect(() => {
    if (user?.id && playlist?.tracks) {
      checkFavorites();
    }
  }, [user?.id, playlist?.tracks]);

  const loadPlaylist = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await musicService.getPlaylistWithTracks(id);
      setPlaylist(data);
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorites = async () => {
    if (!user?.id || !playlist?.tracks) return;

    const favSet = new Set<string>();
    for (const track of playlist.tracks) {
      const isFav = await musicService.isFavorite(user.id, track.id);
      if (isFav) favSet.add(track.id);
    }
    setFavorites(favSet);
  };

  const handlePlay = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;

    setQueue(playlist.tracks, 0);
    play(playlist.tracks[0]);
  };

  const handleShufflePlay = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;

    if (!isShuffled) toggleShuffle();

    const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
    setQueue(playlist.tracks, randomIndex);
    play(playlist.tracks[randomIndex]);
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

  const isCurrentPlaylistPlaying =
    playlist?.tracks?.some((t) => t.id === currentTrack?.id) && isPlaying;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <ListMusic className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Playlist nao encontrada</h2>
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
          background: 'linear-gradient(to bottom, rgba(255,184,0,0.3), transparent)',
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
          {/* Cover */}
          <div className="w-48 h-48 bg-[#282828] rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
            {playlist.cover_url ? (
              <img
                src={playlist.cover_url}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="w-16 h-16 text-gray-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <span className="text-white/70 text-sm uppercase">Playlist</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-4">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-white/70 mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>{playlist.track_count} faixas</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTotalDuration(playlist.total_duration_seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handlePlay}
            className="w-14 h-14 bg-[#FFB800] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isCurrentPlaylistPlaying ? (
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
      </div>

      {/* Tracks */}
      <div className="px-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 text-gray-400 text-xs uppercase border-b border-white/10 mb-2">
          <span className="w-6 text-center">#</span>
          <span className="w-10" />
          <span className="flex-1">Titulo</span>
          <Clock className="w-4 h-4" />
        </div>

        {/* Track list */}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div>
            {playlist.tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isFavorite={favorites.has(track.id)}
                onFavoriteToggle={handleFavoriteToggle}
                tracks={playlist.tracks}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma faixa nesta playlist</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlaylist;
