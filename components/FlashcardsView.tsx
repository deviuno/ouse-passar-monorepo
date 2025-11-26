
import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Check, X, Layers, BrainCircuit, Award, ArrowRight } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
  onBack: () => void;
  onGoToCadernoErros: () => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards, onBack, onGoToCadernoErros }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ remembered: 0, forgotten: 0 });

  if (!cards || cards.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#1A1A1A]">
               <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                   <Layers size={48} className="text-gray-600" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white">Deck Vazio</h2>
               <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">
                   Você ainda não tem flashcards. Vá até o "Caderno de Erros" e use a IA para gerar revisões automáticas!
               </p>
               
               <div className="space-y-3 w-full max-w-xs">
                   <button 
                       onClick={onGoToCadernoErros}
                       className="w-full bg-[#FFB800] text-black hover:bg-[#FFC933] px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg"
                   >
                       Ir para Caderno de Erros
                       <ArrowRight size={18} className="ml-2" />
                   </button>
                   <button onClick={onBack} className="w-full text-gray-500 hover:text-white px-8 py-3 rounded-xl font-bold transition-all text-xs">
                       Voltar
                   </button>
               </div>
          </div>
      );
  }

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const handleNext = (remembered: boolean) => {
      if (remembered) {
          setStats(prev => ({ ...prev, remembered: prev.remembered + 1 }));
      } else {
          setStats(prev => ({ ...prev, forgotten: prev.forgotten + 1 }));
      }

      setIsFlipped(false);
      
      if (currentIndex < cards.length - 1) {
          setTimeout(() => setCurrentIndex(prev => prev + 1), 250);
      } else {
          setTimeout(() => setCompleted(true), 250);
      }
  };

  const handleRestart = () => {
      setCompleted(false);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({ remembered: 0, forgotten: 0 });
  };

  if (completed) {
      const accuracy = Math.round((stats.remembered / cards.length) * 100);
      const xpEarned = stats.remembered * 10 + 50; // Base 50 XP + 10 per card

      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#1A1A1A] relative overflow-hidden">
               {/* Confetti Background */}
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="confetti-piece"></div>
                  <div className="confetti-piece"></div>
                  <div className="confetti-piece"></div>
                  <div className="confetti-piece"></div>
               </div>

              <div className="z-10 bg-[#252525] p-8 rounded-3xl border border-gray-800 shadow-2xl max-w-sm w-full">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                      <Check size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Sessão Concluída!</h2>
                  <p className="text-gray-400 mb-8 text-sm">
                      Você revisou <strong className="text-white">{cards.length} flashcards</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
                          <span className="block text-2xl font-bold text-[#FFB800]">{accuracy}%</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Precisão</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
                          <span className="block text-2xl font-bold text-blue-400">+{xpEarned}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">XP Ganho</span>
                      </div>
                  </div>

                  <div className="flex flex-col space-y-3 w-full">
                      <button onClick={handleRestart} className="w-full bg-[#FFB800] py-3 rounded-xl font-bold text-black hover:bg-[#FFC933] flex items-center justify-center">
                          <RotateCcw size={18} className="mr-2" />
                          Revisar Novamente
                      </button>
                      <button onClick={onBack} className="w-full bg-transparent border border-gray-700 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800">
                          Voltar ao Perfil
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] relative overflow-hidden">
       {/* Ambient Background */}
       <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

       {/* Header */}
       <div className="p-4 flex items-center justify-between relative z-10">
            <button onClick={onBack} className="p-2 bg-black/20 rounded-full text-gray-300 hover:text-white backdrop-blur-sm">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center">
                    <BrainCircuit size={14} className="mr-1" />
                    Revisão Flash
                </span>
            </div>
            <div className="w-9" /> {/* Spacer */}
       </div>

       {/* Progress Indicator */}
       <div className="px-6 mb-4 relative z-10">
           <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold">
               <span>Progresso</span>
               <span>{currentIndex + 1} / {cards.length}</span>
           </div>
           <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out" 
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                ></div>
           </div>
       </div>

       {/* Card Area */}
       <div className="flex-1 relative flex flex-col items-center justify-center perspective-1000 px-6">
            
            {/* Background Card Stack Effect (Next Card Preview) */}
            {nextCard && (
                <div className="absolute w-[85%] aspect-[3/4] bg-[#1f1f1f] rounded-3xl border border-gray-800 shadow-xl transform translate-y-4 scale-95 opacity-50 -z-10"></div>
            )}
            {cards[currentIndex + 2] && (
                <div className="absolute w-[80%] aspect-[3/4] bg-[#1a1a1a] rounded-3xl border border-gray-800 shadow-lg transform translate-y-8 scale-90 opacity-20 -z-20"></div>
            )}

            {/* Active Card */}
            <div 
                className="relative w-full max-w-[320px] aspect-[3/4] cursor-pointer group z-10"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full transition-all duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-[#252525] border border-gray-700 rounded-3xl p-6 flex flex-col shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                             <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase border border-purple-500/20">
                                 {currentCard.materia || 'Geral'}
                             </span>
                             <span className="text-xs text-gray-500 font-medium">Frente</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <h3 className="text-lg font-medium leading-relaxed text-white">
                                {currentCard.front}
                            </h3>
                            {currentCard.assunto && (
                                <p className="text-xs text-gray-500 mt-3">{currentCard.assunto}</p>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-gray-800 text-center">
                            <span className="text-xs text-purple-400 font-bold animate-pulse">Toque para ver a resposta</span>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1A1A1A] border-2 border-[#FFB800] rounded-3xl p-6 flex flex-col shadow-[0_0_40px_rgba(255,184,0,0.15)]">
                         <div className="flex justify-end mb-4">
                             <span className="text-xs text-gray-500 font-medium">Verso</span>
                         </div>
                         
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resposta</span>
                             <h3 className="text-base leading-relaxed text-white font-medium">
                                {currentCard.back}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
       </div>

       {/* Controls Area */}
       <div className="h-32 px-6 pb-6 pt-2">
           {isFlipped ? (
               <div className="grid grid-cols-2 gap-4 h-full items-end animate-fade-in-up">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                     className="h-16 rounded-2xl bg-[#E74C3C]/10 border border-[#E74C3C]/50 text-[#E74C3C] font-bold flex items-center justify-center space-x-2 hover:bg-[#E74C3C] hover:text-white transition-all active:scale-95"
                   >
                       <X size={20} />
                       <span>Não Lembrei</span>
                   </button>
                   
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                     className="h-16 rounded-2xl bg-[#2ECC71]/10 border border-[#2ECC71]/50 text-[#2ECC71] font-bold flex items-center justify-center space-x-2 hover:bg-[#2ECC71] hover:text-white transition-all active:scale-95"
                   >
                       <Check size={20} />
                       <span>Acertei</span>
                   </button>
               </div>
           ) : (
               <div className="flex flex-col items-center justify-end h-full text-center pb-2">
                   <p className="text-sm text-gray-400 font-medium">
                       Tente lembrar a resposta antes de virar o card.
                   </p>
               </div>
           )}
       </div>
    </div>
  );
};

export default FlashcardsView;
