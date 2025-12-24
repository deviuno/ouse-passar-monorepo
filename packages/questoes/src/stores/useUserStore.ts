import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStats, Flashcard, ReviewItem, Course } from '../types';
import { INITIAL_USER_STATS, STORAGE_KEYS } from '../constants';
import { updateUserStats, updateUserLevel } from '../services/userStatsService';
import { calculateLevel } from '../services/gamificationSettingsService';

interface UserState {
  stats: UserStats;
  flashcards: Flashcard[];
  reviews: ReviewItem[];
  ownedCourseIds: string[];
  inventory: string[];

  // Actions
  setStats: (stats: UserStats) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  incrementStats: (increments: { xp?: number; coins?: number; correctAnswers?: number; totalAnswered?: number }) => void;

  setFlashcards: (flashcards: Flashcard[]) => void;
  addFlashcard: (flashcard: Flashcard) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  removeFlashcard: (id: string) => void;

  setReviews: (reviews: ReviewItem[]) => void;
  addReview: (review: ReviewItem) => void;
  updateReview: (questionId: number, updates: Partial<ReviewItem>) => void;

  setOwnedCourseIds: (ids: string[]) => void;
  addOwnedCourse: (id: string) => void;

  setInventory: (items: string[]) => void;
  addToInventory: (itemId: string) => void;

  // Computed
  getDueReviews: () => ReviewItem[];

  // Reset
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      stats: INITIAL_USER_STATS,
      flashcards: [],
      reviews: [],
      ownedCourseIds: [],
      inventory: [],

      setStats: (stats) => set({ stats }),

      updateStats: (updates) =>
        set((state) => ({
          stats: { ...state.stats, ...updates },
        })),

      incrementStats: async (increments) => {
        // Update local state immediately for responsive UI
        const newXP = get().stats.xp + (increments.xp || 0);
        const newLevel = await calculateLevel(newXP);

        set((state) => ({
          stats: {
            ...state.stats,
            xp: newXP,
            coins: state.stats.coins + (increments.coins || 0),
            correctAnswers: state.stats.correctAnswers + (increments.correctAnswers || 0),
            totalAnswered: state.stats.totalAnswered + (increments.totalAnswered || 0),
            level: newLevel,
          },
        }));

        // Persist to Supabase asynchronously
        // Get userId from auth store
        const { user } = await import('./useAuthStore').then(m => m.useAuthStore.getState());
        if (user?.id) {
          const result = await updateUserStats(user.id, increments);
          if (!result.success) {
            console.warn('[useUserStore] Failed to persist stats to Supabase:', result.error);
          }

          // Update level if XP changed
          if (increments.xp) {
            const currentStats = get().stats;
            await updateUserLevel(user.id, currentStats.xp);
          }
        } else {
          console.warn('[useUserStore] No user ID available, stats not persisted to Supabase');
        }
      },

      setFlashcards: (flashcards) => set({ flashcards }),

      addFlashcard: (flashcard) =>
        set((state) => ({
          flashcards: [...state.flashcards, flashcard],
        })),

      updateFlashcard: (id, updates) =>
        set((state) => ({
          flashcards: state.flashcards.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      removeFlashcard: (id) =>
        set((state) => ({
          flashcards: state.flashcards.filter((f) => f.id !== id),
        })),

      setReviews: (reviews) => set({ reviews }),

      addReview: (review) =>
        set((state) => ({
          reviews: [...state.reviews, review],
        })),

      updateReview: (questionId, updates) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.questionId === questionId ? { ...r, ...updates } : r
          ),
        })),

      setOwnedCourseIds: (ownedCourseIds) => set({ ownedCourseIds }),

      addOwnedCourse: (id) =>
        set((state) => ({
          ownedCourseIds: [...state.ownedCourseIds, id],
        })),

      setInventory: (inventory) => set({ inventory }),

      addToInventory: (itemId) =>
        set((state) => ({
          inventory: [...state.inventory, itemId],
        })),

      getDueReviews: () => {
        const now = Date.now();
        return get().reviews.filter((r) => r.nextReviewDate <= now);
      },

      reset: () =>
        set({
          stats: INITIAL_USER_STATS,
          flashcards: [],
          reviews: [],
          ownedCourseIds: [],
          inventory: [],
        }),
    }),
    {
      name: STORAGE_KEYS.STATS,
    }
  )
);
