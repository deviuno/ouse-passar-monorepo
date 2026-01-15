import React from 'react';
import { User, Target, Check, X } from 'lucide-react';
import { Tables } from '../../../lib/database.types';

type Lead = Tables<'leads'>;

interface SuccessCardProps {
  lead: Lead;
  planejamentoId: string;
  slug: string;
  onClose: () => void;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ lead, planejamentoId, slug, onClose }) => {
  const firstName = lead.nome.split(' ')[0];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-40 p-4">
      <div className="bg-brand-card border border-brand-yellow/30 max-w-md w-full rounded-sm p-8 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase mb-2">
          Planejamento Criado!
        </h2>
        <p className="text-gray-400 mb-6">
          O planejamento personalizado para <span className="text-brand-yellow font-bold">{firstName}</span> foi gerado com sucesso.
        </p>

        <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-sm mb-6 text-left">
          <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Resumo</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 text-brand-yellow mr-2" />
              <span className="text-gray-400">Nome:</span>
              <span className="text-white ml-2">{lead.nome}</span>
            </div>
            <div className="flex items-center text-sm">
              <Target className="w-4 h-4 text-brand-yellow mr-2" />
              <span className="text-gray-400">Concurso:</span>
              <span className="text-white ml-2">{lead.concurso_almejado}</span>
            </div>
          </div>
        </div>

        <a
          href={`/plano/${slug}/${planejamentoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
        >
          Ver Planejamento
        </a>
      </div>
    </div>
  );
};
