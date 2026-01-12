import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Music, X } from 'lucide-react';
import { useMusicPlayerStore, formatTime } from '../../stores/useMusicPlayerStore';

/**
 * FloatingMiniPlayer - Barra minimalista de player que aparece quando há música tocando
 * e o usuário está fora do módulo Music.
 *
 * Aparece como uma barra fixa no topo da área de conteúdo com controles essenciais.
 */
export const FloatingMiniPlayer: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    next,
    previous,
    clearQueue,
  } = useMusicPlayerStore();

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleNavigateToMusic = () => {
    navigate('/music');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearQueue();
  };

  return (
    <>
      {/* Desktop: Barra fixa no canto inferior direito */}
      <div className="hidden lg:block fixed bottom-4 right-4 z-50">
        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-80">
          {/* Progress bar no topo */}
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-[#FFB800] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-3 flex items-center gap-3">
            {/* Album art */}
            <button
              onClick={handleNavigateToMusic}
              className="w-12 h-12 bg-[#282828] rounded-lg overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-[#FFB800]/50 transition-all"
            >
              {currentTrack.cover_url ? (
                <img
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-[#FFB800]" />
                </div>
              )}
            </button>

            {/* Track info */}
            <button
              onClick={handleNavigateToMusic}
              className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <p className="text-white text-sm font-medium truncate">
                {currentTrack.title}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artist || 'Artista'} • {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={previous}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-[#FFB800] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black" fill="black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                )}
              </button>
              <button
                onClick={next}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-1 text-gray-500 hover:text-white transition-colors"
              title="Fechar player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Barra fixa acima do menu inferior */}
      <div className="lg:hidden fixed bottom-[72px] left-0 right-0 z-40">
        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-white/10">
          {/* Progress bar no topo */}
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-[#FFB800] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-4 py-2 flex items-center gap-3">
            {/* Album art */}
            <button
              onClick={handleNavigateToMusic}
              className="w-10 h-10 bg-[#282828] rounded-lg overflow-hidden flex-shrink-0"
            >
              {currentTrack.cover_url ? (
                <img
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-[#FFB800]" />
                </div>
              )}
            </button>

            {/* Track info */}
            <button
              onClick={handleNavigateToMusic}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-white text-sm font-medium truncate">
                {currentTrack.title}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artist || 'Artista'}
              </p>
            </button>

            {/* Animated bars when playing */}
            {isPlaying && (
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 h-3 bg-[#FFB800] animate-pulse" />
                <span className="w-0.5 h-4 bg-[#FFB800] animate-pulse" style={{ animationDelay: '0.1s' }} />
                <span className="w-0.5 h-2 bg-[#FFB800] animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 bg-[#FFB800] rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" fill="black" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={next}
              className="p-2 text-gray-400"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingMiniPlayer;
