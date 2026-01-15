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
          <BarChart2 size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Mapa de Calor</h3>
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
          <h3 className="text-[var(--color-text-main)] font-semibold">Mapa de Calor</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)]">Nenhuma estatistica disponivel ainda.</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-2">Complete algumas missoes para ver seu progresso!</p>
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
        <h3 className="text-[var(--color-text-main)] font-semibold">Mapa de Calor</h3>
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
              <span className="text-[var(--color-text-main)] text-sm">{stat.materia}</span>
              <span
                className={`text-sm font-bold ${stat.status === 'forte'
                  ? 'text-[#2ECC71]'
                  : stat.status === 'medio'
                    ? 'text-[#F39C12]'
                    : 'text-[#E74C3C]'
                  }`}
              >
                {stat.percentual}%
              </span>
            </div>
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden border border-[var(--color-border)]">
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
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
          <span className="text-[var(--color-text-muted)] text-xs">Forte (70%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#F39C12]" />
          <span className="text-[var(--color-text-muted)] text-xs">Medio (50-70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
          <span className="text-[var(--color-text-muted)] text-xs">Fraco (-50%)</span>
        </div>
      </div>
    </Card>
  );
}
