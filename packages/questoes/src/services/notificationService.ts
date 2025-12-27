import { supabase } from './supabase';

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: 'info' | 'success' | 'warning' | 'error' | 'trophy' | 'fire' | 'star';
  link?: string;
  read: boolean;
  created_at: string;
  time_ago: string;
}

// Tipos de notificação padrão do sistema
export const NotificationTypes = {
  WELCOME: 'welcome',
  FIRST_CORRECT: 'first_correct',
  MISSION_UNLOCKED: 'mission_unlocked',
  MISSION_COMPLETED: 'mission_completed',
  STREAK_MILESTONE: 'streak_milestone',
  LEVEL_UP: 'level_up',
  DAILY_GOAL: 'daily_goal',
  ACHIEVEMENT: 'achievement',
} as const;

/**
 * Busca notificações do usuário
 */
export async function getUserNotifications(
  userId: string,
  limit = 20,
  includeRead = true
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_notifications', {
      p_user_id: userId,
      p_limit: limit,
      p_include_read: includeRead,
    });

    if (error) {
      console.error('[NotificationService] Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return [];
  }
}

/**
 * Cria uma notificação
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  description: string,
  icon: string = 'info',
  link?: string,
  triggerType?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_description: description,
      p_icon: icon,
      p_link: link || null,
      p_trigger_type: triggerType || null,
    });

    if (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return null;
  }
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('[NotificationService] Error marking as read:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return false;
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      console.error('[NotificationService] Error marking all as read:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return 0;
  }
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return false;
  }
}

/**
 * Limpa todas as notificações do usuário
 */
export async function clearAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[NotificationService] Error clearing notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[NotificationService] Error:', error);
    return false;
  }
}

// ============================================================================
// NOTIFICAÇÕES PADRÃO DO SISTEMA
// ============================================================================

/**
 * Envia notificação de boas-vindas (apenas uma vez por usuário)
 */
export async function sendWelcomeNotification(userId: string, userName?: string): Promise<void> {
  const name = userName ? `, ${userName.split(' ')[0]}` : '';
  await createNotification(
    userId,
    NotificationTypes.WELCOME,
    `Bem-vindo${name}!`,
    'Sua jornada de aprovação começa agora. Explore suas trilhas e conquiste seu objetivo!',
    'success',
    '/',
    'welcome' // trigger único
  );
}

/**
 * Envia notificação de primeiro acerto
 */
export async function sendFirstCorrectNotification(userId: string): Promise<void> {
  await createNotification(
    userId,
    NotificationTypes.FIRST_CORRECT,
    'Primeira Vitória!',
    'Você acertou sua primeira questão! Continue assim e a aprovação será sua.',
    'trophy',
    undefined,
    'first_correct_answer'
  );
}

/**
 * Envia notificação de missão desbloqueada
 */
export async function sendMissionUnlockedNotification(
  userId: string,
  missionName: string,
  missionNumber: number
): Promise<void> {
  await createNotification(
    userId,
    NotificationTypes.MISSION_UNLOCKED,
    'Nova Missão Desbloqueada!',
    `A Missão ${missionNumber} "${missionName}" está disponível. Bora estudar!`,
    'star',
    undefined,
    `mission_${missionNumber}_unlocked`
  );
}

/**
 * Envia notificação de missão completada
 */
export async function sendMissionCompletedNotification(
  userId: string,
  missionName: string,
  score: number
): Promise<void> {
  const emoji = score >= 80 ? 'Excelente' : score >= 60 ? 'Muito bem' : 'Parabéns';
  await createNotification(
    userId,
    NotificationTypes.MISSION_COMPLETED,
    'Missão Completada!',
    `${emoji}! Você completou "${missionName}" com ${score}% de aproveitamento.`,
    'success'
  );
}

/**
 * Envia notificação de marco de streak
 */
export async function sendStreakMilestoneNotification(
  userId: string,
  streakDays: number
): Promise<void> {
  const milestones = [3, 7, 14, 30, 60, 100];
  if (!milestones.includes(streakDays)) return;

  const messages: Record<number, string> = {
    3: 'Você está em uma sequência de 3 dias! Continue firme!',
    7: 'Uma semana de estudos consecutivos! Você é dedicado!',
    14: 'Duas semanas de ofensiva! Sua disciplina é admirável!',
    30: 'UM MÊS de estudos! Você é imparável!',
    60: 'Dois meses de dedicação! A aprovação está próxima!',
    100: '100 DIAS! Você é uma lenda dos estudos!',
  };

  await createNotification(
    userId,
    NotificationTypes.STREAK_MILESTONE,
    `Ofensiva de ${streakDays} Dias!`,
    messages[streakDays],
    'fire',
    '/estatisticas',
    `streak_${streakDays}`
  );
}

/**
 * Envia notificação de level up
 */
export async function sendLevelUpNotification(
  userId: string,
  newLevel: number
): Promise<void> {
  await createNotification(
    userId,
    NotificationTypes.LEVEL_UP,
    `Nível ${newLevel} Alcançado!`,
    `Parabéns! Você subiu para o nível ${newLevel}. Continue evoluindo!`,
    'trophy',
    '/perfil',
    `level_${newLevel}`
  );
}

/**
 * Envia notificação de meta diária atingida
 */
export async function sendDailyGoalNotification(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await createNotification(
    userId,
    NotificationTypes.DAILY_GOAL,
    'Meta Diária Cumprida!',
    'Você completou sua meta de estudos de hoje. Descanse ou continue evoluindo!',
    'success',
    undefined,
    `daily_goal_${today}`
  );
}
