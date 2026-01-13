import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ListMusic } from 'lucide-react';
import { useMusicPlayerStore } from '../../stores/useMusicPlayerStore';
import type { MusicPlaylist } from '../../services/musicService';
import { useTheme } from '../../contexts/ThemeContext';

interface PlaylistCardProps {
  playlist: MusicPlaylist;
  onPlay?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPlay }) => {
  const { play, setQueue } = useMusicPlayerStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    }
  };

  return (
    <Link
      to={`/music/playlist/${playlist.id}`}
      className={`group p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 block ${
        isDark
          ? 'bg-[#181818]/60 hover:bg-[#282828]'
          : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
      }`}
    >
      {/* Cover */}
      <div className="relative aspect-square mb-4 rounded-md overflow-hidden shadow-lg">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark
              ? 'bg-gradient-to-br from-[#282828] to-[#121212]'
              : 'bg-gradient-to-br from-gray-100 to-gray-200'
          }`}>
            <ListMusic className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
        )}

        {/* Play button overlay */}
        <button
          onClick={handlePlayClick}
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#FFB800] rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
        >
          <Play className="w-6 h-6 text-black ml-0.5" />
        </button>
      </div>

      {/* Info */}
      <h3 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{playlist.name}</h3>
      <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {playlist.description || `${playlist.track_count} faixas`}
      </p>
    </Link>
  );
};

export default PlaylistCard;
