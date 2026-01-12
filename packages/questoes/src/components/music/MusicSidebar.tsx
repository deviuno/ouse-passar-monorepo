import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, Heart, ListMusic } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { musicService, type MusicPlaylist } from '../../services/musicService';

interface MusicSidebarProps {
    onNavigate?: () => void;
}

export const MusicSidebar: React.FC<MusicSidebarProps> = ({ onNavigate }) => {
    const { user } = useAuthStore();
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
        { icon: Home, label: 'Início', path: '/music', exact: true },
        { icon: Search, label: 'Buscar', path: '/music/search' },
        { icon: Library, label: 'Sua Biblioteca', path: '/music/library' },
    ];

    return (
        <aside className="w-64 bg-black h-full flex flex-col flex-shrink-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8 text-white">
                    <ListMusic className="w-8 h-8" />
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
                                `flex items-center gap-4 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-6 h-6" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8 space-y-4">
                    <button className="flex items-center gap-4 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full text-left group">
                        <div className="w-6 h-6 bg-gray-300 group-hover:bg-white rounded-sm flex items-center justify-center transition-colors">
                            <PlusSquare className="w-4 h-4 text-black" />
                        </div>
                        Criar playlist
                    </button>
                    <NavLink
                        to="/music/library"
                        onClick={onNavigate}
                        className="flex items-center gap-4 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-blue-300 rounded-sm flex items-center justify-center opacity-70">
                            <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                        Músicas Curtidas
                    </NavLink>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 border-t border-[#282828] mx-6 pt-4">
                <ul className="space-y-3">
                    {playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <NavLink
                                to={`/music/playlist/${playlist.id}`}
                                onClick={onNavigate}
                                className={({ isActive }) =>
                                    `text-sm truncate block ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
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
