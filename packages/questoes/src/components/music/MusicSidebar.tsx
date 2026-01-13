import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, Heart, ListMusic, Send, FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { musicService, type MusicPlaylist } from '../../services/musicService';
import { useTheme } from '../../contexts/ThemeContext';

interface MusicSidebarProps {
    onNavigate?: () => void;
}

export const MusicSidebar: React.FC<MusicSidebarProps> = ({ onNavigate }) => {
    const { user } = useAuthStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadPlaylists();
        }
    }, [user?.id]);

    const loadPlaylists = async () => {
        if (!user?.id) return;
        try {
            const data = await musicService.getUserPlaylists(user.id);
            setPlaylists(data);
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    };

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/music', exact: true },
        { icon: Search, label: 'Buscar', path: '/music/search' },
        { icon: Library, label: 'Sua Biblioteca', path: '/music/library' },
        { icon: Send, label: 'Solicitar Audio', path: '/music/solicitar' },
        { icon: FileText, label: 'Minhas Solicitacoes', path: '/music/solicitacoes' },
    ];

    return (
        <aside className={`w-64 h-full flex flex-col flex-shrink-0 ${
            isDark ? 'bg-black' : 'bg-[#FAFAF8] border-r border-black/5'
        }`}>
            <div className="p-6">
                <div className={`flex items-center gap-2 mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <ListMusic className="w-8 h-8 text-[#FFB800]" />
                    <span className="text-xl font-bold font-display">Ouse Music</span>
                </div>

                <nav className="space-y-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                `flex items-center gap-4 text-sm font-medium transition-colors ${
                                    isDark
                                        ? isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                        : isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                }`
                            }
                        >
                            <item.icon className="w-6 h-6" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8 space-y-4">
                    <button className={`flex items-center gap-4 text-sm font-medium transition-colors w-full text-left group ${
                        isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}>
                        <div className={`w-6 h-6 rounded-sm flex items-center justify-center transition-colors ${
                            isDark
                                ? 'bg-gray-300 group-hover:bg-white'
                                : 'bg-gray-200 group-hover:bg-gray-300'
                        }`}>
                            <PlusSquare className="w-4 h-4 text-black" />
                        </div>
                        Criar playlist
                    </button>
                    <NavLink
                        to="/music/library"
                        onClick={onNavigate}
                        className={`flex items-center gap-4 text-sm font-medium transition-colors ${
                            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-blue-300 rounded-sm flex items-center justify-center opacity-70">
                            <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                        Músicas Curtidas
                    </NavLink>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto px-6 mx-6 pt-4 border-t ${
                isDark ? 'border-[#282828]' : 'border-gray-200'
            }`}>
                <ul className="space-y-3">
                    {playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <NavLink
                                to={`/music/playlist/${playlist.id}`}
                                onClick={onNavigate}
                                className={({ isActive }) =>
                                    `text-sm truncate block ${
                                        isDark
                                            ? isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                            : isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                    }`
                                }
                            >
                                {playlist.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};
