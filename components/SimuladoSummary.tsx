
import React from 'react';
import { CheckCircle, XCircle, Award, Home, RotateCcw } from 'lucide-react';
import { UserAnswer, ParsedQuestion } from '../types';

interface SimuladoSummaryProps {
  answers: UserAnswer[];
  questions: ParsedQuestion[];
  onExit: () => void;
  onRestart: () => void;
}

const SimuladoSummary: React.FC<SimuladoSummaryProps> = ({ answers, questions, onExit, onRestart }) => {
  const total = questions.length;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const percentage = Math.round((correctCount / total) * 100);
  
  const isPassing = percentage >= 70;

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] overflow-y-auto no-scrollbar relative">
      {/* Confetti Animation for Good Score */}
      {isPassing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
        </div>
      )}

      {/* Header Result */}
      <div className={`p-8 flex flex-col items-center justify-center text-center z-10 ${isPassing ? 'bg-gradient-to-b from-[#2ECC71]/20 to-[#1A1A1A]' : 'bg-gradient-to-b from-[#E74C3C]/20 to-[#1A1A1A]'}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 shadow-2xl ${isPassing ? 'bg-[#2ECC71]/20 border-[#2ECC71] text-[#2ECC71]' : 'bg-[#E74C3C]/20 border-[#E74C3C] text-[#E74C3C]'}`}>
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="text-2xl font-bold mb-1 text-white">
          {isPassing ? 'Parabéns!' : 'Continue Estudando!'}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Você acertou <strong className="text-white">{correctCount}</strong> de <strong className="text-white">{total}</strong> questões.
        </p>

        {isPassing && (
           <div className="flex items-center space-x-2 bg-[#FFB800]/20 px-4 py-2 rounded-full border border-[#FFB800]/50">
             <Award size={16} className="text-[#FFB800]" />
             <span className="text-xs font-bold text-[#FFB800]">+250 XP Bônus</span>
           </div>
        )}
      </div>

      {/* Detailed Review */}
      <div className="flex-1 px-4 z-10">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Gabarito Comentado</h3>
        <div className="space-y-3 pb-24">
          {questions.map((q, idx) => {
             const answer = answers.find(a => a.questionId === q.id);
             const isCorrect = answer?.isCorrect;
             
             return (
               <div key={q.id} className="bg-[#252525] p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500">Questão {idx + 1}</span>
                     {isCorrect 
                       ? <span className="text-[#2ECC71] text-xs font-bold flex items-center"><CheckCircle size={14} className="mr-1"/> Acertou</span>
                       : <span className="text-[#E74C3C] text-xs font-bold flex items-center"><XCircle size={14} className="mr-1"/> Errou</span>
                     }
                  </div>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{q.enunciado}</p>
                  
                  <div className="flex items-center justify-between text-xs bg-[#1A1A1A] p-2 rounded-lg">
                     <div>
                       <span className="text-gray-500 block">Sua Resposta</span>
                       <span className={`font-bold ${isCorrect ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                         Letra {answer?.selectedLetter || '-'}
                       </span>
                     </div>
                     <div className="text-right">
                       <span className="text-gray-500 block">Gabarito</span>
                       <span className="font-bold text-[#2ECC71]">Letra {q.gabarito}</span>
                     </div>
                  </div>
               </div>
             );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 w-full max-w-md bg-[#1A1A1A] border-t border-gray-800 p-4 flex space-x-3 z-20">
         <button 
           onClick={onExit}
           className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 flex items-center justify-center"
         >
           <Home size={18} className="mr-2" />
           Início
         </button>
         <button 
           onClick={onRestart}
           className="flex-1 py-3 rounded-xl bg-[#FFB800] text-black font-bold hover:bg-[#FFC933] flex items-center justify-center shadow-lg"
         >
           <RotateCcw size={18} className="mr-2" />
           Refazer
         </button>
      </div>
    </div>
  );
};

export default SimuladoSummary;
