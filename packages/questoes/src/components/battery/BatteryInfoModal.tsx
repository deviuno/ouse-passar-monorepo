import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Battery, Zap, Clock, CheckCircle, ExternalLink, MessageSquare, Headphones, Radio, FileText, Target, Rocket } from 'lucide-react';
import { getTimeUntilRecharge } from '../../types/battery';

interface BatteryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBattery: number;
  maxBattery: number;
  isPremium?: boolean;
  checkoutUrl?: string | null;
  price?: number;
  preparatorioNome?: string;
}

export function BatteryInfoModal({
  isOpen,
  onClose,
  currentBattery,
  maxBattery,
  isPremium = false,
  checkoutUrl,
  price,
  preparatorioNome,
}: BatteryInfoModalProps) {
  const { hours, minutes } = getTimeUntilRecharge();
  const batteryPercentage = Math.round((currentBattery / maxBattery) * 100);

  const handleBuyClick = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center p-3 lg:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto mb-16 lg:mb-0 hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-b from-[#FFB800]/20 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <X className="w-5 h-5 text-[#6E6E6E]" />
              </button>

              <div className="flex flex-col items-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-[#FFB800]/20 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Battery className="w-10 h-10 text-[#FFB800]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white text-center">
                  Sistema de Bateria
                </h2>
                <p className="text-[#A0A0A0] text-sm mt-2 text-center">
                  Entenda como funciona sua energia diária
                </p>
              </div>
            </div>

            {/* Current Status */}
            <div className="px-6 pb-4">
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#3A3A3A]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#A0A0A0] text-sm">Sua bateria atual</span>
                  {isPremium ? (
                    <span className="text-[#FFB800] text-sm font-bold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      ILIMITADA
                    </span>
                  ) : (
                    <span className="text-white font-bold">{currentBattery}/{maxBattery}</span>
                  )}
                </div>
                {!isPremium && (
                  <div className="w-full h-3 bg-[#3A3A3A] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        batteryPercentage > 50
                          ? 'bg-green-500'
                          : batteryPercentage > 20
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${batteryPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content - Battery Costs */}
            <div className="px-6 pb-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Consumo por ação:</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <Target className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Questão</p>
                    <p className="text-[#6E6E6E] text-[10px]">-2 energia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <Rocket className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Iniciar Missão</p>
                    <p className="text-[#6E6E6E] text-[10px]">-5 energia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <MessageSquare className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Chat com IA</p>
                    <p className="text-[#6E6E6E] text-[10px]">-3 energia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <Headphones className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Gerar Áudio</p>
                    <p className="text-[#6E6E6E] text-[10px]">-5 energia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <Radio className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Gerar Podcast</p>
                    <p className="text-[#6E6E6E] text-[10px]">-10 energia</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#2A2A2A] rounded-lg">
                  <FileText className="w-4 h-4 text-[#FFB800]" />
                  <div>
                    <p className="text-white text-xs font-medium">Resumo IA</p>
                    <p className="text-[#6E6E6E] text-[10px]">-5 energia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="px-6 pb-4 space-y-2">
              <h3 className="text-white font-semibold text-sm">Como funciona:</h3>
              <div className="text-[#A0A0A0] text-xs space-y-1">
                <p>• Cada ação consome energia da sua bateria</p>
                <p>• Quando acaba, aguarde a recarga ou assine</p>
                <p>• Recarga automática todo dia à meia-noite</p>
              </div>
            </div>

            {/* Recharge Info */}
            {!isPremium && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                  <Clock className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400">
                    Próxima recarga em <span className="font-bold">{hours}h {minutes}min</span>
                  </p>
                </div>
              </div>
            )}

            {/* Premium Benefits */}
            {!isPremium && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-[#FFB800]/10 to-[#FF8C00]/10 rounded-xl p-4 border border-[#FFB800]/30">
                  <h3 className="text-[#FFB800] font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Bateria Ilimitada
                  </h3>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Estude sem limites, a qualquer hora
                    </li>
                    <li className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Sem interrupções no seu ritmo de estudo
                    </li>
                    <li className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Acesso completo por 12 meses
                    </li>
                  </ul>

                  <button
                    onClick={handleBuyClick}
                    disabled={!checkoutUrl}
                    className={`w-full p-4 rounded-xl transition-all ${
                      checkoutUrl
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300'
                        : 'bg-[#3A3A3A] cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Zap className="w-5 h-5 text-black" />
                      <div className="text-left">
                        <p className="text-black font-bold">Quero Bateria Ilimitada</p>
                        {price && (
                          <p className="text-black/70 text-sm">
                            {preparatorioNome} - R$ {price}
                          </p>
                        )}
                      </div>
                      {checkoutUrl && (
                        <ExternalLink className="w-5 h-5 text-black/60 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Premium Status */}
            {isPremium && (
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-[#FFB800]/10 to-[#FF8C00]/10 rounded-xl p-4 border border-[#FFB800]/30 text-center">
                  <Zap className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                  <h3 className="text-[#FFB800] font-bold mb-1">Você tem Bateria Ilimitada!</h3>
                  <p className="text-[#A0A0A0] text-sm">
                    Aproveite seus estudos sem limites
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium transition-colors"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level
  // This ensures it's not affected by parent transforms/filters
  return createPortal(modalContent, document.body);
}

export default BatteryInfoModal;
