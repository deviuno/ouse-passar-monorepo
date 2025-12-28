/**
 * Tipos para o sistema de bateria
 * Bateria é POR PREPARATÓRIO - cada preparatório tem sua própria bateria
 */

export type BatteryActionType =
  | 'question'
  | 'mission_start'
  | 'chat_message'
  | 'chat_audio'
  | 'chat_podcast'
  | 'chat_summary'
  | 'notebook_create'
  | 'practice_session'
  | 'recharge'
  | 'admin_recharge';

export interface BatterySettings {
  is_enabled: boolean;
  max_battery: number;
  daily_recharge: number;
  recharge_hour: number;
  cost_per_question: number;
  cost_per_mission_start: number;
  cost_per_chat_message: number;
  cost_per_chat_audio: number;
  cost_per_chat_podcast: number;
  cost_per_chat_summary: number;
  cost_per_notebook_create: number;
  cost_per_practice_session: number;
  max_preparatorios_free: number;
  chat_enabled_free: boolean;
  chat_requires_practice: boolean;
  chat_min_questions: number;
  notebooks_enabled_free: boolean;
  notebooks_max_free: number;
  practice_enabled_free: boolean;
  // NOTA: URL de checkout vem do preparatório (checkout_8_questoes)
  // O usuário compra "Ouse Questões" do preparatório específico para ter bateria ilimitada
}

export interface BatteryStatus {
  battery_current: number;
  battery_max: number;
  last_recharge: string | null;
  needs_recharge: boolean;
  is_premium: boolean;
  has_unlimited_battery: boolean;
  unlimited_expires_at: string | null;
  preparatorios_count: number;
  max_preparatorios_free: number;
  settings: BatterySettings;
}

export interface BatteryConsumeResult {
  success: boolean;
  is_premium?: boolean;
  battery_before?: number;
  battery_after?: number;
  battery_current?: number;
  cost?: number;
  error?: 'insufficient_battery' | 'user_trail_not_found';
  checkout_url?: string | null;
}

export interface CanAddPreparatorioResult {
  can_add: boolean;
  is_premium: boolean;
  current_count?: number;
  max_allowed?: number;
  checkout_url?: string | null;
}

export interface BatteryHistoryEntry {
  id: string;
  user_id: string;
  preparatorio_id: string;
  action_type: BatteryActionType;
  cost: number;
  battery_before: number;
  battery_after: number;
  context: Record<string, any>;
  created_at: string;
}

// Helper para calcular porcentagem
export function getBatteryPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((current / max) * 100);
}

// Helper para determinar cor da bateria
export function getBatteryColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage > 50) return 'green';
  if (percentage > 20) return 'yellow';
  return 'red';
}

// Helper para calcular tempo até recarga
export function getTimeUntilRecharge(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
