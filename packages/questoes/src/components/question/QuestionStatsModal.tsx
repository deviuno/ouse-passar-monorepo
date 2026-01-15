import React from 'react';
import { BarChart2 } from 'lucide-react';
import { QuestionStatistics } from '../../services/questionFeedbackService';

interface StatData {
  alternative: string;
  percentage: number;
}

interface QuestionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatData[];
  gabarito: string;
  selectedAlt: string | null;
  questionStats: QuestionStatistics | null;
}

export function QuestionStatsModal({
  isOpen,
  onClose,
  stats,
  gabarito,
  selectedAlt,
  questionStats,
}: QuestionStatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--color-bg-card)] w-full max-w-xs rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white flex items-center">
            <BarChart2 size={20} className="mr-2 text-[#FFB800]" />
            Desempenho
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">X</button>
        </div>

        <div className="space-y-4">
          {stats.map((stat) => {
            const isCorrect = stat.alternative === gabarito;
            const isSelected = stat.alternative === selectedAlt;
            let barColor = 'bg-gray-600';
            if (isCorrect) barColor = 'bg-[#2ECC71]';
            else if (isSelected) barColor = 'bg-[#E74C3C]';

            return (
              <div key={stat.alternative} className="relative">
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className={`${isCorrect ? 'text-[#2ECC71]' : isSelected ? 'text-[#E74C3C]' : 'text-gray-400'}`}>
                    Alternativa {stat.alternative}
                    {isSelected && " (Voce)"}
                  </span>
                  <span>{stat.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${stat.percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Difficulty Distribution */}
        {questionStats && (questionStats.difficultyDistribution.easy > 0 || questionStats.difficultyDistribution.medium > 0 || questionStats.difficultyDistribution.hard > 0) && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-bold text-gray-300 mb-3">Dificuldade percebida</h4>
            <div className="flex gap-2">
              <div className="flex-1 text-center p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-lg font-bold text-green-500">{questionStats.difficultyDistribution.easy}</p>
                <p className="text-[10px] text-gray-400">Facil</p>
              </div>
              <div className="flex-1 text-center p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-lg font-bold text-yellow-500">{questionStats.difficultyDistribution.medium}</p>
                <p className="text-[10px] text-gray-400">Medio</p>
              </div>
              <div className="flex-1 text-center p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-lg font-bold text-red-500">{questionStats.difficultyDistribution.hard}</p>
                <p className="text-[10px] text-gray-400">Dificil</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
