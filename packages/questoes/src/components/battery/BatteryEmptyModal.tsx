import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BatteryWarning, Clock, Zap, ExternalLink } from 'lucide-react';
import { getTimeUntilRecharge } from '../../types/battery';

interface BatteryEmptyModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string | null;
  price?: number;
  preparatorioNome?: string;
}

export function BatteryEmptyModal({
  isOpen,
  onClose,
  checkoutUrl,
  price,
  preparatorioNome,
}: BatteryEmptyModalProps) {
  const { hours, minutes } = getTimeUntilRecharge();

  const handleBuyClick = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-b from-red-100 dark:from-red-900/30 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-[#6E6E6E]" />
              </button>

              <div className="flex flex-col items-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BatteryWarning className="w-10 h-10 text-red-500 dark:text-red-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                  Bateria Esgotada
                </h2>
                <p className="text-gray-500 dark:text-[#A0A0A0] text-sm mt-2 text-center">
                  Sua energia diaria acabou!
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-2 space-y-4">
              {/* Opção 1: Aguardar */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#2A2A2A] rounded-xl border border-gray-200 dark:border-[#3A3A3A]">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Aguarde a recarga</p>
                  <p className="text-gray-500 dark:text-[#6E6E6E] text-sm">
                    Nova carga em{' '}
                    <span className="text-blue-500 dark:text-blue-400 font-bold">
                      {hours}h {minutes}min
                    </span>
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#3A3A3A]" />
                <span className="text-gray-400 dark:text-[#6E6E6E] text-xs">ou</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#3A3A3A]" />
              </div>

              {/* Opção 2: Comprar Ouse Questões */}
              <button
                onClick={handleBuyClick}
                disabled={!checkoutUrl}
                className={`w-full p-4 rounded-xl transition-all ${
                  checkoutUrl
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300'
                    : 'bg-gray-200 dark:bg-[#3A3A3A] cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-left">
                      <p className="text-black font-bold">Ouse Questões</p>
                      <p className="text-black/70 text-sm">
                        {preparatorioNome || 'Acesso completo'}
                        {price ? ` - R$ ${price}` : ''}
                      </p>
                    </div>
                  </div>
                  {checkoutUrl && (
                    <ExternalLink className="w-5 h-5 text-black/60" />
                  )}
                </div>
              </button>

              {checkoutUrl && (
                <p className="text-[10px] text-gray-400 dark:text-[#6E6E6E] text-center">
                  Energia ilimitada + todas as funcionalidades por 1 ano
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BatteryEmptyModal;
