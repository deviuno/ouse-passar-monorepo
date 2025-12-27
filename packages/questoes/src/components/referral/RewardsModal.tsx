import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gift,
  Battery,
  ShoppingBag,
  Percent,
  DollarSign,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Modal, Button } from '../ui';
import {
  getRewardCatalog,
  getUserReferralStats,
  redeemReward,
} from '../../services/referralService';
import type { RewardItem, ReferralStats } from '../../types/referral';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const REWARD_ICONS: Record<string, React.ElementType> = {
  battery: Battery,
  product: ShoppingBag,
  discount: Percent,
  cash: DollarSign,
};

const REWARD_COLORS: Record<string, string> = {
  battery: '#2ECC71',
  product: '#3498DB',
  discount: '#9B59B6',
  cash: '#FFB800',
};

export function RewardsModal({ isOpen, onClose, userId }: RewardsModalProps) {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rewardsData, statsData] = await Promise.all([
        getRewardCatalog(),
        getUserReferralStats(userId),
      ]);
      setRewards(rewardsData);
      setStats(statsData);
    } catch (e) {
      console.error('Erro ao carregar recompensas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    setRedeeming(rewardId);
    setMessage(null);

    const result = await redeemReward(userId, rewardId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Recompensa resgatada com sucesso!' });
      // Recarregar dados
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao resgatar' });
    }

    setRedeeming(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const availablePoints = stats?.available_points || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recompensas">
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Pontos Disponíveis */}
        <div className="bg-gradient-to-r from-[#9B59B6]/20 to-[#3498DB]/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0A0] text-sm">Pontos Disponíveis</p>
              <p className="text-white text-2xl font-bold">{availablePoints}</p>
            </div>
            <Gift size={32} className="text-[#9B59B6]" />
          </div>
        </div>

        {/* Mensagem de Feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                  : 'bg-[#E74C3C]/20 text-[#E74C3C]'
              }`}
            >
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Recompensas */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-8">
            <Gift size={48} className="mx-auto mb-4 text-[#6E6E6E]" />
            <p className="text-[#A0A0A0]">Nenhuma recompensa disponível</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => {
              const Icon = REWARD_ICONS[reward.type] || Gift;
              const color = REWARD_COLORS[reward.type] || '#FFB800';
              const canRedeem = availablePoints >= reward.points_required;
              const isRedeeming = redeeming === reward.id;

              return (
                <motion.div
                  key={reward.id}
                  className={`bg-[#1A1A1A] border rounded-xl p-4 ${
                    canRedeem ? 'border-[#3A3A3A]' : 'border-[#2A2A2A] opacity-60'
                  }`}
                  whileHover={canRedeem ? { scale: 1.01 } : {}}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={24} style={{ color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium">{reward.name}</h4>
                      {reward.description && (
                        <p className="text-[#6E6E6E] text-sm mt-0.5">{reward.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-sm font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {reward.points_required} pts
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={!canRedeem || isRedeeming}
                      onClick={() => handleRedeem(reward.id)}
                      className="flex-shrink-0"
                    >
                      {isRedeeming ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Resgatar'
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <p className="text-[#6E6E6E] text-xs text-center mt-4">
          Ganhe pontos indicando amigos para a plataforma.
          Cada indicação confirmada vale pontos que podem ser trocados por recompensas.
        </p>
      </div>
    </Modal>
  );
}

export default RewardsModal;
