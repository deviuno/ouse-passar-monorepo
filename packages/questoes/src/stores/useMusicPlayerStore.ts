import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
  category_id: string | null;
  is_podcast: boolean;
  materia: string | null;
  assunto: string | null;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface MusicPlayerState {
  // Current playback state
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;

  // UI state
  isPlayerExpanded: boolean;
  isQueueOpen: boolean;

  // Playback history for shuffle
  shuffleHistory: number[];

  // Audio element reference (set by MusicPlayer component)
  audioRef: HTMLAudioElement | null;

  // Actions
  setAudioRef: (ref: HTMLAudioElement | null) => void;
  play: (track?: MusicTrack) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setQueue: (tracks: MusicTrack[], startIndex?: number) => void;
  addToQueue: (track: MusicTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlayerExpanded: (expanded: boolean) => void;
  togglePlayerExpanded: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleQueueOpen: () => void;
  playTrackAtIndex: (index: number) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useMusicPlayerStore = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      repeatMode: 'off',
      isShuffled: false,
      isPlayerExpanded: false,
      isQueueOpen: false,
      shuffleHistory: [],
      audioRef: null,

      // Set audio element reference
      setAudioRef: (ref) => set({ audioRef: ref }),

      // Play a track (or resume current)
      play: (track) => {
        const state = get();

        if (track) {
          // If playing a new track
          const existingIndex = state.queue.findIndex((t) => t.id === track.id);

          if (existingIndex >= 0) {
            // Track is in queue, play from there
            set({
              currentTrack: track,
              queueIndex: existingIndex,
              isPlaying: true,
              currentTime: 0,
            });
          } else {
            // Add to beginning of queue and play
            set({
              currentTrack: track,
              queue: [track, ...state.queue],
              queueIndex: 0,
              isPlaying: true,
              currentTime: 0,
            });
          }

          // Update audio element
          if (state.audioRef) {
            state.audioRef.src = track.audio_url;
            state.audioRef.currentTime = 0;
            state.audioRef.play().catch(console.error);
          }
        } else {
          // Resume current track
          set({ isPlaying: true });
          state.audioRef?.play().catch(console.error);
        }
      },

      // Pause playback
      pause: () => {
        const state = get();
        set({ isPlaying: false });
        state.audioRef?.pause();
      },

      // Toggle play/pause
      togglePlay: () => {
        const state = get();
        if (state.isPlaying) {
          get().pause();
        } else {
          get().play();
        }
      },

      // Next track
      next: () => {
        const state = get();
        const { queue, queueIndex, repeatMode, isShuffled } = state;

        if (queue.length === 0) return;

        let nextIndex: number;

        if (isShuffled) {
          // Random next track (avoiding recent history)
          const availableIndices = queue
            .map((_, i) => i)
            .filter((i) => !state.shuffleHistory.includes(i) || state.shuffleHistory.length >= queue.length - 1);

          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

          // Update shuffle history (keep last N tracks)
          const newHistory = [...state.shuffleHistory, nextIndex].slice(-Math.min(queue.length - 1, 10));
          set({ shuffleHistory: newHistory });
        } else {
          nextIndex = queueIndex + 1;

          if (nextIndex >= queue.length) {
            if (repeatMode === 'all') {
              nextIndex = 0;
            } else {
              // End of queue
              set({ isPlaying: false, currentTime: 0 });
              return;
            }
          }
        }

        const nextTrack = queue[nextIndex];
        set({
          currentTrack: nextTrack,
          queueIndex: nextIndex,
          currentTime: 0,
        });

        if (state.audioRef) {
          state.audioRef.src = nextTrack.audio_url;
          state.audioRef.currentTime = 0;
          if (state.isPlaying) {
            state.audioRef.play().catch(console.error);
          }
        }
      },

      // Previous track
      previous: () => {
        const state = get();
        const { queue, queueIndex, currentTime } = state;

        if (queue.length === 0) return;

        // If more than 3 seconds in, restart current track
        if (currentTime > 3) {
          set({ currentTime: 0 });
          if (state.audioRef) {
            state.audioRef.currentTime = 0;
          }
          return;
        }

        let prevIndex = queueIndex - 1;

        if (prevIndex < 0) {
          if (state.repeatMode === 'all') {
            prevIndex = queue.length - 1;
          } else {
            prevIndex = 0;
          }
        }

        const prevTrack = queue[prevIndex];
        set({
          currentTrack: prevTrack,
          queueIndex: prevIndex,
          currentTime: 0,
        });

        if (state.audioRef) {
          state.audioRef.src = prevTrack.audio_url;
          state.audioRef.currentTime = 0;
          if (state.isPlaying) {
            state.audioRef.play().catch(console.error);
          }
        }
      },

      // Seek to position
      seek: (time) => {
        const state = get();
        set({ currentTime: time });
        if (state.audioRef) {
          state.audioRef.currentTime = time;
        }
      },

      // Update current time (called by audio element)
      setCurrentTime: (currentTime) => set({ currentTime }),

      // Update duration (called by audio element)
      setDuration: (duration) => set({ duration }),

      // Set volume
      setVolume: (volume) => {
        const state = get();
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume, isMuted: false });
        if (state.audioRef) {
          state.audioRef.volume = clampedVolume;
          state.audioRef.muted = false;
        }
      },

      // Toggle mute
      toggleMute: () => {
        const state = get();
        const newMuted = !state.isMuted;
        set({ isMuted: newMuted });
        if (state.audioRef) {
          state.audioRef.muted = newMuted;
        }
      },

      // Set queue
      setQueue: (tracks, startIndex = 0) => {
        const state = get();
        const track = tracks[startIndex];

        set({
          queue: tracks,
          queueIndex: startIndex,
          currentTrack: track || null,
          currentTime: 0,
          shuffleHistory: [],
        });

        if (track && state.audioRef) {
          state.audioRef.src = track.audio_url;
          state.audioRef.currentTime = 0;
        }
      },

      // Add track to end of queue
      addToQueue: (track) => {
        set((state) => ({
          queue: [...state.queue, track],
        }));
      },

      // Remove track from queue
      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = [...state.queue];
          newQueue.splice(index, 1);

          let newQueueIndex = state.queueIndex;
          if (index < state.queueIndex) {
            newQueueIndex--;
          } else if (index === state.queueIndex) {
            // Playing track was removed
            newQueueIndex = Math.min(index, newQueue.length - 1);
          }

          return {
            queue: newQueue,
            queueIndex: newQueueIndex,
            currentTrack: newQueue[newQueueIndex] || null,
          };
        });
      },

      // Clear queue
      clearQueue: () => {
        const state = get();
        set({
          queue: [],
          queueIndex: -1,
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
          shuffleHistory: [],
        });
        if (state.audioRef) {
          state.audioRef.pause();
          state.audioRef.src = '';
        }
      },

      // Toggle shuffle
      toggleShuffle: () => {
        set((state) => ({
          isShuffled: !state.isShuffled,
          shuffleHistory: [],
        }));
      },

      // Cycle repeat mode
      toggleRepeat: () => {
        set((state) => {
          const modes: RepeatMode[] = ['off', 'all', 'one'];
          const currentIndex = modes.indexOf(state.repeatMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return { repeatMode: modes[nextIndex] };
        });
      },

      // Player expansion
      setPlayerExpanded: (isPlayerExpanded) => set({ isPlayerExpanded }),
      togglePlayerExpanded: () => set((state) => ({ isPlayerExpanded: !state.isPlayerExpanded })),

      // Queue drawer
      setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
      toggleQueueOpen: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

      // Play track at specific index
      playTrackAtIndex: (index) => {
        const state = get();
        const track = state.queue[index];

        if (!track) return;

        set({
          currentTrack: track,
          queueIndex: index,
          isPlaying: true,
          currentTime: 0,
        });

        if (state.audioRef) {
          state.audioRef.src = track.audio_url;
          state.audioRef.currentTime = 0;
          state.audioRef.play().catch(console.error);
        }
      },
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
      }),
    }
  )
);

// ============================================================================
// HELPER HOOKS
// ============================================================================

export const useMusicPlayer = () => {
  const store = useMusicPlayerStore();

  return {
    // State
    currentTrack: store.currentTrack,
    isPlaying: store.isPlaying,
    currentTime: store.currentTime,
    duration: store.duration,
    volume: store.volume,
    isMuted: store.isMuted,
    repeatMode: store.repeatMode,
    isShuffled: store.isShuffled,
    queue: store.queue,
    queueIndex: store.queueIndex,
    isPlayerExpanded: store.isPlayerExpanded,
    isQueueOpen: store.isQueueOpen,

    // Actions
    play: store.play,
    pause: store.pause,
    togglePlay: store.togglePlay,
    next: store.next,
    previous: store.previous,
    seek: store.seek,
    setVolume: store.setVolume,
    toggleMute: store.toggleMute,
    setQueue: store.setQueue,
    addToQueue: store.addToQueue,
    toggleShuffle: store.toggleShuffle,
    toggleRepeat: store.toggleRepeat,
    togglePlayerExpanded: store.togglePlayerExpanded,
    toggleQueueOpen: store.toggleQueueOpen,
  };
};

// Format time helper
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
