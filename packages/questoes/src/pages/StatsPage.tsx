import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Award, Target, ChevronRight, Loader2, TrendingUp, User } from 'lucide-react';
import { Card, CircularProgress } from '../components/ui';
import { useUserStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import { calculateXPProgress } from '../constants/levelConfig';
import {
  getUserMateriaStats,
  getUserDailyEvolution,
  getUserPercentile,
  getLeagueRanking,
  getUserAverageTime,
  getUserCompletedMissions,
  getUserSubjectEvolution,
  getUserRecommendations,
  MateriaStats,
  DailyStats,
  LeagueRanking,
  SubjectEvolution,
  Recommendation,
} from '../services/statsService';
import {
  getAllAchievements,
  getUserUnlockedAchievements,
  Achievement,
} from '../services/achievementsService';
import {
  HeatMapCard,
  ComparisonCard,
  EvolutionChart,
  AchievementsCard,
  WeeklyRankingCard,
} from '../components/stats';

export default function StatsPage() {
  const navigate = useNavigate();
  const { stats } = useUserStore();
  const { user, profile } = useAuthStore();
  const xpProgress = calculateXPProgress(stats.xp);

  const [materiaStats, setMateriaStats] = useState<MateriaStats[]>([]);
  const [dailyEvolution, setDailyEvolution] = useState<DailyStats[]>([]);
  const [percentile, setPercentile] = useState<number>(50);
  const [averageTime, setAverageTime] = useState<number>(0);
  const [completedMissions, setCompletedMissions] = useState<number>(0);
  const [subjectEvolution, setSubjectEvolution] = useState<SubjectEvolution[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [materia, daily, userPercentile, avgTime, missions, evolution, recs] = await Promise.all([
          getUserMateriaStats(user.id),
          getUserDailyEvolution(user.id),
          getUserPercentile(user.id),
          getUserAverageTime(user.id),
          getUserCompletedMissions(user.id),
          getUserSubjectEvolution(user.id),
          getUserRecommendations(user.id),
        ]);

        setMateriaStats(materia);
        setDailyEvolution(daily);
        setPercentile(userPercentile);
        setAverageTime(avgTime);
        setCompletedMissions(missions);
        setSubjectEvolution(evolution);
        setRecommendations(recs);
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
      if (!user?.id) {
        setIsLoadingAchievements(false);
        return;
      }

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
      if (!user?.id) {
        setIsLoadingRanking(false);
        return;
      }

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

  // Calculate errors
  const totalErrors = stats.totalAnswered - stats.correctAnswers;

  return (
    <div className="p-4 pb-24 max-w-5xl mx-auto space-y-6">
      {/* Hero Stats Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          {/* Header with Profile */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-main)]">Seu Desempenho</h1>
              <p className="text-sm text-[var(--color-text-muted)]">Visão geral do seu progresso</p>
            </div>

            {/* Profile Photo with Progress Ring */}
            <button
              onClick={() => navigate('/perfil')}
              className="relative group flex-shrink-0"
              title="Ver Perfil"
            >
              <CircularProgress
                value={xpProgress.percentage}
                size={48}
                strokeWidth={2.5}
                color="brand"
                showLabel={false}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
                      <User size={16} className="text-[var(--color-text-sec)]" />
                    </div>
                  )}
                </div>
              </CircularProgress>
              <div className="absolute inset-0 rounded-full bg-[var(--color-brand)]/0 group-hover:bg-[var(--color-brand)]/10 transition-colors" />
            </button>
          </div>

          {/* Big Number - Accuracy */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-5xl sm:text-6xl font-bold tabular-nums" style={{ color: globalAccuracy >= 70 ? 'var(--color-success)' : globalAccuracy >= 50 ? 'var(--color-brand)' : 'var(--color-error)' }}>
              {globalAccuracy}
            </span>
            <span className="text-xl text-[var(--color-text-muted)]">%</span>
            <span className="text-sm text-[var(--color-text-muted)] ml-1">de acerto</span>
          </div>

          {/* Stat Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-main)] border border-[var(--color-border)]">
              <span className="text-xs text-[var(--color-text-muted)]">Total</span>
              <span className="text-xs font-semibold text-[var(--color-text-main)] tabular-nums">{stats.totalAnswered.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
              <span className="text-xs text-[var(--color-success)]">Acertos</span>
              <span className="text-xs font-semibold text-[var(--color-success)] tabular-nums">{stats.correctAnswers.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <span className="text-xs text-[var(--color-error)]">Erros</span>
              <span className="text-xs font-semibold text-[var(--color-error)] tabular-nums">{totalErrors.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Average Time */}
        <Card className="!p-3 !py-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-info)]/10 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-[var(--color-info)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-main)] tabular-nums">
              {averageTime > 0 ? `${averageTime}s` : '—'}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">Tempo médio</p>
          </div>
        </Card>

        {/* Streak */}
        <Card className="!p-3 !py-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center mb-2">
              <Award className="w-4 h-4 text-[var(--color-brand)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-main)] tabular-nums">
              {stats.streak}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">Ofensiva</p>
          </div>
        </Card>

        {/* Missions */}
        <Card className="!p-3 !py-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center mb-2">
              <Target className="w-4 h-4 text-[var(--color-success)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-main)] tabular-nums">
              {completedMissions}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">Missões</p>
          </div>
        </Card>
      </div>

      {/* Performance Analysis - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatMapCard stats={materiaStats} isLoading={isLoading} />
        <ComparisonCard percentile={percentile} subjectEvolution={subjectEvolution} isLoading={isLoading} />
      </div>

      {/* Evolution + Recommendations - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EvolutionChart data={dailyEvolution} isLoading={isLoading} />

        {/* Recommendations */}
        <Card className="h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-[var(--color-text-main)] font-semibold">Recomendações</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)] text-sm">Continue estudando para receber recomendações personalizadas!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec, index) => {
                const IconComponent = rec.type === 'weak_subject' ? Target : rec.type === 'review' ? Clock : Award;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${rec.color}15` }}
                      >
                        <IconComponent size={16} style={{ color: rec.color }} />
                      </div>
                      <div className="text-left">
                        <p className="text-[var(--color-text-main)] text-sm font-medium">{rec.title}</p>
                        <p className="text-[var(--color-text-muted)] text-xs">{rec.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Achievements and Ranking Section - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        <WeeklyRankingCard
          ranking={leagueRanking}
          isLoading={isLoadingRanking}
        />
      </div>
    </div>
  );
}
