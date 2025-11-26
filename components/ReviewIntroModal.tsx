
import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, Calendar, CheckCircle } from 'lucide-react';

interface ReviewIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  count: number;
  userName: string;
}

const ReviewIntroModal: React.FC<ReviewIntroModalProps> = ({ isOpen, onClose, onStart, count, userName }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-sm bg-[#1A1A1A] rounded-3xl border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden transition-all duration-500 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
      >
        <div className="bg-gradient-to-b from-blue-900/20 to-[#1A1A1A] p-8 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-pulse-fast">
                <BrainCircuit size={40} className="text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Plano de Revisão</h2>
            <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-6">Inteligência Artificial</p>

            <div className="bg-[#252525] p-6 rounded-2xl border border-gray-800 text-left mb-8 relative">
                <div className="absolute -left-1 top-6 w-1 h-12 bg-blue-500 rounded-r-full"></div>
                <p className="text-gray-300 leading-relaxed text-sm">
                    "Olá <strong className="text-white">{userName}</strong>, de acordo com o seu desempenho da última semana, elaboramos um plano de revisão focado."
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center text-xs text-gray-400">
                        <CheckCircle size={14} className="text-green-500 mr-2" />
                        Fixar assuntos que você domina
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                        <CheckCircle size={14} className="text-orange-500 mr-2" />
                        Treinar pontos de dificuldade
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-8">
                <Calendar size={16} />
                <span>Meta de hoje: <strong className="text-white">{count} questões</strong></span>
            </div>

            <button 
                onClick={onStart}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center"
            >
                Começar Revisão
            </button>
            <button 
                onClick={onClose}
                className="mt-4 text-xs text-gray-500 hover:text-white"
            >
                Agora não
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewIntroModal;
