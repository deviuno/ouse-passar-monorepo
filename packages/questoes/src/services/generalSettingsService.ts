import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneralSettings {
  maintenanceMode: boolean;
  maxPreparatoriosPerUser: number;
}

// Default settings (fallback when DB is unavailable)
const DEFAULT_SETTINGS: GeneralSettings = {
  maintenanceMode: false,
  maxPreparatoriosPerUser: 5,
};

// Cache for settings to avoid multiple DB calls
let settingsCache: GeneralSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute (shorter for maintenance mode)

// ============================================================================
// API
// ============================================================================

/**
 * Get general settings from database with caching
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
  // Check cache first
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'general');

    if (error) {
      console.warn('[generalSettingsService] Error fetching settings, using defaults:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data || data.length === 0) {
      console.warn('[generalSettingsService] No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Parse settings from array to object
    const settingsMap = new Map(data.map((s: { key: string; value: any }) => [s.key, s.value]));

    const parseBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    };

    const settings: GeneralSettings = {
      maintenanceMode: parseBoolean(settingsMap.get('maintenance_mode')),
      maxPreparatoriosPerUser: parseInt(String(settingsMap.get('max_preparatorios_per_user') || '5'), 10),
    };

    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;

    return settings;
  } catch (error: any) {
    console.error('[generalSettingsService] Exception:', error.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Check if app is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getGeneralSettings();
  return settings.maintenanceMode;
}

/**
 * Get max preparatorios per user
 */
export async function getMaxPreparatoriosPerUser(): Promise<number> {
  const settings = await getGeneralSettings();
  return settings.maxPreparatoriosPerUser;
}

/**
 * Check if user can add more preparatorios
 * @param currentCount - Current number of preparatorios the user has
 * @param isPremium - Whether the user has premium access (unlimited)
 */
export async function canAddMorePreparatorios(
  currentCount: number,
  isPremium: boolean = false
): Promise<{ canAdd: boolean; limit: number; current: number }> {
  // Premium users have unlimited
  if (isPremium) {
    return { canAdd: true, limit: -1, current: currentCount };
  }

  const maxAllowed = await getMaxPreparatoriosPerUser();

  // 0 or negative means unlimited
  if (maxAllowed <= 0) {
    return { canAdd: true, limit: -1, current: currentCount };
  }

  return {
    canAdd: currentCount < maxAllowed,
    limit: maxAllowed,
    current: currentCount,
  };
}

/**
 * Invalidate cache to force reload on next call
 */
export function invalidateGeneralSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

export default {
  getGeneralSettings,
  isMaintenanceMode,
  getMaxPreparatoriosPerUser,
  canAddMorePreparatorios,
  invalidateGeneralSettingsCache,
};
