
import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Check, X, Layers } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
  onBack: () => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!cards || cards.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
               <Layers size={48} className="text-gray-600 mb-4" />
               <h2 className="text-xl font-bold mb-2">Sem Flashcards</h2>
               <p className="text-gray-400 text-sm mb-6">
                   Vá até o "Caderno de Erros" e gere flashcards automáticos com IA para começar a revisão.
               </p>
               <button onClick={onBack} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold">
                   Voltar
               </button>
          </div>
      );
  }

  const currentCard = cards[currentIndex];

  const handleNext = (remembered: boolean) => {
      setIsFlipped(false);
      
      // In a real app, update mastery level here
      console.log(`Card ${currentCard.id}: Remembered = ${remembered}`);

      if (currentIndex < cards.length - 1) {
          setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
      } else {
          setCompleted(true);
      }
  };

  const handleRestart = () => {
      setCompleted(false);
      setCurrentIndex(0);
      setIsFlipped(false);
  };

  if (completed) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#1A1A1A]">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Revisão Concluída!</h2>
              <p className="text-gray-400 mb-8">Você revisou {cards.length} flashcards.</p>
              <div className="flex space-x-4 w-full max-w-xs">
                  <button onClick={onBack} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold text-white">Sair</button>
                  <button onClick={handleRestart} className="flex-1 bg-[#FFB800] py-3 rounded-xl font-bold text-black">Revisar Novamente</button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] relative">
       {/* Header */}
       <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <button onClick={onBack} className="text-gray-400 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <span className="font-bold text-gray-300">
                {currentIndex + 1} / {cards.length}
            </span>
            <div className="w-6"></div>
       </div>

       {/* Progress Bar */}
       <div className="w-full h-1 bg-gray-800">
            <div 
                className="h-full bg-[#FFB800] transition-all duration-300" 
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            ></div>
       </div>

       {/* Card Area */}
       <div className="flex-1 p-6 flex items-center justify-center perspective-1000">
            <div 
                className="relative w-full max-w-sm aspect-[3/4] cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full transition-all duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-[#252525] border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                        <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider mb-4">Pergunta</span>
                        <h3 className="text-xl font-medium leading-relaxed text-white">
                            {currentCard.front}
                        </h3>
                        <p className="text-xs text-gray-500 mt-auto pt-4">Toque para virar</p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1A1A1A] border border-[#FFB800]/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(255,184,0,0.1)]">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resposta</span>
                         <h3 className="text-lg leading-relaxed text-gray-200">
                            {currentCard.back}
                        </h3>
                    </div>
                </div>
            </div>
       </div>

       {/* Controls */}
       {isFlipped && (
           <div className="p-6 pb-8 flex justify-center space-x-6 animate-fade-in-up">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                 className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
               >
                   <X size={24} />
                   <span className="text-[10px] font-bold mt-1">Errei</span>
               </button>
               
               <button 
                 onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                 className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
               >
                   <Check size={24} />
                   <span className="text-[10px] font-bold mt-1">Acertei</span>
               </button>
           </div>
       )}
       {!isFlipped && (
           <div className="p-6 pb-8 flex justify-center text-gray-500 text-sm h-32 items-end">
               <p>Tente lembrar a resposta antes de virar.</p>
           </div>
       )}
    </div>
  );
};

export default FlashcardsView;
