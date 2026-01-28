import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Calendar, Zap, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PromotionalTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
  trialDays?: number;
  expiresAt?: string;
}

export function PromotionalTrialModal({
  isOpen,
  onClose,
  onStartTour,
  trialDays = 30,
  expiresAt,
}: PromotionalTrialModalProps) {
  // Handler para o botão "Iniciar teste"
  const handleStartTrial = () => {
    onClose();
    // Pequeno delay para o modal fechar antes de iniciar o tour
    if (onStartTour) {
      setTimeout(() => {
        onStartTour();
      }, 300);
    }
  };
  // Dispara confete quando o modal abre
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confete da esquerda
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFB800', '#FFC933', '#FFD966', '#FFFFFF', '#FF8C00'],
      });

      // Confete da direita
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFB800', '#FFC933', '#FFD966', '#FFFFFF', '#FF8C00'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Pequeno delay para o modal aparecer primeiro
      const timeout = setTimeout(fireConfetti, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, fireConfetti]);

  // Formatar data de expiração
  const formatExpirationDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formatar período de forma amigável
  const formatTrialPeriod = (days: number) => {
    if (days === 7) return '7 dias';
    if (days === 15) return '15 dias';
    if (days === 30) return '1 mês';
    if (days === 90) return '3 meses';
    if (days === 180) return '6 meses';
    if (days === 365) return '1 ano';
    return `${days} dias`;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente */}
            <div className="relative p-8 pb-6 bg-gradient-to-b from-[#FFB800]/30 via-[#FFB800]/10 to-transparent">
              {/* Ícone animado */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF8C00] flex items-center justify-center mb-4 shadow-lg shadow-[#FFB800]/30"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <Gift className="w-12 h-12 text-black" />
                </motion.div>

                {/* Sparkles ao redor */}
                <motion.div
                  className="absolute top-6 left-1/4"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-[#FFB800]" />
                </motion.div>
                <motion.div
                  className="absolute top-10 right-1/4"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                >
                  <Sparkles className="w-5 h-5 text-[#FFC933]" />
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-[var(--color-text-main)] text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Parabéns!
                </motion.h2>
                <motion.p
                  className="text-[#FFB800] text-lg font-semibold mt-1 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Você ganhou {formatTrialPeriod(trialDays)} grátis!
                </motion.p>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-6 pb-4">
              <motion.div
                className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-[var(--color-text-sec)] text-center text-sm leading-relaxed">
                  Como agradecimento especial, você recebeu acesso{' '}
                  <span className="text-[#FFB800] font-semibold">premium completo</span>{' '}
                  ao Ouse Questões por {formatTrialPeriod(trialDays)}!
                </p>
              </motion.div>
            </div>

            {/* Benefícios */}
            <motion.div
              className="px-6 pb-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-[var(--color-text-main)] font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFB800]" />
                O que você ganha:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-sec)]">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Bateria ilimitada para estudar sem limites
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-sec)]">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Acesso completo ao Mentor com IA
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-sec)]">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Cadernos e simulados ilimitados
                </li>
              </ul>
            </motion.div>

            {/* Data de expiração */}
            {expiresAt && (
              <motion.div
                className="px-6 pb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 p-3 bg-[#FFB800]/10 rounded-xl border border-[#FFB800]/30">
                  <Calendar className="w-5 h-5 text-[#FFB800] flex-shrink-0" />
                  <p className="text-sm text-[var(--color-text-sec)]">
                    Válido até{' '}
                    <span className="text-[#FFB800] font-semibold">
                      {formatExpirationDate(expiresAt)}
                    </span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Botão */}
            <motion.div
              className="px-6 pb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={handleStartTrial}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8C00] hover:from-[#FFC933] hover:to-[#FFB800] text-black font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FFB800]/30"
              >
                Iniciar teste
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export default PromotionalTrialModal;
