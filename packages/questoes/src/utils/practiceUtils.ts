/**
 * Utility functions for practice session operations
 */

import { PracticeMode } from '../types';
import { GamificationSettings } from '../services/gamificationSettingsService';
import { DifficultyRating } from '../services/questionFeedbackService';

export interface SessionStats {
  correct: number;
  total: number;
}

/**
 * Calculates the accuracy percentage
 */
export const calculateAccuracy = (stats: SessionStats): number => {
  if (stats.total === 0) return 0;
  return Math.round((stats.correct / stats.total) * 100);
};

/**
 * Calculates XP reward for a correct answer
 */
export const calculateXPReward = (
  isCorrect: boolean,
  studyMode: PracticeMode,
  settings: GamificationSettings | null
): number => {
  if (!isCorrect) return 0;

  const isHardMode = studyMode === 'hard';

  if (settings) {
    return isHardMode
      ? settings.xp_per_correct_hard_mode
      : settings.xp_per_correct_answer;
  }

  // Fallback values if settings not loaded
  return isHardMode ? 100 : 50;
};

/**
 * Calculates coins reward for a correct answer
 */
export const calculateCoinsReward = (
  isCorrect: boolean,
  studyMode: PracticeMode,
  settings: GamificationSettings | null
): number => {
  if (!isCorrect) return 0;

  const isHardMode = studyMode === 'hard';

  if (settings) {
    return isHardMode
      ? settings.coins_per_correct_hard_mode
      : settings.coins_per_correct_answer;
  }

  // Fallback values if settings not loaded
  return isHardMode ? 20 : 10;
};

/**
 * Maps internal difficulty key to database difficulty rating
 */
export const mapDifficultyToDb = (
  key: 'facil' | 'medio' | 'dificil'
): DifficultyRating => {
  const mapping: Record<string, DifficultyRating> = {
    facil: 'easy',
    medio: 'medium',
    dificil: 'hard',
  };
  return mapping[key];
};

/**
 * Formats time in seconds to a human readable format (mm:ss or hh:mm:ss)
 */
export const formatTimeSpent = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
