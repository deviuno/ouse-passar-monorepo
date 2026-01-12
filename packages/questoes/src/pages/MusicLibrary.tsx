import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Heart, Clock, ListMusic, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type MusicTrack, type MusicPlaylist } from '../services/musicService';
import { TrackRow, PlaylistCard } from '../components/music';

type Tab = 'playlists' | 'favorites';

export const MusicLibrary: React.FC = () => {
    const { user } = useAuthStore();
    const { currentTrail } = useTrailStore();
    const { setQueue, play } = useMusicPlayerStore();

    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('playlists');
    const [favorites, setFavorites] = useState<MusicTrack[]>([]);
    const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    const preparatorioId = currentTrail?.preparatorio_id;

    useEffect(() => {
        if (user?.id && !dataLoaded) {
            loadData();
        }
    }, [user?.id, preparatorioId, dataLoaded]);

    useEffect(() => {
        setDataLoaded(false);
    }, [user?.id, preparatorioId]);

    const loadData = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const [favoritesData, playlistsData] = await Promise.all([
                musicService.getFavorites(user.id),
                musicService.getUserPlaylists(user.id),
            ]);
            setFavorites(favoritesData);
            setPlaylists(playlistsData);
            setDataLoaded(true);
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = async (trackId: string) => {
        if (!user?.id) return;

        try {
            await musicService.toggleFavorite(user.id, trackId);
            setFavorites((prev) => prev.filter((t) => t.id !== trackId));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handlePlayFavorites = () => {
        if (favorites.length === 0) return;
        setQueue(favorites, 0);
        play(favorites[0]);
    };

    const handlePlayPlaylist = async (playlist: MusicPlaylist) => {
        try {
            const data = await musicService.getPlaylistWithTracks(playlist.id);
            if (data?.tracks && data.tracks.length > 0) {
                setQueue(data.tracks, 0);
                play(data.tracks[0]);
            }
        } catch (error) {
            console.error('Error playing playlist:', error);
        }
    };

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !preparatorioId || !newPlaylistName.trim()) return;

        setCreating(true);
        try {
            await musicService.createPlaylist(preparatorioId, user.id, {
                name: newPlaylistName.trim(),
            });
            setNewPlaylistName('');
            setShowCreateModal(false);
            loadData();
        } catch (error) {
            console.error('Error creating playlist:', error);
        } finally {
            setCreating(false);
        }
    };

    // Mostrar loading enquanto espera store hydrate ou carrega dados
    if (loading || (!dataLoaded && user?.id)) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
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

                <h1 className="text-3xl font-bold text-white">Sua Biblioteca</h1>

                {/* Tabs */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'playlists'
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        <ListMusic className="w-4 h-4 inline mr-2" />
                        Playlists
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'favorites'
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        <Heart className="w-4 h-4 inline mr-2" />
                        Favoritos
                    </button>
                </div>
            </div>

            <div className="px-8">
                {/* Playlists Tab */}
                {activeTab === 'playlists' && (
                    <div>
                        {/* Create button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full mb-6 p-4 bg-[#282828] border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Criar nova playlist
                        </button>

                        {playlists.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {playlists.map((playlist) => (
                                    <PlaylistCard
                                        key={playlist.id}
                                        playlist={playlist}
                                        onPlay={() => handlePlayPlaylist(playlist)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Voce ainda nao criou nenhuma playlist</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                    <div>
                        {favorites.length > 0 ? (
                            <>
                                {/* Play all button */}
                                <button
                                    onClick={handlePlayFavorites}
                                    className="mb-6 px-6 py-3 bg-[#FFB800] text-black font-bold rounded-full hover:scale-105 transition-transform"
                                >
                                    Reproduzir todos
                                </button>

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

                                {/* Tracks */}
                                {favorites.map((track, index) => (
                                    <TrackRow
                                        key={track.id}
                                        track={track}
                                        index={index}
                                        isFavorite={true}
                                        onFavoriteToggle={handleFavoriteToggle}
                                        tracks={favorites}
                                    />
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Voce ainda nao favoritou nenhuma faixa</p>
                                <Link to="/music" className="text-[#FFB800] hover:underline mt-2 block">
                                    Explorar musicas
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#282828] rounded-lg w-full max-w-sm p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Criar playlist</h2>
                        <form onSubmit={handleCreatePlaylist}>
                            <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Nome da playlist"
                                autoFocus
                                className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FFB800]/50 mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newPlaylistName.trim()}
                                    className="px-6 py-2 bg-[#FFB800] text-black font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {creating ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicLibrary;
