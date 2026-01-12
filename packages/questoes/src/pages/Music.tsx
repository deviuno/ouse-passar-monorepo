import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Play, Loader2, Mic2, ChevronRight, Sparkles, Music as MusicIcon, Send } from 'lucide-react';
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
    const [allTracks, setAllTracks] = useState<MusicTrack[]>([]);
    const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
    const [categories, setCategories] = useState<MusicCategory[]>([]);
    const [lessonPodcastsMaterias, setLessonPodcastsMaterias] = useState<{ materia: string; count: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadedData, setLoadedData] = useState(false);

    const preparatorioId = currentTrail?.preparatorio_id;

    // Carregar dados quando user estiver disponível
    useEffect(() => {
        // Se não temos user, aguardar (store pode estar hidratando)
        if (!user?.id) {
            const timeout = setTimeout(() => {
                setLoading(false);
            }, 500);
            return () => clearTimeout(timeout);
        }

        // Se já carregamos, não carregar novamente
        if (loadedData) {
            return;
        }

        loadData();
    }, [user?.id, loadedData, preparatorioId]);

    const loadData = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            // Faixas e categorias são globais
            const [tracksData, categoriesData, historyData, podcastsMaterias] = await Promise.all([
                musicService.getTracks(),
                musicService.getCategories(),
                musicService.getHistory(user.id, 10),
                musicService.getLessonPodcastsMaterias(),
            ]);

            setAllTracks(tracksData);
            setCategories(categoriesData);
            setRecentTracks(historyData);
            setLessonPodcastsMaterias(podcastsMaterias);

            // Playlists dependem de preparatorio (se disponível)
            if (preparatorioId) {
                const playlistsData = await musicService.getPublicPlaylists(preparatorioId);
                setPlaylists(playlistsData);
            }

            setLoadedData(true);
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

                {/* Músicas */}
                {allTracks.filter(t => !t.is_podcast).length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MusicIcon className="w-5 h-5 text-[#FFB800]" />
                                Músicas Educativas
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {allTracks.filter(t => !t.is_podcast).map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        setQueue([track], 0);
                                        play(track);
                                    }}
                                    className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-lg text-left transition-all"
                                >
                                    <div className="aspect-square bg-[#282828] rounded-md mb-3 overflow-hidden relative">
                                        {track.cover_url ? (
                                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFB800]/20 to-orange-500/20">
                                                <MusicIcon className="w-12 h-12 text-[#FFB800]/50" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#FFB800] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                                            <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                                        </div>
                                    </div>
                                    <p className="text-white font-medium truncate">{track.title}</p>
                                    <p className="text-gray-400 text-sm truncate">{track.materia || track.artist || 'Música'}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Podcasts */}
                {allTracks.filter(t => t.is_podcast).length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mic2 className="w-5 h-5 text-purple-400" />
                                Podcasts
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {allTracks.filter(t => t.is_podcast).map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        setQueue([track], 0);
                                        play(track);
                                    }}
                                    className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-lg text-left transition-all"
                                >
                                    <div className="aspect-square bg-[#282828] rounded-md mb-3 overflow-hidden relative">
                                        {track.cover_url ? (
                                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-900/20">
                                                <Mic2 className="w-12 h-12 text-purple-400/50" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                                        </div>
                                    </div>
                                    <p className="text-white font-medium truncate">{track.title}</p>
                                    <p className="text-gray-400 text-sm truncate">{track.materia || 'Podcast'}</p>
                                </button>
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

                {/* Request Audio Card */}
                <section>
                    <Link
                        to="/music/solicitar"
                        className="block bg-gradient-to-r from-[#FFB800]/20 via-[#FFB800]/10 to-purple-500/20 border border-[#FFB800]/30 rounded-2xl p-6 hover:border-[#FFB800]/50 hover:scale-[1.01] transition-all group"
                    >
                        <div className="flex items-center gap-6">
                            {/* Icon */}
                            <div className="w-16 h-16 bg-gradient-to-br from-[#FFB800] to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-8 h-8 text-black" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                    Solicitar Audio
                                    <span className="text-xs bg-[#FFB800]/20 text-[#FFB800] px-2 py-0.5 rounded-full font-medium">
                                        Novo
                                    </span>
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Nao encontrou o que procurava? Solicite uma musica ou podcast sobre qualquer tema do seu preparatorio!
                                </p>
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0 hidden sm:flex items-center gap-2 text-[#FFB800]">
                                <span className="text-sm font-medium">Solicitar</span>
                                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <MusicIcon className="w-4 h-4 text-[#FFB800]" />
                                <span>Musicas educativas</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Mic2 className="w-4 h-4 text-purple-400" />
                                <span>Podcasts explicativos</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Sparkles className="w-4 h-4 text-green-400" />
                                <span>Gerado com IA</span>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Empty state */}
                {playlists.length === 0 && categories.length === 0 && recentTracks.length === 0 && lessonPodcastsMaterias.length === 0 && allTracks.length === 0 && (
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
