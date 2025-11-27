import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Gift, BookOpen, Brain, Trophy, Zap } from 'lucide-react';
import { Course } from '../types';

interface FreeEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onConfirm: (course: Course) => void;
}

const FreeEnrollModal: React.FC<FreeEnrollModalProps> = ({ isOpen, onClose, course, onConfirm }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleEnroll = () => {
    if (!course) return;
    setIsProcessing(true);
    // Simulate brief processing
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm(course);
      onClose();
    }, 800);
  };

  if (!shouldRender || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        className={`w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl flex flex-col border-t border-x border-gray-800 shadow-[0_-10px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-transform duration-300 ease-out pointer-events-auto transform ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-gradient-to-r from-green-900/30 to-green-900/10">
          <h3 className="font-bold text-white text-lg flex items-center">
             <Gift className="mr-2 text-green-500" size={20} />
             Curso Gratuito
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] no-scrollbar">

            {/* Course Summary */}
            <div className="bg-[#252525] p-5 rounded-2xl border border-green-900/30 mb-6 flex items-start space-x-4">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-3xl border border-gray-800 shadow-lg">
                    {course.icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-white text-lg leading-tight mb-1">{course.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{course.subtitle}</p>
                    <div className="inline-block bg-green-500/20 border border-green-500/50 px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-green-400 uppercase">100% Gratuito</span>
                    </div>
                </div>
            </div>

            {/* Free Badge Highlight */}
            <div className="bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500/30 rounded-2xl p-4 mb-6 text-center">
                <div className="text-4xl font-bold text-green-400 mb-1">R$ 0,00</div>
                <p className="text-green-300/70 text-sm">Acesso completo sem custo</p>
            </div>

            {/* Benefits */}
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">O que voce recebe:</h4>
            <ul className="space-y-3 mb-6 bg-[#252525] p-4 rounded-xl border border-gray-800">
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3 shrink-0" />
                    Acesso a todas as questoes do preparatorio
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3 shrink-0" />
                    Simulados ilimitados com cronometro
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3 shrink-0" />
                    Comentarios detalhados em cada questao
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3 shrink-0" />
                    Sistema de revisao inteligente (SRS)
                </li>
            </ul>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
                    <BookOpen size={20} className="mx-auto mb-1 text-blue-400" />
                    <span className="text-[10px] text-gray-400">Questoes</span>
                </div>
                <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
                    <Brain size={20} className="mx-auto mb-1 text-purple-400" />
                    <span className="text-[10px] text-gray-400">Revisao IA</span>
                </div>
                <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
                    <Trophy size={20} className="mx-auto mb-1 text-yellow-400" />
                    <span className="text-[10px] text-gray-400">Ranking</span>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={handleEnroll}
                disabled={isProcessing}
                className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-900/30 transition-all flex items-center justify-center"
            >
                {isProcessing ? (
                     <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Zap size={20} className="mr-2" />
                        Inscrever-se Gratuitamente
                    </>
                )}
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-4">
                Ao se inscrever, voce tera acesso imediato ao conteudo.
            </p>
        </div>
      </div>
    </div>
  );
};

export default FreeEnrollModal;
