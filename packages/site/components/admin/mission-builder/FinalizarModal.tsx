import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Plus } from 'lucide-react';

interface FinalizarModalProps {
  show: boolean;
  totalTopicosPendentes: number;
  finalizando: boolean;
  onNovaRodada: () => void;
  onConfirmar: () => void;
  onClose: () => void;
}

export const FinalizarModal: React.FC<FinalizarModalProps> = ({
  show,
  totalTopicosPendentes,
  finalizando,
  onNovaRodada,
  onConfirmar,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-card rounded-xl border border-white/10 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Tópicos Pendentes
          </h3>
          <p className="text-gray-400">
            Você ainda tem <span className="text-brand-yellow font-bold">{totalTopicosPendentes}</span> {totalTopicosPendentes === 1 ? 'tópico' : 'tópicos'} para designar.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Deseja finalizar mesmo assim ou criar uma nova rodada?
          </p>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
          <button
            onClick={onNovaRodada}
            disabled={finalizando}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-yellow text-brand-darker font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Criar Nova Rodada
          </button>
          <button
            onClick={onConfirmar}
            disabled={finalizando}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {finalizando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};
