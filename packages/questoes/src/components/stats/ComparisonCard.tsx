import React from 'react';
import { Target, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
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
          <Target size={20} className="text-[#3498DB]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Comparativo</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#3498DB]" size={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-[#3498DB]" />
        <h3 className="text-[var(--color-text-main)] font-semibold">Comparativo</h3>
      </div>

      <div className="text-center mb-4">
        <p className="text-[var(--color-text-muted)] text-sm mb-1">Voce esta acima de</p>
        <p className="text-4xl font-bold text-[#2ECC71]">{percentile}%</p>
        <p className="text-[var(--color-text-muted)] text-sm">dos estudantes</p>
      </div>

      {subjectEvolution.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[var(--color-text-sec)] text-xs mb-2">Evolucao ultimos 7 dias:</p>
          {subjectEvolution.map((subject) => (
            <div
              key={subject.materia}
              className="flex items-center justify-between p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg"
            >
              <span className="text-[var(--color-text-main)] text-sm truncate flex-1">{subject.materia}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {subject.evolution >= 0 ? (
                  <>
                    <TrendingUp size={14} className="text-[#2ECC71]" />
                    <span className="text-[#2ECC71] text-sm">+{subject.evolution}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} className="text-[#E74C3C]" />
                    <span className="text-[#E74C3C] text-sm">{subject.evolution}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[var(--color-text-muted)] text-sm">Estude mais para ver sua evolucao por materia</p>
        </div>
      )}
    </Card>
  );
}
