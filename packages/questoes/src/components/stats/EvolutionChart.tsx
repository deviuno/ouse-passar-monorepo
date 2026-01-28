import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { DailyStats } from '../../services/statsService';

interface EvolutionChartProps {
  data: DailyStats[];
  isLoading?: boolean;
}

export function EvolutionChart({ data, isLoading }: EvolutionChartProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Evolução Diária</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Evolução Diária</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)] text-sm">Nenhum dado de evolução disponível ainda.</p>
        </div>
      </Card>
    );
  }

  const maxQuestoes = Math.max(...data.map((d) => d.questoes), 1);
  const totalQuestions = data.reduce((acc, d) => acc + d.questoes, 0);
  const daysWithActivity = data.filter(d => d.questoes > 0);
  const averageAccuracy = daysWithActivity.length > 0
    ? Math.round(daysWithActivity.reduce((acc, d) => acc + d.acerto, 0) / daysWithActivity.length)
    : 0;

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-[var(--color-brand)]" />
        <h3 className="text-[var(--color-text-main)] font-semibold">Evolução Diária</h3>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-28 mb-2">
        {data.map((day, index) => {
          const hasData = day.questoes > 0;
          const heightPercent = hasData ? (day.questoes / maxQuestoes) * 100 : 0;

          return (
            <div key={day.dia + index} className="flex-1 flex flex-col items-center">
              <div className="relative w-full flex flex-col items-center">
                {hasData && (
                  <span className="text-[10px] text-[var(--color-text-sec)] font-medium tabular-nums mb-1">
                    {day.acerto}%
                  </span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: hasData ? `${Math.max(heightPercent, 8)}%` : 4 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
                  className={`w-full max-w-[32px] rounded-t-md ${hasData ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-bg-elevated)]'}`}
                  style={{ minHeight: hasData ? '16px' : '4px' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Labels */}
      <div className="flex justify-between gap-2 mb-4">
        {data.map((day, index) => (
          <div key={day.dia + index} className="flex-1 text-center">
            <span className="text-[var(--color-text-muted)] text-[10px] font-medium uppercase">{day.dia}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <div>
          <p className="text-[var(--color-text-muted)] text-xs">Últimos 7 dias</p>
          <p className="text-[var(--color-text-main)] font-bold tabular-nums">{totalQuestions.toLocaleString('pt-BR')} questões</p>
        </div>
        <div className="text-right">
          <p className="text-[var(--color-text-muted)] text-xs">Média de acerto</p>
          <p className="text-[var(--color-success)] font-bold tabular-nums">{averageAccuracy}%</p>
        </div>
      </div>
    </Card>
  );
}
