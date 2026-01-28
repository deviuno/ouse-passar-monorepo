import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { savePomodoroSession } from '../services/pomodoroService';

// ============================================================================
// TYPES
// ============================================================================

export type TimerPhase = 'study' | 'break' | 'long_break' | 'idle';

export interface PomodoroSettings {
  studyDuration: number;        // seconds (default 25 min = 1500)
  breakDuration: number;        // seconds (default 5 min = 300)
  longBreakDuration: number;    // seconds (default 15 min = 900)
  sessionsUntilLongBreak: number; // default 4
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface StudyTimerState {
  // Visibility
  isVisible: boolean;
  isExpanded: boolean;

  // Timer state
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: TimerPhase;
  timeRemaining: number;
  sessionStartedAt: string | null;

  // Pomodoro settings
  settings: PomodoroSettings;

  // Session tracking
  completedSessions: number;
  totalStudyTimeToday: number;

  // Internal
  _intervalId: number | null;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  stop: () => void;
  tick: () => void;
  setSettings: (settings: Partial<PomodoroSettings>) => void;
  toggle: () => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setTotalStudyTimeToday: (seconds: number) => void;
  _completePhase: () => void;
  _startInterval: () => void;
  _stopInterval: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SETTINGS: PomodoroSettings = {
  studyDuration: 25 * 60,      // 25 minutes
  breakDuration: 5 * 60,       // 5 minutes
  longBreakDuration: 15 * 60,  // 15 minutes
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
};

// ============================================================================
// AUDIO CONTEXT (singleton for browser autoplay policy compliance)
// ============================================================================

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {
      console.warn('[StudyTimer] Could not create AudioContext:', e);
      return null;
    }
  }
  return audioContext;
};

// Must be called during user interaction (e.g., clicking start button)
const initializeAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(console.warn);
  }
};

// ============================================================================
// HELPERS
// ============================================================================

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

const getNextPhase = (
  currentPhase: TimerPhase,
  completedSessions: number,
  sessionsUntilLongBreak: number
): TimerPhase => {
  if (currentPhase === 'study') {
    // After study, check if long break is needed
    const newCompletedCount = completedSessions + 1;
    if (newCompletedCount % sessionsUntilLongBreak === 0) {
      return 'long_break';
    }
    return 'break';
  }

  // After any break, go back to study
  return 'study';
};

const playNotificationSound = async () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (fallback)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Create a simple beep using Web Audio API
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('[StudyTimer] Could not play notification sound:', e);
  }
};

const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'pomodoro-timer',
    });
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// ============================================================================
// STORE
// ============================================================================

export const useStudyTimerStore = create<StudyTimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isVisible: true,
      isExpanded: false,
      isRunning: false,
      isPaused: false,
      currentPhase: 'idle',
      timeRemaining: DEFAULT_SETTINGS.studyDuration,
      sessionStartedAt: null,
      settings: DEFAULT_SETTINGS,
      completedSessions: 0,
      totalStudyTimeToday: 0,
      _intervalId: null,

      // Start the timer
      start: () => {
        const state = get();

        // Initialize AudioContext on user interaction (required by browser autoplay policy)
        if (state.settings.soundEnabled) {
          initializeAudioContext();
        }

        // Request notification permission on first start
        if (state.settings.notificationsEnabled) {
          requestNotificationPermission();
        }

        const phase = state.currentPhase === 'idle' ? 'study' : state.currentPhase;
        const duration = getDurationForPhase(phase, state.settings);

        set({
          isRunning: true,
          isPaused: false,
          currentPhase: phase,
          timeRemaining: duration,
          sessionStartedAt: new Date().toISOString(),
        });

        get()._startInterval();
      },

      // Pause the timer
      pause: () => {
        set({ isPaused: true, isRunning: false });
        get()._stopInterval();
      },

      // Resume from pause
      resume: () => {
        const state = get();

        // Re-initialize AudioContext on user interaction (browser may have suspended it)
        if (state.settings.soundEnabled) {
          initializeAudioContext();
        }

        set({ isPaused: false, isRunning: true });
        get()._startInterval();
      },

      // Reset to initial state
      reset: () => {
        get()._stopInterval();
        const state = get();
        set({
          isRunning: false,
          isPaused: false,
          currentPhase: 'idle',
          timeRemaining: state.settings.studyDuration,
          sessionStartedAt: null,
        });
      },

      // Skip to next phase
      skip: () => {
        const state = get();

        // If running, complete current phase first (mark as incomplete)
        if (state.isRunning || state.isPaused) {
          const wasStudy = state.currentPhase === 'study';

          // Save incomplete session
          if (state.sessionStartedAt) {
            const duration = getDurationForPhase(state.currentPhase, state.settings);
            const elapsedSeconds = duration - state.timeRemaining;

            if (elapsedSeconds > 10 && state.currentPhase !== 'idle') { // Only save if at least 10 seconds elapsed
              const sessionType = state.currentPhase === 'long_break' ? 'long_break' : state.currentPhase;
              savePomodoroSession({
                session_type: sessionType as 'study' | 'break' | 'long_break',
                duration_seconds: elapsedSeconds,
                completed: false,
                started_at: state.sessionStartedAt,
                ended_at: new Date().toISOString(),
              }).catch(console.error);

              // Update today's study time if it was a study session
              if (wasStudy) {
                set((s) => ({
                  totalStudyTimeToday: s.totalStudyTimeToday + elapsedSeconds,
                }));
              }
            }
          }
        }

        get()._stopInterval();

        const nextPhase = getNextPhase(
          state.currentPhase,
          state.completedSessions,
          state.settings.sessionsUntilLongBreak
        );

        const newCompletedSessions = state.currentPhase === 'study'
          ? state.completedSessions + 1
          : state.completedSessions;

        set({
          isRunning: true,
          isPaused: false,
          currentPhase: nextPhase,
          timeRemaining: getDurationForPhase(nextPhase, state.settings),
          sessionStartedAt: new Date().toISOString(),
          completedSessions: newCompletedSessions,
        });

        get()._startInterval();
      },

      // Stop completely and hide
      stop: () => {
        get()._stopInterval();
        set({
          isRunning: false,
          isPaused: false,
          currentPhase: 'idle',
          timeRemaining: get().settings.studyDuration,
          sessionStartedAt: null,
          completedSessions: 0,
        });
      },

      // Tick (called every second)
      tick: () => {
        const state = get();

        if (!state.isRunning || state.isPaused) return;

        const newTime = state.timeRemaining - 1;

        if (newTime <= 0) {
          get()._completePhase();
        } else {
          set({ timeRemaining: newTime });
        }
      },

      // Complete current phase
      _completePhase: () => {
        const state = get();
        get()._stopInterval();

        const wasStudy = state.currentPhase === 'study';
        const duration = getDurationForPhase(state.currentPhase, state.settings);

        // Save completed session
        if (state.sessionStartedAt && state.currentPhase !== 'idle') {
          const sessionType = state.currentPhase === 'long_break' ? 'long_break' : state.currentPhase;
          savePomodoroSession({
            session_type: sessionType as 'study' | 'break' | 'long_break',
            duration_seconds: duration,
            completed: true,
            started_at: state.sessionStartedAt,
            ended_at: new Date().toISOString(),
          }).catch(console.error);
        }

        // Update completed sessions count
        const newCompletedSessions = wasStudy
          ? state.completedSessions + 1
          : state.completedSessions;

        // Update today's study time
        const newTotalStudyTime = wasStudy
          ? state.totalStudyTimeToday + duration
          : state.totalStudyTimeToday;

        // Determine next phase
        const nextPhase = getNextPhase(
          state.currentPhase,
          state.completedSessions,
          state.settings.sessionsUntilLongBreak
        );

        // Play sound and show notification
        if (state.settings.soundEnabled) {
          playNotificationSound();
        }

        if (state.settings.notificationsEnabled) {
          if (wasStudy) {
            const isLongBreak = nextPhase === 'long_break';
            showBrowserNotification(
              isLongBreak ? 'Hora do intervalo longo!' : 'Hora do intervalo!',
              isLongBreak
                ? 'Parabens! Descanse por 15 minutos.'
                : 'Descanse por 5 minutos.'
            );
          } else {
            showBrowserNotification(
              'Volta aos estudos!',
              'Seu intervalo acabou. Hora de focar!'
            );
          }
        }

        set({
          isRunning: true,
          isPaused: false,
          currentPhase: nextPhase,
          timeRemaining: getDurationForPhase(nextPhase, state.settings),
          sessionStartedAt: new Date().toISOString(),
          completedSessions: newCompletedSessions,
          totalStudyTimeToday: newTotalStudyTime,
        });

        get()._startInterval();
      },

      // Update settings
      setSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));

        // If idle, update timeRemaining to match new study duration
        const state = get();
        if (state.currentPhase === 'idle' && !state.isRunning) {
          set({ timeRemaining: state.settings.studyDuration });
        }
      },

      // Toggle visibility
      toggle: () => set((state) => ({ isVisible: !state.isVisible })),

      // Toggle expanded/minimized
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

      // Set expanded state
      setExpanded: (expanded) => set({ isExpanded: expanded }),

      // Set today's study time (for sync from server)
      setTotalStudyTimeToday: (seconds) => set({ totalStudyTimeToday: seconds }),

      // Internal: start interval
      _startInterval: () => {
        const state = get();
        if (state._intervalId) {
          clearInterval(state._intervalId);
        }

        const id = window.setInterval(() => {
          get().tick();
        }, 1000);

        set({ _intervalId: id });
      },

      // Internal: stop interval
      _stopInterval: () => {
        const state = get();
        if (state._intervalId) {
          clearInterval(state._intervalId);
          set({ _intervalId: null });
        }
      },
    }),
    {
      name: 'study-timer-storage',
      partialize: (state) => ({
        isVisible: state.isVisible,
        isExpanded: state.isExpanded,
        settings: state.settings,
        completedSessions: state.completedSessions,
        totalStudyTimeToday: state.totalStudyTimeToday,
        currentPhase: state.currentPhase,
        timeRemaining: state.timeRemaining,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        sessionStartedAt: state.sessionStartedAt,
      }),
    }
  )
);

// ============================================================================
// HELPER HOOKS
// ============================================================================

export const useStudyTimer = () => {
  const store = useStudyTimerStore();

  return {
    // State
    isVisible: store.isVisible,
    isExpanded: store.isExpanded,
    isRunning: store.isRunning,
    isPaused: store.isPaused,
    currentPhase: store.currentPhase,
    timeRemaining: store.timeRemaining,
    settings: store.settings,
    completedSessions: store.completedSessions,
    totalStudyTimeToday: store.totalStudyTimeToday,

    // Actions
    start: store.start,
    pause: store.pause,
    resume: store.resume,
    reset: store.reset,
    skip: store.skip,
    stop: store.stop,
    toggle: store.toggle,
    toggleExpanded: store.toggleExpanded,
    setExpanded: store.setExpanded,
    setSettings: store.setSettings,
    setTotalStudyTimeToday: store.setTotalStudyTimeToday,
  };
};

// Format time as MM:SS
export const formatTimerTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format total time as Xh Xmin
export const formatTotalTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};
