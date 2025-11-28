
import React from 'react';
import { ArrowLeft, BookX, Zap } from 'lucide-react';
import { UserAnswer, ParsedQuestion } from '../types';

interface CadernoErrosViewProps {
  answers: UserAnswer[];
  questions: ParsedQuestion[];
  onBack: () => void;
  onGenerateFlashcards?: (questions: ParsedQuestion[]) => void;
  isGenerating?: boolean;
}

const CadernoErrosView: React.FC<CadernoErrosViewProps> = ({ answers, questions, onBack, onGenerateFlashcards, isGenerating }) => {
  // Filter only incorrect answers and reverse to show newest first
  const incorrectAnswers = answers.filter(a => !a.isCorrect).slice().reverse();
  
  // Get unique incorrect questions
  const uniqueQuestionIds = Array.from(new Set(incorrectAnswers.map(a => a.questionId)));
  const incorrectQuestions = uniqueQuestionIds
    .map(id => questions.find(q => q.id === id))
    .filter((q): q is ParsedQuestion => !!q);

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center sticky top-0 bg-[#1A1A1A] z-10 justify-between">
        <div className="flex items-center">
            <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl font-bold flex items-center text-white">
                    <BookX className="mr-2 text-red-500" />
                    Caderno de Erros
                </h1>
                <p className="text-xs text-gray-500">{incorrectAnswers.length} questões para revisar</p>
            </div>
        </div>
      </div>

      {/* AI Action Area */}
      {incorrectQuestions.length > 0 && onGenerateFlashcards && (
          <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800">
              <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-200 max-w-[60%]">
                      Use a IA para transformar seus erros em cartões de estudo rápidos.
                  </p>
                  <button 
                    onClick={() => onGenerateFlashcards(incorrectQuestions)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-lg transition-all ${isGenerating ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                  >
                      {isGenerating ? (
                          <>Gerando...</>
                      ) : (
                          <><Zap size={14} className="mr-2" /> Gerar Flashcards</>
                      )}
                  </button>
              </div>
          </div>
      )}

      <div className="p-4 space-y-4">
        {incorrectAnswers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <p>Nenhum erro registrado ainda.</p>
                <p className="text-xs mt-2">Continue estudando para povoar seu caderno (ou não! 😉)</p>
            </div>
        ) : (
            incorrectAnswers.map((answer, index) => {
                const question = questions.find(q => q.id === answer.questionId);
                if (!question) return null;

                const selectedText = question.parsedAlternativas.find(a => a.letter === answer.selectedLetter)?.text;
                const correctText = question.parsedAlternativas.find(a => a.letter === answer.correctLetter)?.text;

                return (
                    <div key={`${answer.questionId}-${index}`} className="bg-[#252525] p-5 rounded-xl border border-red-900/30">
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-[10px] font-bold text-[#FFB800] uppercase tracking-wider bg-[#FFB800]/10 px-2 py-1 rounded">
                                {question.materia}
                            </span>
                            <span className="text-gray-500 text-xs">{question.banca} • {question.ano}</span>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-200 mb-4 line-clamp-3">
                            {question.enunciado}
                        </p>

                        <div className="space-y-2 text-xs">
                            <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
                                <span className="block text-red-400 font-bold mb-1">Você marcou ({answer.selectedLetter}):</span>
                                <span className="text-gray-300">{selectedText}</span>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 p-2 rounded-lg">
                                <span className="block text-green-400 font-bold mb-1">Correta ({answer.correctLetter}):</span>
                                <span className="text-gray-300">{correctText}</span>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default CadernoErrosView;
