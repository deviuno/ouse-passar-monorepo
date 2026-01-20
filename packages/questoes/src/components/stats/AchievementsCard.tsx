import React from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { Achievement } from '../../services/achievementsService';

interface AchievementsCardProps {
  achievements: Achievement[];
  unlockedIds: string[];
  userStats: { streak: number; totalAnswered: number; correctAnswers: number };
  isLoading?: boolean;
}

export function AchievementsCard({
  achievements,
  unlockedIds,
  userStats,
  isLoading,
}: AchievementsCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Conquistas</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        </div>
      </Card>
    );
  }

  function calculateProgress(achievement: Achievement, stats: typeof userStats, unlocked: string[]): number {
    if (unlocked.includes(achievement.id)) return 100;

    switch (achievement.requirement_type) {
      case 'questions_answered':
        return Math.min((stats.totalAnswered / achievement.requirement_value) * 100, 100);
      case 'correct_answers':
        return Math.min((stats.correctAnswers / achievement.requirement_value) * 100, 100);
      case 'streak_days':
        return Math.min((stats.streak / achievement.requirement_value) * 100, 100);
      default:
        return 0;
    }
  }

  // Combine database achievements with fallback local achievements
  const rawAchievements = achievements.length > 0 ? achievements.map(a => ({
    id: a.id,
    emoji: a.icon || '🏆',
    title: a.name,
    description: a.description,
    unlocked: unlockedIds.includes(a.id),
    progress: calculateProgress(a, userStats, unlockedIds),
  })) : [
    {
      id: 'first-step',
      emoji: '🎯',
      title: 'Primeiro Passo',
      description: 'Concluiu sua primeira missao na trilha.',
      unlocked: userStats.totalAnswered > 0,
      progress: userStats.totalAnswered > 0 ? 100 : 0,
    },
    {
      id: 'streak-3',
      emoji: '🔥',
      title: 'Em Chamas',
      description: 'Mantenha uma ofensiva de 3 dias.',
      unlocked: userStats.streak >= 3,
      progress: Math.min((userStats.streak / 3) * 100, 100),
    },
    {
      id: 'scholar',
      emoji: '📚',
      title: 'Estudioso',
      description: 'Respondeu mais de 100 questoes.',
      unlocked: userStats.totalAnswered >= 100,
      progress: Math.min((userStats.totalAnswered / 100) * 100, 100),
    },
  ];

  // Sort: unlocked first, then by progress (closest to unlocking)
  const displayAchievements = [...rawAchievements].sort((a, b) => {
    // Unlocked achievements come first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    // Then sort by progress descending (closest to unlocking first)
    return b.progress - a.progress;
  });

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[#FFB800]" />
          <h3 className="text-[var(--color-text-main)] font-semibold">Conquistas</h3>
        </div>
        <span className="text-[#6E6E6E] text-xs">
          {displayAchievements.filter(a => a.unlocked).length}/{displayAchievements.length}
        </span>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {displayAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${achievement.unlocked ? 'bg-[#FFB800]/20' : 'bg-[var(--color-bg-main)] grayscale'
                }`}
            >
              {achievement.unlocked ? achievement.emoji : '🔒'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h4
                  className={`font-medium text-sm truncate ${achievement.unlocked ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'
                    }`}
                >
                  {achievement.title}
                </h4>
                {!achievement.unlocked && achievement.progress > 0 && (
                  <span className="text-[10px] text-[var(--color-text-muted)] ml-2">
                    {Math.round(achievement.progress)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{achievement.description}</p>
              {!achievement.unlocked && (
                <div className="mt-1.5 h-1 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffac00] transition-all duration-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              )}
            </div>
            {achievement.unlocked && (
              <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#2ECC71] text-[10px]">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
