import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Target, AlertTriangle, ChevronRight } from 'lucide-react';
import { TrailMission } from '../../types';

interface MissionNeedingMassificacao {
  mission: TrailMission;
  missionNumber: number;
  score: number;
}

interface TecnicaMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionsNeedingMassificacao: MissionNeedingMassificacao[];
  onMissionClick: (mission: TrailMission) => void;
  onProceedToTecnica: () => void;
}

export function TecnicaMissionModal({
  isOpen,
  onClose,
  missionsNeedingMassificacao,
  onMissionClick,
  onProceedToTecnica,
}: TecnicaMissionModalProps) {
  if (!isOpen) return null;

  const hasMissionsToReview = missionsNeedingMassificacao.length > 0;

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
          className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#3A3A3A] bg-gradient-to-r from-blue-900/30 to-blue-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Missão Técnica</h2>
                  <p className="text-xs text-blue-400">
                    {hasMissionsToReview
                      ? 'Você tem missões pendentes de revisão'
                      : 'Pronto para a missão técnica!'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <X className="w-5 h-5 text-[#6E6E6E]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {hasMissionsToReview ? (
              <>
                {/* Warning */}
                <div className="flex items-start gap-3 p-3 bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-lg mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      {missionsNeedingMassificacao.length} {missionsNeedingMassificacao.length === 1 ? 'missão precisa' : 'missões precisam'} de revisão
                    </p>
                    <p className="text-[#A0A0A0] text-xs mt-1">
                      Você pode refazer as missões abaixo para melhorar sua nota ou prosseguir para a técnica.
                    </p>
                  </div>
                </div>

                {/* Missions List */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {missionsNeedingMassificacao.map(({ mission, missionNumber, score }) => (
                    <button
                      key={mission.id}
                      onClick={() => onMissionClick(mission)}
                      className="w-full flex items-center justify-between p-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-[#3A3A3A] hover:border-[#E74C3C]/50 rounded-lg transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E74C3C]/20 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-[#E74C3C]" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">
                            Missão {missionNumber}
                          </p>
                          <p className="text-[#6E6E6E] text-xs">
                            {mission.assunto?.nome || 'Assunto'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-[#E74C3C] text-sm font-bold">{Math.round(score)}%</p>
                          <p className="text-[#6E6E6E] text-[10px]">Sua nota</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6E6E6E] group-hover:text-[#E74C3C] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#3A3A3A]" />
                  <span className="text-[#6E6E6E] text-xs">ou</span>
                  <div className="flex-1 h-px bg-[#3A3A3A]" />
                </div>

                {/* Proceed Button */}
                <button
                  onClick={onProceedToTecnica}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Continuar para a Técnica
                </button>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Tudo certo!</h3>
                  <p className="text-[#A0A0A0] text-sm mb-6">
                    Você não tem nenhuma missão pendente de revisão. Pode prosseguir para a missão técnica!
                  </p>
                  <button
                    onClick={onProceedToTecnica}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Iniciar Missão Técnica
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TecnicaMissionModal;
