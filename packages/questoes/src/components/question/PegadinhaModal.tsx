import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PegadinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  explicacao?: string;
}

export function PegadinhaModal({
  isOpen,
  onClose,
  explicacao,
}: PegadinhaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--color-bg-card)] w-full max-w-sm rounded-2xl border border-orange-500 p-0 shadow-2xl overflow-hidden">
        <div className="bg-orange-500/10 p-4 border-b border-orange-500/30 flex justify-between items-center">
          <h3 className="font-bold text-orange-400 flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            Cuidado! E uma Pegadinha
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[var(--color-text-main)] leading-relaxed text-sm">
            {explicacao || "Esta questao contem elementos projetados para induzir o candidato ao erro comum. Fique atento aos detalhes do enunciado!"}
          </p>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
