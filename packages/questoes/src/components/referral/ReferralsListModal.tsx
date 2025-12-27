import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '../ui';
import {
  getUserReferrals,
  getUserReferralStats,
  getAffiliateSettings,
} from '../../services/referralService';
import type { Referral, ReferralStats, AffiliateSettings } from '../../types/referral';

interface ReferralsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRequestWithdrawal?: () => void;
}

// Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: '#F39C12',
    icon: Clock,
    description: 'Aguardando confirmação',
  },
  confirmed: {
    label: 'Confirmado',
    color: '#2ECC71',
    icon: CheckCircle,
    description: 'Indicação confirmada',
  },
  rewarded: {
    label: 'Recompensado',
    color: '#9B59B6',
    icon: CheckCircle,
    description: 'Recompensa entregue',
  },
};

export function ReferralsListModal({
  isOpen,
  onClose,
  userId,
  onRequestWithdrawal,
}: ReferralsListModalProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [referralsData, statsData, settingsData] = await Promise.all([
        getUserReferrals(userId),
        getUserReferralStats(userId),
        getAffiliateSettings(),
      ]);
      setReferrals(referralsData);
      setStats(statsData);
      setSettings(settingsData);
    } catch (e) {
      console.error('Erro ao carregar indicados:', e);
    } finally {
      setLoading(false);
    }
  };

  const canWithdraw =
    stats &&
    settings &&
    stats.total_commissions >= settings.min_withdrawal;

  // Animações diferentes para mobile e desktop
  const modalVariants = isMobile
    ? {
        initial: { y: '100%', opacity: 1 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 1 },
      }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container - Desktop: centered flex, Mobile: bottom positioned */}
          <div
            className={`
              fixed z-[100] pointer-events-none
              ${isMobile
                ? 'inset-x-0 bottom-[72px] top-auto'
                : 'inset-0 flex items-center justify-center p-4'
              }
            `}
          >
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={
                isMobile
                  ? { type: 'spring', damping: 30, stiffness: 300 }
                  : { type: 'spring', damping: 25, stiffness: 300 }
              }
              className={`
                pointer-events-auto bg-[#252525] shadow-2xl overflow-hidden flex flex-col
                ${
                  isMobile
                    ? 'w-full rounded-t-2xl max-h-[60vh]'
                    : 'w-full max-w-md rounded-2xl max-h-[80vh]'
                }
              `}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
              {/* Drag handle para mobile */}
              {isMobile && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#6E6E6E] rounded-full" />
              )}
              <h2 className="text-lg font-semibold text-white">Meus Indicados</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#3A3A3A] transition-colors"
              >
                <X size={20} className="text-[#A0A0A0]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Resumo */}
              {stats && (
                <div className="bg-gradient-to-r from-[#3498DB]/20 to-[#2ECC71]/20 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white text-xl font-bold">{stats.total_referrals}</p>
                      <p className="text-[#A0A0A0] text-xs">Total</p>
                    </div>
                    <div>
                      <p className="text-[#2ECC71] text-xl font-bold">{stats.confirmed_referrals}</p>
                      <p className="text-[#A0A0A0] text-xs">Confirmados</p>
                    </div>
                    <div>
                      <p className="text-[#F39C12] text-xl font-bold">{stats.pending_referrals}</p>
                      <p className="text-[#A0A0A0] text-xs">Pendentes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Indicados */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto mb-4 text-[#6E6E6E]" />
                  <p className="text-[#A0A0A0]">Nenhum indicado ainda</p>
                  <p className="text-[#6E6E6E] text-sm mt-1">
                    Compartilhe seu link para começar a indicar!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => {
                    const statusConfig = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    const referredUser = referral.referred_user;

                    return (
                      <div
                        key={referral.id}
                        className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {referredUser?.avatar_url ? (
                              <img
                                src={referredUser.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-[#6E6E6E]" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {referredUser?.name || 'Usuário'}
                            </p>
                            <p className="text-[#6E6E6E] text-xs truncate">
                              {referredUser?.email || 'Email não disponível'}
                            </p>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1">
                            <StatusIcon size={16} style={{ color: statusConfig.color }} />
                            <span
                              className="text-xs font-medium"
                              style={{ color: statusConfig.color }}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Pontos ganhos */}
                        {referral.points_earned > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
                            <span className="text-[#9B59B6] text-xs">
                              +{referral.points_earned} pontos ganhos
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comissões e Saque */}
              {stats && stats.total_commissions > 0 && (
                <div className="mt-4 p-4 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#A0A0A0] text-sm">Total em Comissões</span>
                    <span className="text-[#2ECC71] font-bold text-lg">
                      R$ {stats.total_commissions.toFixed(2)}
                    </span>
                  </div>

                  {settings && (
                    <div className="text-[#6E6E6E] text-xs mb-3">
                      Mínimo para saque: R$ {settings.min_withdrawal.toFixed(2)}
                    </div>
                  )}

                  {canWithdraw ? (
                    <Button
                      fullWidth
                      onClick={() => {
                        onRequestWithdrawal?.();
                        onClose();
                      }}
                    >
                      Solicitar Saque
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-[#F39C12] text-sm">
                      <AlertCircle size={16} />
                      <span>
                        Faltam R$ {((settings?.min_withdrawal || 0) - (stats?.total_commissions || 0)).toFixed(2)} para solicitar saque
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <p className="text-[#6E6E6E] text-xs text-center mt-4">
                Quando seus indicados confirmam o cadastro, você ganha pontos.
                Quando eles compram, você ganha comissões!
              </p>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ReferralsListModal;
