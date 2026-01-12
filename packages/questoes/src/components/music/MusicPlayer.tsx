import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { useMusicPlayerStore, formatTime } from '../../stores/useMusicPlayerStore';

export const MusicPlayer: React.FC = () => {
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isPlayerExpanded,
    isQueueOpen,
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
    togglePlayerExpanded,
    toggleQueueOpen,
    playTrackAtIndex,
    clearQueue,
  } = useMusicPlayerStore();

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Não renderiza nada se não tiver track
  if (!currentTrack) return null;

  return (
    <>
        <div
          className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 z-50 transition-all duration-300 ${isPlayerExpanded ? 'h-screen bg-black' : 'h-24'
            }`}
        >
          {/* Expanded view */}
          {isPlayerExpanded && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <button
                  onClick={togglePlayerExpanded}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
                <span className="text-gray-400 text-sm uppercase tracking-wide">
                  {isQueueOpen ? 'Fila de reproducao' : 'Tocando agora'}
                </span>
                <button
                  onClick={toggleQueueOpen}
                  className={`p-2 transition-colors ${isQueueOpen ? 'text-[#FFB800]' : 'text-gray-400 hover:text-white'}`}
                >
                  <ListMusic className="w-6 h-6" />
                </button>
              </div>

              {/* Main content - switches between player and queue */}
              {!isQueueOpen ? (
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
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="w-24 h-24 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{currentTrack.title}</h2>
                    <p className="text-gray-400">{currentTrack.artist || 'Artista desconhecido'}</p>
                  </div>

                  {/* Progress */}
                  <div className="w-full max-w-md mb-6">
                    <div
                      ref={progressRef}
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
                        <Pause className="w-9 h-9 text-black" fill="black" />
                      ) : (
                        <Play className="w-9 h-9 text-black ml-1" fill="black" />
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
                </div>
              ) : (
                /* Queue view */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Currently playing */}
                  <div className="p-4 border-b border-white/10">
                    <p className="text-xs text-gray-400 uppercase mb-2">Tocando agora</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                        {currentTrack.cover_url ? (
                          <img src={currentTrack.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ListMusic className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[#FFB800] font-medium truncate">{currentTrack.title}</p>
                        <p className="text-gray-400 text-sm truncate">{currentTrack.artist || 'Artista desconhecido'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Queue list */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400 uppercase">Proximas ({queue.length - queueIndex - 1})</p>
                        <button
                          onClick={clearQueue}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Limpar fila
                        </button>
                      </div>
                      <div className="space-y-1">
                        {queue.slice(queueIndex + 1).map((track, idx) => (
                          <button
                            key={`${track.id}-${idx}`}
                            onClick={() => playTrackAtIndex(queueIndex + 1 + idx)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <span className="text-gray-500 text-sm w-5">{idx + 1}</span>
                            <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                              {track.cover_url ? (
                                <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ListMusic className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-white text-sm truncate">{track.title}</p>
                              <p className="text-gray-400 text-xs truncate">{track.artist || 'Artista'}</p>
                            </div>
                            <span className="text-gray-500 text-xs">{formatTime(track.duration_seconds)}</span>
                          </button>
                        ))}
                        {queue.length - queueIndex - 1 === 0 && (
                          <p className="text-gray-500 text-sm text-center py-8">Nenhuma musica na fila</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mini controls at bottom */}
                  <div className="p-4 border-t border-white/10 flex items-center justify-center gap-6">
                    <button onClick={previous} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <SkipBack className="w-6 h-6" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-black" fill="black" />
                      ) : (
                        <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
                      )}
                    </button>
                    <button onClick={next} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mini player */}
          {!isPlayerExpanded && (
            <div className="h-full flex items-center px-4 gap-4">
              {/* Track info */}
              <button onClick={togglePlayerExpanded} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                  {currentTrack.cover_url ? (
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ListMusic className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{currentTrack.title}</p>
                  <p className="text-gray-400 text-sm truncate">{currentTrack.artist || 'Artista desconhecido'}</p>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={previous} className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-black" fill="black" />
                  ) : (
                    <Play className="w-7 h-7 text-black ml-0.5" fill="black" />
                  )}
                </button>
                <button onClick={next} className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar (mini) */}
              <div className="hidden md:block flex-1 max-w-md">
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="h-1 bg-gray-600 rounded-full cursor-pointer group"
                >
                  <div
                    className="h-full bg-white group-hover:bg-[#FFB800] rounded-full transition-colors"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume */}
              <div className="hidden lg:flex items-center gap-2">
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
                  className="w-24 accent-[#FFB800]"
                />
              </div>

              {/* Queue button */}
              <button
                onClick={toggleQueueOpen}
                className={`p-2 transition-colors hidden sm:block ${isQueueOpen ? 'text-[#FFB800]' : 'text-gray-400 hover:text-white'}`}
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Queue drawer */}
          {isQueueOpen && !isPlayerExpanded && (
            <div className="absolute bottom-full right-0 w-80 max-h-96 bg-[#282828] border border-white/10 rounded-t-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-bold">Fila de reproducao</h3>
                <button onClick={clearQueue} className="text-gray-400 hover:text-white text-sm">
                  Limpar
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {queue.map((track, index) => (
                  <button
                    key={`${track.id}-${index}`}
                    onClick={() => playTrackAtIndex(index)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${index === queueIndex ? 'bg-white/10' : ''
                      }`}
                  >
                    <div className="w-10 h-10 bg-[#121212] rounded overflow-hidden flex-shrink-0">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ListMusic className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className={`truncate ${index === queueIndex ? 'text-[#FFB800]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-sm truncate">{track.artist || 'Artista desconhecido'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </>
  );
};

export default MusicPlayer;
