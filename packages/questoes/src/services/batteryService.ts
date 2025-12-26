/**
 * Serviço de Bateria
 * Gerencia o sistema de energia para usuários gratuitos
 * Bateria é POR PREPARATÓRIO
 */

import { supabase } from './supabaseClient';
import {
  BatteryStatus,
  BatteryConsumeResult,
  CanAddPreparatorioResult,
  BatteryActionType,
  BatterySettings,
  BatteryHistoryEntry,
} from '../types/battery';

// Cache local para evitar requests constantes
let settingsCache: BatterySettings | null = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca as configurações de bateria
 */
export async function getBatterySettings(): Promise<BatterySettings | null> {
  try {
    // Verificar cache
    if (settingsCache && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
      return settingsCache;
    }

    const { data, error } = await supabase.rpc('get_battery_settings');

    if (error) {
      console.error('[BatteryService] Error getting settings:', error);
      return null;
    }

    // Parsear valores
    const settings: BatterySettings = {
      is_enabled: data.is_enabled === 'true' || data.is_enabled === true,
      max_battery: parseInt(data.max_battery) || 100,
      daily_recharge: parseInt(data.daily_recharge) || 100,
      recharge_hour: parseInt(data.recharge_hour) || 0,
      cost_per_question: parseInt(data.cost_per_question) || 2,
      cost_per_mission_start: parseInt(data.cost_per_mission_start) || 5,
      cost_per_chat_message: parseInt(data.cost_per_chat_message) || 3,
      cost_per_notebook_create: parseInt(data.cost_per_notebook_create) || 10,
      cost_per_practice_session: parseInt(data.cost_per_practice_session) || 5,
      max_preparatorios_free: parseInt(data.max_preparatorios_free) || 1,
      chat_enabled_free: data.chat_enabled_free === 'true' || data.chat_enabled_free === true,
      chat_requires_practice: data.chat_requires_practice === 'true' || data.chat_requires_practice === true,
      chat_min_questions: parseInt(data.chat_min_questions) || 10,
      notebooks_enabled_free: data.notebooks_enabled_free === 'true' || data.notebooks_enabled_free === true,
      notebooks_max_free: parseInt(data.notebooks_max_free) || 3,
      practice_enabled_free: data.practice_enabled_free === 'true' || data.practice_enabled_free === true,
    };

    // Atualizar cache
    settingsCache = settings;
    settingsCacheTime = Date.now();

    return settings;
  } catch (error) {
    console.error('[BatteryService] Error getting settings:', error);
    return null;
  }
}

/**
 * Busca o status da bateria para um preparatório específico
 */
export async function getBatteryStatus(
  userId: string,
  preparatorioId: string
): Promise<BatteryStatus | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_battery_status', {
      p_user_id: userId,
      p_preparatorio_id: preparatorioId,
    });

    if (error) {
      console.error('[BatteryService] Error getting status:', error);
      return null;
    }

    if (data.error) {
      console.warn('[BatteryService] Status error:', data.error);
      return null;
    }

    return data as BatteryStatus;
  } catch (error) {
    console.error('[BatteryService] Error getting status:', error);
    return null;
  }
}

/**
 * Consome energia da bateria para uma ação
 */
export async function consumeBattery(
  userId: string,
  preparatorioId: string,
  actionType: BatteryActionType,
  context: Record<string, any> = {}
): Promise<BatteryConsumeResult> {
  try {
    const { data, error } = await supabase.rpc('consume_battery', {
      p_user_id: userId,
      p_preparatorio_id: preparatorioId,
      p_action_type: actionType,
      p_context: context,
    });

    if (error) {
      console.error('[BatteryService] Error consuming battery:', error);
      return { success: false, error: 'user_trail_not_found' };
    }

    return data as BatteryConsumeResult;
  } catch (error) {
    console.error('[BatteryService] Error consuming battery:', error);
    return { success: false, error: 'user_trail_not_found' };
  }
}

/**
 * Verifica se pode executar uma ação (sem consumir)
 */
export async function canPerformAction(
  userId: string,
  preparatorioId: string,
  actionType: BatteryActionType
): Promise<{ canPerform: boolean; cost: number; currentBattery: number; isPremium: boolean }> {
  try {
    const status = await getBatteryStatus(userId, preparatorioId);

    if (!status) {
      return { canPerform: false, cost: 0, currentBattery: 0, isPremium: false };
    }

    // Premium pode sempre
    if (status.is_premium) {
      return { canPerform: true, cost: 0, currentBattery: status.battery_current, isPremium: true };
    }

    // Determinar custo
    const costMap: Record<BatteryActionType, keyof BatterySettings> = {
      question: 'cost_per_question',
      mission_start: 'cost_per_mission_start',
      chat_message: 'cost_per_chat_message',
      notebook_create: 'cost_per_notebook_create',
      practice_session: 'cost_per_practice_session',
      recharge: 'cost_per_question', // não usado
      admin_recharge: 'cost_per_question', // não usado
    };

    const costKey = costMap[actionType];
    const cost = status.settings[costKey] as number;

    return {
      canPerform: status.battery_current >= cost,
      cost,
      currentBattery: status.battery_current,
      isPremium: false,
    };
  } catch (error) {
    console.error('[BatteryService] Error checking action:', error);
    return { canPerform: false, cost: 0, currentBattery: 0, isPremium: false };
  }
}

/**
 * Verifica se o usuário pode adicionar mais preparatórios
 */
export async function checkCanAddPreparatorio(
  userId: string
): Promise<CanAddPreparatorioResult> {
  try {
    const { data, error } = await supabase.rpc('check_can_add_preparatorio', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[BatteryService] Error checking preparatorio limit:', error);
      return { can_add: false, is_premium: false };
    }

    return data as CanAddPreparatorioResult;
  } catch (error) {
    console.error('[BatteryService] Error checking preparatorio limit:', error);
    return { can_add: false, is_premium: false };
  }
}

/**
 * Busca histórico de consumo de bateria
 */
export async function getBatteryHistory(
  userId: string,
  preparatorioId: string,
  limit: number = 20
): Promise<BatteryHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('battery_history')
      .select('*')
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[BatteryService] Error getting history:', error);
      return [];
    }

    return data as BatteryHistoryEntry[];
  } catch (error) {
    console.error('[BatteryService] Error getting history:', error);
    return [];
  }
}

/**
 * Invalida o cache de configurações
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  settingsCacheTime = 0;
}

export default {
  getBatterySettings,
  getBatteryStatus,
  consumeBattery,
  canPerformAction,
  checkCanAddPreparatorio,
  getBatteryHistory,
  invalidateSettingsCache,
};
