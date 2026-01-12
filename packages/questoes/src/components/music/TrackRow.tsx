import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Heart, Clock, ListPlus, Share2, Trash2, Music, Mic2 } from 'lucide-react';
import { MusicTrack, useMusicPlayerStore, formatTime } from '../../stores/useMusicPlayerStore';

interface TrackRowProps {
  track: MusicTrack;
  index?: number;
  showIndex?: boolean;
  showDuration?: boolean;
  showCover?: boolean;
  isFavorite?: boolean;
  isInPlaylist?: boolean; // Se está em uma playlist do usuário
  onFavoriteToggle?: (trackId: string) => void;
  onPlayTrack?: (track: MusicTrack) => void;
  onAddToPlaylist?: (track: MusicTrack) => void;
  onRemoveFromPlaylist?: (track: MusicTrack) => void;
  tracks?: MusicTrack[]; // All tracks in the list for queue
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index = 0,
  showIndex = true,
  showDuration = true,
  showCover = true,
  isFavorite = false,
  isInPlaylist = false,
  onFavoriteToggle,
  onPlayTrack,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  tracks,
}) => {
  const { currentTrack, isPlaying, play, pause, setQueue } = useMusicPlayerStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisPlaying = isCurrentTrack && isPlaying;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

  const handleClick = () => {
    // Single click: play the track
    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      if (tracks && tracks.length > 0) {
        setQueue(tracks, index);
        play(track);
      } else if (onPlayTrack) {
        onPlayTrack(track);
      } else {
        play(track);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) {
      // Position menu near the click, but ensure it stays on screen
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 200);
      setContextMenuPosition({ x, y });
    }
    setShowContextMenu(true);
  };

  const handleContextAction = (action: string) => {
    setShowContextMenu(false);
    switch (action) {
      case 'favorite':
        onFavoriteToggle?.(track.id);
        break;
      case 'addToPlaylist':
        onAddToPlaylist?.(track);
        break;
      case 'removeFromPlaylist':
        onRemoveFromPlaylist?.(track);
        break;
      case 'share':
        // Copy track info to clipboard
        navigator.clipboard.writeText(`${track.title} - ${track.artist || 'Artista'}`);
        break;
    }
  };

  return (
    <>
      <div
        ref={rowRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleDoubleClick}
        className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer select-none hover:bg-white/10 ${isCurrentTrack ? 'bg-white/5' : ''
          }`}
      >
        {/* Index / Play indicator */}
        {showIndex && (
          <div className="w-6 text-center flex-shrink-0">
            <span className={`group-hover:hidden ${isCurrentTrack ? 'text-[#FFB800]' : 'text-gray-400'} text-sm`}>
              {isThisPlaying ? (
                <span className="flex items-center justify-center gap-0.5">
                  <span className="w-0.5 h-3 bg-[#FFB800] animate-pulse" />
                  <span className="w-0.5 h-4 bg-[#FFB800] animate-pulse delay-75" />
                  <span className="w-0.5 h-2 bg-[#FFB800] animate-pulse delay-150" />
                </span>
              ) : (
                index + 1
              )}
            </span>
            <span className="hidden group-hover:flex items-center justify-center text-white">
              {isThisPlaying ? (
                <Pause className="w-4 h-4" fill="white" />
              ) : (
                <Play className="w-4 h-4" fill="white" />
              )}
            </span>
          </div>
        )}

        {/* Cover */}
        {showCover && (
          <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {track.is_podcast || track.materia ? (
                  <Mic2 className="w-4 h-4 text-purple-400" />
                ) : (
                  <Music className="w-4 h-4 text-gray-600" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Track info - takes all available space */}
        <div className="flex-1 min-w-0 mr-2">
          <p className={`font-medium truncate ${isCurrentTrack ? 'text-[#FFB800]' : 'text-white'}`}>
            {track.assunto || track.title}
          </p>
          <p className="text-gray-400 text-sm truncate">
            {track.materia || track.artist || 'Artista desconhecido'}
          </p>
        </div>

        {/* Favorite indicator - always visible if favorited, shows on hover otherwise */}
        {onFavoriteToggle && (
          <Heart
            className={`w-4 h-4 flex-shrink-0 transition-opacity ${isFavorite
                ? 'text-[#FFB800] fill-current opacity-100'
                : 'text-gray-400 opacity-0 group-hover:opacity-100'
              }`}
          />
        )}

        {/* Duration */}
        {showDuration && (
          <span className="text-gray-400 text-sm flex-shrink-0 tabular-nums">
            {formatTime(track.duration_seconds)}
          </span>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#282828] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[180px]"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => handleContextAction('favorite')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-[#FFB800] fill-current' : ''}`} />
            <span className="text-sm">{isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span>
          </button>

          <button
            onClick={() => handleContextAction('addToPlaylist')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
          >
            <ListPlus className="w-4 h-4" />
            <span className="text-sm">Adicionar a playlist</span>
          </button>

          {isInPlaylist && (
            <button
              onClick={() => handleContextAction('removeFromPlaylist')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Remover da playlist</span>
            </button>
          )}

          <div className="border-t border-white/10 my-1" />

          <button
            onClick={() => handleContextAction('share')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Copiar nome da musica</span>
          </button>
        </div>
      )}
    </>
  );
};

export default TrackRow;
