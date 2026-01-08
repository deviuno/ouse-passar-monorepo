import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  /** Se true, não renderiza header (útil para modais totalmente customizados) */
  hideHeader?: boolean;
  /** Se true, não adiciona padding no content */
  noPadding?: boolean;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

/**
 * Modal padronizado para a área do aluno.
 *
 * Comportamento:
 * - Desktop: Centralizado horizontal e verticalmente
 * - Mobile: Centralizado horizontal, alinhado à base (acima do menu de rodapé)
 * - Animação: Entra de baixo para cima, sai para baixo
 */
export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  size = 'md',
  showCloseButton = true,
  hideHeader = false,
  noPadding = false,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container - Responsivo */}
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 pb-24 md:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8
              }}
              className={`
                w-full ${sizes[size]}
                bg-[var(--color-bg-card)] rounded-2xl shadow-2xl
                overflow-hidden pointer-events-auto
                max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-48px)]
                flex flex-col theme-transition
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {!hideHeader && (title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {icon}
                    {title && (
                      <h2 className="text-lg font-semibold text-[var(--color-text-main)]">{title}</h2>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                      <X size={20} className="text-[var(--color-text-sec)]" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`overflow-y-auto flex-1 ${noPadding ? '' : 'p-4'}`}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;
