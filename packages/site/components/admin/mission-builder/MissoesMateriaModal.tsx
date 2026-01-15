import React from 'react';
import { ClipboardList, Trash2, X } from 'lucide-react';
import { BuilderState, Missao } from './types';

interface MissoesMateriaModalProps {
  show: boolean;
  materiaId: string | null;
  builderState: BuilderState | null;
  onDeleteMissao: (missaoId: string) => void;
  onClose: () => void;
}

export const MissoesMateriaModal: React.FC<MissoesMateriaModalProps> = ({
  show,
  materiaId,
  builderState,
  onDeleteMissao,
  onClose,
}) => {
  if (!show || !materiaId) return null;

  const materiaNome = builderState?.materias.find(m => m.id === materiaId)?.materia;
  const missoesMateria = builderState?.rodadas
    .flatMap(r => r.missoes.filter(m => m.materia_id === materiaId).map(m => ({ ...m, rodadaNumero: r.numero }))) || [];

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
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-yellow" />
            {materiaNome}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {missoesMateria.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Nenhuma missão criada para esta matéria.
            </p>
          ) : (
            <div className="space-y-3">
              {missoesMateria.map(missao => (
                <div
                  key={missao.id}
                  className="flex items-start justify-between p-3 bg-brand-darker rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-brand-yellow/20 text-brand-yellow rounded">
                        Rodada {missao.rodadaNumero}
                      </span>
                      <span className="text-sm text-white font-medium">
                        Missão {missao.numero}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 whitespace-pre-wrap">
                      {missao.assunto}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteMissao(missao.id)}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
