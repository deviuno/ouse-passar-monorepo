import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Loader2, ChevronDown } from 'lucide-react';
import { Card } from '../ui';
import { MateriaStats } from '../../services/statsService';

interface HeatMapCardProps {
  stats: MateriaStats[];
  isLoading?: boolean;
}

const INITIAL_DISPLAY_COUNT = 5;

export function HeatMapCard({ stats, isLoading }: HeatMapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreItems = stats.length > INITIAL_DISPLAY_COUNT;
  const displayedStats = isExpanded ? stats : stats.slice(0, INITIAL_DISPLAY_COUNT);
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
        <AnimatePresence mode="popLayout">
          {displayedStats.map((stat, index) => {
            const color = getStatusColor(stat.status);
            return (
              <motion.div
                key={stat.materia}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                layout
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
        </AnimatePresence>
      </div>

      {/* Ver todas button */}
      {hasMoreItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1.5 mt-4 py-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors"
        >
          <span>{isExpanded ? 'Ver menos' : `Ver todas (${stats.length})`}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>
      )}

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
