import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2 } from 'lucide-react';
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
          <TrendingUp size={20} className="text-[#2ECC71]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Evolucao Diaria</h3>
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
          <h3 className="text-[var(--color-text-main)] font-semibold">Evolucao Diaria</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#6E6E6E]">Nenhum dado de evolucao disponivel ainda.</p>
        </div>
      </Card>
    );
  }

  const maxQuestoes = Math.max(...data.map((d) => d.questoes), 1);

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-[#2ECC71]" />
        <h3 className="text-[var(--color-text-main)] font-semibold">Evolucao Diaria</h3>
      </div>

      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((day, index) => (
          <div key={day.dia + index} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: day.questoes > 0 ? `${(day.questoes / maxQuestoes) * 100}%` : '4px' }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`w-full rounded-t-lg relative min-h-[4px] ${day.questoes > 0 ? 'bg-[#FFB800]' : 'bg-[var(--color-bg-elevated)]'}`}
            >
              {day.questoes > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-text-sec)]">
                  {day.acerto}%
                </span>
              )}
            </motion.div>
            <span className="text-[var(--color-text-muted)] text-[10px]">{day.dia}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
        <div>
          <p className="text-[var(--color-text-muted)] text-xs">Ultimos 7 dias</p>
          <p className="text-[var(--color-text-main)] font-bold">{data.reduce((acc, d) => acc + d.questoes, 0)} questoes</p>
        </div>
        <div className="text-right">
          <p className="text-[var(--color-text-muted)] text-xs">Media de acerto</p>
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
