import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Play, Loader2, Mic2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrailStore } from '../stores/useTrailStore';
import { useMusicPlayerStore } from '../stores/useMusicPlayerStore';
import { musicService, type MusicTrack, type MusicPlaylist, type MusicCategory } from '../services/musicService';
import { PlaylistCard, TrackRow, CategoryCard } from '../components/music';

export const Music: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { currentTrail } = useTrailStore();
    const { setQueue, play } = useMusicPlayerStore();

    const [loading, setLoading] = useState(true); // Começa como true
    const [recentTracks, setRecentTracks] = useState<MusicTrack[]>([]);
    const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
    const [categories, setCategories] = useState<MusicCategory[]>([]);
    const [lessonPodcastsMaterias, setLessonPodcastsMaterias] = useState<{ materia: string; count: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadedForPreparatorio, setLoadedForPreparatorio] = useState<string | null>(null);

    const preparatorioId = currentTrail?.preparatorio_id;

    // Carregar dados quando preparatorioId e user estiverem disponíveis
    useEffect(() => {
        // Se não temos preparatorioId ou user, aguardar (store pode estar hidratando)
        if (!preparatorioId || !user?.id) {
            // Dar um timeout curto para permitir hidratação
            const timeout = setTimeout(() => {
                if (!preparatorioId) {
                    setLoading(false); // Mostrar empty state se realmente não tem
                }
            }, 500);
            return () => clearTimeout(timeout);
        }

        // Se já carregamos para este preparatório, não carregar novamente
        if (loadedForPreparatorio === preparatorioId) {
            return;
        }

        loadData();
    }, [preparatorioId, user?.id, loadedForPreparatorio]);

    const loadData = async () => {
        if (!preparatorioId || !user?.id) return;

        setLoading(true);
        try {
            const [playlistsData, categoriesData, historyData, podcastsMaterias] = await Promise.all([
                musicService.getPublicPlaylists(preparatorioId),
                musicService.getCategories(preparatorioId),
                musicService.getHistory(user.id, 10),
                musicService.getLessonPodcastsMaterias(preparatorioId),
            ]);

            setPlaylists(playlistsData);
            setCategories(categoriesData);
            setRecentTracks(historyData);
            setLessonPodcastsMaterias(podcastsMaterias);
            setLoadedForPreparatorio(preparatorioId);
        } catch (error) {
            console.error('Error loading music data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/music/search?q=${encodeURIComponent(searchQuery)}`);
        }
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    // Mostrar loading enquanto carrega dados
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
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {getGreeting()}, {user?.user_metadata?.name?.split(' ')[0] || 'Aluno'}!
                    </h1>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="max-w-md">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="O que voce quer ouvir?"
                            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#FFB800]/50 focus:bg-white/15 transition-all"
                        />
                    </div>
                </form>
            </div>

            <div className="px-8 space-y-12">
                {/* Recent tracks */}
                {recentTracks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Tocados recentemente</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {recentTracks.slice(0, 5).map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        setQueue([track], 0);
                                        play(track);
                                    }}
                                    className="group bg-[#181818] hover:bg-[#282828] p-3 rounded-lg flex items-center gap-3 transition-all"
                                >
                                    <div className="w-12 h-12 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                                        {track.cover_url ? (
                                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-white font-medium truncate">{track.title}</p>
                                        <p className="text-gray-400 text-sm truncate">{track.artist || 'Artista'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Podcasts das Aulas */}
                {lessonPodcastsMaterias.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mic2 className="w-5 h-5 text-purple-400" />
                                Podcasts das Aulas
                            </h2>
                            <Link
                                to="/music/aulas"
                                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                            >
                                Ver todos
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {lessonPodcastsMaterias.slice(0, 6).map(({ materia, count }) => (
                                <Link
                                    key={materia}
                                    to={`/music/aulas?materia=${encodeURIComponent(materia)}`}
                                    className="bg-gradient-to-br from-purple-600 to-purple-900 p-4 rounded-lg hover:scale-105 transition-transform"
                                >
                                    <h3 className="text-white font-bold truncate">{materia}</h3>
                                    <p className="text-white/70 text-sm mt-1">{count} podcasts</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Categorias</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map((category) => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Playlists */}
                {playlists.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Playlists do Preparatorio</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {playlists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist.id}
                                    playlist={playlist}
                                    onPlay={() => handlePlayPlaylist(playlist)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {playlists.length === 0 && categories.length === 0 && recentTracks.length === 0 && lessonPodcastsMaterias.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Play className="w-12 h-12 text-gray-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Nada por aqui ainda</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            O preparatorio ainda nao adicionou conteudo ao modulo de musica.
                            Volte mais tarde!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Music;
