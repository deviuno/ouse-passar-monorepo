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
    <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-full px-3 py-2">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-[#FFB800] hover:bg-[#FFC933] flex items-center justify-center transition-colors"
      >
        {isPlaying ? (
          <Pause size={18} className="text-black" fill="black" />
        ) : (
          <Play size={18} className="text-black ml-0.5" fill="black" />
        )}
      </button>

      {/* Waveform */}
      <div
        className="flex-1 flex items-center gap-[2px] h-6 cursor-pointer min-w-[100px]"
        onClick={handleWaveformClick}
      >
        {waveform.map((height, index) => {
          const barProgress = (index / waveform.length) * 100;
          const isPlayed = barProgress < progress;

          return (
            <div
              key={index}
              className={`flex-1 max-w-[4px] rounded-full transition-colors duration-100 ${
                isPlayed ? 'bg-[#FFB800]' : 'bg-[#4A4A4A]'
              }`}
              style={{ height: `${height * 100}%` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="flex-shrink-0 text-xs text-[#A0A0A0] font-medium min-w-[36px] text-center">
        {formatTime(duration - currentTime)}
      </span>

      {/* Speed Button */}
      <button
        onClick={cycleSpeed}
        className="flex-shrink-0 w-10 h-6 rounded-full bg-[#3A3A3A] hover:bg-[#4A4A4A] flex items-center justify-center text-xs font-medium text-white transition-colors"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

export default AudioPlayer;
