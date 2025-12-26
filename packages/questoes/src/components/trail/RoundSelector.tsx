import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoundSelectorProps {
    currentRoundIndex: number;
    totalRounds: number;
    onRoundChange: (index: number) => void;
    compact?: boolean;
}

export function RoundSelector({ currentRoundIndex, totalRounds, onRoundChange, compact = false }: RoundSelectorProps) {
    const canGoPrev = currentRoundIndex > 0;
    const canGoNext = currentRoundIndex < totalRounds - 1;

    if (compact) {
        return (
            <div className="flex items-center gap-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-2 py-1 shadow-sm">
                <button
                    onClick={() => canGoPrev && onRoundChange(currentRoundIndex - 1)}
                    disabled={!canGoPrev}
                    className={`p-0.5 rounded transition-all ${canGoPrev
                        ? 'hover:bg-[#3A3A3A] text-white active:scale-95'
                        : 'text-zinc-600 cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                </button>

                <span className="text-xs font-semibold text-white px-0.5 whitespace-nowrap">
                    Rodada {currentRoundIndex + 1}
                </span>

                <button
                    onClick={() => canGoNext && onRoundChange(currentRoundIndex + 1)}
                    disabled={!canGoNext}
                    className={`p-0.5 rounded transition-all ${canGoNext
                        ? 'hover:bg-[#3A3A3A] text-white active:scale-95'
                        : 'text-zinc-600 cursor-not-allowed'
                        }`}
                >
                    <ChevronRight size={14} strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl px-3 py-1.5 shadow-sm">
            <button
                onClick={() => canGoPrev && onRoundChange(currentRoundIndex - 1)}
                disabled={!canGoPrev}
                className={`p-1.5 rounded-lg transition-all ${canGoPrev
                    ? 'hover:bg-[#3A3A3A] text-white bg-zinc-800 hover:scale-105 active:scale-95'
                    : 'text-zinc-600 bg-transparent cursor-not-allowed'
                    }`}
                title="Rodada anterior"
            >
                <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <span className="text-sm font-bold text-white px-2 min-w-[70px] text-center tracking-wide">
                Rodada {currentRoundIndex + 1}
            </span>

            <button
                onClick={() => canGoNext && onRoundChange(currentRoundIndex + 1)}
                disabled={!canGoNext}
                className={`p-1.5 rounded-lg transition-all ${canGoNext
                    ? 'hover:bg-[#3A3A3A] text-white bg-zinc-800 hover:scale-105 active:scale-95'
                    : 'text-zinc-600 bg-transparent cursor-not-allowed'
                    }`}
                title="Próxima rodada"
            >
                <ChevronRight size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}