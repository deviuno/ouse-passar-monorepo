import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Square } from 'lucide-react';
import { TimerPhase } from '../../stores/useStudyTimerStore';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: TimerPhase;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
  onStop: () => void;
  variant: 'mini' | 'expanded';
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  currentPhase,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
  onStop,
  variant,
}) => {
  const isIdle = currentPhase === 'idle' && !isRunning && !isPaused;

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-1">
        {isIdle ? (
          <button
            onClick={onStart}
            className="p-1.5 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-black transition-colors"
            title="Iniciar"
          >
            <Play className="w-4 h-4" fill="currentColor" />
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="p-1.5 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-black transition-colors"
            title="Continuar"
          >
            <Play className="w-4 h-4" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className="p-1.5 rounded-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] transition-colors"
            title="Pausar"
          >
            <Pause className="w-4 h-4" fill="currentColor" />
          </button>
        )}
      </div>
    );
  }

  // Expanded variant
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Reset */}
      <button
        onClick={onReset}
        className="p-2.5 rounded-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
        title="Reiniciar"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Main play/pause button */}
      {isIdle ? (
        <button
          onClick={onStart}
          className="w-14 h-14 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg"
          title="Iniciar"
        >
          <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
        </button>
      ) : isPaused ? (
        <button
          onClick={onResume}
          className="w-14 h-14 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg"
          title="Continuar"
        >
          <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={onPause}
          className="w-14 h-14 rounded-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] flex items-center justify-center hover:scale-105 transition-all shadow-lg"
          title="Pausar"
        >
          <Pause className="w-7 h-7" fill="currentColor" />
        </button>
      )}

      {/* Skip */}
      <button
        onClick={onSkip}
        className="p-2.5 rounded-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
        title="Pular para proxima fase"
        disabled={isIdle}
      >
        <SkipForward className="w-5 h-5" />
      </button>

      {/* Stop - only show when running or paused */}
      {(isRunning || isPaused) && (
        <button
          onClick={onStop}
          className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Parar completamente"
        >
          <Square className="w-5 h-5" fill="currentColor" />
        </button>
      )}
    </div>
  );
};

export default TimerControls;
