
import React, { useState, useEffect } from 'react';
import { X, Coffee, Timer, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Course, StudyMode } from '../types';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSelectMode: (mode: StudyMode, time?: number) => void;
}

const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({ isOpen, onClose, course, onSelectMode }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  // State for Simulado Mode Configuration
  const [isSimuladoExpanded, setIsSimuladoExpanded] = useState(false);
  const [minutes, setMinutes] = useState(120);

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

  if (!shouldRender || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div 
        className={`w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl flex flex-col border-t border-x border-gray-800 shadow-[0_-10px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-transform duration-300 ease-out pointer-events-auto transform ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-[#252525]">
          <div>
            <h3 className="font-bold text-white text-lg">Configurar Estudo</h3>
            <p className="text-xs text-gray-400">{course.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-[#1A1A1A] overflow-y-auto max-h-[70vh] no-scrollbar">
            
            {/* Mode Zen Card */}
            <button 
                onClick={() => onSelectMode('zen')}
                className="w-full relative overflow-hidden group rounded-2xl border border-teal-900/50 hover:border-teal-500 transition-all duration-300 text-left bg-[#1A1A1A]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-5 flex items-start space-x-4">
                    <div className="bg-teal-900/30 p-3 rounded-xl text-teal-400 group-hover:text-teal-300 group-hover:scale-110 transition-transform duration-300">
                        <Coffee size={28} />
                    </div>
                    <div>
                        <h4 className="font-bold text-teal-400 text-lg mb-1 flex items-center">
                            Modo Zen
                        </h4>
                        <p className="text-gray-400 text-sm leading-tight">
                            Sem pressão de tempo. Feedback imediato após cada questão. Ideal para fixação de conteúdo.
                        </p>
                    </div>
                </div>
            </button>

             {/* Mode Reta Final Card */}
             <button 
                onClick={() => onSelectMode('reta_final')}
                className="w-full relative overflow-hidden group rounded-2xl border border-purple-900/50 hover:border-purple-500 transition-all duration-300 text-left bg-[#1A1A1A]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-5 flex items-start space-x-4">
                    <div className="bg-purple-900/30 p-3 rounded-xl text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-transform duration-300">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h4 className="font-bold text-purple-400 text-lg mb-1 flex items-center">
                            Reta Final
                        </h4>
                        <p className="text-gray-400 text-sm leading-tight">
                            Questões de alta frequência e comentários resumidos. Para revisões rápidas e intensas.
                        </p>
                    </div>
                </div>
            </button>

            {/* Mode Simulado Card (Expandable) */}
            <div className={`rounded-2xl border transition-all duration-300 ${isSimuladoExpanded ? 'border-red-500 bg-[#252525]/30' : 'border-red-900/50 hover:border-red-500'}`}>
                <button 
                    onClick={() => setIsSimuladoExpanded(!isSimuladoExpanded)}
                    className="w-full relative overflow-hidden group text-left rounded-2xl focus:outline-none"
                >
                    <div className={`absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent opacity-50 transition-opacity ${isSimuladoExpanded ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                    <div className="relative p-5 flex items-start space-x-4">
                        <div className="bg-red-900/30 p-3 rounded-xl text-red-500 transition-transform duration-300">
                            <Timer size={28} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-red-500 text-lg mb-1 flex items-center justify-between">
                                Modo Simulado
                                {isSimuladoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </h4>
                            <p className="text-gray-400 text-sm leading-tight">
                                Cronômetro ligado. Feedback apenas ao final.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Expanded Controls for Simulado */}
                {isSimuladoExpanded && (
                    <div className="px-5 pb-5 pt-0 animate-fade-in">
                        <div className="border-t border-gray-700/50 pt-4 mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-gray-300">Tempo de Prova</span>
                                <span className="text-xl font-bold text-red-500 font-mono">{minutes} min</span>
                            </div>
                            
                            <input 
                                type="range" 
                                min="15" 
                                max="240" 
                                step="15" 
                                value={minutes} 
                                onChange={(e) => setMinutes(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
                                <span>15m</span>
                                <span>120m</span>
                                <span>240m</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => onSelectMode('hard', minutes)}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center"
                        >
                            <Timer size={18} className="mr-2" />
                            Começar Simulado
                        </button>
                    </div>
                )}
            </div>

            <div className="pt-2 text-center pb-4">
                <p className="text-[10px] text-gray-600">Todos os modos contam pontos para o Ranking Semanal.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectionModal;
