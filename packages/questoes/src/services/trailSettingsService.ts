import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface TrailSettings {
  questionsPerMission: number;
  missionsPerRound: number;
  minScoreToPass: number;
  allowRetry: boolean;
  showExplanation: boolean;
}

// Default settings (fallback when DB is unavailable)
const DEFAULT_SETTINGS: TrailSettings = {
  questionsPerMission: 5,
  missionsPerRound: 5,
  minScoreToPass: 70,
  allowRetry: true,
  showExplanation: true,
};

// Cache for settings to avoid multiple DB calls
let settingsCache: TrailSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// API
// ============================================================================

/**
 * Get trail settings from database with caching
 */
export async function getTrailSettings(): Promise<TrailSettings> {
  // Check cache first
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'trail');

    if (error) {
      console.warn('[trailSettingsService] Error fetching settings, using defaults:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data || data.length === 0) {
      console.warn('[trailSettingsService] No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Parse settings from array to object
    const settingsMap = new Map(data.map((s: { key: string; value: any }) => [s.key, s.value]));

    const parseValue = (value: any): any => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      const num = Number(value);
      if (!isNaN(num)) return num;
      return value;
    };

    const settings: TrailSettings = {
      questionsPerMission: parseValue(settingsMap.get('questions_per_mission')) ?? DEFAULT_SETTINGS.questionsPerMission,
      missionsPerRound: parseValue(settingsMap.get('missions_per_round')) ?? DEFAULT_SETTINGS.missionsPerRound,
      minScoreToPass: parseValue(settingsMap.get('min_score_to_pass')) ?? DEFAULT_SETTINGS.minScoreToPass,
      allowRetry: parseValue(settingsMap.get('allow_retry')) ?? DEFAULT_SETTINGS.allowRetry,
      showExplanation: parseValue(settingsMap.get('show_explanation')) ?? DEFAULT_SETTINGS.showExplanation,
    };

    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;

    return settings;
  } catch (error: any) {
    console.error('[trailSettingsService] Exception:', error.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get questions per mission setting
 */
export async function getQuestionsPerMission(): Promise<number> {
  const settings = await getTrailSettings();
  return settings.questionsPerMission;
}

/**
 * Get minimum score to pass (%)
 */
export async function getMinScoreToPass(): Promise<number> {
  const settings = await getTrailSettings();
  return settings.minScoreToPass;
}

/**
 * Check if a score passes the mission
 * @param score - Score achieved (0-100)
 */
export async function doesScorePass(score: number): Promise<boolean> {
  const minScore = await getMinScoreToPass();
  return score >= minScore;
}

/**
 * Invalidate cache to force reload on next call
 */
export function invalidateTrailSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

export default {
  getTrailSettings,
  getQuestionsPerMission,
  getMinScoreToPass,
  doesScorePass,
  invalidateTrailSettingsCache,
};
