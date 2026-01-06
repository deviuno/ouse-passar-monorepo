/**
 * Serviço de Assinatura
 * Verifica se o usuário é assinante do Ouse Questões
 * Assinantes têm acesso ilimitado APENAS na rota /praticar
 */

import { supabase } from './supabaseClient';

// Cache local para evitar requests constantes
let subscriberCache: { userId: string; isSubscriber: boolean; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minuto

/**
 * Verifica se o usuário é assinante do Ouse Questões
 * Assinantes não consomem bateria na rota /praticar
 */
export async function isOuseQuestoesSubscriber(userId: string): Promise<boolean> {
  if (!userId) return false;

  // Verificar cache
  if (
    subscriberCache &&
    subscriberCache.userId === userId &&
    Date.now() - subscriberCache.timestamp < CACHE_TTL
  ) {
    return subscriberCache.isSubscriber;
  }

  try {
    // Buscar na tabela admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_ouse_questoes_subscriber')
      .eq('id', userId)
      .single();

    if (error) {
      // Se não encontrar registro, não é assinante
      if (error.code === 'PGRST116') {
        subscriberCache = { userId, isSubscriber: false, timestamp: Date.now() };
        return false;
      }
      console.error('[SubscriptionService] Error checking subscription:', error);
      return false;
    }

    const isSubscriber = data?.is_ouse_questoes_subscriber === true;

    // Atualizar cache
    subscriberCache = { userId, isSubscriber, timestamp: Date.now() };

    return isSubscriber;
  } catch (error) {
    console.error('[SubscriptionService] Error:', error);
    return false;
  }
}

/**
 * Invalida o cache de assinatura
 */
export function invalidateSubscriberCache(): void {
  subscriberCache = null;
}

export default {
  isOuseQuestoesSubscriber,
  invalidateSubscriberCache,
};
