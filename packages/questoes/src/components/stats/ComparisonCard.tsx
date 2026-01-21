import React from 'react';
import { Users, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { SubjectEvolution } from '../../services/statsService';

interface ComparisonCardProps {
  percentile: number;
  subjectEvolution: SubjectEvolution[];
  isLoading?: boolean;
}

export function ComparisonCard({ percentile, subjectEvolution, isLoading }: ComparisonCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-[var(--color-info)]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Comparativo</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[var(--color-info)]" size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-[var(--color-info)]" />
        <h3 className="text-[var(--color-text-main)] font-semibold">Comparativo</h3>
      </div>

      {/* Percentile Display */}
      <div className="relative mb-5 p-4 rounded-xl bg-gradient-to-br from-[var(--color-success)]/5 to-[var(--color-success)]/10 border border-[var(--color-success)]/20">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[var(--color-success)] tabular-nums">{percentile}%</span>
        </div>
        <p className="text-sm text-[var(--color-text-sec)] mt-1">acima dos outros estudantes</p>
      </div>

      {subjectEvolution.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wide mb-3">Evolução nos últimos 7 dias</p>
          {subjectEvolution.map((subject) => (
            <div
              key={subject.materia}
              className="flex items-center justify-between p-2.5 bg-[var(--color-bg-main)] rounded-lg"
            >
              <span className="text-[var(--color-text-main)] text-sm truncate flex-1 pr-2">{subject.materia}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {subject.evolution >= 0 ? (
                  <>
                    <TrendingUp size={14} className="text-[var(--color-success)]" />
                    <span className="text-[var(--color-success)] text-sm font-semibold tabular-nums">+{subject.evolution}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} className="text-[var(--color-error)]" />
                    <span className="text-[var(--color-error)] text-sm font-semibold tabular-nums">{subject.evolution}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[var(--color-text-muted)] text-sm">Estude mais para ver sua evolução por matéria</p>
        </div>
      )}
    </Card>
  );
}
