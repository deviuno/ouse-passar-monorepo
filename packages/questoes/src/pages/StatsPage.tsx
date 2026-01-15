import React, { useState, useEffect } from 'react';
import { Clock, Award, Target, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CircularProgress } from '../components/ui';
import { useUserStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
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
  const { stats } = useUserStore();
  const { user } = useAuthStore();

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

  return (
    <div className="p-4 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Raio-X do Aluno</h1>
        <p className="text-[var(--color-text-muted)]">
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
          <p className="text-[var(--color-text-muted)] text-sm mt-2">Taxa de Acerto</p>
        </Card>

        {/* Stats Summary */}
        <Card className="col-span-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] text-sm">Questões</span>
              <span className="text-[var(--color-text-main)] font-bold">{stats.totalAnswered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] text-sm">Acertos</span>
              <span className="text-[#2ECC71] font-bold">{stats.correctAnswers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] text-sm">Erros</span>
              <span className="text-[#E74C3C] font-bold">
                {stats.totalAnswered - stats.correctAnswers}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Stats - Hidden on mobile, shown on desktop */}
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Clock size={24} className="text-[#3498DB] mb-2" />
          <p className="text-[var(--color-text-main)] font-bold text-lg">{averageTime > 0 ? `${averageTime}s` : '-'}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Tempo médio</p>
        </Card>
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Award size={24} className="text-[#FFB800] mb-2" />
          <p className="text-[var(--color-text-main)] font-bold text-lg">{stats.streak}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Ofensiva</p>
        </Card>
        <Card className="hidden lg:flex flex-col items-center justify-center h-full">
          <Target size={24} className="text-[#2ECC71] mb-2" />
          <p className="text-[var(--color-text-main)] font-bold text-lg">{completedMissions}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Missões</p>
        </Card>
      </div>

      {/* Quick Stats - Mobile only */}
      <div className="grid grid-cols-3 gap-3 mb-4 lg:hidden">
        <Card className="flex flex-col items-center justify-center py-3">
          <Clock size={22} className="text-[#3498DB] mb-1.5" />
          <p className="text-[var(--color-text-main)] font-bold text-base">{averageTime > 0 ? `${averageTime}s` : '-'}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Tempo médio</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <Award size={22} className="text-[#FFB800] mb-1.5" />
          <p className="text-[var(--color-text-main)] font-bold text-base">{stats.streak}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Ofensiva</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <Target size={22} className="text-[#2ECC71] mb-1.5" />
          <p className="text-[var(--color-text-main)] font-bold text-base">{completedMissions}</p>
          <p className="text-[var(--color-text-muted)] text-xs">Missões</p>
        </Card>
      </div>

      {/* Heat Map + Comparison - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HeatMapCard stats={materiaStats} isLoading={isLoading} />
        <ComparisonCard percentile={percentile} subjectEvolution={subjectEvolution} isLoading={isLoading} />
      </div>

      {/* Evolution + Recommendations - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <EvolutionChart data={dailyEvolution} isLoading={isLoading} />

        {/* Action Items */}
        <Card className="h-full">
          <h3 className="text-[var(--color-text-main)] font-semibold mb-3">Recomendações</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#FFB800]" size={32} />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)]">Continue estudando para receber recomendações personalizadas!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec, index) => {
                const IconComponent = rec.type === 'weak_subject' ? Target : rec.type === 'review' ? Clock : Award;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${rec.color}15` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${rec.color}30` }}
                      >
                        <IconComponent size={16} style={{ color: rec.color }} />
                      </div>
                      <div className="text-left">
                        <p className="text-[var(--color-text-main)] text-sm">{rec.title}</p>
                        <p className="text-[var(--color-text-muted)] text-xs">{rec.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#6E6E6E]" />
                  </button>
                );
              })}
            </div>
          )}
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
