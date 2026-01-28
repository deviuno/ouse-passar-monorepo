import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  type?: 'explanation' | 'podcast';
}

// Gerar waveform aleatória mas consistente baseada na URL
function generateWaveform(seed: string, bars: number = 32): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const waveform: number[] = [];
  for (let i = 0; i < bars; i++) {
    // Pseudo-random baseado no hash e posição
    const x = Math.sin(hash * (i + 1) * 0.1) * 10000;
    const normalized = Math.abs(x - Math.floor(x));
    // Altura entre 20% e 100%
    waveform.push(0.2 + normalized * 0.8);
  }
  return waveform;
}

/**
 * Skeleton loader for AudioPlayer - shown while audio is being generated
 * Includes simulated progress bar
 */
export function AudioPlayerSkeleton() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        // 0-60% in 30s (2% per second, update every 500ms = 1%)
        if (prev < 60) return prev + 1;
        // 60-90% in 45s (0.67% per second, update every 500ms = 0.33%)
        if (prev < 90) return prev + 0.33;
        // 90-98% very slowly (stays here until audio arrives)
        if (prev < 98) return prev + 0.1;
        // Cap at 98% - will jump to 100% when real player loads
        return 98;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.round(progress);

  return (
    <div className="space-y-2">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">Gerando áudio...</span>
        <span className="tabular-nums font-medium">{progressPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFB800] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player skeleton */}
      <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-[#1A1A1A] rounded-full px-2 sm:px-3 py-2">
        {/* Play Button Skeleton - with subtle play icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-[#3A3A3A] flex items-center justify-center">
          <Play size={20} className="text-gray-200 dark:text-[#4A4A4A] ml-0.5" fill="currentColor" />
        </div>

        {/* Waveform Skeleton - static, no progress fill */}
        <div className="flex-1 flex items-center gap-[2px] h-6 min-w-[60px]">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 max-w-[4px] rounded-full bg-gray-300 dark:bg-[#3A3A3A]"
              style={{ height: `${20 + Math.sin(index * 0.5) * 30 + 30}%` }}
            />
          ))}
        </div>

        {/* Duration Skeleton */}
        <div className="flex-shrink-0 w-8 h-4 rounded bg-gray-300 dark:bg-[#3A3A3A] animate-pulse" />

        {/* Speed Button Skeleton */}
        <div className="flex-shrink-0 w-9 h-7 rounded-full bg-gray-300 dark:bg-[#3A3A3A] animate-pulse" />
      </div>
    </div>
  );
}

export function AudioPlayer({ src, type = 'explanation' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveform] = useState(() => generateWaveform(src));

  // Ciclo de velocidades
  const speedOptions = [1, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = speedOptions.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newRate = speedOptions[nextIndex];

    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * duration;
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-[#1A1A1A] rounded-full px-2 sm:px-3 py-2">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FFB800] hover:bg-[#FFC933] flex items-center justify-center transition-colors"
      >
        {isPlaying ? (
          <Pause size={20} className="text-black" fill="black" />
        ) : (
          <Play size={20} className="text-black ml-0.5" fill="black" />
        )}
      </button>

      {/* Waveform */}
      <div
        className="flex-1 flex items-center gap-[2px] h-6 cursor-pointer min-w-[60px]"
        onClick={handleWaveformClick}
      >
        {waveform.map((height, index) => {
          const barProgress = (index / waveform.length) * 100;
          const isPlayed = barProgress < progress;

          return (
            <div
              key={index}
              className={`flex-1 max-w-[4px] rounded-full transition-colors duration-100 ${
                isPlayed ? 'bg-[#FFB800]' : 'bg-gray-300 dark:bg-[#4A4A4A]'
              }`}
              style={{ height: `${height * 100}%` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="flex-shrink-0 text-xs text-gray-500 dark:text-[#A0A0A0] font-medium min-w-[32px] text-center tabular-nums">
        {formatTime(duration - currentTime)}
      </span>

      {/* Speed Button */}
      <button
        onClick={cycleSpeed}
        className="flex-shrink-0 w-9 h-7 rounded-full bg-gray-200 dark:bg-[#3A3A3A] hover:bg-gray-300 dark:hover:bg-[#4A4A4A] flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white transition-colors"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

export default AudioPlayer;
