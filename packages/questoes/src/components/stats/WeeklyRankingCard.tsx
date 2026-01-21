import React from 'react';
import { motion } from 'framer-motion';
import { Crown, User, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { LeagueRanking, LeagueTier } from '../../services/statsService';
import { getOptimizedImageUrl } from '../../utils/image';

// League tier configuration
const leagueTiers: Record<LeagueTier, { label: string; color: string; emoji: string }> = {
  ferro: { label: 'Ferro', color: '#6E6E6E', emoji: '🔩' },
  bronze: { label: 'Bronze', color: '#CD7F32', emoji: '🥉' },
  prata: { label: 'Prata', color: '#C0C0C0', emoji: '🥈' },
  ouro: { label: 'Ouro', color: '#FFD700', emoji: '🥇' },
  diamante: { label: 'Diamante', color: '#B9F2FF', emoji: '💎' },
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
          <Crown size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
        </div>
      </Card>
    );
  }

  if (!ranking || ranking.members.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)] text-sm">Nenhum ranking disponível ainda.</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-2">Continue praticando para aparecer no ranking!</p>
        </div>
      </Card>
    );
  }

  const leagueConfig = leagueTiers[ranking.league];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Ranking Semanal</h3>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${leagueConfig.color}15`, color: leagueConfig.color }}
        >
          <span>{leagueConfig.emoji}</span>
          <span>{leagueConfig.label}</span>
        </div>
      </div>

      {/* Position indicator */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20">
        <span className="text-[var(--color-text-sec)] text-sm">Sua posição</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[var(--color-brand)] font-bold text-lg tabular-nums">{ranking.userPosition}º</span>
          <span className="text-[var(--color-text-muted)] text-xs">de {ranking.totalMembers}</span>
        </div>
      </div>

      {/* Ranking list */}
      <div className="space-y-2">
        {ranking.members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
              member.isCurrentUser
                ? 'bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20'
                : 'bg-[var(--color-bg-main)]'
            }`}
          >
            {/* Position */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                member.position === 1
                  ? 'bg-[#FFD700]/20 text-[#FFD700]'
                  : member.position === 2
                    ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]'
                    : member.position === 3
                      ? 'bg-[#CD7F32]/20 text-[#CD7F32]'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
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
                <User size={16} className="text-[var(--color-text-muted)]" />
              )}
            </div>

            {/* Name and level */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  member.isCurrentUser ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-main)]'
                }`}
              >
                {member.name}
                {member.isCurrentUser && ' (Você)'}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Nível {member.level}</p>
            </div>

            {/* XP */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[var(--color-brand)] tabular-nums">
                {member.xp.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">XP</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
