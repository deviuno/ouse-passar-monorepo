import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  show: boolean;
  type: 'missao' | 'rodada';
  targetName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  type,
  targetName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        className="bg-brand-card rounded-xl border border-white/10 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Confirmar Exclusão
          </h3>
          <p className="text-gray-400">
            Tem certeza que deseja excluir{' '}
            <span className="text-white font-semibold">{targetName}</span>?
          </p>
          {type === 'rodada' && (
            <p className="text-red-400 text-sm mt-2">
              Todas as missões desta rodada também serão excluídas.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-gray-400 font-semibold hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};
