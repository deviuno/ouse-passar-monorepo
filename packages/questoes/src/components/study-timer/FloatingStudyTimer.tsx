import React, { useState, useEffect, useRef } from 'react';
import { Settings, Clock, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useStudyTimer, useStudyTimerStore, formatTotalTime } from '../../stores/useStudyTimerStore';
import { getTodayStudyTime } from '../../services/pomodoroService';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { PhaseIndicator } from './PhaseIndicator';
import { PomodoroSettings } from './PomodoroSettings';

interface FloatingStudyTimerProps {
  sidebarWidth?: number; // Width of sidebar in pixels (for desktop positioning)
}

export const FloatingStudyTimer: React.FC<FloatingStudyTimerProps> = ({ sidebarWidth = 256 }) => {
  const {
    isVisible,
    isExpanded,
    isRunning,
    isPaused,
    currentPhase,
    timeRemaining,
    settings,
    completedSessions,
    totalStudyTimeToday,
    start,
    pause,
    resume,
    reset,
    skip,
    stop,
    toggle,
    toggleExpanded,
    setSettings,
    setTotalStudyTimeToday,
  } = useStudyTimer();

  const [showSettings, setShowSettings] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasRehydrated = useRef(false);

  // Handle timer rehydration on mount
  useEffect(() => {
    if (hasRehydrated.current) return;
    hasRehydrated.current = true;

    // Reset daily totals if it's a new day
    const lastDate = localStorage.getItem('study-timer-last-date');
    const today = new Date().toDateString();

    if (lastDate !== today) {
      setTotalStudyTimeToday(0);
      localStorage.setItem('study-timer-last-date', today);
    }

    // If timer was running when page closed, restart the interval
    if (isRunning && !isPaused) {
      useStudyTimerStore.getState()._startInterval();
    }
  }, [isRunning, isPaused, setTotalStudyTimeToday]);

  // Fetch today's study time from server on mount
  useEffect(() => {
    const fetchTodayTime = async () => {
      try {
        const seconds = await getTodayStudyTime();
        if (seconds > totalStudyTimeToday) {
          setTotalStudyTimeToday(seconds);
        }
      } catch (error) {
        console.error('[FloatingStudyTimer] Error fetching today time:', error);
      }
    };

    fetchTodayTime();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase colors for border glow
  const phaseColors: Record<string, string> = {
    study: '#10B981',
    break: '#3B82F6',
    long_break: '#8B5CF6',
    idle: '#FFB800',
  };

  const currentColor = phaseColors[currentPhase] || phaseColors.idle;
  const isActive = isRunning || isPaused;

  // Calculate left position for desktop (sidebar width + padding)
  const desktopLeft = sidebarWidth + 24; // 24px padding from sidebar edge

  // Check if we're on desktop (lg breakpoint = 1024px)
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Position styles
  const positionStyle = isDesktop
    ? { left: desktopLeft, bottom: 16 }
    : { left: 16, bottom: 80 };

  if (!isVisible) {
    // Show small toggle button when timer is hidden
    return (
      <button
        onClick={toggle}
        className="fixed z-40 p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full shadow-lg hover:bg-[var(--color-bg-elevated)] transition-all"
        style={positionStyle}
        title="Mostrar timer de estudo"
      >
        <Clock className="w-5 h-5 text-[#FFB800]" />
      </button>
    );
  }

  // Minimized pill view
  if (!isExpanded) {
    return (
      <>
        <div
          className={`
            fixed z-40
            bg-[var(--color-bg-card)]/95 backdrop-blur-md
            border border-[var(--color-border)]
            rounded-full shadow-lg
            transition-all duration-200
            ${isActive ? 'ring-2 ring-opacity-50' : ''}
          `}
          style={{
            ...positionStyle,
            ['--tw-ring-color' as string]: isActive ? currentColor : undefined,
            boxShadow: isActive ? `0 0 20px ${currentColor}20` : undefined,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Timer display */}
            <button
              onClick={toggleExpanded}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <TimerDisplay
                timeRemaining={timeRemaining}
                currentPhase={currentPhase}
                isRunning={isRunning}
                isPaused={isPaused}
                settings={settings}
                variant="mini"
              />
            </button>

            {/* Controls - always show on mobile, hover on desktop */}
            <div className={`flex items-center gap-1 ${isHovered ? 'opacity-100' : 'lg:opacity-0'} transition-opacity`}>
              <TimerControls
                isRunning={isRunning}
                isPaused={isPaused}
                currentPhase={currentPhase}
                onStart={start}
                onPause={pause}
                onResume={resume}
                onSkip={skip}
                onReset={reset}
                onStop={stop}
                variant="mini"
              />
            </div>

            {/* Expand button */}
            <button
              onClick={toggleExpanded}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              title="Expandir"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Hide button */}
            <button
              onClick={toggle}
              className="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
              title="Esconder timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showSettings && (
          <PomodoroSettings
            settings={settings}
            onSave={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </>
    );
  }

  // Expanded card view
  return (
    <>
      <div
        className={`
          fixed z-40
          bg-[var(--color-bg-card)]/95 backdrop-blur-md
          border border-[var(--color-border)]
          rounded-xl shadow-2xl
          w-72
          transition-all duration-200
          ${isActive ? 'ring-2 ring-opacity-30' : ''}
        `}
        style={{
          ...positionStyle,
          ['--tw-ring-color' as string]: isActive ? currentColor : undefined,
          boxShadow: isActive ? `0 0 30px ${currentColor}15` : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFB800]" />
            <span className="text-sm font-medium text-[var(--color-text-main)] uppercase tracking-wide">
              Timer de Estudo
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
              title="Configuracoes"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleExpanded}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
              title="Minimizar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Esconder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="p-6 flex flex-col items-center">
          <TimerDisplay
            timeRemaining={timeRemaining}
            currentPhase={currentPhase}
            isRunning={isRunning}
            isPaused={isPaused}
            settings={settings}
            variant="expanded"
          />
        </div>

        {/* Controls */}
        <div className="px-4 pb-4">
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            currentPhase={currentPhase}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onSkip={skip}
            onReset={reset}
            onStop={stop}
            variant="expanded"
          />
        </div>

        {/* Footer with stats */}
        <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 rounded-b-xl">
          <div className="flex items-center justify-between">
            {/* Phase indicator */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Sessoes
              </span>
              <PhaseIndicator
                completedSessions={completedSessions}
                sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
              />
            </div>

            {/* Today's total */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Hoje
              </span>
              <span className="text-sm font-semibold text-[var(--color-text-main)]">
                {formatTotalTime(totalStudyTimeToday)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <PomodoroSettings
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default FloatingStudyTimer;
