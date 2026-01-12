import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  ListMusic,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react';
import { useMusicPlayerStore, formatTime } from '../../stores/useMusicPlayerStore';

/**
 * TopMusicPlayer - Player fixo no topo da tela que aparece quando há música tocando.
 * Persiste durante a navegação em todas as páginas do app.
 * Clicando no player abre a visualização expandida com playlist.
 */
export const TopMusicPlayer: React.FC = () => {
  const navigate = useNavigate();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    queueIndex,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playTrackAtIndex,
    clearQueue,
  } = useMusicPlayerStore();

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearQueue();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Expanded full-screen player view
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={toggleExpanded}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <span className="text-gray-400 text-sm uppercase tracking-wide">
            Tocando agora
          </span>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Player section */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            {/* Cover */}
            <div className="w-64 h-64 md:w-80 md:h-80 bg-[#282828] rounded-lg overflow-hidden shadow-2xl mb-8 flex-shrink-0">
              {currentTrack.cover_url ? (
                <img
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFB800]/20 to-orange-500/20">
                  <Music className="w-24 h-24 text-[#FFB800]/50" />
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{currentTrack.title}</h2>
              <p className="text-gray-400">{currentTrack.materia || currentTrack.artist || 'Ouse Passar'}</p>
            </div>

            {/* Progress */}
            <div className="w-full max-w-md mb-6">
              <div
                onClick={handleProgressClick}
                className="h-1 bg-gray-600 rounded-full cursor-pointer group"
              >
                <div
                  className="h-full bg-white group-hover:bg-[#FFB800] rounded-full relative transition-colors"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${isShuffled ? 'text-[#FFB800]' : 'text-gray-400 hover:text-white'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button onClick={previous} className="p-2 text-gray-400 hover:text-white transition-colors">
                <SkipBack className="w-8 h-8" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-black" fill="black" />
                ) : (
                  <Play className="w-8 h-8 text-black ml-1" fill="black" />
                )}
              </button>
              <button onClick={next} className="p-2 text-gray-400 hover:text-white transition-colors">
                <SkipForward className="w-8 h-8" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-[#FFB800]' : 'text-gray-400 hover:text-white'}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume - desktop */}
            <div className="hidden lg:flex items-center gap-3 mt-6">
              <button onClick={toggleMute} className="p-2 text-gray-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-32 accent-[#FFB800]"
              />
            </div>
          </div>

          {/* Queue section */}
          <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[40vh] lg:max-h-full">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#FFB800]" />
                <h3 className="text-white font-bold">Fila de reproducao</h3>
              </div>
              <button
                onClick={clearQueue}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Limpar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {queue.map((track, index) => (
                <button
                  key={`${track.id}-${index}`}
                  onClick={() => playTrackAtIndex(index)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                    index === queueIndex ? 'bg-white/10' : ''
                  }`}
                >
                  <span className="text-gray-500 text-sm w-6 text-center">
                    {index === queueIndex ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-[#FFB800] animate-pulse" />
                        <span className="w-0.5 h-4 bg-[#FFB800] animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-2 bg-[#FFB800] animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-left flex-1">
                    <p className={`truncate text-sm ${index === queueIndex ? 'text-[#FFB800]' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {track.materia || track.artist || 'Ouse Passar'}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs">{formatTime(track.duration_seconds)}</span>
                </button>
              ))}
              {queue.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">Nenhuma musica na fila</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mini player bar at top
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-b border-white/10 shadow-lg">
      {/* Progress bar no topo */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="h-1 bg-white/10 cursor-pointer group"
      >
        <div
          className="h-full bg-[#FFB800] group-hover:bg-[#FFC933] transition-all duration-150 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#FFB800] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="px-4 py-2 flex items-center gap-3">
        {/* Album art - clicavel para expandir */}
        <button
          onClick={toggleExpanded}
          className="w-12 h-12 bg-[#282828] rounded-lg overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-[#FFB800]/50 transition-all group"
        >
          {currentTrack.cover_url ? (
            <img
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFB800]/20 to-orange-500/20">
              <Music className="w-6 h-6 text-[#FFB800]" />
            </div>
          )}
        </button>

        {/* Track info - clicavel para expandir */}
        <button
          onClick={toggleExpanded}
          className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <p className="text-white text-sm font-medium truncate">
            {currentTrack.title}
          </p>
          <p className="text-gray-400 text-xs truncate">
            {currentTrack.materia || currentTrack.artist || 'Ouse Passar'}
          </p>
        </button>

        {/* Time display - desktop only */}
        <div className="hidden md:block text-xs text-gray-400 whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={previous}
            className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-[#FFB800] hover:bg-[#FFC933] rounded-full flex items-center justify-center hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black" fill="black" />
            ) : (
              <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume - desktop only */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 accent-[#FFB800] h-1"
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-2 text-gray-500 hover:text-white transition-colors"
          title="Fechar player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TopMusicPlayer;
