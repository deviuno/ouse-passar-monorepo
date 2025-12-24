import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, RefreshCw, X, Zap, Target, BookOpen, User, RotateCw, Trophy, GraduationCap, Cpu } from 'lucide-react';
import { TrailMission, MissionType } from '../../types';
import { isMassificacao } from '../../services/massificacaoService';

// Storage key for massification modal
const MASSIFICACAO_MODAL_SHOWN_KEY = 'ouse_massificacao_modal_shown';

// Modal explaining what massification is
function MassificacaoModal({
    isOpen,
    onClose,
    onStart,
    missionLabel,
}: {
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
    missionLabel: string;
}) {
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
                    className="bg-[#1A1A1A] border border-[#E74C3C]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#E74C3C]/20 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-[#E74C3C]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Massificação</h2>
                                <p className="text-sm text-[#E74C3C]">{missionLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
                        >
                            <X className="w-5 h-5 text-[#6E6E6E]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 mb-6">
                        <p className="text-[#A0A0A0] text-sm leading-relaxed">
                            Você não atingiu a pontuação mínima nesta missão. A <span className="text-[#E74C3C] font-semibold">Massificação</span> é uma oportunidade de reforçar seu aprendizado!
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                                <Target className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">Mesmas questões</p>
                                    <p className="text-[#6E6E6E] text-xs">Você refará exatamente as mesmas questões para fixar o conteúdo.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                                <BookOpen className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">Conteúdo disponível</p>
                                    <p className="text-[#6E6E6E] text-xs">Acesso ao material teórico para revisar antes de responder.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                                <Zap className="w-5 h-5 text-[#6E6E6E] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">Sem recompensas</p>
                                    <p className="text-[#6E6E6E] text-xs">Não ganha XP ou moedas, mas desbloqueia a próxima missão.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-[#3A3A3A] text-[#A0A0A0] font-medium hover:bg-[#2A2A2A] transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={onStart}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#E74C3C] text-white font-medium hover:bg-[#C0392B] transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Fazer Massificação
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hover Card Component with smart positioning
function MissionHoverCard({
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
}: {
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
}) {
    const isLocked = status === 'locked';
    const isTop = placement === 'top';

    // Type-based configuration
    const getTypeConfig = () => {
        if (isMassificacaoMission || type === 'massificacao') {
            return {
                title: 'Massificação',
                color: 'text-red-500',
                dotColor: 'bg-red-500',
                headerBorder: 'border-red-500/30',
                icon: RefreshCw
            };
        }
        switch (type) {
            case 'revisao':
                return {
                    title: `Revisão ${index + 1}`,
                    color: 'text-amber-500',
                    dotColor: 'bg-amber-500',
                    headerBorder: 'border-amber-500/30',
                    icon: RotateCw
                };
            case 'simulado_rodada':
                return {
                    title: `Simulado ${index + 1}`,
                    color: 'text-purple-500',
                    dotColor: 'bg-purple-500',
                    headerBorder: 'border-purple-500/30',
                    icon: Trophy
                };
            case 'tecnica':
                return {
                    title: `Técnica ${index + 1}`,
                    color: 'text-blue-500',
                    dotColor: 'bg-blue-500',
                    headerBorder: 'border-blue-500/30',
                    icon: Cpu
                };
            default: // normal
                return {
                    title: `Missão ${index + 1}`,
                    color: 'text-emerald-500',
                    dotColor: 'bg-emerald-500',
                    headerBorder: 'border-emerald-500/30',
                    icon: GraduationCap
                };
        }
    };

    const config = getTypeConfig();
    const title = config.title;
    const materiaName = mission.materia?.materia || 'Matéria Geral';
    const assuntoName = mission.assunto?.nome || 'Assunto da Missão';

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
            className={`absolute w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] overflow-hidden pointer-events-auto ${horizontalClasses} ${isTop ? 'bottom-full mb-3' : 'top-full mt-3'}`}
        >
            {/* Header */}
            <div className={`p-3 border-b border-zinc-800 ${isLocked ? 'bg-zinc-800/50' : 'bg-gradient-to-r from-zinc-800 to-zinc-900'}`}>
                <div className="flex items-center justify-end mb-1">
                </div>
                <div className="flex items-center gap-2 mb-0.5">
                    <config.icon size={14} className={config.color} />
                    <h3 className={`font-bold text-sm leading-tight text-white`}>{title}</h3>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-1">{materiaName}</p>
            </div>

            {/* Body */}
            <div className="p-3 bg-zinc-900">
                <div className="mb-3">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Assuntos Abordados:</p>
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
                                        <p className="text-xs text-zinc-300 font-medium leading-snug">
                                            {subject}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {!isLocked && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onStudy('teoria'); }}
                                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <BookOpen size={12} /> Teoria
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onStudy('questoes'); }}
                                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Target size={12} /> Questões
                            </button>
                        </div>
                    </div>
                )}

                {isLocked && (
                    <div className="w-full py-2 bg-zinc-800 border border-dashed border-zinc-700 text-zinc-500 font-medium text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <Lock size={12} /> Bloqueado
                    </div>
                )}
            </div>

            {/* Arrow */}
            <div className={`absolute w-3 h-3 bg-zinc-900 border-zinc-700 rotate-45 transform ${arrowHorizontalClasses} ${isTop
                ? 'bottom-[-6px] border-r border-b'
                : 'top-[-6px] border-l border-t'
                }`}></div>
        </motion.div>
    );
}

interface TrailRound {
    id: string;
    round_number: number;
    status: 'locked' | 'active' | 'completed';
    missions: TrailMission[];
    titulo?: string;
}

interface TrailMapProps {
    rounds: TrailRound[];
    currentMissionIndex?: number;
    onMissionClick: (mission: TrailMission, tab?: 'teoria' | 'questoes') => void;
    userAvatar?: string;
    // External control for round navigation
    viewingRoundIndex?: number;
    onViewingRoundChange?: (index: number) => void;
    // Animation props
    justCompletedMissionId?: string | null;
    onAnimationComplete?: () => void;
    // Legacy support
    missions?: TrailMission[];
}

export function TrailMap({
    rounds: propRounds,
    missions: legacyMissions,
    currentMissionIndex,
    onMissionClick,
    userAvatar,
    viewingRoundIndex: controlledIndex,
    onViewingRoundChange,
    justCompletedMissionId,
    onAnimationComplete,
}: TrailMapProps) {
    // Support legacy missions prop by wrapping in a round
    const rounds = useMemo(() => {
        if (propRounds && propRounds.length > 0) {
            return propRounds;
        }
        if (legacyMissions && legacyMissions.length > 0) {
            return [{
                id: 'legacy-round',
                round_number: 1,
                status: 'active' as const,
                missions: legacyMissions,
            }];
        }
        return [];
    }, [propRounds, legacyMissions]);

    // Determine which round is the current active one (highest unlocked)
    const currentActiveRoundIndex = useMemo(() => {
        let lastActiveIndex = 0;
        for (let i = 0; i < rounds.length; i++) {
            if (rounds[i].status !== 'locked') {
                lastActiveIndex = i;
            }
        }
        return lastActiveIndex;
    }, [rounds]);

    // Internal state for viewing round (used if not controlled externally)
    const [internalViewingIndex, setInternalViewingIndex] = useState(currentActiveRoundIndex);

    // Hover state for mission cards
    const [hoveredMissionId, setHoveredMissionId] = useState<string | null>(null);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

    // Cleanup hover timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
        };
    }, [hoverTimeout]);

    // Use controlled index if provided, otherwise use internal state
    const viewingRoundIndex = controlledIndex !== undefined ? controlledIndex : internalViewingIndex;
    const setViewingRoundIndex = onViewingRoundChange || setInternalViewingIndex;

    // Update internal state when active round changes (only if not controlled)
    useEffect(() => {
        if (controlledIndex === undefined) {
            setInternalViewingIndex(currentActiveRoundIndex);
        }
    }, [currentActiveRoundIndex, controlledIndex]);

    const currentRound = rounds[viewingRoundIndex];
    const missions = currentRound?.missions || [];

    // Check if the viewed round is the active one
    const isViewingActiveRound = viewingRoundIndex === currentActiveRoundIndex;
    const isViewingFutureRound = viewingRoundIndex > currentActiveRoundIndex;

    // Calculate global mission index start for current round
    const startMissionIndex = useMemo(() => {
        let count = 0;
        for (let i = 0; i < viewingRoundIndex; i++) {
            count += (rounds[i].missions?.length || 0);
        }
        return count;
    }, [rounds, viewingRoundIndex]);

    // Configuration
    const CONFIG = {
        ITEM_HEIGHT: 140,
        WAVE_AMPLITUDE: 86,
        CENTER_OFFSET: 0,
        START_Y: 80,
    };

    // Helper to calculate position
    const getPosition = (index: number) => {
        const side = index % 2 === 0 ? -1 : 1;
        const xOffset = side * CONFIG.WAVE_AMPLITUDE;
        const y = CONFIG.START_Y + index * CONFIG.ITEM_HEIGHT;
        return { x: xOffset, y };
    };

    // Calculate all positions
    const positions = useMemo(() => {
        return missions.map((_, i) => getPosition(i));
    }, [missions.length]);

    // Generate SVG Path
    const svgPath = useMemo(() => {
        if (positions.length === 0) return '';

        let path = `M ${positions[0].x} ${positions[0].y}`;

        for (let i = 0; i < positions.length - 1; i++) {
            const current = positions[i];
            const next = positions[i + 1];
            const cp1 = { x: current.x, y: current.y + CONFIG.ITEM_HEIGHT * 0.5 };
            const cp2 = { x: next.x, y: next.y - CONFIG.ITEM_HEIGHT * 0.5 };
            path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
        }

        return path;
    }, [positions]);

    // Find current mission index in this round (includes needs_massificacao)
    const currentMissionIndexInRound = useMemo(() => {
        if (!isViewingActiveRound) return -1;
        const idx = missions.findIndex(m =>
            m.status === 'available' ||
            m.status === 'in_progress' ||
            m.status === 'needs_massificacao'
        );
        return idx;
    }, [missions, isViewingActiveRound]);

    // Animation state for avatar movement
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationFromIndex, setAnimationFromIndex] = useState<number | null>(null);

    // Massification modal state
    const [massificacaoModal, setMassificacaoModal] = useState<{
        isOpen: boolean;
        mission: TrailMission | null;
        label: string;
    }>({ isOpen: false, mission: null, label: '' });

    // Check if user has seen massification modal before
    const hasSeenMassificacaoModal = useCallback(() => {
        try {
            return localStorage.getItem(MASSIFICACAO_MODAL_SHOWN_KEY) === 'true';
        } catch {
            return false;
        }
    }, []);

    // Mark massification modal as seen
    const markMassificacaoModalSeen = useCallback(() => {
        try {
            localStorage.setItem(MASSIFICACAO_MODAL_SHOWN_KEY, 'true');
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Handle mission click - go directly to mission (no modal)
    const handleMissionClick = useCallback((mission: TrailMission, index: number, tab?: 'teoria' | 'questoes') => {
        if (mission.status === 'locked') return;
        onMissionClick(mission, tab);
    }, [onMissionClick]);

    // Handle starting massification from modal
    const handleStartMassificacao = useCallback(() => {
        markMassificacaoModalSeen();
        if (massificacaoModal.mission) {
            onMissionClick(massificacaoModal.mission);
        }
        setMassificacaoModal({ isOpen: false, mission: null, label: '' });
    }, [massificacaoModal.mission, markMassificacaoModalSeen, onMissionClick]);

    // Close massification modal
    const handleCloseMassificacaoModal = useCallback(() => {
        setMassificacaoModal({ isOpen: false, mission: null, label: '' });
    }, []);

    // Helper to get massification label
    const getMassificacaoLabel = useCallback((mission: TrailMission, globalIndex: number) => {
        // Find the original mission to get its number
        const originalMissionIndex = missions.findIndex(m => m.id === mission.massificacao_de);
        const currentLocalIndex = missions.findIndex(m => m.id === mission.id);
        const startIdx = globalIndex - currentLocalIndex;

        const missionNumber = originalMissionIndex >= 0 ? startIdx + originalMissionIndex + 1 : globalIndex + 1;
        const tentativa = mission.tentativa_massificacao || 1;

        // If it's the first attempt, just show "Massificação M1"
        // If multiple attempts, show "Massificação M1 (2)"
        if (tentativa > 1) {
            return `Massificação M${missionNumber} (${tentativa})`;
        }
        return `Massificação M${missionNumber}`;
    }, [missions]);

    // Find the index of the just completed mission
    const justCompletedIndex = useMemo(() => {
        if (!justCompletedMissionId) return -1;
        return missions.findIndex(m => m.id === justCompletedMissionId);
    }, [missions, justCompletedMissionId]);

    // Trigger animation when returning from completed mission
    useEffect(() => {
        if (justCompletedMissionId && justCompletedIndex >= 0 && !isAnimating) {
            // Start animation from the completed mission
            setAnimationFromIndex(justCompletedIndex);
            setIsAnimating(true);

            // Animation duration
            const animationDuration = 1500; // 1.5 seconds

            // Clear the animation state after it completes
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setAnimationFromIndex(null);
                onAnimationComplete?.();
            }, animationDuration);

            return () => clearTimeout(timer);
        }
    }, [justCompletedMissionId, justCompletedIndex, isAnimating, onAnimationComplete]);

    // Get the animated avatar position
    const avatarPosition = useMemo(() => {
        if (isAnimating && animationFromIndex !== null && positions[animationFromIndex]) {
            return positions[animationFromIndex];
        }
        if (currentMissionIndexInRound >= 0 && positions[currentMissionIndexInRound]) {
            return positions[currentMissionIndexInRound];
        }
        return null;
    }, [isAnimating, animationFromIndex, currentMissionIndexInRound, positions]);

    // Target position for animation
    const targetPosition = useMemo(() => {
        if (currentMissionIndexInRound >= 0 && positions[currentMissionIndexInRound]) {
            return positions[currentMissionIndexInRound];
        }
        return null;
    }, [currentMissionIndexInRound, positions]);

    if (rounds.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-[#A0A0A0]">
                Nenhuma rodada disponível
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {/* Future Round Warning - Minimal banner */}
            {isViewingFutureRound && (
                <div className="bg-[#2A2A2A] border-b border-[#3A3A3A] px-4 py-2 text-center">
                    <p className="text-[#6E6E6E] text-xs flex items-center justify-center gap-1.5">
                        <Lock size={12} />
                        Complete a rodada atual para desbloquear
                    </p>
                </div>
            )}

            {/* Trail Map Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentRound?.id || 'empty'}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full flex justify-center pt-4"
                    style={{ height: positions[positions.length - 1]?.y + 150 || 500 }}
                >
                    {/* SVG Background Layer */}
                    <svg
                        className="absolute top-0 w-full h-full pointer-events-none z-0 overflow-visible"
                        style={{ left: '50%' }}
                    >
                        <path
                            d={svgPath}
                            fill="none"
                            stroke={isViewingFutureRound ? "#2A2A2A" : "#52525b"}
                            strokeWidth="3"
                            strokeDasharray="12 8"
                            strokeLinecap="round"
                            className="opacity-60 transition-colors"
                        />
                    </svg>

                    {/* Animated Avatar - moves from completed mission to next */}
                    {isAnimating && userAvatar && avatarPosition && targetPosition && (
                        <motion.div
                            className="absolute z-50 flex flex-col items-center pointer-events-none"
                            style={{
                                left: `calc(50% + ${avatarPosition.x}px)`,
                                top: avatarPosition.y,
                                transform: 'translate(-50%, -50%)',
                            }}
                            initial={{
                                x: 0,
                                y: -64,
                            }}
                            animate={{
                                x: targetPosition.x - avatarPosition.x,
                                y: targetPosition.y - avatarPosition.y - 64,
                            }}
                            transition={{
                                duration: 1.2,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg mb-1 whitespace-nowrap"
                            >
                                Avançando!
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45" />
                            </motion.div>
                            {userAvatar ? (
                                <motion.img
                                    alt="User"
                                    className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-lg object-cover"
                                    src={userAvatar}
                                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                                    transition={{ duration: 0.3, repeat: Infinity }}
                                />
                            ) : (
                                <motion.div
                                    className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-lg bg-zinc-800 flex items-center justify-center text-emerald-500"
                                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                                    transition={{ duration: 0.3, repeat: Infinity }}
                                >
                                    <User size={20} />
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Render Nodes */}
                    {missions.map((mission, index) => {
                        const globalIndex = startMissionIndex + index;
                        const pos = positions[index];

                        // Override status if viewing future round
                        let effectiveStatus = mission.status;
                        if (isViewingFutureRound) {
                            effectiveStatus = 'locked';
                        }

                        let status: 'completed' | 'active' | 'locked' = 'locked';
                        if (effectiveStatus === 'completed') status = 'completed';
                        if (effectiveStatus === 'available' || effectiveStatus === 'in_progress' || effectiveStatus === 'needs_massificacao') status = 'active';

                        // Check if it's the current mission
                        const isCurrent = index === currentMissionIndexInRound && isViewingActiveRound;
                        if (isCurrent) status = 'active';

                        // Check if it's a massification mission (needs_massificacao status)
                        const isMassificacaoMission = isMassificacao(mission) || effectiveStatus === 'needs_massificacao';

                        const isCompleted = status === 'completed';
                        const isActive = status === 'active';
                        const isHovered = hoveredMissionId === mission.id;

                        // Calculate z-index: Hovered > Current > Others
                        const zIndex = isHovered ? 50 : (isCurrent ? 20 : 10);

                        return (
                            <div
                                key={mission.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group"
                                style={{
                                    top: pos.y,
                                    left: `calc(50% + ${pos.x}px)`,
                                    zIndex
                                }}
                                onMouseEnter={() => {
                                    if (hoverTimeout) clearTimeout(hoverTimeout);
                                    setHoveredMissionId(mission.id);
                                }}
                                onMouseLeave={() => {
                                    const timeout = setTimeout(() => {
                                        setHoveredMissionId(null);
                                    }, 200);
                                    setHoverTimeout(timeout);
                                }}
                            >
                                {/* Popup Card on Hover */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <MissionHoverCard
                                            mission={mission}
                                            index={globalIndex}
                                            status={status}
                                            onStudy={(tab) => handleMissionClick(mission, index, tab)}
                                            isMassificacao={isMassificacaoMission}
                                            placement={index <= 1 ? 'bottom' : 'top'}
                                            horizontalPosition={pos.x < -40 ? 'left' : pos.x > 40 ? 'right' : 'center'}
                                            type={mission.tipo}
                                            onMouseEnter={() => {
                                                if (hoverTimeout) clearTimeout(hoverTimeout);
                                                setHoveredMissionId(mission.id);
                                            }}
                                            onMouseLeave={() => {
                                                const timeout = setTimeout(() => {
                                                    setHoveredMissionId(null);
                                                }, 200);
                                                setHoverTimeout(timeout);
                                            }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Active Indicator (Avatar + "Voce esta aqui") - hidden during animation */}
                                {isActive && isCurrent && !isAnimating && (
                                    <motion.div
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute z-20 -top-16 flex flex-col items-center"
                                    >
                                        <motion.div
                                            animate={{
                                                backgroundColor: isMassificacaoMission
                                                    ? ["#E74C3C", "#C0392B", "#E74C3C"]
                                                    : mission.tipo === 'revisao'
                                                        ? ["#F59E0B", "#D97706", "#F59E0B"]
                                                        : mission.tipo === 'simulado_rodada'
                                                            ? ["#A855F7", "#9333EA", "#A855F7"]
                                                            : mission.tipo === 'tecnica'
                                                                ? ["#3B82F6", "#2563EB", "#3B82F6"]
                                                                : ["#059669", "#047857", "#059669"]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg mb-1 whitespace-nowrap relative"
                                        >
                                            {isMassificacaoMission ? 'Massificação' : 'Você está aqui'}
                                            <motion.div
                                                animate={{
                                                    backgroundColor: isMassificacaoMission
                                                        ? ["#E74C3C", "#C0392B", "#E74C3C"]
                                                        : mission.tipo === 'revisao'
                                                            ? ["#F59E0B", "#D97706", "#F59E0B"]
                                                            : mission.tipo === 'simulado_rodada'
                                                                ? ["#A855F7", "#9333EA", "#A855F7"]
                                                                : mission.tipo === 'tecnica'
                                                                    ? ["#3B82F6", "#2563EB", "#3B82F6"]
                                                                    : ["#059669", "#047857", "#059669"]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                                            ></motion.div>
                                        </motion.div>
                                        {userAvatar ? (
                                            <img
                                                alt="User"
                                                className={`w-8 h-8 rounded-full border-2 shadow-lg mx-auto mb-2 object-cover
                                                    ${isMassificacaoMission
                                                        ? 'border-[#E74C3C]'
                                                        : mission.tipo === 'revisao'
                                                            ? 'border-amber-500'
                                                            : mission.tipo === 'simulado_rodada'
                                                                ? 'border-purple-500'
                                                                : mission.tipo === 'tecnica'
                                                                    ? 'border-blue-500'
                                                                    : 'border-[#e7cb00]'}`}
                                                src={userAvatar}
                                            />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full border-2 shadow-lg mx-auto mb-2 flex items-center justify-center bg-zinc-800
                                                ${isMassificacaoMission
                                                    ? 'border-[#E74C3C] text-[#E74C3C]'
                                                    : mission.tipo === 'revisao'
                                                        ? 'border-amber-500 text-amber-500'
                                                        : mission.tipo === 'simulado_rodada'
                                                            ? 'border-purple-500 text-purple-500'
                                                            : mission.tipo === 'tecnica'
                                                                ? 'border-blue-500 text-blue-500'
                                                                : 'border-[#e7cb00] text-[#e7cb00]'}`}>
                                                <User size={16} />
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* The Button */}
                                <motion.button
                                    initial={{ rotate: 45 }}
                                    whileHover={{ rotate: 45, scale: status !== 'locked' ? 1.1 : 1 }}
                                    whileTap={{ rotate: 45, scale: status !== 'locked' ? 0.95 : 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    disabled={status === 'locked'}
                                    onClick={() => handleMissionClick(mission, index)}
                                    className={`
                                        relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2
                                        ${/* COMPLETED STATE - Solid Colors */ ''}
                                        ${isCompleted && !isMassificacaoMission
                                            ? mission.tipo === 'revisao'
                                                ? 'border-amber-600 bg-amber-600'
                                                : mission.tipo === 'simulado_rodada'
                                                    ? 'border-purple-600 bg-purple-600'
                                                    : mission.tipo === 'tecnica'
                                                        ? 'border-blue-600 bg-blue-600'
                                                        : 'border-emerald-600 bg-emerald-600'
                                            : ''}
                                        ${isCompleted && isMassificacaoMission ? 'border-emerald-600 bg-emerald-600' : ''}

                                        ${/* ACTIVE STATE - Subtle Glow */ ''}
                                        ${isActive && !isMassificacaoMission
                                            ? mission.tipo === 'revisao'
                                                ? 'border-white bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                                                : mission.tipo === 'simulado_rodada'
                                                    ? 'border-white bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.35)]'
                                                    : mission.tipo === 'tecnica'
                                                        ? 'border-white bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                                                        : 'border-[#e7cb00] bg-[#d59a01] shadow-[0_0_15px_rgba(213,154,1,0.35)]'
                                            : ''}
                                        ${isActive && isMassificacaoMission ? 'border-white bg-[#E74C3C] shadow-[0_0_15px_rgba(231,76,60,0.35)]' : ''}

                                        ${/* LOCKED STATE - Solid Colors (No Opacity) */ ''}
                                        ${status === 'locked' && !isMassificacaoMission
                                            ? mission.tipo === 'revisao'
                                                ? 'border-amber-900 bg-amber-950 ring-2 ring-amber-900/20'
                                                : mission.tipo === 'simulado_rodada'
                                                    ? 'border-purple-900 bg-purple-950 ring-2 ring-purple-900/20'
                                                    : mission.tipo === 'tecnica'
                                                        ? 'border-blue-900 bg-blue-950 ring-2 ring-blue-900/20'
                                                        : 'border-zinc-700 bg-zinc-900' /* Normal Locked */
                                            : ''}
                                        ${status === 'locked' && isMassificacaoMission ? 'border-red-900 bg-red-950 ring-2 ring-red-900/20' : ''}
                                    `}
                                >
                                    <div className="-rotate-45 text-white flex items-center justify-center">
                                        {isCompleted && <Check size={32} className="text-white" strokeWidth={3} />}

                                        {(isActive || status === 'locked') && (
                                            isMassificacaoMission ? (
                                                <RefreshCw size={32} className={`${status === 'locked' ? 'text-red-300' : 'text-white'}`} strokeWidth={2} />
                                            ) : mission.tipo === 'revisao' ? (
                                                <RotateCw size={32} className={`${status === 'locked' ? 'text-amber-300' : 'text-white'}`} strokeWidth={2} />
                                            ) : mission.tipo === 'simulado_rodada' ? (
                                                <Trophy size={32} className={`${status === 'locked' ? 'text-purple-300' : 'text-white'}`} strokeWidth={2} />
                                            ) : mission.tipo === 'tecnica' ? (
                                                <Cpu size={32} className={`${status === 'locked' ? 'text-blue-300' : 'text-white'}`} strokeWidth={2} />
                                            ) : (
                                                <GraduationCap size={32} className={`${status === 'locked' ? 'text-zinc-400' : 'text-white'}`} strokeWidth={2} />
                                            )
                                        )}
                                    </div>
                                </motion.button>

                                {/* Label - Shows "Missao X" */}
                                <div className={`
                                    mt-8 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs font-semibold text-center transition-all duration-300 max-w-[120px] shadow-md
                                    ${isCompleted ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : ''}
                                    ${isActive && !isMassificacaoMission
                                        ? mission.tipo === 'revisao'
                                            ? 'bg-white border-amber-500 text-amber-500 dark:bg-zinc-700 dark:text-amber-500 translate-y-1'
                                            : mission.tipo === 'simulado_rodada'
                                                ? 'bg-white border-purple-500 text-purple-500 dark:bg-zinc-700 dark:text-purple-500 translate-y-1'
                                                : mission.tipo === 'tecnica'
                                                    ? 'bg-white border-blue-500 text-blue-500 dark:bg-zinc-700 dark:text-blue-500 translate-y-1'
                                                    : 'bg-white border-[#e7cb00] text-[#d59a01] dark:bg-zinc-700 dark:text-[#e7cb00] translate-y-1'
                                        : ''}
                                    ${isActive && isMassificacaoMission ? 'bg-white border-[#E74C3C] text-[#E74C3C] dark:bg-zinc-700 dark:text-[#E74C3C] translate-y-1' : ''}
                                    ${status === 'locked' ? 'bg-zinc-50/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-70' : ''}
                                `}>
                                    {status === 'locked' && (
                                        <Lock size={12} className="inline-block mr-1 -mt-0.5" />
                                    )}
                                    {isMassificacaoMission
                                        ? getMassificacaoLabel(mission, globalIndex)
                                        : mission.tipo === 'revisao'
                                            ? `Revisão ${globalIndex + 1}`
                                            : mission.tipo === 'simulado_rodada'
                                                ? `Simulado ${globalIndex + 1}`
                                                : mission.tipo === 'tecnica'
                                                    ? `Técnica ${globalIndex + 1}`
                                                    : `Missão ${globalIndex + 1}`
                                    }
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Bottom padding */}
            <div className="h-20" />

            {/* Massification Modal */}
            <MassificacaoModal
                isOpen={massificacaoModal.isOpen}
                onClose={handleCloseMassificacaoModal}
                onStart={handleStartMassificacao}
                missionLabel={massificacaoModal.label}
            />
        </div>
    );
}

// Export helper to get round navigation info
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