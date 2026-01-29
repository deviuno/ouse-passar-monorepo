import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ParsedQuestion, CommunityStats, PracticeMode } from "../../types";
import { COLORS, MOCK_STATS } from "../../constants";
import {
  AlertTriangle,
  BarChart2,
  Timer,
  Coffee,
  Zap,
  BrainCircuit,
  Star,
  ChevronLeft,
  ChevronRight,
  Flag,
  Gem,
  Pencil,
} from "lucide-react";
import {
  getQuestionStatistics,
  QuestionStatistics,
} from "../../services/questionFeedbackService";
import CommentsSection from "./CommentsSection";
import { ReportQuestionModal } from "./ReportQuestionModal";
import { QuestionStatsModal } from "./QuestionStatsModal";
import { PegadinhaModal } from "./PegadinhaModal";
import { QuestionFeedbackTabs } from "./QuestionFeedbackTabs";
import {
  PageHelpButton,
  questionFeedbackTourConfig,
  questionFeedbackSteps,
} from "../tour";
import RippleEffect from "../ui/RippleEffect";
import { validateQuestion } from "../../utils/questionValidator";
import CorruptedQuestionCard from "./CorruptedQuestionCard";
import { getOptimizedImageUrl } from "../../utils/image";
import { QuestionAnnotationBalloon } from "./QuestionAnnotationBalloon";

interface QuestionCardProps {
  question: ParsedQuestion;
  isLastQuestion: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  onOpenTutor: () => void;
  onAnswer: (letter: string, clickX?: number, clickY?: number) => void;
  onRateDifficulty?: (difficulty: "easy" | "medium" | "hard") => void;
  onTimeout?: () => void;
  studyMode?: PracticeMode;
  initialTime?: number; // Duration in minutes for Simulado mode
  userId?: string | null; // Para o sistema de comentários
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  savedDifficultyRating?: "easy" | "medium" | "hard" | null; // User's previous rating
  userRole?: "admin" | "user";
  showCorrectAnswers?: boolean; // When true, shows star on correct answer (admin or user with permission)
  previousAnswer?: { letter: string; correct: boolean } | null; // Resposta anterior (modo read-only)
  onEditTimer?: () => void; // Callback to edit timer duration in simulado mode
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isLastQuestion,
  onNext,
  onPrevious,
  onOpenTutor,
  onAnswer,
  onRateDifficulty,
  onTimeout,
  studyMode = "zen",
  initialTime = 120,
  userId,
  onShowToast,
  savedDifficultyRating,
  userRole,
  showCorrectAnswers = false,
  previousAnswer = null,
  onEditTimer,
}) => {
  // ============================================
  // ALL HOOKS MUST BE CALLED FIRST (before any conditional returns)
  // This is required by React's Rules of Hooks
  // ============================================

  // Estado do modal de report
  const [showReportModal, setShowReportModal] = useState(false);

  // Se tem resposta anterior, inicia com ela selecionada e submetida (modo read-only)
  const [selectedAlt, setSelectedAlt] = useState<string | null>(
    previousAnswer?.letter || null
  );
  const [isSubmitted, setIsSubmitted] = useState(!!previousAnswer);
  const isReadOnly = !!previousAnswer; // Questão já respondida, não pode alterar
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // New States
  const [difficultyRating, setDifficultyRating] = useState<
    "easy" | "medium" | "hard" | null
  >(savedDifficultyRating || null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPegadinhaModal, setShowPegadinhaModal] = useState(false);

  // Statistics state
  const [questionStats, setQuestionStats] = useState<QuestionStatistics | null>(
    null
  );
  const [loadingStats, setLoadingStats] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(initialTime * 60); // in seconds
  const timeoutCalledRef = useRef(false); // Prevent multiple timeout calls

  // Ref para os botões de navegação principais
  const navigationButtonsRef = useRef<HTMLDivElement>(null);

  // Ref para o botão de responder
  const submitButtonRef = useRef<HTMLDivElement>(null);

  // Validar questão
  const questionValidation = useMemo(() => {
    try {
      return validateQuestion({
        enunciado: question?.enunciado,
        parsedAlternativas: question?.parsedAlternativas,
        gabarito: question?.gabarito,
      });
    } catch (error) {
      console.error("[QuestionCard] Erro ao validar questão:", error);
      return {
        isValid: false,
        isCorrupted: true,
        errors: ["Erro ao validar questão"],
        warnings: [],
      };
    }
  }, [question?.id, question?.enunciado, question?.parsedAlternativas, question?.gabarito]);

  // Reset state when question changes
  useEffect(() => {
    // Se tem resposta anterior, usar ela
    if (previousAnswer) {
      setSelectedAlt(previousAnswer.letter);
      setIsSubmitted(true);
      // Carregar explicação se disponível
      if (question.comentario) {
        setExplanation(question.comentario);
      }
    } else {
      setSelectedAlt(null);
      setIsSubmitted(false);
      setExplanation(null);
    }
    setDifficultyRating(savedDifficultyRating || null);
    setShowStatsModal(false);
    setShowPegadinhaModal(false);
    setShowReportModal(false);
    setQuestionStats(null);
  }, [question.id, savedDifficultyRating, previousAnswer]);

  // Fetch statistics when question is answered
  useEffect(() => {
    if (isSubmitted && !questionStats && !loadingStats) {
      setLoadingStats(true);
      getQuestionStatistics(question.id).then((stats) => {
        setQuestionStats(stats);
        setLoadingStats(false);
      });
    }
  }, [isSubmitted, question.id, questionStats, loadingStats]);

  // Reset timer when initialTime changes (e.g., user changes timer preference)
  useEffect(() => {
    if (studyMode === "hard") {
      setTimeLeft(initialTime * 60);
      timeoutCalledRef.current = false; // Reset the timeout flag when timer resets
    }
  }, [initialTime, studyMode]);

  // Timer Effect
  useEffect(() => {
    if (studyMode === "hard") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [studyMode]);

  // Handle timeout when timer reaches 0
  useEffect(() => {
    if (studyMode === "hard" && timeLeft === 0 && onTimeout && !timeoutCalledRef.current) {
      timeoutCalledRef.current = true;
      // Use setTimeout to ensure this runs outside of React's render cycle
      setTimeout(() => {
        onTimeout();
      }, 0);
    }
  }, [studyMode, timeLeft, onTimeout]);

  // Scroll para os botões de navegação após submissão (apenas se não estiverem visíveis)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isSubmitted && navigationButtonsRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado com o feedback
      timeoutId = setTimeout(() => {
        if (navigationButtonsRef.current) {
          const element = navigationButtonsRef.current;
          const rect = element.getBoundingClientRect();
          const viewportHeight =
            window.innerHeight || document.documentElement.clientHeight;
          const bottomMenuHeight = 80; // Altura do menu fixo do rodapé

          // Verifica se o elemento está visível (considerando o menu do rodapé)
          const isVisible =
            rect.top >= 0 && rect.bottom <= viewportHeight - bottomMenuHeight;

          // Só rola se não estiver visível
          if (!isVisible) {
            const absoluteElementTop = rect.top + window.pageYOffset;
            const offset = rect.height + bottomMenuHeight;
            const targetScroll =
              absoluteElementTop - viewportHeight + offset + 20;

            // Só rola se for para cima (revelar conteúdo abaixo), nunca para baixo
            if (targetScroll > window.pageYOffset) {
              window.scrollTo({
                top: targetScroll,
                behavior: "smooth",
              });
            }
          }
        }
      }, 100);
    }

    // Cleanup timeout when question changes or component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSubmitted, question.id]);

  // ============================================
  // CONDITIONAL RETURN - After all hooks
  // ============================================

  // Se a questão está corrompida ou inválida, mostrar card de erro
  if (!questionValidation.isValid || questionValidation.isCorrupted) {
    return (
      <>
        <CorruptedQuestionCard
          questionId={question?.id || 0}
          onSkip={onNext}
          onReport={() => setShowReportModal(true)}
          errors={questionValidation.errors}
        />
        {showReportModal && (
          <ReportQuestionModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            questionId={question?.id || 0}
            questionInfo={{
              materia: question?.materia,
              assunto: question?.assunto,
              banca: question?.banca,
              ano: question?.ano,
            }}
          />
        )}
      </>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSelect = (letter: string) => {
    if (isSubmitted || isReadOnly) return;
    setSelectedAlt(letter);

    // Scroll suave para mostrar o botão de responder (com offset para o menu fixo do rodapé)
    setTimeout(() => {
      if (submitButtonRef.current) {
        const element = submitButtonRef.current;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const bottomMenuHeight = 80; // Altura aproximada do menu fixo
        const offset = elementRect.height + bottomMenuHeight;

        const targetScroll =
          absoluteElementTop - window.innerHeight + offset + 20;

        // Só rola se for para cima (revelar conteúdo abaixo), nunca para baixo
        if (targetScroll > window.pageYOffset) {
          window.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }
      }
    }, 100);
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (!selectedAlt) return;

    // Extract click coordinates for battery toast
    const clickX = e?.clientX;
    const clickY = e?.clientY;

    // Notify parent about the answer
    onAnswer(selectedAlt, clickX, clickY);

    // If Mode is Simulado (Hard), we do NOT show feedback. We move to next.
    if (studyMode === "hard") {
      // Just move to next (or finish if last)
      onNext();
      return;
    }

    // For Zen/Reta Final, show feedback
    setIsSubmitted(true);

    // Load explanation from database comentario field
    if (question.comentario) {
      setExplanation(question.comentario);
    } else {
      setExplanation(null);
    }
  };

  const handleRate = (diff: "easy" | "medium" | "hard") => {
    setDifficultyRating(diff);
    if (onRateDifficulty) {
      onRateDifficulty(diff);
    }
  };

  const getOptionStyle = (
    letter: string
  ): { className: string; style?: React.CSSProperties } => {
    // Basic Selection Style
    if (!isSubmitted) {
      return {
        className:
          selectedAlt === letter
            ? `border-[var(--color-brand)] bg-gradient-to-br from-[var(--color-brand)]/10 via-transparent to-[var(--color-brand)]/5 text-[var(--color-text-main)] backdrop-blur-sm`
            : `border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-main)]`,
      };
    }

    // Feedback Style - Apenas a alternativa selecionada pelo usuário recebe a borda colorida
    // Acertou: borda verde #059669 | Errou: borda vermelha #dc2626
    if (selectedAlt === letter) {
      if (letter === question.gabarito) {
        // Usuário acertou - borda verde
        return {
          className: "font-bold",
          style: {
            borderColor: "#059669",
            borderWidth: "3px",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
          },
        };
      } else {
        // Usuário errou - borda vermelha
        return {
          className: "font-bold",
          style: {
            borderColor: "#dc2626",
            borderWidth: "3px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
          },
        };
      }
    }

    // Mostrar resposta correta quando usuário errou (destaque mais sutil)
    if (letter === question.gabarito && selectedAlt !== letter) {
      return {
        className: "",
        style: {
          borderColor: "#059669",
          backgroundColor: "rgba(5, 150, 105, 0.05)",
        },
      };
    }

    return { className: "border-[var(--color-border)] opacity-40" };
  };

  // Build stats data from real statistics or use fallback
  const buildStatsData = () => {
    const alternatives = question.parsedAlternativas.map((a) => a.letter);

    if (questionStats && questionStats.totalAnswers > 0) {
      return alternatives.map((alt) => ({
        alternative: alt,
        percentage: questionStats.alternativeDistribution[alt] || 0,
      }));
    }

    // Fallback to MOCK_STATS if no real data
    return MOCK_STATS["default"];
  };

  const currentStats = buildStatsData();

  // Função para converter URLs de imagem em markdown antes de renderizar
  const preprocessImageUrls = (text: string, imagensEnunciado?: string | null): string => {
    if (!text) return "";

    let processed = text;

    // Primeiro: substituir placeholders por URLs reais do campo imagens_enunciado
    if (imagensEnunciado) {
      // Extrair URLs do campo imagens_enunciado (formato: {url1,url2} ou {url})
      const urlMatches = imagensEnunciado.match(/https?:\/\/[^\s,}]+/g);
      if (urlMatches && urlMatches.length > 0) {
        // Substituir placeholder "URL_DA_IMAGEM_AQUI" pela primeira URL real
        processed = processed.replace(
          /!\[([^\]]*)\]\(URL_DA_IMAGEM_AQUI\)/gi,
          `![Imagem](${urlMatches[0]})`
        );

        // Se houver múltiplas imagens e múltiplos placeholders, substituir sequencialmente
        let urlIndex = 0;
        processed = processed.replace(
          /!\[([^\]]*)\]\(URL_DA_IMAGEM_AQUI\)/gi,
          () => {
            const url = urlMatches[urlIndex] || urlMatches[0];
            urlIndex++;
            return `![Imagem](${url})`;
          }
        );
      }
    }

    // Padrão 0: Corrigir markdown de link que deveria ser imagem [Imagem](url) -> ![Imagem](url)
    processed = processed.replace(
      /(?<!!)\[Imagem[^\]]*\]\((https?:\/\/[^)]+)\)/gi,
      "\n\n![Imagem]($1)\n\n"
    );

    // Padrão 1: "Disponível em: URL. Acesso em: ..." com extensão de imagem
    processed = processed.replace(
      /Disponível em:\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))[^\n]*/gi,
      "\n\n![Imagem da questão]($1)\n\n"
    );

    // Padrão 2: "Disponível em: URL" para CDNs conhecidos (tecconcursos, etc)
    processed = processed.replace(
      /Disponível em:\s*(https?:\/\/cdn\.tecconcursos\.com\.br\/[^\s\)]+)[^\n]*/gi,
      "\n\n![Imagem da questão]($1)\n\n"
    );

    // Padrão 3: URLs diretas de imagem com extensão (não já em formato markdown)
    processed = processed.replace(
      /(?<!\]\()(?<!\!)\b(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))\b(?!\))/gi,
      "\n\n![Imagem]($1)\n\n"
    );

    // Padrão 4: URLs do CDN TecConcursos (figuras sem extensão)
    processed = processed.replace(
      /(?<!\]\()(?<!\!)\b(https?:\/\/cdn\.tecconcursos\.com\.br\/figuras\/[^\s<>")\]]+)\b(?!\))/gi,
      "\n\n![Imagem]($1)\n\n"
    );

    // Padrão 5: Tags HTML <img src="...">
    processed = processed.replace(
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      "\n\n![Imagem]($1)\n\n"
    );

    return processed;
  };

  // Função para formatar texto com quebras de linha e negrito (legado)
  const formatText = (text: string) => {
    if (!text) return null;

    // Divide por quebras de linha e processa cada parte
    return text.split("\n").map((paragraph, idx) => {
      // Processa negrito **texto** ou __texto__
      const parts = paragraph.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={partIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("__") && part.endsWith("__")) {
          return (
            <strong key={partIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <p key={idx} className={idx > 0 ? "mt-3" : ""}>
          {formattedParts}
        </p>
      );
    });
  };

  const renderQuestionInfos = () => {
    const { banca, orgao, ano } = question;

    const parts = [];

    if (banca) parts.push(banca);
    if (ano) parts.push(ano);
    if (orgao) parts.push(orgao);

    return <h2 className="text-sm text-gray-400">{parts.join(" • ")}</h2>;
  };

  return (
    <div
      className="flex flex-col pb-24 px-3 md:px-4 pt-4 md:pt-6"
    >
      {/* Header Info */}
      <div className="mb-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col flex-1">
            <div className="flex items-center mb-1 flex-wrap gap-2">
              <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider">
                {question.materia}
              </span>

              {studyMode === "zen" && (
                <div className="flex items-center text-teal-400 text-[10px] bg-teal-900/20 px-2 py-0.5 rounded-full border border-teal-900/50">
                  <Coffee size={10} className="mr-1" /> ZEN
                </div>
              )}
              {studyMode === "hard" && (
                <div className="flex items-center text-red-500 text-[10px] bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50">
                  <Timer size={10} className="mr-1" /> SIMULADO
                </div>
              )}
              {studyMode === "reta_final" && (
                <div className="flex items-center text-purple-500 text-[10px] bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-900/50">
                  <Zap size={10} className="mr-1" /> RETA FINAL
                </div>
              )}
              {studyMode === "review" && (
                <div className="flex items-center text-blue-400 text-[10px] bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-900/50">
                  <BrainCircuit size={10} className="mr-1" /> REVISÃO
                </div>
              )}
              {question.isAiGenerated && (
                <div className="flex items-center text-[10px] px-2 py-0.5 rounded-full border text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700/50">
                  <Gem size={10} className="mr-1" /> INÉDITA
                </div>
              )}
            </div>
            {question.assunto && (
              <p className="text-xs text-[var(--color-text-sec)] mb-1">
                {question.assunto}
              </p>
            )}
            {renderQuestionInfos()}
          </div>

          {/* Countdown Timer (Only for Simulado Mode) */}
          {studyMode === "hard" && (
            <>
              <div
                className={`group relative flex items-center ml-2 rounded-lg transition-all duration-200 ${
                  timeLeft <= 30
                    ? 'bg-red-500/10'
                    : 'bg-[var(--color-bg-elevated)]'
                }`}
                style={timeLeft <= 30 ? {
                  animation: 'urgentPulse 0.6s ease-in-out infinite',
                } : undefined}
              >
                {/* Timer display */}
                <div
                  className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 transition-all duration-200 ${
                    onEditTimer ? 'group-hover:pr-1' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors duration-200 ${
                      timeLeft <= 30
                        ? 'bg-red-500/20'
                        : 'bg-red-500/10'
                    }`}
                  >
                    <Timer
                      size={12}
                      className={`transition-colors duration-200 ${
                        timeLeft <= 30 ? 'text-red-400' : 'text-red-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`font-mono font-semibold text-sm tabular-nums tracking-tight transition-colors duration-200 ${
                      timeLeft <= 30 ? 'text-red-400' : 'text-red-500'
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Edit button - integrated, reveals on hover */}
                {onEditTimer && (
                  <button
                    onClick={onEditTimer}
                    className="flex items-center justify-center w-0 overflow-hidden opacity-0 group-hover:w-7 group-hover:opacity-100 h-full pr-1.5 transition-all duration-200 ease-out"
                    title="Configurar tempo"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors duration-150">
                      <Pencil size={10} />
                    </div>
                  </button>
                )}

                {/* Subtle border */}
                <div
                  className={`absolute inset-0 rounded-lg border pointer-events-none transition-colors duration-200 ${
                    timeLeft <= 30
                      ? 'border-red-500/40'
                      : 'border-[var(--color-border)]'
                  }`}
                />
              </div>

              {/* Urgent timer animation keyframes */}
              {timeLeft <= 30 && (
                <style>{`
                  @keyframes urgentPulse {
                    0%, 100% {
                      opacity: 1;
                      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
                    }
                    50% {
                      opacity: 0.85;
                      box-shadow: 0 0 12px 2px rgba(239, 68, 68, 0.3);
                    }
                  }
                `}</style>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enunciado */}
      <div className="text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-medium text-[var(--color-text-main)] prose prose-sm max-w-none [&_strong]:text-[var(--color-text-main)] [&_p]:text-[var(--color-text-main)] [&_li]:text-[var(--color-text-main)]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="mb-3 leading-relaxed text-[var(--color-text-main)]">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-[var(--color-text-main)]">
                {children}
              </strong>
            ),
            img: ({ src, alt }) => (
              <img
                src={getOptimizedImageUrl(src, 800, 85)}
                alt={alt || "Imagem da questão"}
                className="max-w-full h-auto rounded-lg my-3 border border-[var(--color-border)]"
                loading="lazy"
              />
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-light)]"
              >
                {children}
              </a>
            ),
          }}
        >
          {preprocessImageUrls(question.enunciado || "", question.imagens_enunciado)}
        </ReactMarkdown>
      </div>

      {/* User Annotation Balloon - only shows after answering in zen mode */}
      {userId && isSubmitted && studyMode === "zen" && (
        <QuestionAnnotationBalloon
          questionId={question.id}
          userId={userId}
        />
      )}

      {/* Alternatives */}
      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        {question.parsedAlternativas.map((alt) => {
          const optionStyle = getOptionStyle(alt.letter);
          return (
            <button
              key={alt.letter}
              onClick={() => handleSelect(alt.letter)}
              className={`w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start group relative ${optionStyle.className}`}
              style={optionStyle.style}
              disabled={isSubmitted}
            >
              <span
                className={`font-bold mr-2 md:mr-3 w-5 md:w-6 shrink-0 text-sm md:text-base ${
                  isSubmitted && alt.letter === question.gabarito
                    ? "text-[#059669]"
                    : isSubmitted &&
                      selectedAlt === alt.letter &&
                      alt.letter !== question.gabarito
                    ? "text-[#DC2626]"
                    : ""
                }`}
              >
                {alt.letter}
              </span>
              <span className="text-xs md:text-sm flex-1">{alt.text}</span>
              {(userRole === "admin" || showCorrectAnswers) &&
                alt.letter === question.gabarito &&
                !isSubmitted && (
                  <div
                    className="absolute top-2 right-2 text-[#FFB800]"
                    title={
                      userRole === "admin"
                        ? "Gabarito (Visível apenas para Admin)"
                        : "Resposta correta"
                    }
                  >
                    <Star size={16} fill="#FFB800" />
                  </div>
                )}
            </button>
          );
        })}
      </div>

      {/* Actions / Feedback Area */}
      <div className="mt-auto" ref={submitButtonRef}>
        {!isSubmitted ? (
          <RippleEffect className="w-full rounded-full">
            <button
              onClick={(e) => handleSubmit(e)}
              disabled={!selectedAlt}
              className={`w-full py-4 rounded-full font-bold uppercase tracking-wide transition-all touch-feedback ${
                selectedAlt
                  ? "bg-[#ffac00] hover:bg-[#ffbc33] text-black shadow-[0_0_15px_rgba(255,172,0,0.4)]"
                  : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed opacity-70"
              }`}
            >
              {studyMode === "hard"
                ? isLastQuestion
                  ? "Finalizar Simulado"
                  : "Confirmar Resposta"
                : "Responder"}
            </button>
          </RippleEffect>
        ) : (
          <div className="animate-fade-in-up">
            {/* 1. Top Buttons Row: Stats & Difficulty */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => handleRate("easy")}
                className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                  difficultyRating === "easy"
                    ? "bg-[var(--color-success)]/20 border-[var(--color-success)] text-[var(--color-success)]"
                    : "border-[var(--color-border-strong)] text-[var(--color-text-sec)] hover:bg-[var(--color-bg-elevated)]"
                }`}
              >
                Fácil
              </button>
              <button
                onClick={() => handleRate("medium")}
                className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                  difficultyRating === "medium"
                    ? "bg-[var(--color-warning)]/20 border-[var(--color-warning)] text-[var(--color-warning)]"
                    : "border-[var(--color-border-strong)] text-[var(--color-text-sec)] hover:bg-[var(--color-bg-elevated)]"
                }`}
              >
                Médio
              </button>
              <button
                onClick={() => handleRate("hard")}
                className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                  difficultyRating === "hard"
                    ? "bg-[var(--color-error)]/20 border-[var(--color-error)] text-[var(--color-error)]"
                    : "border-[var(--color-border-strong)] text-[var(--color-text-sec)] hover:bg-[var(--color-bg-elevated)]"
                }`}
              >
                Difícil
              </button>
              <button
                onClick={() => setShowStatsModal(true)}
                className="p-2 rounded-lg text-xs font-bold border border-[var(--color-border-strong)] text-[var(--color-brand)] hover:bg-[var(--color-bg-elevated)] flex flex-col items-center justify-center transition-colors"
              >
                <BarChart2 size={16} />
              </button>
            </div>

            {/* 2. Navigation Row: Previous / Next Highlighted */}
            <div ref={navigationButtonsRef} className="flex gap-3 mb-4">
              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className={`w-full flex items-center justify-center py-3 rounded-xl border-2 font-bold transition-all touch-feedback ${
                    onPrevious
                      ? "border-[var(--color-border-strong)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] bg-[var(--color-bg-card)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed bg-[var(--color-bg-elevated)]"
                  }`}
                >
                  <ChevronLeft size={20} className="mr-1" /> Anterior
                </button>
              </RippleEffect>

              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={() => {
                    console.log(
                      "[QuestionCard] Botão Próxima/Finalizar clicado (nav)",
                      { isLastQuestion }
                    );
                    // Scroll both window and any scrollable container
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    document.querySelector(".lg\\:overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
                    onNext();
                  }}
                  className="w-full flex items-center justify-center py-3 bg-[#ffac00] hover:bg-[#ffbc33] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(255,172,0,0.3)] hover:shadow-[0_0_25px_rgba(255,172,0,0.5)] transition-all border-2 border-[#ffac00] hover:border-[#ffbc33] touch-feedback"
                >
                  {isLastQuestion ? "Finalizar" : "Próxima"}{" "}
                  <ChevronRight size={20} className="ml-1" />
                </button>
              </RippleEffect>
            </div>

            {/* 3. Feedback Tabs Section */}
            <QuestionFeedbackTabs
              question={question}
              explanation={explanation}
              loadingExplanation={loadingExplanation}
              questionStats={questionStats}
              userId={userId || null}
              onShowToast={onShowToast}
              selectedAlt={selectedAlt}
              isCorrect={selectedAlt === question.gabarito}
            />

            {/* 4. Bottom Navigation Row: Previous / Next (duplicate for convenience) */}
            <div className="flex gap-3 mt-4">
              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className={`w-full flex items-center justify-center py-3 rounded-xl border-2 font-bold transition-all touch-feedback ${
                    onPrevious
                      ? "border-[var(--color-border-strong)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] bg-[var(--color-bg-card)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed bg-[var(--color-bg-elevated)]"
                  }`}
                >
                  <ChevronLeft size={20} className="mr-1" /> Anterior
                </button>
              </RippleEffect>

              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={() => {
                    // Scroll both window and any scrollable container
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    document.querySelector(".lg\\:overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
                    onNext();
                  }}
                  className="w-full flex items-center justify-center py-3 bg-[#ffac00] hover:bg-[#ffbc33] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(255,172,0,0.3)] hover:shadow-[0_0_25px_rgba(255,172,0,0.5)] transition-all border-2 border-[#ffac00] hover:border-[#ffbc33] touch-feedback"
                >
                  {isLastQuestion ? "Finalizar" : "Próxima"}{" "}
                  <ChevronRight size={20} className="ml-1" />
                </button>
              </RippleEffect>
            </div>
          </div>
        )}
      </div>

      {/* Stats Modal Popup */}
      <QuestionStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={currentStats}
        gabarito={question.gabarito}
        selectedAlt={selectedAlt}
        questionStats={questionStats}
      />

      {/* Pegadinha Explanation Modal */}
      <PegadinhaModal
        isOpen={showPegadinhaModal}
        onClose={() => setShowPegadinhaModal(false)}
        explicacao={question.explicacaoPegadinha}
      />

      {/* Report Question Modal */}
      <ReportQuestionModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        questionId={question.id}
        questionInfo={{
          materia: question.materia,
          assunto: question.assunto,
          banca: question.banca,
          ano: question.ano,
        }}
        onSuccess={() => {
          onShowToast?.("Report enviado com sucesso!", "success");
        }}
      />

      {/* Contextual Tour for Feedback - shown after user answers */}
      {isSubmitted && !isReadOnly && (
        <PageHelpButton
          tourId={questionFeedbackTourConfig.tourId}
          title={questionFeedbackTourConfig.title}
          description={questionFeedbackTourConfig.description}
          features={questionFeedbackTourConfig.features}
          steps={questionFeedbackSteps}
          autoStartOnFirstVisit={true}
          pageIsReady={isSubmitted}
        />
      )}
    </div>
  );
};

export default QuestionCard;
