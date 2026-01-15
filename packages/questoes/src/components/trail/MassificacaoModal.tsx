import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Zap, Target, BookOpen } from 'lucide-react';

interface MassificacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
    missionLabel: string;
}

export function MassificacaoModal({
    isOpen,
    onClose,
    onStart,
    missionLabel,
}: MassificacaoModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[var(--color-bg-card)] border border-[#E74C3C]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl theme-transition"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#E74C3C]/20 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-[#E74C3C]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Massificacao</h2>
                                <p className="text-sm text-[#E74C3C]">{missionLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 mb-6">
                        <p className="text-[var(--color-text-sec)] text-sm leading-relaxed">
                            Voce nao atingiu a pontuacao minima nesta missao. A <span className="text-[#E74C3C] font-semibold">Massificacao</span> e uma oportunidade de reforcar seu aprendizado!
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                                <Target className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[var(--color-text-main)] text-sm font-medium">Mesmas questoes</p>
                                    <p className="text-[var(--color-text-muted)] text-xs">Voce refara exatamente as mesmas questoes para fixar o conteudo.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                                <BookOpen className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[var(--color-text-main)] text-sm font-medium">Conteudo disponivel</p>
                                    <p className="text-[var(--color-text-muted)] text-xs">Acesso ao material teorico para revisar antes de responder.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                                <Zap className="w-5 h-5 text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[var(--color-text-main)] text-sm font-medium">Sem recompensas</p>
                                    <p className="text-[var(--color-text-muted)] text-xs">Nao ganha XP ou moedas, mas desbloqueia a proxima missao.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-sec)] font-medium hover:bg-[var(--color-bg-elevated)] transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={onStart}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#E74C3C] text-white font-medium hover:bg-[#C0392B] transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Fazer Massificacao
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
