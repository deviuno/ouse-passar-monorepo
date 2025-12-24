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
} from 'lucide-react';
import { Card, Progress, CircularProgress, StaggerContainer, StaggerItem } from '../components/ui';
import { useUserStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getUserMateriaStats,
  getUserWeeklyEvolution,
  getUserPercentile,
  MateriaStats,
  WeeklyStats
} from '../services/statsService';

function HeatMapCard({ stats, isLoading }: { stats: MateriaStats[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card>
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
      <Card>
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
    <Card>
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
      <Card>
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
    <Card>
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

function EvolutionChart({ data, isLoading }: { data: WeeklyStats[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Evolução Semanal</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Evolução Semanal</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhum dado de evolução disponível ainda.</p>
        </div>
      </Card>
    );
  }
  const maxQuestoes = Math.max(...data.map((d) => d.questoes));

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-[#2ECC71]" />
        <h3 className="text-white font-semibold">Evolução Semanal</h3>
      </div>

      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((week, index) => (
          <div key={week.semana} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(week.questoes / maxQuestoes) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full bg-[#FFB800] rounded-t-lg relative min-h-[20px]"
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-[#A0A0A0]">
                {week.acerto}%
              </span>
            </motion.div>
            <span className="text-[#6E6E6E] text-xs">{week.semana}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3A3A3A]">
        <div>
          <p className="text-[#6E6E6E] text-xs">Total de questões</p>
          <p className="text-white font-bold">{data.reduce((acc, d) => acc + d.questoes, 0)}</p>
        </div>
        <div className="text-right">
          <p className="text-[#6E6E6E] text-xs">Média de acerto</p>
          <p className="text-[#2ECC71] font-bold">
            {Math.round(data.reduce((acc, d) => acc + d.acerto, 0) / data.length)}%
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function StatsPage() {
  const { stats } = useUserStore();
  const { user } = useAuthStore();

  const [materiaStats, setMateriaStats] = useState<MateriaStats[]>([]);
  const [weeklyEvolution, setWeeklyEvolution] = useState<WeeklyStats[]>([]);
  const [percentile, setPercentile] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);

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
        const [materia, weekly, userPercentile] = await Promise.all([
          getUserMateriaStats(user.id),
          getUserWeeklyEvolution(user.id),
          getUserPercentile(user.id),
        ]);

        setMateriaStats(materia);
        setWeeklyEvolution(weekly);
        setPercentile(userPercentile);
      } catch (error) {
        console.error('[StatsPage] Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [user?.id]);

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Raio-X do Aluno</h1>
        <p className="text-[#A0A0A0]">
          Sua performance detalhada e pontos de melhoria
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center">
          <CircularProgress
            value={globalAccuracy}
            size={80}
            strokeWidth={8}
            color={globalAccuracy >= 70 ? 'success' : globalAccuracy >= 50 ? 'brand' : 'error'}
          />
          <p className="text-[#6E6E6E] text-sm mt-2">Taxa de Acerto Global</p>
        </Card>

        <Card>
          <div className="space-y-3">
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center" padding="sm">
          <Clock size={20} className="text-[#3498DB] mx-auto mb-1" />
          <p className="text-white font-bold">45s</p>
          <p className="text-[#6E6E6E] text-[10px]">Tempo médio</p>
        </Card>
        <Card className="text-center" padding="sm">
          <Award size={20} className="text-[#FFB800] mx-auto mb-1" />
          <p className="text-white font-bold">{stats.streak}</p>
          <p className="text-[#6E6E6E] text-[10px]">Ofensiva</p>
        </Card>
        <Card className="text-center" padding="sm">
          <Target size={20} className="text-[#2ECC71] mx-auto mb-1" />
          <p className="text-white font-bold">5</p>
          <p className="text-[#6E6E6E] text-[10px]">Missões</p>
        </Card>
      </div>

      {/* Heat Map */}
      <div className="mb-6">
        <HeatMapCard stats={materiaStats} isLoading={isLoading} />
      </div>

      {/* Comparison */}
      <div className="mb-6">
        <ComparisonCard percentile={percentile} isLoading={isLoading} />
      </div>

      {/* Evolution */}
      <div className="mb-6">
        <EvolutionChart data={weeklyEvolution} isLoading={isLoading} />
      </div>

      {/* Action Items */}
      <Card>
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
  );
}
