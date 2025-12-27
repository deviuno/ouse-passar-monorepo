import { supabase } from './supabase';
import type {
  Referral,
  ReferralStats,
  RewardItem,
  RewardRedemption,
  AffiliateCommission,
  AffiliateSettings,
  ReferralLinkInfo,
} from '../types/referral';

const REFERRAL_STORAGE_KEY = 'ouse_referrer';
const APP_DOMAIN = 'questoes.ousepassar.com.br';
const REFERRAL_PATH = '/ref';

// ============================================
// Link de Indicação
// ============================================

/**
 * Gera o link de indicação do usuário
 */
export async function getReferralLink(userId: string): Promise<ReferralLinkInfo | null> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('username, name, avatar_url')
    .eq('id', userId)
    .single();

  if (error || !profile?.username) {
    return null;
  }

  return {
    username: profile.username,
    referral_url: `https://${APP_DOMAIN}${REFERRAL_PATH}/${profile.username}`,
    referrer_name: profile.name,
    referrer_avatar_url: profile.avatar_url,
  };
}

/**
 * Busca usuário pelo username (para landing page)
 */
export async function getUserByUsername(username: string): Promise<{
  id: string;
  name?: string;
  avatar_url?: string;
} | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Gera username para um novo usuário baseado no nome e salva no perfil
 */
export async function generateUsername(name: string, userId: string): Promise<string | null> {
  // 1. Gerar username único
  const { data: generatedUsername, error: genError } = await supabase.rpc('generate_username', {
    p_name: name,
    p_user_id: userId,
  });

  if (genError) {
    console.error('Erro ao gerar username:', genError);
    return null;
  }

  if (!generatedUsername) {
    console.error('Username não gerado');
    return null;
  }

  // 2. Salvar username no perfil do usuário
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ username: generatedUsername.toLowerCase() })
    .eq('id', userId);

  if (updateError) {
    console.error('Erro ao salvar username:', updateError);
    return null;
  }

  return generatedUsername;
}

/**
 * Atualiza o username do usuário
 */
export async function updateUsername(userId: string, username: string): Promise<boolean> {
  // Primeiro, gera o username se não foi fornecido
  const finalUsername = username || await generateUsername('user', userId);

  if (!finalUsername) return false;

  const { error } = await supabase
    .from('user_profiles')
    .update({ username: finalUsername.toLowerCase() })
    .eq('id', userId);

  return !error;
}

// ============================================
// Tracking de Visitas
// ============================================

/**
 * Salva o referrer no localStorage
 */
export function saveReferrerToStorage(username: string): void {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, username.toLowerCase());
  } catch (e) {
    console.warn('Não foi possível salvar referrer:', e);
  }
}

/**
 * Recupera o referrer do localStorage
 */
export function getReferrerFromStorage(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Remove o referrer do localStorage
 */
export function clearReferrerFromStorage(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Registra visita via link de indicação (analytics)
 */
export async function trackReferralVisit(
  referrerUsername: string,
  sessionId?: string
): Promise<void> {
  try {
    await supabase.from('referral_tracking').insert({
      referrer_username: referrerUsername.toLowerCase(),
      session_id: sessionId,
      landing_page: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.warn('Erro ao registrar tracking:', e);
  }
}

// ============================================
// Indicações
// ============================================

/**
 * Cria uma indicação quando usuário se cadastra
 */
export async function createReferral(
  referrerUsername: string,
  referredId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_referral', {
    p_referrer_username: referrerUsername.toLowerCase(),
    p_referred_id: referredId,
  });

  if (error) {
    console.error('Erro ao criar indicação:', error);
    return null;
  }

  // Limpa o storage após criar a indicação
  clearReferrerFromStorage();

  return data;
}

/**
 * Confirma uma indicação (após usuário confirmar email ou fazer primeira ação)
 */
export async function confirmReferral(referredId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('confirm_referral', {
    p_referred_id: referredId,
  });

  if (error) {
    console.error('Erro ao confirmar indicação:', error);
    return false;
  }

  return data === true;
}

/**
 * Busca indicações feitas pelo usuário
 */
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referred_user:referred_id (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar indicações:', error);
    return [];
  }

  return data?.map((r: any) => ({
    ...r,
    referred_user: r.referred_user ? {
      id: r.referred_user.id,
      name: r.referred_user.name,
      email: r.referred_user.email,
      avatar_url: r.referred_user.avatar_url,
    } : undefined,
  })) || [];
}

/**
 * Busca estatísticas de indicação do usuário
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('referral_points, total_referrals, total_commissions')
    .eq('id', userId)
    .single();

  // Buscar contagem de indicações por status
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', userId);

  // Buscar pontos gastos em resgates
  const { data: redemptions } = await supabase
    .from('referral_redemptions')
    .select('points_spent')
    .eq('user_id', userId)
    .in('status', ['pending', 'completed']);

  // Buscar comissões por status
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('commission_amount, status')
    .eq('affiliate_id', userId);

  const confirmed = referrals?.filter(r => r.status === 'confirmed' || r.status === 'rewarded').length || 0;
  const pending = referrals?.filter(r => r.status === 'pending').length || 0;
  const spentPoints = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0;
  const totalPoints = profile?.referral_points || 0;

  const pendingCommissions = commissions
    ?.filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const paidCommissions = commissions
    ?.filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  return {
    total_referrals: profile?.total_referrals || 0,
    confirmed_referrals: confirmed,
    pending_referrals: pending,
    total_points: totalPoints,
    available_points: totalPoints - spentPoints,
    spent_points: spentPoints,
    total_commissions: profile?.total_commissions || 0,
    pending_commissions: pendingCommissions,
    paid_commissions: paidCommissions,
  };
}

// ============================================
// Recompensas
// ============================================

/**
 * Busca catálogo de recompensas
 */
export async function getRewardCatalog(): Promise<RewardItem[]> {
  const { data, error } = await supabase
    .from('referral_reward_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Erro ao buscar recompensas:', error);
    return [];
  }

  return data || [];
}

/**
 * Resgata uma recompensa
 */
export async function redeemReward(
  userId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string; redemption_id?: string }> {
  // Buscar recompensa
  const { data: reward, error: rewardError } = await supabase
    .from('referral_reward_catalog')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single();

  if (rewardError || !reward) {
    return { success: false, error: 'Recompensa não encontrada' };
  }

  // Buscar pontos disponíveis
  const stats = await getUserReferralStats(userId);

  if (stats.available_points < reward.points_required) {
    return { success: false, error: 'Pontos insuficientes' };
  }

  // Criar resgate
  const { data: redemption, error: redemptionError } = await supabase
    .from('referral_redemptions')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      points_spent: reward.points_required,
      status: 'pending',
    })
    .select()
    .single();

  if (redemptionError) {
    return { success: false, error: 'Erro ao criar resgate' };
  }

  // Processar recompensa baseado no tipo
  try {
    if (reward.type === 'battery') {
      // Adicionar bateria bonus para todos os preparatórios do usuário
      const batteryAmount = reward.reward_value?.battery_amount || 0;

      const { data: trails } = await supabase
        .from('user_trails')
        .select('preparatorio_id')
        .eq('user_id', userId);

      for (const trail of trails || []) {
        await supabase.rpc('add_bonus_battery', {
          p_user_id: userId,
          p_preparatorio_id: trail.preparatorio_id,
          p_amount: batteryAmount,
        });
      }
    }

    // Marcar como completo
    await supabase
      .from('referral_redemptions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', redemption.id);

    return { success: true, redemption_id: redemption.id };
  } catch (e) {
    // Marcar como falho
    await supabase
      .from('referral_redemptions')
      .update({ status: 'failed' })
      .eq('id', redemption.id);

    return { success: false, error: 'Erro ao processar recompensa' };
  }
}

/**
 * Busca histórico de resgates do usuário
 */
export async function getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from('referral_redemptions')
    .select(`
      *,
      reward:reward_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar resgates:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Comissões
// ============================================

/**
 * Busca comissões do afiliado
 */
export async function getAffiliateCommissions(userId: string): Promise<AffiliateCommission[]> {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select(`
      *,
      referred_user:referred_id (
        id,
        name,
        email
      )
    `)
    .eq('affiliate_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar comissões:', error);
    return [];
  }

  return data?.map((c: any) => ({
    ...c,
    referred_user: c.referred_user ? {
      id: c.referred_user.id,
      name: c.referred_user.name,
      email: c.referred_user.email,
    } : undefined,
  })) || [];
}

// ============================================
// Configurações
// ============================================

/**
 * Busca configurações de afiliados
 */
export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('category', 'affiliates');

  if (error) {
    console.error('Erro ao buscar configurações de afiliados:', error);
  }

  const settings: Record<string, string> = {};
  data?.forEach(s => {
    settings[s.key] = s.value;
  });

  return {
    is_enabled: settings.is_enabled === 'true',
    points_per_referral: parseInt(settings.points_per_referral || '100', 10),
    commission_rate: parseFloat(settings.commission_rate || '10'),
    min_withdrawal: parseFloat(settings.min_withdrawal || '50'),
    battery_reward_per_referral: parseInt(settings.battery_reward_per_referral || '10', 10),
  };
}

/**
 * Verifica se o sistema de afiliados está habilitado
 */
export async function isAffiliateSystemEnabled(): Promise<boolean> {
  const settings = await getAffiliateSettings();
  return settings.is_enabled;
}
