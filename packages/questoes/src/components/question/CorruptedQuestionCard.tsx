import React, { useEffect, useRef } from 'react';
import { AlertTriangle, SkipForward, Flag, Loader2 } from 'lucide-react';

interface CorruptedQuestionCardProps {
  questionId: number;
  onSkip: () => void;
  onReport?: () => void;
  errors?: string[];
  autoSkip?: boolean;
  autoSkipDelay?: number;
}

/**
 * Card exibido quando uma questão está corrompida e não pode ser mostrada
 */
const CorruptedQuestionCard: React.FC<CorruptedQuestionCardProps> = ({
  questionId,
  onSkip,
  onReport,
  errors = [],
  autoSkip = true,
  autoSkipDelay = 1500,
}) => {
  const hasSkipped = useRef(false);

  // Auto-skip corrupted questions
  useEffect(() => {
    if (!autoSkip || hasSkipped.current) return;

    const timer = setTimeout(() => {
      if (!hasSkipped.current) {
        hasSkipped.current = true;
        console.log(`[CorruptedQuestionCard] Auto-skipping question ${questionId}`);
        onSkip();
      }
    }, autoSkipDelay);

    return () => clearTimeout(timer);
  }, [questionId, onSkip, autoSkip, autoSkipDelay]);

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 md:p-8 border border-red-500/30 flex flex-col items-center justify-center min-h-[400px]">
      {/* Icon */}
      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-3">
        Questão indisponível
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-center mb-4 max-w-md">
        Esta questão possui problemas de formatação e não pode ser exibida no momento.
        {autoSkip && ' Pulando automaticamente...'}
      </p>

      {/* Auto-skip indicator */}
      {autoSkip && (
        <div className="flex items-center gap-2 text-sm text-[#FFB800] mb-4">
          <Loader2 size={16} className="animate-spin" />
          <span>Carregando próxima questão...</span>
        </div>
      )}

      {/* Question ID */}
      <div className="text-xs text-gray-500 mb-6">
        ID da questão: {questionId}
      </div>

      {/* Error details (collapsed by default) */}
      {errors.length > 0 && (
        <details className="w-full max-w-md mb-6">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Ver detalhes técnicos
          </summary>
          <ul className="mt-2 text-xs text-gray-600 bg-black/30 rounded-lg p-3">
            {errors.map((error, index) => (
              <li key={index} className="mb-1">• {error}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Actions - only show if not auto-skipping */}
      {!autoSkip && (
        <div className="flex gap-3">
          {onReport && (
            <button
              onClick={onReport}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              <Flag size={18} />
              Reportar problema
            </button>
          )}

          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFB800] hover:bg-[#FFC933] text-black font-bold rounded-xl transition-colors"
          >
            <SkipForward size={18} />
            Próxima questão
          </button>
        </div>
      )}
    </div>
  );
};

export default CorruptedQuestionCard;
