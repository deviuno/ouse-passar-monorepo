import { useMemo, useState, useEffect } from 'react';

interface TrailRound {
  roundNumber: number;
  status: 'locked' | 'available' | 'completed';
  missions: any[];
}

/**
 * Hook para navegar entre rodadas da trilha
 */
export function useRoundNavigation(rounds: TrailRound[]) {
  const currentActiveRoundIndex = useMemo(() => {
    let lastActiveIndex = 0;
    for (let i = 0; i < rounds.length; i++) {
      if (rounds[i].status !== 'locked') {
        lastActiveIndex = i;
      }
    }
    return lastActiveIndex;
  }, [rounds]);

  const [viewingRoundIndex, setViewingRoundIndex] = useState(currentActiveRoundIndex);

  useEffect(() => {
    setViewingRoundIndex(currentActiveRoundIndex);
  }, [currentActiveRoundIndex]);

  const canGoBack = viewingRoundIndex > 0;
  const canGoForward = viewingRoundIndex < rounds.length - 1;

  const goToPrevious = () => setViewingRoundIndex(v => Math.max(0, v - 1));
  const goToNext = () => setViewingRoundIndex(v => Math.min(rounds.length - 1, v + 1));

  return {
    viewingRoundIndex,
    setViewingRoundIndex,
    currentRound: viewingRoundIndex + 1,
    totalRounds: rounds.length,
    canGoBack,
    canGoForward,
    goToPrevious,
    goToNext,
    currentActiveRoundIndex,
  };
}
