import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  ChevronRight,
  Loader2,
  Trophy,
  User,
  Crown,
} from 'lucide-react';
import { Card, Progress, CircularProgress, StaggerContainer, StaggerItem } from '../components/ui';
import { useUserStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getUserMateriaStats,
  getUserDailyEvolution,
  getUserPercentile,
  getLeagueRanking,
  MateriaStats,
  DailyStats,
  LeagueRanking,
  RankingMember,
  LeagueTier,
} from '../services/statsService';
import {
  getAllAchievements,
  getUserUnlockedAchievements,
  Achievement,
} from '../services/achievementsService';

function HeatMapCard({ stats, isLoading }: { stats: MateriaStats[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={20} className="text-[#FFB800]" />
          <h3 className="text-white font-semibold">Mapa de Calor</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        </div>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={20} className="text-[#FFB800]" />
          <h3 className="text-white font-semibold">Mapa de Calor</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhuma estatística disponível ainda.</p>
          <p className="text-[#6E6E6E] text-sm mt-2">Complete algumas missões para ver seu progresso!</p>
        </div>
      </Card>
    );
  }
  const getStatusColor = (status: 'forte' | 'medio' | 'fraco') => {
    switch (status) {
      case 'forte':
        return 'bg-[#2ECC71]';
      case 'medio':
        return 'bg-[#F39C12]';
      case 'fraco':
        return 'bg-[#E74C3C]';
    }
  };

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={20} className="text-[#FFB800]" />
        <h3 className="text-white font-semibold">Mapa de Calor</h3>
      </div>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.materia}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-sm">{stat.materia}</span>
              <span
                className={`text-sm font-bold ${
                  stat.status === 'forte'
                    ? 'text-[#2ECC71]'
                    : stat.status === 'medio'
                    ? 'text-[#F39C12]'
                    : 'text-[#E74C3C]'
                }`}
              >
                {stat.percentual}%
              </span>
            </div>
            <div className="h-3 bg-[#3A3A3A] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentual}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`h-full rounded-full ${getStatusColor(stat.status)}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#3A3A3A]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
          <span className="text-[#6E6E6E] text-xs">Forte (70%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#F39C12]" />
          <span className="text-[#6E6E6E] text-xs">Médio (50-70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
          <span className="text-[#6E6E6E] text-xs">Fraco (-50%)</span>
        </div>
      </div>
    </Card>
  );
}

function ComparisonCard({ percentile, isLoading }: { percentile: number; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-[#3498DB]" />
          <h3 className="text-white font-semibold">Comparativo</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#3498DB]" size={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-[#3498DB]" />
        <h3 className="text-white font-semibold">Comparativo</h3>
      </div>

      <div className="text-center mb-4">
        <p className="text-[#A0A0A0] text-sm mb-1">Você está acima de</p>
        <p className="text-4xl font-bold text-[#2ECC71]">{percentile}%</p>
        <p className="text-[#A0A0A0] text-sm">dos estudantes</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-[#3A3A3A]/50 rounded-lg">
          <span className="text-[#A0A0A0] text-sm">Direito Constitucional</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-[#2ECC71]" />
            <span className="text-[#2ECC71] text-sm">+12%</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2 bg-[#3A3A3A]/50 rounded-lg">
          <span className="text-[#A0A0A0] text-sm">Língua Portuguesa</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-[#2ECC71]" />
            <span className="text-[#2ECC71] text-sm">+8%</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2 bg-[#3A3A3A]/50 rounded-lg">
          <span className="text-[#A0A0A0] text-sm">Raciocínio Lógico</span>
          <div className="flex items-center gap-1">
            <TrendingDown size={14} className="text-[#E74C3C]" />
            <span className="text-[#E74C3C] text-sm">-5%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EvolutionChart({ data, isLoading }: { data: DailyStats[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-[#2ECC71]" />
          <h3 className="text-white font-semibold">Evolução Diária</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#2ECC71]" size={32} />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-[#2ECC71]" />
          <h3 className="text-white font-semibold">Evolução Diária</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhum dado de evolução disponível ainda.</p>
        </div>
      </Card>
    );
  }
  const maxQuestoes = Math.max(...data.map((d) => d.questoes), 1);

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-[#2ECC71]" />
        <h3 className="text-white font-semibold">Evolução Diária</h3>
      </div>

      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((day, index) => (
          <div key={day.dia + index} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: day.questoes > 0 ? `${(day.questoes / maxQuestoes) * 100}%` : '4px' }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`w-full rounded-t-lg relative min-h-[4px] ${day.questoes > 0 ? 'bg-[#FFB800]' : 'bg-[#3A3A3A]'}`}
            >
              {day.questoes > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-[#A0A0A0]">
                  {day.acerto}%
                </span>
              )}
            </motion.div>
            <span className="text-[#6E6E6E] text-[10px]">{day.dia}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3A3A3A]">
        <div>
          <p className="text-[#6E6E6E] text-xs">Últimos 7 dias</p>
          <p className="text-white font-bold">{data.reduce((acc, d) => acc + d.questoes, 0)} questões</p>
        </div>
        <div className="text-right">
          <p className="text-[#6E6E6E] text-xs">Média de acerto</p>
          <p className="text-[#2ECC71] font-bold">
            {data.filter(d => d.questoes > 0).length > 0
              ? Math.round(data.filter(d => d.questoes > 0).reduce((acc, d) => acc + d.acerto, 0) / data.filter(d => d.questoes > 0).length)
              : 0}%
          </p>
        </div>
      </div>
    </Card>
  );
}

// League tier configuration
const leagueTiers: Record<LeagueTier, { label: string; color: string; emoji: string }> = {
  ferro: { label: 'Liga Ferro', color: '#6E6E6E', emoji: '🔩' },
  bronze: { label: 'Liga Bronze', color: '#CD7F32', emoji: '🥉' },
  prata: { label: 'Liga Prata', color: '#C0C0C0', emoji: '🥈' },
  ouro: { label: 'Liga Ouro', color: '#FFD700', emoji: '🥇' },
  diamante: { label: 'Liga Diamante', color: '#B9F2FF', emoji: '💎' },
};

// Achievements Card Component
function AchievementsCard({
  achievements,
  unlockedIds,
  userStats,
  isLoading,
}: {
  achievements: Achievement[];
  unlockedIds: string[];
  userStats: { streak: number; totalAnswered: number; correctAnswers: number };
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-[#FFB800]" />
          <h3 className="text-white font-semibold">Conquistas</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        </div>
      </Card>
    );
  }

  // Combine database achievements with fallback local achievements
  const rawAchievements = achievements.length > 0 ? achievements.map(a => ({
    id: a.id,
    emoji: a.icon || '🏆',
    title: a.name,
    description: a.description,
    unlocked: unlockedIds.includes(a.id),
    progress: calculateProgress(a, userStats, unlockedIds),
  })) : [
    {
      id: 'first-step',
      emoji: '🎯',
      title: 'Primeiro Passo',
      description: 'Concluiu sua primeira missão na trilha.',
      unlocked: userStats.totalAnswered > 0,
      progress: userStats.totalAnswered > 0 ? 100 : 0,
    },
    {
      id: 'streak-3',
      emoji: '🔥',
      title: 'Em Chamas',
      description: 'Mantenha uma ofensiva de 3 dias.',
      unlocked: userStats.streak >= 3,
      progress: Math.min((userStats.streak / 3) * 100, 100),
    },
    {
      id: 'scholar',
      emoji: '📚',
      title: 'Estudioso',
      description: 'Respondeu mais de 100 questões.',
      unlocked: userStats.totalAnswered >= 100,
      progress: Math.min((userStats.totalAnswered / 100) * 100, 100),
    },
  ];

  // Sort: unlocked first, then by progress (closest to unlocking)
  const displayAchievements = [...rawAchievements].sort((a, b) => {
    // Unlocked achievements come first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    // Then sort by progress descending (closest to unlocking first)
    return b.progress - a.progress;
  });

  function calculateProgress(achievement: Achievement, stats: typeof userStats, unlocked: string[]): number {
    if (unlocked.includes(achievement.id)) return 100;

    switch (achievement.requirement_type) {
      case 'questions_answered':
        return Math.min((stats.totalAnswered / achievement.requirement_value) * 100, 100);
      case 'correct_answers':
        return Math.min((stats.correctAnswers / achievement.requirement_value) * 100, 100);
      case 'streak_days':
        return Math.min((stats.streak / achievement.requirement_value) * 100, 100);
      default:
        return 0;
    }
  }

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[#FFB800]" />
          <h3 className="text-white font-semibold">Conquistas</h3>
        </div>
        <span className="text-[#6E6E6E] text-xs">
          {displayAchievements.filter(a => a.unlocked).length}/{displayAchievements.length}
        </span>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {displayAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-[#2A2A2A]/50 border border-[#3A3A3A]"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                achievement.unlocked ? 'bg-[#FFB800]/20' : 'bg-[#1A1A1A] grayscale'
              }`}
            >
              {achievement.unlocked ? achievement.emoji : '🔒'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h4
                  className={`font-medium text-sm truncate ${
                    achievement.unlocked ? 'text-white' : 'text-[#6E6E6E]'
                  }`}
                >
                  {achievement.title}
                </h4>
                {!achievement.unlocked && achievement.progress > 0 && (
                  <span className="text-[10px] text-[#A0A0A0] ml-2">
                    {Math.round(achievement.progress)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0A0A0] truncate">{achievement.description}</p>
              {!achievement.unlocked && (
                <div className="mt-1.5 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFB800] transition-all duration-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              )}
            </div>
            {achievement.unlocked && (
              <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#2ECC71] text-[10px]">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Weekly Ranking Card Component
function WeeklyRankingCard({
  ranking,
  isLoading,
}: {
  ranking: LeagueRanking | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={20} className="text-[#FFB800]" />
          <h3 className="text-white font-semibold">Ranking Semanal</h3>
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
          <h3 className="text-white font-semibold">Ranking Semanal</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhum ranking disponível ainda.</p>
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
          <h3 className="text-white font-semibold">Ranking Semanal</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{leagueConfig.emoji}</span>
          <span className="text-xs" style={{ color: leagueConfig.color }}>
            {leagueConfig.label}
          </span>
        </div>
      </div>

      {/* Position indicator */}
      <div className="text-center mb-4 p-2 bg-[#2A2A2A]/50 rounded-lg">
        <span className="text-[#A0A0A0] text-sm">Sua posição: </span>
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
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              member.isCurrentUser
                ? 'bg-[#FFB800]/10 border border-[#FFB800]/30'
                : 'bg-[#2A2A2A]/50 border border-transparent'
            }`}
          >
            {/* Position */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                member.position === 1
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
            <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-[#6E6E6E]" />
              )}
            </div>

            {/* Name and level */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  member.isCurrentUser ? 'text-[#FFB800]' : 'text-white'
                }`}
              >
                {member.name}
                {member.isCurrentUser && ' (Você)'}
              </p>
              <p className="text-[10px] text-[#6E6E6E]">Nível {member.level}</p>
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

export default function StatsPage() {
  const { stats } = useUserStore();
  const { user } = useAuthStore();

  const [materiaStats, setMateriaStats] = useState<MateriaStats[]>([]);
  const [dailyEvolution, setDailyEvolution] = useState<DailyStats[]>([]);
  const [percentile, setPercentile] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  // Ranking state
  const [leagueRanking, setLeagueRanking] = useState<LeagueRanking | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);

  const globalAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
      : 0;

  // Load statistics data
  useEffect(() => {
    async function loadStats() {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const [materia, daily, userPercentile] = await Promise.all([
          getUserMateriaStats(user.id),
          getUserDailyEvolution(user.id),
          getUserPercentile(user.id),
        ]);

        setMateriaStats(materia);
        setDailyEvolution(daily);
        setPercentile(userPercentile);
      } catch (error) {
        console.error('[StatsPage] Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [user?.id]);

  // Load achievements
  useEffect(() => {
    async function loadAchievements() {
      if (!user?.id) return;

      setIsLoadingAchievements(true);
      try {
        const [allAch, unlockedIds] = await Promise.all([
          getAllAchievements(),
          getUserUnlockedAchievements(user.id),
        ]);

        setAchievements(allAch);
        setUnlockedAchievementIds(unlockedIds);
      } catch (error) {
        console.error('[StatsPage] Error loading achievements:', error);
      } finally {
        setIsLoadingAchievements(false);
      }
    }

    loadAchievements();
  }, [user?.id]);

  // Load ranking
  useEffect(() => {
    async function loadRanking() {
      if (!user?.id) return;

      setIsLoadingRanking(true);
      try {
        const ranking = await getLeagueRanking(user.id);
        setLeagueRanking(ranking);
      } catch (error) {
        console.error('[StatsPage] Error loading ranking:', error);
      } finally {
        setIsLoadingRanking(false);
      }
    }

    loadRanking();
  }, [user?.id]);

  return (
    <div className="p-4 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Raio-X do Aluno</h1>
        <p className="text-[#A0A0A0]">
          Sua performance detalhada e pontos de melhoria
        </p>
      </div>

      {/* Main Stats + Quick Stats - Combined row on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Circular Progress - Spans 2 cols on mobile, 1 on desktop */}
        <Card className="text-center col-span-1">
          <CircularProgress
            value={globalAccuracy}
            size={80}
            strokeWidth={8}
            color={globalAccuracy >= 70 ? 'success' : globalAccuracy >= 50 ? 'brand' : 'error'}
          />
          <p className="text-[#6E6E6E] text-sm mt-2">Taxa de Acerto</p>
        </Card>

        {/* Stats Summary */}
        <Card className="col-span-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6E6E6E] text-sm">Questões</span>
              <span className="text-white font-bold">{stats.totalAnswered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6E6E6E] text-sm">Acertos</span>
              <span className="text-[#2ECC71] font-bold">{stats.correctAnswers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6E6E6E] text-sm">Erros</span>
              <span className="text-[#E74C3C] font-bold">
                {stats.totalAnswered - stats.correctAnswers}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Stats - Hidden on mobile, shown on desktop */}
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Clock size={24} className="text-[#3498DB] mb-2" />
          <p className="text-white font-bold text-lg">45s</p>
          <p className="text-[#6E6E6E] text-xs">Tempo médio</p>
        </Card>
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Award size={24} className="text-[#FFB800] mb-2" />
          <p className="text-white font-bold text-lg">{stats.streak}</p>
          <p className="text-[#6E6E6E] text-xs">Ofensiva</p>
        </Card>
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Target size={24} className="text-[#2ECC71] mb-2" />
          <p className="text-white font-bold text-lg">5</p>
          <p className="text-[#6E6E6E] text-xs">Missões</p>
        </Card>
      </div>

      {/* Quick Stats - Mobile only */}
      <div className="grid grid-cols-3 gap-3 mb-4 lg:hidden">
        <Card className="flex flex-col items-center justify-center py-3">
          <Clock size={22} className="text-[#3498DB] mb-1.5" />
          <p className="text-white font-bold text-base">45s</p>
          <p className="text-[#6E6E6E] text-xs">Tempo médio</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <Award size={22} className="text-[#FFB800] mb-1.5" />
          <p className="text-white font-bold text-base">{stats.streak}</p>
          <p className="text-[#6E6E6E] text-xs">Ofensiva</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <Target size={22} className="text-[#2ECC71] mb-1.5" />
          <p className="text-white font-bold text-base">5</p>
          <p className="text-[#6E6E6E] text-xs">Missões</p>
        </Card>
      </div>

      {/* Heat Map + Comparison - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HeatMapCard stats={materiaStats} isLoading={isLoading} />
        <ComparisonCard percentile={percentile} isLoading={isLoading} />
      </div>

      {/* Evolution + Recommendations - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <EvolutionChart data={dailyEvolution} isLoading={isLoading} />

        {/* Action Items */}
        <Card className="h-full">
          <h3 className="text-white font-semibold mb-3">Recomendações</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-[#E74C3C]/10 rounded-lg hover:bg-[#E74C3C]/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E74C3C]/20 flex items-center justify-center">
                  <Target size={16} className="text-[#E74C3C]" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm">Foque em Raciocínio Lógico</p>
                  <p className="text-[#6E6E6E] text-xs">Seu ponto mais fraco</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#6E6E6E]" />
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-[#3498DB]/10 rounded-lg hover:bg-[#3498DB]/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3498DB]/20 flex items-center justify-center">
                  <Clock size={16} className="text-[#3498DB]" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm">Revise 12 questões</p>
                  <p className="text-[#6E6E6E] text-xs">Revisão espaçada pendente</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#6E6E6E]" />
            </button>
          </div>
        </Card>
      </div>

      {/* Achievements and Ranking Section - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Achievements */}
        <AchievementsCard
          achievements={achievements}
          unlockedIds={unlockedAchievementIds}
          userStats={{
            streak: stats.streak,
            totalAnswered: stats.totalAnswered,
            correctAnswers: stats.correctAnswers,
          }}
          isLoading={isLoadingAchievements}
        />

        {/* Weekly Ranking */}
        <WeeklyRankingCard
          ranking={leagueRanking}
          isLoading={isLoadingRanking}
        />
      </div>
    </div>
  );
}
