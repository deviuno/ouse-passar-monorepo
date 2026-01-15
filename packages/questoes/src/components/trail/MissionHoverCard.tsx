import React from 'react';
import { motion } from 'framer-motion';
import { Lock, RefreshCw, Target, BookOpen, RotateCw, Trophy, GraduationCap, Cpu } from 'lucide-react';
import { TrailMission, MissionType } from '../../types';

interface MissionHoverCardProps {
    mission: TrailMission;
    index: number;
    status: 'locked' | 'active' | 'completed';
    onStudy: (tab?: 'teoria' | 'questoes') => void;
    isMassificacao: boolean;
    placement?: 'top' | 'bottom';
    horizontalPosition?: 'left' | 'center' | 'right';
    type?: MissionType;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function MissionHoverCard({
    mission,
    index,
    status,
    onStudy,
    isMassificacao: isMassificacaoMission,
    placement = 'top',
    horizontalPosition = 'center',
    type = 'normal',
    onMouseEnter,
    onMouseLeave
}: MissionHoverCardProps) {
    const isLocked = status === 'locked';
    const isTop = placement === 'top';

    // Type-based configuration
    const getTypeConfig = () => {
        if (isMassificacaoMission || type === 'massificacao') {
            return {
                title: 'Massificacao',
                color: 'text-red-500',
                dotColor: 'bg-red-500',
                headerBorder: 'border-red-500/30',
                icon: RefreshCw
            };
        }
        switch (type) {
            case 'revisao':
                return {
                    title: 'Revisao',
                    color: 'text-amber-500',
                    dotColor: 'bg-amber-500',
                    headerBorder: 'border-amber-500/30',
                    icon: RotateCw
                };
            case 'simulado_rodada':
                return {
                    title: 'Simulado',
                    color: 'text-purple-500',
                    dotColor: 'bg-purple-500',
                    headerBorder: 'border-purple-500/30',
                    icon: Trophy
                };
            case 'tecnica':
                return {
                    title: 'Tecnica',
                    color: 'text-blue-500',
                    dotColor: 'bg-blue-500',
                    headerBorder: 'border-blue-500/30',
                    icon: Cpu
                };
            default: // normal
                return {
                    title: `Missao ${index + 1}`,
                    color: 'text-emerald-500',
                    dotColor: 'bg-emerald-500',
                    headerBorder: 'border-emerald-500/30',
                    icon: GraduationCap
                };
        }
    };

    const config = getTypeConfig();
    const title = config.title;
    const materiaName = mission.materia?.materia || 'Materia Geral';
    const assuntoName = mission.assunto?.nome || 'Assunto da Missao';

    // Horizontal positioning logic
    let horizontalClasses = 'left-1/2 -translate-x-1/2';
    let arrowHorizontalClasses = 'left-1/2 -translate-x-1/2';

    if (horizontalPosition === 'left') {
        horizontalClasses = 'left-0 translate-x-[-10px]';
        arrowHorizontalClasses = 'left-6';
    } else if (horizontalPosition === 'right') {
        horizontalClasses = 'right-0 translate-x-[10px]';
        arrowHorizontalClasses = 'right-6';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`absolute w-64 glass border border-[var(--color-border)] rounded-xl shadow-2xl z-[100] overflow-hidden pointer-events-auto theme-transition ${horizontalClasses} ${isTop ? 'bottom-full mb-3' : 'top-full mt-3'}`}
        >
            {/* Header */}
            <div className={`p-3 border-b border-[var(--color-border)] ${isLocked ? 'bg-[var(--color-bg-elevated)]/50' : 'bg-[var(--color-bg-elevated)]'}`}>
                <div className="flex items-center justify-end mb-1">
                </div>
                <div className="flex items-center gap-2 mb-0.5">
                    <config.icon size={14} className={config.color} />
                    <h3 className={`font-bold text-sm leading-tight text-[var(--color-text-main)]`}>{title}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{materiaName}</p>
            </div>

            {/* Body */}
            <div className="p-3 bg-transparent backdrop-blur-md">
                <div className="mb-3">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Assuntos Abordados:</p>
                    {(() => {
                        // Simple parser to split topics based on numeric patterns (e.g. "5.1 ", "5.2 ")
                        // Looks for patterns like "1. ", "10. ", "5.1 ", "5.1. "
                        const subjects = assuntoName
                            .split(/(?=\b\d+\.\d+\s)|(?=\b\d+\.\s)/g)
                            .map(s => s.trim())
                            .filter(Boolean);

                        // Fallback if no split happened (or just one item)
                        const items = subjects.length > 0 ? subjects : [assuntoName];

                        return (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((subject, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.dotColor}`} />
                                        <p className="text-xs text-[var(--color-text-sec)] font-medium leading-snug">
                                            {subject}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {!isLocked && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onStudy('teoria'); }}
                                className="py-2 px-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-sec)] font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <BookOpen size={12} /> Teoria
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onStudy('questoes'); }}
                                className="py-2 px-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-sec)] font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Target size={12} /> Questoes
                            </button>
                        </div>
                    </div>
                )}

                {isLocked && (
                    <div className="w-full py-2 bg-[var(--color-bg-elevated)] border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] font-medium text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <Lock size={12} /> Bloqueado
                    </div>
                )}
            </div>

            {/* Arrow */}
            <div className={`absolute w-3 h-3 glass rotate-45 transform ${arrowHorizontalClasses} ${isTop
                ? 'bottom-[-6px] border-r border-b'
                : 'top-[-6px] border-l border-t'
                }`}></div>
        </motion.div>
    );
}
