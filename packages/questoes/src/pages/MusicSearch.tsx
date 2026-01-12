import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Clock, Loader2, Music, ListMusic } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { musicService, type MusicTrack, type MusicPlaylist } from '../services/musicService';
import { TrackRow, PlaylistCard } from '../components/music';

type Tab = 'all' | 'tracks' | 'playlists';

export const MusicSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { currentTrail } = useTrailStore();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const preparatorioId = currentTrail?.preparatorio_id;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, preparatorioId]);

  useEffect(() => {
    if (user?.id && tracks.length > 0) {
      checkFavorites();
    }
  }, [user?.id, tracks]);

  const performSearch = async (searchQuery: string) => {
    if (!preparatorioId || !searchQuery.trim()) return;

    setLoading(true);
    try {
      const [tracksData, playlistsData] = await Promise.all([
        musicService.searchTracks(preparatorioId, searchQuery),
        musicService.searchPlaylists(preparatorioId, searchQuery),
      ]);
      setTracks(tracksData);
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error searching:', error);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
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

  const filteredTracks = activeTab === 'playlists' ? [] : tracks;
  const filteredPlaylists = activeTab === 'tracks' ? [] : playlists;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] pb-24">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-[#FFB800]/20 to-transparent">
        <Link
          to="/music"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar faixas e playlists..."
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#FFB800]/50 focus:bg-white/15 transition-all text-lg"
            />
          </div>
        </form>

        {/* Tabs */}
        {(tracks.length > 0 || playlists.length > 0) && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'tracks'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Music className="w-4 h-4 inline mr-2" />
              Faixas
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'playlists'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ListMusic className="w-4 h-4 inline mr-2" />
              Playlists
            </button>
          </div>
        )}
      </div>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          </div>
        ) : (
          <>
            {/* No query state */}
            {!searchParams.get('q') && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Digite algo para buscar</p>
              </div>
            )}

            {/* No results state */}
            {searchParams.get('q') && tracks.length === 0 && playlists.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">
                  Nenhum resultado para "{searchParams.get('q')}"
                </p>
                <p className="text-sm">Tente buscar por outro termo</p>
              </div>
            )}

            {/* Tracks */}
            {filteredTracks.length > 0 && (
              <section className="mb-8">
                {activeTab === 'all' && (
                  <h2 className="text-xl font-bold text-white mb-4">Faixas</h2>
                )}

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
                {filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    isFavorite={favorites.has(track.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    tracks={filteredTracks}
                  />
                ))}
              </section>
            )}

            {/* Playlists */}
            {filteredPlaylists.length > 0 && (
              <section>
                {activeTab === 'all' && (
                  <h2 className="text-xl font-bold text-white mb-4">Playlists</h2>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredPlaylists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MusicSearch;
