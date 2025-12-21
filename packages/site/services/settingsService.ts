import { supabase } from '../lib/supabase';

export interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsByCategory {
  [category: string]: {
    [key: string]: {
      value: any;
      description: string | null;
    };
  };
}

// Get all settings
export async function getAllSettings(): Promise<SystemSetting[]> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching settings:', error);
    return [];
  }
}

// Get settings by category
export async function getSettingsByCategory(category: string): Promise<SystemSetting[]> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', category)
      .order('key', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    return [];
  }
}

// Get a single setting
export async function getSetting(category: string, key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.value;
  } catch (error) {
    console.error('Error fetching setting:', error);
    return null;
  }
}

// Update a setting
export async function updateSetting(
  category: string,
  key: string,
  value: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('category', category)
      .eq('key', key);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return { success: false, error: error.message };
  }
}

// Update multiple settings at once
export async function updateSettings(
  settings: Array<{ category: string; key: string; value: any }>
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const setting of settings) {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: setting.value })
        .eq('category', setting.category)
        .eq('key', setting.key);

      if (error) throw error;
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
}

// Get all settings organized by category
export async function getSettingsGrouped(): Promise<SettingsByCategory> {
  try {
    const settings = await getAllSettings();
    const grouped: SettingsByCategory = {};

    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      grouped[setting.category][setting.key] = {
        value: setting.value,
        description: setting.description,
      };
    }

    return grouped;
  } catch (error) {
    console.error('Error fetching grouped settings:', error);
    return {};
  }
}

// Helper to parse setting value
export function parseSettingValue(value: any): any {
  if (typeof value === 'string') {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Check for boolean strings
      if (value === 'true') return true;
      if (value === 'false') return false;
      // Check for number strings
      const num = Number(value);
      if (!isNaN(num)) return num;
      return value;
    }
  }
  return value;
}

// Simulado settings helper
export async function getSimuladoSettings(): Promise<{
  questionsPerSimulado: number;
  maxAttempts: number;
  differentExamsPerUser: number;
  allowChat: boolean;
  timeLimitMinutes: number;
  showAnswersAfter: boolean;
  allowReview: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
}> {
  const settings = await getSettingsByCategory('simulado');
  const settingsMap = new Map(settings.map(s => [s.key, parseSettingValue(s.value)]));

  return {
    questionsPerSimulado: settingsMap.get('questions_per_simulado') ?? 120,
    maxAttempts: settingsMap.get('max_attempts') ?? -1,
    differentExamsPerUser: settingsMap.get('different_exams_per_user') ?? 1,
    allowChat: settingsMap.get('allow_chat') ?? false,
    timeLimitMinutes: settingsMap.get('time_limit_minutes') ?? 180,
    showAnswersAfter: settingsMap.get('show_answers_after') ?? true,
    allowReview: settingsMap.get('allow_review') ?? true,
    randomizeQuestions: settingsMap.get('randomize_questions') ?? true,
    randomizeOptions: settingsMap.get('randomize_options') ?? true,
  };
}

// Store settings helper
export async function getStoreSettings(): Promise<{
  defaultSimuladoPriceCoins: number;
  defaultSimuladoPriceReal: number;
  autoCreateSimuladoProduct: boolean;
}> {
  const settings = await getSettingsByCategory('store');
  const settingsMap = new Map(settings.map(s => [s.key, parseSettingValue(s.value)]));

  return {
    defaultSimuladoPriceCoins: settingsMap.get('default_simulado_price_coins') ?? 500,
    defaultSimuladoPriceReal: settingsMap.get('default_simulado_price_real') ?? 29.90,
    autoCreateSimuladoProduct: settingsMap.get('auto_create_simulado_product') ?? true,
  };
}
