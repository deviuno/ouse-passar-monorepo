import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores';
import { ToastMessage } from '../../types';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: 'bg-[#2ECC71]/20 border-[#2ECC71] text-[#2ECC71]',
  error: 'bg-[#E74C3C]/20 border-[#E74C3C] text-[#E74C3C]',
  info: 'bg-[#3498DB]/20 border-[#3498DB] text-[#3498DB]',
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(({ toast, onRemove }, ref) => {
  const Icon = icons[toast.type];

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        flex items-center gap-3 p-4 rounded-xl border
        ${colors[toast.type]}
        shadow-lg backdrop-blur-sm
        min-w-[300px] max-w-[400px]
      `}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="flex-1 text-white text-sm">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
});

ToastItem.displayName = 'ToastItem';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
