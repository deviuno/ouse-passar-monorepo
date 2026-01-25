import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, LogOut, Trash2, XCircle } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: 'exit' | 'delete' | 'warning' | 'error';
  isLoading?: boolean;
}

const variantStyles: Record<ConfirmVariant, { bg: string; border: string; text: string; btnBg: string; btnHover: string }> = {
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    btnBg: 'bg-red-500',
    btnHover: 'hover:bg-red-600',
  },
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    btnBg: 'bg-orange-500',
    btnHover: 'hover:bg-orange-600',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    btnBg: 'bg-blue-500',
    btnHover: 'hover:bg-blue-600',
  },
};

const icons = {
  exit: LogOut,
  delete: Trash2,
  warning: AlertTriangle,
  error: XCircle,
};

/**
 * Modal de confirmação padronizado.
 * Usa o Modal base com animação de baixo para cima.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  icon = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  const styles = variantStyles[variant];
  const IconComponent = icons[icon];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      size="sm"
      noPadding
    >
      <div className="p-6">
        {/* Icon */}
        <div className={`w-16 h-16 ${styles.bg} ${styles.border} border rounded-full flex items-center justify-center mx-auto mb-4`}>
          <IconComponent size={32} className={styles.text} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[var(--color-text-main)] text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-[var(--color-text-sec)] text-center text-sm mb-6">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-200 dark:bg-[#3A3A3A] text-[var(--color-text-main)] rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-[#4A4A4A] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 ${styles.btnBg} text-white rounded-xl font-semibold ${styles.btnHover} transition-colors disabled:opacity-50`}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
