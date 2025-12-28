import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Map<number, { letter: string; correct: boolean }>; // questionId -> answer
  questionIds: number[]; // Array de IDs das questões na ordem
  onNavigate: (index: number) => void;
  disabled?: boolean;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onNavigate,
  disabled = false,
}: QuestionNavigatorProps) {
  // Verifica se uma questão (por índice) foi respondida
  const isAnswered = (index: number): boolean => {
    const questionId = questionIds[index];
    return questionId !== undefined && answers.has(questionId);
  };

  // Verifica se a resposta está correta
  const isCorrect = (index: number): boolean | null => {
    const questionId = questionIds[index];
    if (questionId === undefined) return null;
    const answer = answers.get(questionId);
    return answer?.correct ?? null;
  };

  // Determina se o item é clicável (apenas questões já respondidas ou a atual)
  const isClickable = (index: number): boolean => {
    if (disabled) return false;
    // Pode clicar em qualquer questão já respondida ou na atual
    return isAnswered(index) || index === currentIndex;
  };

  return (
    <div className="w-full py-3 px-2">
      {/* Container com scroll horizontal se necessário */}
      <div className="flex items-center justify-center gap-1 flex-wrap max-w-full">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const answered = isAnswered(index);
          const correct = isCorrect(index);
          const isCurrent = index === currentIndex;
          const clickable = isClickable(index);

          return (
            <motion.button
              key={index}
              onClick={() => clickable && onNavigate(index)}
              disabled={!clickable}
              className={`
                relative flex items-center justify-center
                w-8 h-8 rounded-full text-xs font-bold
                transition-all duration-200
                ${
                  isCurrent
                    ? 'bg-brand-yellow text-brand-darker ring-2 ring-brand-yellow ring-offset-2 ring-offset-[#1A1A1A]'
                    : answered
                    ? correct
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-[#2A2A2A] text-gray-500 border border-[#3A3A3A]'
                }
                ${
                  clickable && !isCurrent
                    ? 'hover:scale-110 cursor-pointer'
                    : !clickable
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }
              `}
              whileHover={clickable && !isCurrent ? { scale: 1.1 } : undefined}
              whileTap={clickable ? { scale: 0.95 } : undefined}
              title={
                answered
                  ? `Questão ${index + 1} - ${correct ? 'Correta' : 'Incorreta'}`
                  : `Questão ${index + 1}`
              }
            >
              {answered ? (
                correct ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )
              ) : (
                <span>{index + 1}</span>
              )}

              {/* Indicador de questão atual */}
              {isCurrent && (
                <motion.div
                  className="absolute -bottom-1 w-1 h-1 bg-brand-yellow rounded-full"
                  layoutId="currentIndicator"
                />
              )}
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}

export default QuestionNavigator;
