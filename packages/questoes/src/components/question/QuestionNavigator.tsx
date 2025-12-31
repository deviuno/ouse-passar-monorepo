import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Map<number, { letter: string; correct: boolean }>; // questionId -> answer
  questionIds: number[]; // Array de IDs das questões na ordem
  onNavigate: (index: number) => void;
  disabled?: boolean;
  studyMode?: 'zen' | 'hard'; // Modo de estudo - só exibe no modo zen
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onNavigate,
  disabled = false,
  studyMode = 'zen',
}: QuestionNavigatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll para manter a questão atual visível
  useEffect(() => {
    if (currentButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = currentButtonRef.current;

      // Calcula a posição para centralizar o botão atual
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;

      // Centraliza o botão no container
      const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

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

  // Não exibe no modo hard (simulado)
  if (studyMode === 'hard') {
    return null;
  }

  return (
    <div
      className="py-1 -mx-4"
      style={{ width: 'calc(100% + 2rem)' }}
    >
      {/* Container com scroll horizontal e swipe */}
      <div
        ref={scrollContainerRef}
        className="flex items-center overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          gap: '5px',
          paddingLeft: '12px',
        }}
      >
        {Array.from({ length: totalQuestions }, (_, index) => {
          const answered = isAnswered(index);
          const correct = isCorrect(index);
          const isCurrent = index === currentIndex;
          const clickable = isClickable(index);

          return (
            <motion.button
              key={index}
              ref={isCurrent ? currentButtonRef : null}
              onClick={() => clickable && onNavigate(index)}
              disabled={!clickable}
              className={`
                relative flex items-center justify-center flex-shrink-0
                w-6 h-6 min-w-6 min-h-6 aspect-square rounded-full text-[10px] font-normal
                transition-all duration-200
                ${
                  isCurrent
                    ? 'bg-[#3D3520] text-[#D4A84B] border border-[#5C4F2A]'
                    : answered
                    ? correct
                      ? 'bg-[#1E3A2F] text-[#6EBF8B] border border-[#2D4F3E]'
                      : 'bg-[#3A2020] text-[#D88888] border border-[#4F2D2D]'
                    : 'bg-[#252525] text-[#6E6E6E] border border-[#333333]'
                }
                ${
                  clickable && !isCurrent
                    ? 'hover:scale-105 cursor-pointer'
                    : !clickable
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }
              `}
              whileHover={clickable && !isCurrent ? { scale: 1.05 } : undefined}
              whileTap={clickable ? { scale: 0.95 } : undefined}
              title={
                answered
                  ? `Questão ${index + 1} - ${correct ? 'Correta' : 'Incorreta'}`
                  : `Questão ${index + 1}`
              }
            >
              <span>{index + 1}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionNavigator;
