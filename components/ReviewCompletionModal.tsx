import React, { useState, useEffect } from 'react';
import { BrainCircuit, CheckCircle, XCircle, Home, Trophy, Flame, Calendar } from 'lucide-react';
import { UserAnswer, ParsedQuestion } from '../types';

interface ReviewCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  answers: UserAnswer[];
  questions: ParsedQuestion[];
  nextReviewCount: number;
}

const ReviewCompletionModal: React.FC<ReviewCompletionModalProps> = ({
  isOpen,
  onClose,
  answers,
  questions,
  nextReviewCount,
}) => {
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

  const total = answers.length;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const incorrectCount = total - correctCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isPerfect = percentage === 100;
  const isGood = percentage >= 70;

  // Get incorrect questions for display
  const incorrectQuestions = questions.filter(q => {
    const answer = answers.find(a => a.questionId === q.id);
    return answer && !answer.isCorrect;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm bg-[#1A1A1A] rounded-3xl border ${isPerfect ? 'border-green-500/30' : isGood ? 'border-blue-500/30' : 'border-orange-500/30'} shadow-2xl overflow-hidden transition-all duration-500 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`p-6 text-center ${isPerfect ? 'bg-gradient-to-b from-green-900/30 to-transparent' : isGood ? 'bg-gradient-to-b from-blue-900/30 to-transparent' : 'bg-gradient-to-b from-orange-900/30 to-transparent'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${isPerfect ? 'bg-green-500/20 border-green-500 text-green-400' : isGood ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>
            {isPerfect ? (
              <Trophy size={40} />
            ) : (
              <BrainCircuit size={40} />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {isPerfect ? 'Revisao Perfeita!' : isGood ? 'Bom Trabalho!' : 'Continue Praticando!'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isPerfect
              ? 'Voce dominou todas as questoes!'
              : isGood
              ? 'Seu conhecimento esta se consolidando.'
              : 'A repeticao e a chave do sucesso.'}
          </p>
        </div>

        {/* Stats */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#252525] p-3 rounded-xl text-center border border-gray-800">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-[10px] text-gray-500 uppercase">Revisadas</div>
            </div>
            <div className="bg-[#252525] p-3 rounded-xl text-center border border-green-900/30">
              <div className="text-2xl font-bold text-green-400">{correctCount}</div>
              <div className="text-[10px] text-gray-500 uppercase">Acertos</div>
            </div>
            <div className="bg-[#252525] p-3 rounded-xl text-center border border-red-900/30">
              <div className="text-2xl font-bold text-red-400">{incorrectCount}</div>
              <div className="text-[10px] text-gray-500 uppercase">Erros</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Taxa de Acerto</span>
              <span className={`font-bold ${isGood ? 'text-green-400' : 'text-orange-400'}`}>{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isGood ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* SRS Feedback */}
          <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 mb-4">
            <div className="flex items-start space-x-3">
              <Calendar className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Proxima Revisao</h4>
                {incorrectCount > 0 ? (
                  <p className="text-xs text-gray-400">
                    <span className="text-orange-400 font-bold">{incorrectCount} questoes</span> serao revisadas novamente em breve para fixar o conteudo.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    <span className="text-green-400 font-bold">Todas as questoes</span> foram dominadas! O intervalo de revisao aumentara.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Incorrect Questions Preview */}
          {incorrectQuestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Para Revisar Novamente</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                {incorrectQuestions.slice(0, 3).map((q, idx) => (
                  <div key={q.id} className="bg-[#252525] p-2 rounded-lg border border-red-900/20 flex items-start space-x-2">
                    <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400 line-clamp-2">{q.enunciado}</p>
                  </div>
                ))}
                {incorrectQuestions.length > 3 && (
                  <p className="text-xs text-gray-600 text-center">
                    +{incorrectQuestions.length - 3} outras questoes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Next Review Info */}
          {nextReviewCount > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 bg-blue-900/20 py-2 px-4 rounded-lg border border-blue-900/30">
              <Flame size={16} className="text-orange-500" />
              <span>
                <strong className="text-white">{nextReviewCount}</strong> questoes pendentes para hoje
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 mt-auto">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition-all ${isPerfect ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            <Home size={18} className="mr-2" />
            Voltar ao Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCompletionModal;
