import { supabase } from './supabaseClient';
import { RetaFinalSettings, StudyMode } from '../types/trail';

// ============================================================================
// TYPES
// ============================================================================

interface SystemSetting {
  category: string;
  key: string;
  value: string;
  description?: string;
}

// Default settings (fallback when DB is unavailable)
const DEFAULT_SETTINGS: RetaFinalSettings = {
  isEnabled: true,
  questionPercentage: 50, // 50% das questões do modo normal
  minQuestionsPerMission: 5,
};

// Cache for settings to avoid multiple DB calls
let settingsCache: RetaFinalSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// SETTINGS API
// ============================================================================

/**
 * Get Reta Final settings from database with caching
 */
export async function getRetaFinalSettings(): Promise<RetaFinalSettings> {
  // Check cache first
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'reta_final');

    if (error) {
      console.warn('[retaFinalService] Error fetching settings, using defaults:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data || data.length === 0) {
      console.warn('[retaFinalService] No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Parse settings from array to object
    const settingsMap = new Map(data.map((s: { key: string; value: string }) => [s.key, s.value]));

    const settings: RetaFinalSettings = {
      isEnabled: settingsMap.get('is_enabled') === 'true',
      questionPercentage: parseInt(settingsMap.get('question_percentage') || '50', 10),
      minQuestionsPerMission: parseInt(settingsMap.get('min_questions_per_mission') || '5', 10),
    };

    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;

    return settings;
  } catch (error: any) {
    console.error('[retaFinalService] Exception:', error.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Calculate the number of questions for Reta Final mode
 * @param normalCount - Number of questions in normal mode
 * @returns Number of questions for Reta Final mode
 */
export async function calculateRetaFinalQuestionCount(normalCount: number): Promise<number> {
  const settings = await getRetaFinalSettings();

  // Apply percentage reduction
  const reducedCount = Math.floor(normalCount * (settings.questionPercentage / 100));

  // Ensure minimum is respected
  return Math.max(settings.minQuestionsPerMission, reducedCount);
}

/**
 * Get effective question count based on study mode
 * @param normalCount - Base question count
 * @param mode - Current study mode
 */
export async function getEffectiveQuestionCount(
  normalCount: number,
  mode: StudyMode
): Promise<number> {
  if (mode === 'reta_final') {
    return calculateRetaFinalQuestionCount(normalCount);
  }
  return normalCount;
}

/**
 * Invalidate cache to force reload on next call
 */
export function invalidateRetaFinalCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

// ============================================================================
// THEME CONSTANTS
// ============================================================================

export const RETA_FINAL_THEME = {
  colors: {
    primary: '#FFD700',      // Amarelo dourado
    secondary: '#1A1A1A',    // Preto
    accent: '#FF6B00',       // Laranja
    danger: '#DC2626',       // Vermelho para urgência
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    background: '#0F0F0F',
    cardBg: '#1F1F1F',
    border: '#FFD700',
  },
  gradients: {
    header: 'linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)',
    button: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    card: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
    urgency: 'linear-gradient(135deg, #DC2626 0%, #FF6B00 100%)',
  },
  badge: {
    label: 'RETA FINAL',
    icon: '🔥',
    emoji: '⚡',
  },
};

// ============================================================================
// USER MODE ACCESS
// ============================================================================

interface ModeAccess {
  hasNormal: boolean;
  hasRetaFinal: boolean;
  currentMode: StudyMode;
}

/**
 * Get user's mode access for a specific preparatorio
 */
export async function getUserModeAccess(
  userId: string,
  preparatorioId: string
): Promise<ModeAccess> {
  try {
    const { data, error } = await supabase
      .from('user_trails')
      .select('has_normal_access, has_reta_final_access, current_mode')
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId)
      .maybeSingle();

    if (error || !data) {
      // Default: only normal access
      return {
        hasNormal: true,
        hasRetaFinal: false,
        currentMode: 'normal',
      };
    }

    return {
      hasNormal: data.has_normal_access ?? true,
      hasRetaFinal: data.has_reta_final_access ?? false,
      currentMode: (data.current_mode as StudyMode) ?? 'normal',
    };
  } catch (error) {
    console.error('[retaFinalService] Error getting mode access:', error);
    return {
      hasNormal: true,
      hasRetaFinal: false,
      currentMode: 'normal',
    };
  }
}

/**
 * Switch user's current study mode
 */
export async function switchUserMode(
  userId: string,
  preparatorioId: string,
  mode: StudyMode
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if user has access to the requested mode
    const access = await getUserModeAccess(userId, preparatorioId);

    if (mode === 'normal' && !access.hasNormal) {
      return { success: false, error: 'Você não tem acesso ao modo Normal' };
    }

    if (mode === 'reta_final' && !access.hasRetaFinal) {
      return { success: false, error: 'Você não tem acesso ao modo Reta Final' };
    }

    // Update the mode
    const { error } = await supabase
      .from('user_trails')
      .update({
        current_mode: mode,
        // If switching to reta_final, also set is_reta_final for compatibility
        is_reta_final: mode === 'reta_final',
        reta_final_started_at: mode === 'reta_final' ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId);

    if (error) {
      console.error('[retaFinalService] Error switching mode:', error);
      return { success: false, error: 'Erro ao alternar modo' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[retaFinalService] Exception switching mode:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Grant Reta Final access to a user for a specific preparatorio
 * (Used after purchase/enrollment)
 */
export async function grantRetaFinalAccess(
  userId: string,
  preparatorioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_trails')
      .update({ has_reta_final_access: true })
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId);

    if (error) {
      console.error('[retaFinalService] Error granting access:', error);
      return { success: false, error: 'Erro ao conceder acesso' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[retaFinalService] Exception granting access:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Grant Normal access to a user for a specific preparatorio
 */
export async function grantNormalAccess(
  userId: string,
  preparatorioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_trails')
      .update({ has_normal_access: true })
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId);

    if (error) {
      console.error('[retaFinalService] Error granting normal access:', error);
      return { success: false, error: 'Erro ao conceder acesso' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[retaFinalService] Exception granting normal access:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getRetaFinalSettings,
  calculateRetaFinalQuestionCount,
  getEffectiveQuestionCount,
  invalidateRetaFinalCache,
  getUserModeAccess,
  switchUserMode,
  grantRetaFinalAccess,
  grantNormalAccess,
  RETA_FINAL_THEME,
};
