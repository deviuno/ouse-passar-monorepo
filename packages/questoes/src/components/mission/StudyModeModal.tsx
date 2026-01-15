import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'zen' | 'hard') => void;
}

export function StudyModeModal({
  isOpen,
  onClose,
  onSelectMode,
}: StudyModeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2 text-center">
            Escolha o modo de estudo
          </h2>
          <p className="text-[var(--color-text-sec)] text-sm text-center mb-6">
            Como você quer praticar as questões?
          </p>

          <div className="space-y-3">
            {/* Modo Zen */}
            <button
              onClick={() => onSelectMode('zen')}
              className="w-full p-4 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[#4CAF50] rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4CAF50]/30 transition-colors">
                  <span className="text-2xl">🧘</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-main)] group-hover:text-[#4CAF50] transition-colors">
                    Modo Zen
                  </h3>
                  <p className="text-[var(--color-text-sec)] text-sm mt-1">
                    Veja o gabarito e comentário após cada questão. Ideal para aprender com calma.
                  </p>
                </div>
              </div>
            </button>

            {/* Modo Simulado (internamente 'hard') */}
            <button
              onClick={() => onSelectMode('hard')}
              className="w-full p-4 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[#FFB800] rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFB800]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFB800]/30 transition-colors">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-main)] group-hover:text-[#FFB800] transition-colors">
                    Modo Simulado
                  </h3>
                  <p className="text-[var(--color-text-sec)] text-sm mt-1">
                    Responda todas as questões primeiro. Gabarito e comentários só no final.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-[#6E6E6E] hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
