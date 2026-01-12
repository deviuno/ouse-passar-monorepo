import React, { useEffect, useRef } from 'react';
import { useMusicPlayerStore } from '../../stores/useMusicPlayerStore';

/**
 * AudioEngine - Componente invisível que mantém o elemento <audio> sempre montado.
 * Isso garante que a música continue tocando mesmo ao navegar para outras páginas.
 *
 * Este componente deve ser renderizado no nível mais alto da aplicação (MainLayout).
 */
export const AudioEngine: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentTrack,
    isPlaying,
    repeatMode,
    volume,
    isMuted,
    setAudioRef,
    setCurrentTime,
    setDuration,
    next,
  } = useMusicPlayerStore();

  // Registrar o audio ref no store ao montar
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    return () => setAudioRef(null);
  }, []);

  // Sincronizar volume e mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Atualizar source quando a track mudar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.audio_url) {
      audio.src = currentTrack.audio_url;
      audio.currentTime = 0;
    }
  }, [currentTrack]);

  // Controlar play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying && audio.paused) {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  // Event listeners do audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        next();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, next, setCurrentTime, setDuration]);

  // Elemento de áudio invisível - sempre montado
  return <audio ref={audioRef} preload="metadata" className="hidden" />;
};

export default AudioEngine;
