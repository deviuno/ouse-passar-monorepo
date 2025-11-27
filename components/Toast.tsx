
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 500); // 0.5 seconds - quick feedback
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const borderColors = {
    success: 'border-green-500/50',
    error: 'border-red-500/50',
    info: 'border-blue-500/50',
  };

  return (
    <div className={`flex items-center p-4 mb-3 rounded-xl bg-[#252525] border ${borderColors[toast.type]} shadow-lg animate-fade-in-up min-w-[300px] pointer-events-auto`}>
      <div className="mr-3">{icons[toast.type]}</div>
      <p className="text-sm text-white font-medium flex-1">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="ml-3 text-gray-500 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none w-full max-w-sm px-4">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
};
