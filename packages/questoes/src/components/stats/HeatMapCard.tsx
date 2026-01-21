import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { MateriaStats } from '../../services/statsService';

interface HeatMapCardProps {
  stats: MateriaStats[];
  isLoading?: boolean;
}

export function HeatMapCard({ stats, isLoading }: HeatMapCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Desempenho por Matéria</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
        </div>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-[var(--color-brand)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Desempenho por Matéria</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)] text-sm">Nenhuma estatística disponível ainda.</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-2">Complete algumas questões para ver seu progresso!</p>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: 'forte' | 'medio' | 'fraco') => {
    switch (status) {
      case 'forte':
        return 'var(--color-success)';
      case 'medio':
        return 'var(--color-warning)';
      case 'fraco':
        return 'var(--color-error)';
    }
  };

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-[var(--color-brand)]" />
        <h3 className="text-[var(--color-text-main)] font-semibold">Desempenho por Matéria</h3>
      </div>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const color = getStatusColor(stat.status);
          return (
            <motion.div
              key={stat.materia}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[var(--color-text-main)] text-sm font-medium truncate pr-2">{stat.materia}</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color }}
                >
                  {stat.percentual}%
                </span>
              </div>
              <div className="h-2 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentual}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--color-text-muted)] text-xs">Forte (70%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]" />
          <span className="text-[var(--color-text-muted)] text-xs">Médio (50-70%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)]" />
          <span className="text-[var(--color-text-muted)] text-xs">Fraco (&lt;50%)</span>
        </div>
      </div>
    </Card>
  );
}
