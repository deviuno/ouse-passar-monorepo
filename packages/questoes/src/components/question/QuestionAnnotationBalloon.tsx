import React, { useState, useEffect } from 'react';
import { BookMarked, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestionAnnotations, GoldenAnnotation } from '../../services/goldenNotebookService';

interface AnnotationWithNotebook extends GoldenAnnotation {
  caderno_nome: string;
}

interface QuestionAnnotationBalloonProps {
  questionId: number;
  userId: string | null;
}

export const QuestionAnnotationBalloon: React.FC<QuestionAnnotationBalloonProps> = ({
  questionId,
  userId,
}) => {
  const [annotations, setAnnotations] = useState<AnnotationWithNotebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!userId || !questionId) {
      setAnnotations([]);
      return;
    }

    const fetchAnnotations = async () => {
      setLoading(true);
      try {
        const data = await getQuestionAnnotations(userId, questionId);
        setAnnotations(data);
      } catch (error) {
        console.error('[QuestionAnnotationBalloon] Erro ao buscar anotações:', error);
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnotations();
  }, [userId, questionId]);

  // Don't render anything if no annotations or loading
  if (loading || annotations.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {annotations.map((annotation) => (
        <motion.div
          key={annotation.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Arrow pointing up - indicates comment is about content above */}
          <div className="absolute -top-2 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-amber-500/40" />

          {/* Balloon container - simplified design */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl">
            {/* Header - always visible */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-amber-500">
                  Sua anotação
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {annotation.caderno_nome}
                </span>
                {expanded ? (
                  <ChevronUp size={16} className="text-amber-500/70" />
                ) : (
                  <ChevronDown size={16} className="text-amber-500/70" />
                )}
              </div>
            </button>

            {/* Content - expandable, text directly in balloon */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-[var(--color-text-main)] whitespace-pre-wrap leading-relaxed">
                      {annotation.conteudo}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuestionAnnotationBalloon;
