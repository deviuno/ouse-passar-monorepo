import React from 'react';
import { TimerPhase, formatTimerTime, PomodoroSettings } from '../../stores/useStudyTimerStore';

interface TimerDisplayProps {
  timeRemaining: number;
  currentPhase: TimerPhase;
  isRunning: boolean;
  isPaused: boolean;
  settings: PomodoroSettings;
  variant: 'mini' | 'expanded';
}

const PHASE_CONFIG: Record<TimerPhase, { label: string; color: string; bgColor: string; icon: string }> = {
  study: {
    label: 'Estudo',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '📖',
  },
  break: {
    label: 'Intervalo',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: '☕',
  },
  long_break: {
    label: 'Intervalo Longo',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '🧘',
  },
  idle: {
    label: 'Pronto',
    color: '#FFB800',
    bgColor: 'rgba(255, 184, 0, 0.1)',
    icon: '🍅',
  },
};

const getDurationForPhase = (phase: TimerPhase, settings: PomodoroSettings): number => {
  switch (phase) {
    case 'study':
      return settings.studyDuration;
    case 'break':
      return settings.breakDuration;
    case 'long_break':
      return settings.longBreakDuration;
    case 'idle':
    default:
      return settings.studyDuration;
  }
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  currentPhase,
  isRunning,
  isPaused,
  settings,
  variant,
}) => {
  const config = PHASE_CONFIG[currentPhase];
  const totalDuration = getDurationForPhase(currentPhase, settings);
  const progress = totalDuration > 0 ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 0;

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-base">{config.icon}</span>
        <span
          className="font-mono text-base font-semibold tabular-nums"
          style={{ color: isRunning ? config.color : 'var(--color-text-muted)' }}
        >
          {formatTimerTime(timeRemaining)}
        </span>
        {isPaused && (
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
            pausado
          </span>
        )}
      </div>
    );
  }

  // Expanded variant with circular progress
  const size = 160;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: isRunning ? `drop-shadow(0 0 6px ${config.color}40)` : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ color: isRunning ? config.color : 'var(--color-text-main)' }}
          >
            {formatTimerTime(timeRemaining)}
          </span>
          <span
            className="text-xs uppercase tracking-wider mt-1"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {isPaused && (
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase mt-0.5">
              pausado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
