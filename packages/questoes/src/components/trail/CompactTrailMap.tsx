import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { TrailMission } from '../../types';

interface CompactTrailMapProps {
    missions: TrailMission[];
    currentMissionIndex: number;
    onMissionClick: (mission: TrailMission) => void;
}

export function CompactTrailMap({ missions, currentMissionIndex, onMissionClick }: CompactTrailMapProps) {
    return (
        <div className="flex flex-col items-center py-4 gap-1">
            {missions.map((mission, index) => {
                let status: 'completed' | 'active' | 'locked' = 'locked';
                if (mission.status === 'completed') status = 'completed';
                if (mission.status === 'available' || mission.status === 'in_progress') status = 'active';

                const isCurrent = index === currentMissionIndex;
                if (isCurrent) status = 'active';

                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                const isLast = index === missions.length - 1;

                return (
                    <div key={mission.id} className="flex flex-col items-center">
                        {/* Node */}
                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={status === 'locked'}
                            onClick={() => onMissionClick(mission)}
                            className={`
                                relative w-10 h-10 rounded-xl flex items-center justify-center
                                transition-all duration-200 border-2
                                ${isCompleted ? 'border-emerald-500 bg-emerald-500' : ''}
                                ${isActive ? 'border-[#FFB800] bg-[#FFB800]/20 ring-2 ring-[#FFB800]/30' : ''}
                                ${status === 'locked' ? 'border-zinc-600 bg-zinc-700/50' : ''}
                            `}
                        >
                            {isCompleted && <Check size={20} className="text-white" strokeWidth={3} />}
                            {isActive && <span className="text-sm font-bold text-[#FFB800]">{index + 1}</span>}
                            {status === 'locked' && <Lock size={14} className="text-zinc-500" />}

                            {/* Current indicator */}
                            {isActive && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -right-1 -top-1 w-3 h-3 bg-[#FFB800] rounded-full"
                                />
                            )}
                        </motion.button>

                        {/* Connector line */}
                        {!isLast && (
                            <div className={`
                                w-0.5 h-4 my-1
                                ${index < currentMissionIndex ? 'bg-emerald-500' : 'bg-zinc-600'}
                            `} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CompactTrailMap;
