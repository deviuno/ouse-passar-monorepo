import React from 'react';
import { Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { Missao, Rodada } from './types';

interface RevisoesListModalProps {
  show: boolean;
  rodada: Rodada | undefined;
  onDeleteMissao: (missaoId: string) => void;
  onNovaRevisao: () => void;
  onClose: () => void;
}

export const RevisoesListModal: React.FC<RevisoesListModalProps> = ({
  show,
  rodada,
  onDeleteMissao,
  onNovaRevisao,
  onClose,
}) => {
  if (!show || !rodada) return null;

  const revisoesRodada = rodada.missoes.filter(m => m.tipo === 'revisao');

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-card rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Revisões</h3>
              <p className="text-xs text-gray-400">Rodada {rodada.numero}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {revisoesRodada.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Nenhuma revisão criada para esta rodada.
            </p>
          ) : (
            <div className="space-y-3">
              {revisoesRodada.map(revisao => (
                <div
                  key={revisao.id}
                  className="flex items-start justify-between p-3 bg-brand-darker rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-400">
                      {revisao.tema || 'Revisão'}
                    </p>
                    {revisao.assunto && (
                      <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap line-clamp-3">
                        {revisao.assunto}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteMissao(revisao.id)}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-brand-darker/50 border-t border-white/10">
          <button
            onClick={onNovaRevisao}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Revisão
          </button>
        </div>
      </div>
    </div>
  );
};
