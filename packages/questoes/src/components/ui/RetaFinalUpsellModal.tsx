import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, BookOpen, Zap, Clock, Target, ArrowRight, Loader2 } from 'lucide-react';
import { StudyMode } from '../../types/trail';
import { RETA_FINAL_THEME } from '../../services/retaFinalService';

interface RetaFinalUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMode: StudyMode;
  preparatorioName: string;
  checkoutUrl?: string;
  onUnlock?: () => Promise<void>; // For testing: auto-unlock mode
}

export function RetaFinalUpsellModal({
  isOpen,
  onClose,
  targetMode,
  preparatorioName,
  checkoutUrl,
  onUnlock,
}: RetaFinalUpsellModalProps) {
  const isRetaFinal = targetMode === 'reta_final';
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleCheckout = async () => {
    // For testing: if onUnlock is provided, use it to auto-unlock
    if (onUnlock) {
      setIsUnlocking(true);
      try {
        await onUnlock();
      } finally {
        setIsUnlocking(false);
      }
      return;
    }

    // Production: open checkout URL
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Container - centered on desktop, bottom sheet on mobile */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-4 pb-20 lg:pb-4 lg:items-center lg:inset-0"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{
                background: isRetaFinal
                  ? `linear-gradient(180deg, ${RETA_FINAL_THEME.colors.secondary} 0%, #0F0F0F 100%)`
                  : 'linear-gradient(180deg, #1F1F1F 0%, #0F0F0F 100%)',
                border: isRetaFinal
                  ? `2px solid ${RETA_FINAL_THEME.colors.primary}`
                  : '2px solid #3A3A3A',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <X size={20} className="text-gray-400" />
              </button>

              {/* Header with icon */}
              <div className="pt-8 pb-6 px-6 text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: isRetaFinal
                      ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary} 0%, ${RETA_FINAL_THEME.colors.accent} 100%)`
                      : 'linear-gradient(135deg, #FFB800 0%, #2ECC71 100%)',
                  }}
                >
                  {isRetaFinal ? (
                    <Flame className="w-8 h-8 text-black" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-black" />
                  )}
                </div>

                <h2
                  className="text-2xl font-bold mb-2"
                  style={{
                    color: isRetaFinal ? RETA_FINAL_THEME.colors.primary : '#FFB800',
                  }}
                >
                  {isRetaFinal ? 'Modo Reta Final' : 'Modo Normal'}
                </h2>

                <p className="text-gray-400 text-sm">
                  {preparatorioName}
                </p>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                {isRetaFinal ? (
                  <>
                    <p className="text-white text-center mb-6">
                      Faltam poucos dias para sua prova?
                      <br />
                      <span className="text-gray-400">
                        O modo Reta Final foi feito para você!
                      </span>
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Conteúdo Resumido</p>
                          <p className="text-gray-400 text-sm">Teoria direto ao ponto, sem enrolação</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Menos Questões</p>
                          <p className="text-gray-400 text-sm">Foco nas questões mais importantes</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Target className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Foco na Banca</p>
                          <p className="text-gray-400 text-sm">Questões que simulam a prova real</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white text-center mb-6">
                      Quer estudar com mais profundidade?
                      <br />
                      <span className="text-gray-400">
                        O modo Normal oferece o conteúdo completo!
                      </span>
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <BookOpen className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Conteúdo Completo</p>
                          <p className="text-gray-400 text-sm">Teoria detalhada e abrangente</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Mais Questões</p>
                          <p className="text-gray-400 text-sm">Pratique com mais exercícios</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Estudo Aprofundado</p>
                          <p className="text-gray-400 text-sm">Ideal para quem tem mais tempo</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* CTA Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isUnlocking}
                  className="w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: isRetaFinal
                      ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary} 0%, ${RETA_FINAL_THEME.colors.accent} 100%)`
                      : 'linear-gradient(135deg, #FFB800 0%, #2ECC71 100%)',
                  }}
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Desbloqueando...</span>
                    </>
                  ) : (
                    <>
                      <span>Quero Desbloquear</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Secondary action */}
                <button
                  onClick={onClose}
                  className="w-full mt-3 py-3 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Continuar no modo atual
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RetaFinalUpsellModal;
