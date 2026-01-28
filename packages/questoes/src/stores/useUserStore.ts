import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStats, Flashcard, ReviewItem, Course } from '../types';
import { INITIAL_USER_STATS, STORAGE_KEYS } from '../constants';
import { updateUserStats, updateUserLevel } from '../services/userStatsService';
import { calculateLevel, checkAndAwardBonuses, BonusCheckResult } from '../services/gamificationSettingsService';

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
        console.log('[useUserStore] incrementStats called with:', increments);

        // Update local state immediately for responsive UI
        const newXP = get().stats.xp + (increments.xp || 0);
        const newCoins = get().stats.coins + (increments.coins || 0);
        const newLevel = await calculateLevel(newXP);

        // Calculate streak locally
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const currentStats = get().stats;
        const lastPractice = currentStats.lastPracticeDate;
        let newStreak = currentStats.streak;

        if (!lastPractice) {
          // First time practicing
          newStreak = 1;
        } else if (lastPractice === today) {
          // Same day, keep current streak
          newStreak = currentStats.streak;
        } else {
          // Check if yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastPractice === yesterdayStr) {
            // Consecutive day, increment streak
            newStreak = currentStats.streak + 1;
          } else {
            // Skipped days, reset streak
            newStreak = 1;
          }
        }

        set((state) => ({
          stats: {
            ...state.stats,
            xp: newXP,
            coins: newCoins,
            correctAnswers: state.stats.correctAnswers + (increments.correctAnswers || 0),
            totalAnswered: state.stats.totalAnswered + (increments.totalAnswered || 0),
            level: newLevel,
            streak: newStreak,
            lastPracticeDate: today,
          },
        }));

        console.log('[useUserStore] Local state updated. New XP:', newXP, 'New Coins:', newCoins, 'New Level:', newLevel);

        // Persist to Supabase asynchronously
        // Get userId from auth store (dynamic import to avoid circular dependency)
        try {
          const authModule = await import('./useAuthStore');
          const authState = authModule.useAuthStore.getState();
          const userId = authState.user?.id;

          console.log('[useUserStore] User ID from auth store:', userId);

          if (userId) {
            console.log('[useUserStore] Calling updateUserStats for user:', userId);
            const result = await updateUserStats(userId, increments);

            if (result.success) {
              console.log('[useUserStore] Stats persisted to Supabase successfully!');

              // Sync streak from database (RPC now calculates it correctly)
              const { getUserStats } = await import('../services/userStatsService');
              const dbStats = await getUserStats(userId);
              if (dbStats) {
                set((state) => ({
                  stats: {
                    ...state.stats,
                    streak: dbStats.streak,
                    lastPracticeDate: dbStats.lastPracticeDate || state.stats.lastPracticeDate,
                  },
                }));
                console.log('[useUserStore] Streak synced from DB:', dbStats.streak);
              }

              // Update level if XP changed
              if (increments.xp && increments.xp > 0) {
                const currentStats = get().stats;
                await updateUserLevel(userId, currentStats.xp);
                console.log('[useUserStore] Level updated in Supabase');
              }

              // Check for gamification bonuses (daily goal, streak milestones)
              if (increments.totalAnswered && increments.totalAnswered > 0) {
                const bonusResult = await checkAndAwardBonuses(userId, increments.totalAnswered);

                if (bonusResult) {
                  let bonusXp = 0;
                  let bonusCoins = 0;
                  const bonusMessages: string[] = [];

                  if (bonusResult.daily_goal_bonus_awarded) {
                    bonusXp += bonusResult.daily_goal_xp;
                    bonusCoins += bonusResult.daily_goal_coins;
                    bonusMessages.push(`Meta diária: +${bonusResult.daily_goal_xp} XP, +${bonusResult.daily_goal_coins} moedas`);
                  }
                  if (bonusResult.streak_7_bonus_awarded) {
                    bonusXp += bonusResult.streak_7_xp;
                    bonusMessages.push(`Streak 7 dias: +${bonusResult.streak_7_xp} XP`);
                  }
                  if (bonusResult.streak_30_bonus_awarded) {
                    bonusXp += bonusResult.streak_30_xp;
                    bonusMessages.push(`Streak 30 dias: +${bonusResult.streak_30_xp} XP`);
                  }

                  // Update local state with bonus XP/coins
                  if (bonusXp > 0 || bonusCoins > 0) {
                    const updatedLevel = await calculateLevel(get().stats.xp + bonusXp);
                    set((state) => ({
                      stats: {
                        ...state.stats,
                        xp: state.stats.xp + bonusXp,
                        coins: state.stats.coins + bonusCoins,
                        level: updatedLevel,
                      },
                    }));
                    console.log('[useUserStore] Bonuses awarded:', bonusMessages.join(', '));
                  }
                }
              }
            } else {
              console.error('[useUserStore] Failed to persist stats to Supabase:', result.error);
            }
          } else {
            console.warn('[useUserStore] No user ID available, stats not persisted to Supabase');
          }
        } catch (error) {
          console.error('[useUserStore] Error persisting stats:', error);
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
