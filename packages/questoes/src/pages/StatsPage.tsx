import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Card, Progress, CircularProgress, StaggerContainer, StaggerItem } from '../components/ui';
import { useUserStore } from '../stores';

// Mock data for demonstration
const MATERIA_STATS = [
  { materia: 'Lingua Portuguesa', acertos: 45, total: 60, percentual: 75, status: 'forte' as const },
  { materia: 'Direito Constitucional', acertos: 38, total: 50, percentual: 76, status: 'forte' as const },
  { materia: 'Direito Administrativo', acertos: 22, total: 40, percentual: 55, status: 'medio' as const },
  { materia: 'Informatica', acertos: 18, total: 30, percentual: 60, status: 'medio' as const },
  { materia: 'Raciocinio Logico', acertos: 8, total: 25, percentual: 32, status: 'fraco' as const },
];

const WEEKLY_EVOLUTION = [
  { semana: 'Sem 1', questoes: 50, acerto: 62 },
  { semana: 'Sem 2', questoes: 75, acerto: 68 },
  { semana: 'Sem 3', questoes: 60, acerto: 71 },
  { semana: 'Sem 4', questoes: 90, acerto: 74 },
];

function HeatMapCard({ stats }: { stats: typeof MATERIA_STATS }) {
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
          <span className="text-[#6E6E6E] text-xs">Medio (50-70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
          <span className="text-[#6E6E6E] text-xs">Fraco (-50%)</span>
        </div>
      </div>
    </Card>
  );
}

function ComparisonCard() {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-[#3498DB]" />
        <h3 className="text-white font-semibold">Comparativo</h3>
      </div>

      <div className="text-center mb-4">
        <p className="text-[#A0A0A0] text-sm mb-1">Voce esta acima de</p>
        <p className="text-4xl font-bold text-[#2ECC71]">68%</p>
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
          <span className="text-[#A0A0A0] text-sm">Lingua Portuguesa</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-[#2ECC71]" />
            <span className="text-[#2ECC71] text-sm">+8%</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2 bg-[#3A3A3A]/50 rounded-lg">
          <span className="text-[#A0A0A0] text-sm">Raciocinio Logico</span>
          <div className="flex items-center gap-1">
            <TrendingDown size={14} className="text-[#E74C3C]" />
            <span className="text-[#E74C3C] text-sm">-5%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EvolutionChart({ data }: { data: typeof WEEKLY_EVOLUTION }) {
  const maxQuestoes = Math.max(...data.map((d) => d.questoes));

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-[#2ECC71]" />
        <h3 className="text-white font-semibold">Evolucao Semanal</h3>
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
          <p className="text-[#6E6E6E] text-xs">Total de questoes</p>
          <p className="text-white font-bold">{data.reduce((acc, d) => acc + d.questoes, 0)}</p>
        </div>
        <div className="text-right">
          <p className="text-[#6E6E6E] text-xs">Media de acerto</p>
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

  const globalAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
      : 0;

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
              <span className="text-[#6E6E6E] text-sm">Questoes</span>
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
          <p className="text-[#6E6E6E] text-[10px]">Tempo medio</p>
        </Card>
        <Card className="text-center" padding="sm">
          <Award size={20} className="text-[#FFB800] mx-auto mb-1" />
          <p className="text-white font-bold">{stats.streak}</p>
          <p className="text-[#6E6E6E] text-[10px]">Ofensiva</p>
        </Card>
        <Card className="text-center" padding="sm">
          <Target size={20} className="text-[#2ECC71] mx-auto mb-1" />
          <p className="text-white font-bold">5</p>
          <p className="text-[#6E6E6E] text-[10px]">Missoes</p>
        </Card>
      </div>

      {/* Heat Map */}
      <div className="mb-6">
        <HeatMapCard stats={MATERIA_STATS} />
      </div>

      {/* Comparison */}
      <div className="mb-6">
        <ComparisonCard />
      </div>

      {/* Evolution */}
      <div className="mb-6">
        <EvolutionChart data={WEEKLY_EVOLUTION} />
      </div>

      {/* Action Items */}
      <Card>
        <h3 className="text-white font-semibold mb-3">Recomendacoes</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 bg-[#E74C3C]/10 rounded-lg hover:bg-[#E74C3C]/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E74C3C]/20 flex items-center justify-center">
                <Target size={16} className="text-[#E74C3C]" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm">Foque em Raciocinio Logico</p>
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
                <p className="text-white text-sm">Revise 12 questoes</p>
                <p className="text-[#6E6E6E] text-xs">Revisao espacada pendente</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#6E6E6E]" />
          </button>
        </div>
      </Card>
    </div>
  );
}
