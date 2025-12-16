
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Star, Flag } from 'lucide-react';
import { TrailMission, MissionStatus } from '../../types';

interface TrailMapProps {
    missions: TrailMission[];
    currentMissionIndex: number;
    onMissionClick: (mission: TrailMission) => void;
    userAvatar?: string;
}

export function TrailMap({ missions, currentMissionIndex, onMissionClick, userAvatar }: TrailMapProps) {
    // Configuration
    const CONFIG = {
        ITEM_HEIGHT: 140, // Vertical spacing between nodes
        WAVE_AMPLITUDE: 86, // How wide the zigzag is (20% wider)
        CENTER_OFFSET: 0, // 0 means centered in container
        START_Y: 80, // Top padding
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

            // Control points for bezier curve
            const cp1 = { x: current.x, y: current.y + CONFIG.ITEM_HEIGHT * 0.5 };
            const cp2 = { x: next.x, y: next.y - CONFIG.ITEM_HEIGHT * 0.5 };

            path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
        }

        return path;
    }, [positions]);

    return (
        <div className="relative w-full flex justify-center" style={{ height: positions[positions.length - 1]?.y + 150 || 500 }}>
            {/* SVG Background Layer */}
            <svg
                className="absolute top-0 w-full h-full pointer-events-none z-0 overflow-visible"
                style={{ left: '50%' }} // Center the SVG coordinate system
            >
                <path
                    d={svgPath}
                    fill="none"
                    stroke="#52525b"
                    strokeWidth="3"
                    strokeDasharray="12 8"
                    strokeLinecap="round"
                    className="opacity-60 transition-colors"
                />
            </svg>

            {/* Render Nodes */}
            {missions.map((mission, index) => {
                const pos = positions[index];

                let status: 'completed' | 'active' | 'locked' = 'locked';
                if (mission.status === 'completed') status = 'completed';
                if (mission.status === 'available' || mission.status === 'in_progress') status = 'active';

                // Override if it's strictly the current one based on prop
                const isCurrent = index === currentMissionIndex;
                if (isCurrent) status = 'active';

                // Styles based on status
                const isCompleted = status === 'completed';
                const isActive = status === 'active';

                return (
                    <div
                        key={mission.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group z-10"
                        style={{
                            top: pos.y,
                            left: `calc(50% + ${pos.x}px)` // Offset from center
                        }}
                    >
                        {/* Active Indicator (Avatar + "Você está aqui") */}
                        {isActive && (
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute z-20 -top-16 flex flex-col items-center"
                            >
                                <motion.div
                                    animate={{ backgroundColor: ["#059669", "#047857", "#059669"] }} // Emerald-600 to Emerald-700
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg mb-1 whitespace-nowrap relative"
                                >
                                    Você está aqui
                                    <motion.div
                                        animate={{ backgroundColor: ["#059669", "#047857", "#059669"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                                    ></motion.div>
                                </motion.div>
                                {userAvatar && (
                                    <img
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-[#FFB800] shadow-lg mx-auto mb-2"
                                        src={userAvatar}
                                    />
                                )}
                            </motion.div>
                        )}

                        {/* The Button */}
                        <motion.button
                            initial={{ rotate: 45 }}
                            whileHover={{ rotate: 45, scale: 1.1 }}
                            whileTap={{ rotate: 45, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            disabled={status === 'locked'}
                            onClick={() => onMissionClick(mission)}
                            className={`
                        relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2
                        ${isCompleted ? 'border-emerald-500 bg-emerald-500' : ''}
                        ${isActive ? 'border-[#FFB800] bg-zinc-50 dark:bg-zinc-600 ring-4 ring-[#FFB800]/20' : ''}
                        ${status === 'locked' ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80' : ''}
                    `}
                        >
                            <div className="-rotate-45 text-white flex items-center justify-center">
                                {isCompleted && <Check size={32} className="text-white" strokeWidth={4} />}
                                {isActive && <span className="text-2xl font-bold text-[#FFB800] drop-shadow-sm">{index + 1}</span>}
                                {status === 'locked' ? (
                                    <div className="relative">
                                        <Lock size={20} className="text-zinc-400 dark:text-zinc-600" />
                                    </div>
                                ) : null}
                            </div>
                        </motion.button>

                        {/* Label */}
                        <div className={`
                     mt-8 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs font-semibold text-center transition-all duration-300 max-w-[120px] shadow-md
                     ${isCompleted ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : ''}
                     ${isActive ? 'bg-white border-[#FFB800] text-[#FFB800] dark:bg-zinc-700 dark:text-[#FFB800] translate-y-1' : ''}
                     ${status === 'locked' ? 'bg-zinc-50/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-70' : ''}
                `}>
                            {mission.assunto?.nome || `Fase ${index + 1}`}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
