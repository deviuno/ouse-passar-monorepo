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
            <div className="flex items-center gap-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-1 shadow-sm">
                <button
                    onClick={() => canGoPrev && onRoundChange(currentRoundIndex - 1)}
                    disabled={!canGoPrev}
                    className={`p-0.5 rounded transition-all ${canGoPrev
                        ? 'hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] active:scale-95'
                        : 'text-[var(--color-text-muted)] cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                </button>

                <span className="text-xs font-semibold text-[var(--color-text-main)] px-0.5 whitespace-nowrap">
                    Rodada {currentRoundIndex + 1}
                </span>

                <button
                    onClick={() => canGoNext && onRoundChange(currentRoundIndex + 1)}
                    disabled={!canGoNext}
                    className={`p-0.5 rounded transition-all ${canGoNext
                        ? 'hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] active:scale-95'
                        : 'text-[var(--color-text-muted)] cursor-not-allowed'
                        }`}
                >
                    <ChevronRight size={14} strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 shadow-sm">
            <button
                onClick={() => canGoPrev && onRoundChange(currentRoundIndex - 1)}
                disabled={!canGoPrev}
                className={`p-1.5 rounded-lg transition-all ${canGoPrev
                    ? 'hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] bg-[var(--color-bg-main)] hover:scale-105 active:scale-95'
                    : 'text-[var(--color-text-muted)] bg-transparent cursor-not-allowed'
                    }`}
                title="Rodada anterior"
            >
                <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <span className="text-sm font-bold text-[var(--color-text-main)] px-2 min-w-[70px] text-center tracking-wide">
                Rodada {currentRoundIndex + 1}
            </span>

            <button
                onClick={() => canGoNext && onRoundChange(currentRoundIndex + 1)}
                disabled={!canGoNext}
                className={`p-1.5 rounded-lg transition-all ${canGoNext
                    ? 'hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] bg-[var(--color-bg-main)] hover:scale-105 active:scale-95'
                    : 'text-[var(--color-text-muted)] bg-transparent cursor-not-allowed'
                    }`}
                title="Próxima rodada"
            >
                <ChevronRight size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}