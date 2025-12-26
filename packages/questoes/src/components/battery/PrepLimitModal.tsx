import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Lock, Zap, ExternalLink } from 'lucide-react';

interface PrepLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxAllowed: number;
  checkoutUrl?: string | null;
  price?: number;
}

export function PrepLimitModal({
  isOpen,
  onClose,
  currentCount,
  maxAllowed,
  checkoutUrl,
  price = 97,
}: PrepLimitModalProps) {
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
            className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-b from-purple-900/30 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <X className="w-5 h-5 text-[#6E6E6E]" />
              </button>

              <div className="flex flex-col items-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="relative">
                    <BookOpen className="w-10 h-10 text-purple-400" />
                    <Lock className="absolute -bottom-1 -right-1 w-5 h-5 text-purple-300" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-white text-center">
                  Limite de Preparatorios
                </h2>
                <p className="text-[#A0A0A0] text-sm mt-2 text-center">
                  Voce atingiu o limite do plano gratuito
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-2 space-y-4">
              {/* Info Box */}
              <div className="flex items-center gap-4 p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Preparatorios Ativos</p>
                  <p className="text-[#6E6E6E] text-sm">
                    <span className="text-purple-400 font-bold">{currentCount}</span>
                    {' / '}
                    <span className="text-purple-400 font-bold">{maxAllowed}</span>
                    {' '}permitidos no plano gratuito
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-[#A0A0A0] text-sm text-center">
                No plano gratuito voce pode ter apenas {maxAllowed}{' '}
                {maxAllowed === 1 ? 'preparatorio ativo' : 'preparatorios ativos'}.
              </p>

              {/* CTA Button */}
              <button
                onClick={handleBuyClick}
                disabled={!checkoutUrl}
                className={`w-full p-4 rounded-xl transition-all ${
                  checkoutUrl
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400'
                    : 'bg-[#3A3A3A] cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">Preparatorios Ilimitados</p>
                      <p className="text-purple-200 text-sm">
                        Por 1 ano - R$ {price}
                      </p>
                    </div>
                  </div>
                  {checkoutUrl && (
                    <ExternalLink className="w-5 h-5 text-white/60" />
                  )}
                </div>
              </button>

              {checkoutUrl && (
                <p className="text-[10px] text-[#6E6E6E] text-center">
                  Tenha acesso ilimitado a todos os preparatorios
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PrepLimitModal;
