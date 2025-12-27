// Types para sistema de indicação e afiliados

export type ReferralStatus = 'pending' | 'confirmed' | 'rewarded';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';
export type RewardType = 'battery' | 'product' | 'discount' | 'cash';
export type RedemptionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// Indicação
export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_at: string;
  status: ReferralStatus;
  points_earned: number;
  created_at: string;
  // Dados do usuário indicado (join)
  referred_user?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Estatísticas de indicação do usuário
export interface ReferralStats {
  total_referrals: number;
  confirmed_referrals: number;
  pending_referrals: number;
  total_points: number;
  available_points: number; // Pontos que podem ser resgatados
  spent_points: number;
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
}

// Item do catálogo de recompensas
export interface RewardItem {
  id: string;
  name: string;
  description?: string;
  type: RewardType;
  points_required: number;
  reward_value: {
    battery_amount?: number;
    product_id?: string;
    discount_percent?: number;
    cash_amount?: number;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Resgate de recompensa
export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
  // Dados da recompensa (join)
  reward?: RewardItem;
}

// Comissão de afiliado
export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referred_id: string;
  transaction_id?: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  notes?: string;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  // Dados do usuário indicado (join)
  referred_user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

// Tracking de visita via link de indicação
export interface ReferralTracking {
  id: string;
  referrer_username: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  landing_page?: string;
  created_at: string;
  converted_at?: string;
  converted_user_id?: string;
}

// Configurações de afiliados (do system_settings)
export interface AffiliateSettings {
  is_enabled: boolean;
  points_per_referral: number;
  commission_rate: number;
  min_withdrawal: number;
  battery_reward_per_referral: number;
}

// Response para o link de indicação
export interface ReferralLinkInfo {
  username: string;
  referral_url: string;
  referrer_name?: string;
  referrer_avatar_url?: string;
}
