import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, RefreshCw } from 'lucide-react';
import { TrailMission } from '../../types';
import { isMassificacao } from '../../services/massificacaoService';

interface TrailRound {
    id: string;
    round_number: number;
    status: 'locked' | 'active' | 'completed';
    missions: TrailMission[];
    titulo?: string;
}

interface CompactTrailMapProps {
    rounds?: TrailRound[];
    missions?: TrailMission[];
    currentMissionIndex?: number;
    onMissionClick: (mission: TrailMission) => void;
    viewingRoundIndex?: number;
}

export function CompactTrailMap({
    rounds: propRounds,
    missions: legacyMissions,
    currentMissionIndex,
    onMissionClick,
    viewingRoundIndex = 0,
}: CompactTrailMapProps) {
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

    // Determine which round is the current active one
    const currentActiveRoundIndex = useMemo(() => {
        let lastActiveIndex = 0;
        for (let i = 0; i < rounds.length; i++) {
            if (rounds[i].status !== 'locked') {
                lastActiveIndex = i;
            }
        }
        return lastActiveIndex;
    }, [rounds]);

    const currentRound = rounds[viewingRoundIndex];
    const missions = currentRound?.missions || [];

    const isViewingActiveRound = viewingRoundIndex === currentActiveRoundIndex;
    const isViewingFutureRound = viewingRoundIndex > currentActiveRoundIndex;

    // Find current mission index in this round
    const currentMissionIndexInRound = useMemo(() => {
        if (!isViewingActiveRound) return -1;
        // needs_massificacao também é considerado como missão atual ativa
        const idx = missions.findIndex(m =>
            m.status === 'available' ||
            m.status === 'in_progress' ||
            m.status === 'needs_massificacao'
        );
        return idx;
    }, [missions, isViewingActiveRound]);

    if (rounds.length === 0) {
        return (
            <div className="flex items-center justify-center p-4 text-[#6E6E6E] text-xs">
                Sem rodadas
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-2">
            {/* Round indicator */}
            {rounds.length > 1 && (
                <div className={`text-[10px] font-medium px-2 py-0.5 rounded mb-3 ${
                    isViewingFutureRound
                        ? 'text-[#6E6E6E] bg-[#2A2A2A]'
                        : isViewingActiveRound
                            ? 'text-[#A0A0A0] bg-[#2A2A2A]'
                            : 'text-[#2ECC71] bg-[#2ECC71]/10'
                }`}>
                    R{currentRound?.round_number || viewingRoundIndex + 1}
                </div>
            )}

            {/* Future round indicator */}
            {isViewingFutureRound && (
                <div className="mb-2">
                    <Lock size={12} className="text-[#6E6E6E]" />
                </div>
            )}

            {/* Missions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentRound?.id || 'empty'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center gap-1"
                >
                    {missions.map((mission, index) => {
                        // Override status if viewing future round
                        let effectiveStatus = mission.status;
                        if (isViewingFutureRound) {
                            effectiveStatus = 'locked';
                        }

                        let status: 'completed' | 'active' | 'locked' = 'locked';
                        if (effectiveStatus === 'completed') status = 'completed';
                        // needs_massificacao também é considerado ativo
                        if (effectiveStatus === 'available' || effectiveStatus === 'in_progress' || effectiveStatus === 'needs_massificacao') status = 'active';

                        const isCurrent = index === currentMissionIndexInRound && isViewingActiveRound;
                        if (isCurrent) status = 'active';

                        // Check if it's a massification mission
                        const isMassificacaoMission = isMassificacao(mission);

                        const isCompleted = status === 'completed';
                        const isActive = status === 'active';
                        const isLast = index === missions.length - 1;

                        return (
                            <div key={mission.id} className="flex flex-col items-center">
                                {/* Node */}
                                <motion.button
                                    whileHover={{ scale: status !== 'locked' ? 1.15 : 1 }}
                                    whileTap={{ scale: status !== 'locked' ? 0.95 : 1 }}
                                    disabled={status === 'locked'}
                                    onClick={() => onMissionClick(mission)}
                                    className={`
                                        relative w-10 h-10 rounded-xl flex items-center justify-center
                                        transition-all duration-200 border-2
                                        ${isCompleted ? 'border-emerald-500 bg-emerald-500' : ''}
                                        ${isActive && !isMassificacaoMission ? 'border-[#FFB800] bg-[#FFB800]/20 ring-2 ring-[#FFB800]/30' : ''}
                                        ${isActive && isMassificacaoMission ? 'border-[#E74C3C] bg-[#E74C3C]/20 ring-2 ring-[#E74C3C]/30' : ''}
                                        ${status === 'locked' ? 'border-zinc-600 bg-zinc-700/50' : ''}
                                    `}
                                    title={`Missao ${index + 1}`}
                                >
                                    {isCompleted && <Check size={20} className="text-white" strokeWidth={3} />}
                                    {isActive && !isMassificacaoMission && <span className="text-sm font-bold text-[#FFB800]">{index + 1}</span>}
                                    {isActive && isMassificacaoMission && <RefreshCw size={16} className="text-[#E74C3C]" />}
                                    {status === 'locked' && <Lock size={14} className="text-zinc-500" />}

                                    {/* Current indicator */}
                                    {isActive && isCurrent && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={`absolute -right-1 -top-1 w-3 h-3 rounded-full ${isMassificacaoMission ? 'bg-[#E74C3C]' : 'bg-[#FFB800]'}`}
                                        />
                                    )}
                                </motion.button>

                                {/* Connector line */}
                                {!isLast && (
                                    <div className={`
                                        w-0.5 h-4 my-1
                                        ${index < currentMissionIndexInRound ? 'bg-emerald-500' : 'bg-zinc-600'}
                                    `} />
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default CompactTrailMap;
