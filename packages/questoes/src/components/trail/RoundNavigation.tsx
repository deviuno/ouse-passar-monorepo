import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoundNavigationProps {
    currentRound: number;
    totalRounds: number;
    onPrevious: () => void;
    onNext: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
}

export function RoundNavigation({
    currentRound,
    totalRounds,
    onPrevious,
    onNext,
    canGoBack,
    canGoForward,
}: RoundNavigationProps) {
    if (totalRounds <= 1) return null;

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onPrevious}
                disabled={!canGoBack}
                className={`p-1 rounded transition-colors ${
                    canGoBack
                        ? 'text-[#A0A0A0] hover:text-white hover:bg-[#3A3A3A]'
                        : 'text-[#4A4A4A] cursor-not-allowed'
                }`}
                title="Rodada anterior"
            >
                <ChevronLeft size={16} />
            </button>

            <span className="text-[#A0A0A0] text-xs font-medium min-w-[70px] text-center">
                Rodada {currentRound}/{totalRounds}
            </span>

            <button
                onClick={onNext}
                disabled={!canGoForward}
                className={`p-1 rounded transition-colors ${
                    canGoForward
                        ? 'text-[#A0A0A0] hover:text-white hover:bg-[#3A3A3A]'
                        : 'text-[#4A4A4A] cursor-not-allowed'
                }`}
                title="Proxima rodada"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

export default RoundNavigation;
