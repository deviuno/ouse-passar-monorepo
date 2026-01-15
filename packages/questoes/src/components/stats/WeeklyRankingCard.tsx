import React from 'react';
import { motion } from 'framer-motion';
import { Crown, User, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { LeagueRanking, LeagueTier } from '../../services/statsService';
import { getOptimizedImageUrl } from '../../utils/image';

// League tier configuration
const leagueTiers: Record<LeagueTier, { label: string; color: string; emoji: string }> = {
  ferro: { label: 'Liga Ferro', color: '#6E6E6E', emoji: '🔩' },
  bronze: { label: 'Liga Bronze', color: '#CD7F32', emoji: '🥉' },
  prata: { label: 'Liga Prata', color: '#C0C0C0', emoji: '🥈' },
  ouro: { label: 'Liga Ouro', color: '#FFD700', emoji: '🥇' },
  diamante: { label: 'Liga Diamante', color: '#B9F2FF', emoji: '💎' },
};

interface WeeklyRankingCardProps {
  ranking: LeagueRanking | null;
  isLoading?: boolean;
}

export function WeeklyRankingCard({ ranking, isLoading }: WeeklyRankingCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        </div>
      </Card>
    );
  }

  if (!ranking || ranking.members.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhum ranking disponivel ainda.</p>
          <p className="text-[#6E6E6E] text-sm mt-2">Continue praticando para aparecer no ranking!</p>
        </div>
      </Card>
    );
  }

  const leagueConfig = leagueTiers[ranking.league];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{leagueConfig.emoji}</span>
          <span className="text-xs" style={{ color: leagueConfig.color }}>
            {leagueConfig.label}
          </span>
        </div>
      </div>

      {/* Position indicator */}
      <div className="text-center mb-4 p-2 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
        <span className="text-[#A0A0A0] text-sm">Sua posicao: </span>
        <span className="text-[#FFB800] font-bold">{ranking.userPosition}º</span>
        <span className="text-[#6E6E6E] text-sm"> de {ranking.totalMembers}</span>
      </div>

      {/* Ranking list */}
      <div className="space-y-2">
        {ranking.members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${member.isCurrentUser
              ? 'bg-[#FFB800]/10 border border-[#FFB800]/30'
              : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]'
              }`}
          >
            {/* Position */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${member.position === 1
                ? 'bg-[#FFD700]/20 text-[#FFD700]'
                : member.position === 2
                  ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]'
                  : member.position === 3
                    ? 'bg-[#CD7F32]/20 text-[#CD7F32]'
                    : 'bg-[#3A3A3A] text-[#A0A0A0]'
                }`}
            >
              {member.position}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={getOptimizedImageUrl(member.avatar_url, 64, 80)}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User size={16} className="text-[#6E6E6E]" />
              )}
            </div>

            {/* Name and level */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${member.isCurrentUser ? 'text-[#FFB800]' : 'text-[var(--color-text-main)]'
                  }`}
              >
                {member.name}
                {member.isCurrentUser && ' (Voce)'}
              </p>
              <p className="text-[10px] text-[#6E6E6E]">Nivel {member.level}</p>
            </div>

            {/* XP */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#FFB800]">
                {member.xp.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] text-[#6E6E6E]">XP</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
