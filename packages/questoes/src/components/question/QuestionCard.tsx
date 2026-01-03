
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ParsedQuestion, CommunityStats, PracticeMode } from '../../types';
import { COLORS, MOCK_STATS } from '../../constants';
import { MessageCircle, AlertTriangle, BarChart2, X, Timer, Coffee, Zap, BrainCircuit, Star, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { generateExplanation } from '../../services/geminiService';
import { getQuestionStatistics, QuestionStatistics } from '../../services/questionFeedbackService';
import CommentsSection from './CommentsSection';
import { ReportQuestionModal } from './ReportQuestionModal';
import { useHorizontalSwipe } from '../../hooks/useSwipe';
import RippleEffect from '../ui/RippleEffect';

interface QuestionCardProps {
  question: ParsedQuestion;
  isLastQuestion: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  onOpenTutor: () => void;
  onAnswer: (letter: string, clickX?: number, clickY?: number) => void;
  onRateDifficulty?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onTimeout?: () => void;
  studyMode?: PracticeMode;
  initialTime?: number; // Duration in minutes for Simulado mode
  userId?: string | null; // Para o sistema de comentários
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  savedDifficultyRating?: 'easy' | 'medium' | 'hard' | null; // User's previous rating
  userRole?: 'admin' | 'user';
  showCorrectAnswers?: boolean; // When true, shows star on correct answer (admin or user with permission)
  previousAnswer?: { letter: string; correct: boolean } | null; // Resposta anterior (modo read-only)
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, isLastQuestion, onNext, onPrevious, onOpenTutor, onAnswer, onRateDifficulty, onTimeout, studyMode = 'zen', initialTime = 120, userId, onShowToast, savedDifficultyRating, userRole, showCorrectAnswers = false, previousAnswer = null }) => {
  // Se tem resposta anterior, inicia com ela selecionada e submetida (modo read-only)
  const [selectedAlt, setSelectedAlt] = useState<string | null>(previousAnswer?.letter || null);
  const [isSubmitted, setIsSubmitted] = useState(!!previousAnswer);
  const isReadOnly = !!previousAnswer; // Questão já respondida, não pode alterar
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // New States
  const [difficultyRating, setDifficultyRating] = useState<'easy' | 'medium' | 'hard' | null>(savedDifficultyRating || null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPegadinhaModal, setShowPegadinhaModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Statistics state
  const [questionStats, setQuestionStats] = useState<QuestionStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(initialTime * 60); // in seconds

  // Ref para os botões de navegação principais
  const navigationButtonsRef = useRef<HTMLDivElement>(null);

  // Ref para o botão de responder
  const submitButtonRef = useRef<HTMLDivElement>(null);

  // Swipe gestures para navegação mobile (apenas se já respondeu)
  const swipeHandlersRaw = useHorizontalSwipe(
    () => {
      // Swipe left = próxima questão
      if (isSubmitted) {
        onNext();
      }
    },
    () => {
      // Swipe right = questão anterior
      if (isSubmitted && onPrevious) {
        onPrevious();
      }
    }
  );

  // Extract only DOM-valid event handlers (remove isSwiping and swipeDirection to avoid React warnings)
  const { onTouchStart, onTouchMove, onTouchEnd } = swipeHandlersRaw;
  const swipeHandlers = { onTouchStart, onTouchMove, onTouchEnd };

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

  // Timer Effect
  useEffect(() => {
    if (studyMode === 'hard') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1 && onTimeout) {
            clearInterval(timer);
            onTimeout();
            return 0;
          }
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [studyMode, onTimeout]);

  // Scroll para os botões de navegação após submissão (apenas se não estiverem visíveis)
  useEffect(() => {
    if (isSubmitted && navigationButtonsRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado com o feedback
      setTimeout(() => {
        if (navigationButtonsRef.current) {
          const element = navigationButtonsRef.current;
          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
          const bottomMenuHeight = 80; // Altura do menu fixo do rodapé

          // Verifica se o elemento está visível (considerando o menu do rodapé)
          const isVisible = (
            rect.top >= 0 &&
            rect.bottom <= (viewportHeight - bottomMenuHeight)
          );

          // Só rola se não estiver visível
          if (!isVisible) {
            const absoluteElementTop = rect.top + window.pageYOffset;
            const offset = rect.height + bottomMenuHeight;
            const targetScroll = absoluteElementTop - viewportHeight + offset + 20;

            // Só rola se for para cima (revelar conteúdo abaixo), nunca para baixo
            if (targetScroll > window.pageYOffset) {
              window.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
              });
            }
          }
        }
      }, 100);
    }
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

        const targetScroll = absoluteElementTop - window.innerHeight + offset + 20;

        // Só rola se for para cima (revelar conteúdo abaixo), nunca para baixo
        if (targetScroll > window.pageYOffset) {
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
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
    if (studyMode === 'hard') {
      // Just move to next (or finish if last)
      onNext();
      return;
    }

    // For Zen/Reta Final, show feedback
    setIsSubmitted(true);

    // Load explanation logic
    if (question.comentario) {
      setExplanation(question.comentario);
    } else {
      // Fetch AI explanation if human comment is missing
      setLoadingExplanation(true);
      const aiExpl = await generateExplanation(question);
      setExplanation(`🤖 **Explicação IA:**\n\n${aiExpl}`);
      setLoadingExplanation(false);
    }
  };

  const handleRate = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficultyRating(diff);
    if (onRateDifficulty) {
      onRateDifficulty(diff);
    }
  };

  const getOptionStyle = (letter: string) => {
    // Basic Selection Style
    if (!isSubmitted) {
      return selectedAlt === letter
        ? `border-[#FFB800] bg-[#FFB800] bg-opacity-20 text-white`
        : `border-[#6E6E6E] hover:bg-[#2A2A2A]`;
    }

    // Feedback Style (Only for Zen/Reta Final)
    if (letter === question.gabarito) {
      return `border-[#2ECC71] bg-[#2ECC71] bg-opacity-20 text-[#2ECC71]`;
    }

    if (selectedAlt === letter && letter !== question.gabarito) {
      return `border-[#E74C3C] bg-[#E74C3C] bg-opacity-20 text-[#E74C3C]`;
    }

    return `border-[#333] opacity-50`;
  };

  // Build stats data from real statistics or use fallback
  const buildStatsData = () => {
    const alternatives = question.parsedAlternativas.map(a => a.letter);

    if (questionStats && questionStats.totalAnswers > 0) {
      return alternatives.map(alt => ({
        alternative: alt,
        percentage: questionStats.alternativeDistribution[alt] || 0
      }));
    }

    // Fallback to MOCK_STATS if no real data
    return MOCK_STATS['default'];
  };

  const currentStats = buildStatsData();

  // Função para converter URLs de imagem em markdown antes de renderizar
  const preprocessImageUrls = (text: string): string => {
    if (!text) return '';

    // Padrão 1: "Disponível em: URL. Acesso em: ..."
    let processed = text.replace(
      /Disponível em:\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))[^\n]*/gi,
      '\n\n![Imagem da questão]($1)\n\n'
    );

    // Padrão 2: URLs diretas de imagem (não já em formato markdown)
    processed = processed.replace(
      /(?<!\]\()(?<!\!)\b(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))\b(?!\))/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    // Padrão 3: Tags HTML <img src="...">
    processed = processed.replace(
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      '\n\n![Imagem]($1)\n\n'
    );

    return processed;
  };

  // Função para formatar texto com quebras de linha e negrito (legado)
  const formatText = (text: string) => {
    if (!text) return null;

    // Divide por quebras de linha e processa cada parte
    return text.split('\n').map((paragraph, idx) => {
      // Processa negrito **texto** ou __texto__
      const parts = paragraph.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return <strong key={partIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div
      className="flex flex-col pb-24 px-3 md:px-4 pt-4 md:pt-6"
      {...(isSubmitted ? swipeHandlers : {})}
    >
      {/* Header Info */}
      <div className="mb-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col flex-1">
            <div className="flex items-center mb-1 flex-wrap gap-2">
              <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider">
                {question.materia}
              </span>

              {studyMode === 'zen' && (
                <div className="flex items-center text-teal-400 text-[10px] bg-teal-900/20 px-2 py-0.5 rounded-full border border-teal-900/50">
                  <Coffee size={10} className="mr-1" /> ZEN
                </div>
              )}
              {studyMode === 'hard' && (
                <div className="flex items-center text-red-500 text-[10px] bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50">
                  <Timer size={10} className="mr-1" /> SIMULADO
                </div>
              )}
              {studyMode === 'reta_final' && (
                <div className="flex items-center text-purple-500 text-[10px] bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-900/50">
                  <Zap size={10} className="mr-1" /> RETA FINAL
                </div>
              )}
              {studyMode === 'review' && (
                <div className="flex items-center text-blue-400 text-[10px] bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-900/50">
                  <BrainCircuit size={10} className="mr-1" /> REVISÃO
                </div>
              )}
            </div>
            <h2 className="text-sm text-gray-400">{question.banca} • {question.ano} • {question.orgao}</h2>
          </div>

          {/* Countdown Timer (Only for Simulado Mode) */}
          {studyMode === 'hard' && (
            <div className="flex items-center bg-[#1A1A1A] border border-red-900/50 rounded-lg px-2 py-1 ml-2 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
              <Timer size={14} className="text-red-500 mr-1 animate-pulse" />
              <span className="font-mono font-bold text-red-500 text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enunciado */}
      <div className="text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-medium text-gray-100 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt || 'Imagem da questão'}
                className="max-w-full h-auto rounded-lg my-3 border border-gray-700"
                loading="lazy"
              />
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] underline hover:text-[#FFC933]">
                {children}
              </a>
            ),
          }}
        >
          {preprocessImageUrls(question.enunciado || '')}
        </ReactMarkdown>
      </div>

      {/* Alternatives */}
      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        {question.parsedAlternativas.map((alt) => (
          <button
            key={alt.letter}
            onClick={() => handleSelect(alt.letter)}
            className={`w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start group relative ${getOptionStyle(alt.letter)}`}
            disabled={isSubmitted}
          >
            <span className={`font-bold mr-2 md:mr-3 w-5 md:w-6 shrink-0 text-sm md:text-base ${isSubmitted && alt.letter === question.gabarito ? 'text-[#2ECC71]' : ''}`}>
              {alt.letter}
            </span>
            <span className="text-xs md:text-sm flex-1">{alt.text}</span>
            {(userRole === 'admin' || showCorrectAnswers) && alt.letter === question.gabarito && !isSubmitted && (
              <div className="absolute top-2 right-2 text-[#FFB800]" title={userRole === 'admin' ? "Gabarito (Visível apenas para Admin)" : "Resposta correta"}>
                <Star size={16} fill="#FFB800" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Actions / Feedback Area */}
      <div className="mt-auto" ref={submitButtonRef}>
        {!isSubmitted ? (
          <RippleEffect className="w-full rounded-full">
            <button
              onClick={(e) => handleSubmit(e)}
              disabled={!selectedAlt}
              className={`w-full py-4 rounded-full font-bold text-black uppercase tracking-wide transition-all touch-feedback ${selectedAlt ? 'bg-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]' : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
            >
              {studyMode === 'hard'
                ? (isLastQuestion ? 'Finalizar Simulado' : 'Confirmar Resposta')
                : 'Responder'
              }
            </button>
          </RippleEffect>
        ) : (
          <div className="animate-fade-in-up">

            {/* 1. Top Buttons Row: Stats & Difficulty */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => handleRate('easy')}
                className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'easy' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
              >
                Fácil
              </button>
              <button
                onClick={() => handleRate('medium')}
                className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
              >
                Médio
              </button>
              <button
                onClick={() => handleRate('hard')}
                className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'hard' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
              >
                Difícil
              </button>
              <button
                onClick={() => setShowStatsModal(true)}
                className="p-2 rounded-lg text-xs font-bold border border-gray-700 text-[#FFB800] hover:bg-gray-800 flex flex-col items-center justify-center"
              >
                <BarChart2 size={16} />
              </button>
            </div>

            {/* 2. Navigation Row: Previous / Next Highlighted */}
            <div ref={navigationButtonsRef} className="flex gap-3 mb-6">
              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className={`w-full flex items-center justify-center py-3 rounded-xl border-2 font-bold transition-all touch-feedback ${onPrevious
                      ? 'border-gray-600 text-white hover:bg-gray-800'
                      : 'border-transparent text-gray-600 cursor-not-allowed bg-gray-900/50'
                    }`}
                >
                  <ChevronLeft size={20} className="mr-1" /> Anterior
                </button>
              </RippleEffect>

              <RippleEffect className="flex-1 rounded-xl">
                <button
                  onClick={onNext}
                  className="w-full flex items-center justify-center py-3 bg-[#FFB800] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(255,184,0,0.3)] hover:shadow-[0_0_25px_rgba(255,184,0,0.5)] transition-all border-2 border-[#FFB800] touch-feedback"
                >
                  {isLastQuestion ? 'Finalizar' : 'Próxima'} <ChevronRight size={20} className="ml-1" />
                </button>
              </RippleEffect>
            </div>

            {/* 3. Feedback Box (Lower down) */}
            <div className={`p-4 rounded-lg mb-4 border ${selectedAlt === question.gabarito ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${selectedAlt === question.gabarito ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                  {selectedAlt === question.gabarito ? 'Excelente! 🎯' : 'Não foi dessa vez... ❌'}
                </h3>
                {questionStats && questionStats.totalAnswers > 0 ? (
                  <span className="text-xs text-gray-400">
                    {questionStats.accuracyRate}% da comunidade acertou ({questionStats.totalAnswers} respostas)
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Seja o primeiro a responder!
                  </span>
                )}
              </div>

              {/* Pegadinha Badge Here - Inside Feedback Box */}
              {question.isPegadinha && (
                <button
                  onClick={() => setShowPegadinhaModal(true)}
                  className="w-full mb-4 flex items-center justify-start bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all group text-left"
                >
                  <div className="bg-orange-500/20 p-2 rounded-md mr-3 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide mb-0.5">Alerta de Pegadinha</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300">Toque para ver a armadilha desta questão.</span>
                  </div>
                </button>
              )}

              <div className="text-sm text-gray-300 leading-relaxed">
                {loadingExplanation ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
                  </div>
                ) : (
                  <>
                    {studyMode === 'reta_final' && (
                      <span className="text-purple-400 font-bold text-xs mb-1 block">RESUMO RETA FINAL:</span>
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ children }) => <h2 className="text-lg font-bold text-[#FFB800] mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-200 mt-2 mb-1">{children}</h4>,
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-[#FFB800] pl-4 my-3 italic text-gray-400">{children}</blockquote>,
                        code: ({ children }) => <code className="bg-gray-800 px-1.5 py-0.5 rounded text-[#FFB800] text-sm">{children}</code>,
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt || 'Imagem da questão'}
                            className="max-w-full h-auto rounded-lg my-3 border border-gray-700"
                            loading="lazy"
                          />
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] underline hover:text-[#FFC933]">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {preprocessImageUrls(explanation || '')}
                    </ReactMarkdown>
                  </>
                )}
              </div>
            </div>

            {/* 4. Bottom Nav Buttons */}
            <div className="flex space-x-3 pb-4 border-b border-gray-800 mb-6">
              {/* Botão de Report (primeiro, ao lado do Tirar Dúvida) */}
              <button
                onClick={() => setShowReportModal(true)}
                className="w-12 h-12 flex items-center justify-center bg-[#2A2A2A] text-[#E74C3C] border border-[#E74C3C] rounded-full hover:bg-[#E74C3C]/10 transition-colors flex-shrink-0"
                title="Reportar problema"
              >
                <Flag size={18} />
              </button>

              <button
                onClick={onOpenTutor}
                className="flex-1 flex items-center justify-center py-3 bg-[#2A2A2A] text-white border border-[#FFB800] rounded-full font-semibold hover:bg-[#333]"
              >
                <MessageCircle size={18} className="mr-2 text-[#FFB800]" />
                Tirar Dúvida
              </button>

              <button
                onClick={onNext}
                className="flex-1 py-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-full font-medium hover:bg-gray-700"
              >
                {isLastQuestion ? 'Finalizar' : 'Próxima Questão'}
              </button>
            </div>

            {/* Community Comments Section */}
            <CommentsSection
              questionId={question.id}
              userId={userId || null}
              onShowToast={onShowToast}
            />

          </div>
        )}
      </div>

      {/* Stats Modal Popup */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1A1A1A] w-full max-w-xs rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white flex items-center">
                <BarChart2 size={20} className="mr-2 text-[#FFB800]" />
                Desempenho
              </h3>
              <button onClick={() => setShowStatsModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              {currentStats.map((stat) => {
                const isCorrect = stat.alternative === question.gabarito;
                const isSelected = stat.alternative === selectedAlt;
                let barColor = 'bg-gray-600';
                if (isCorrect) barColor = 'bg-[#2ECC71]';
                else if (isSelected) barColor = 'bg-[#E74C3C]';

                return (
                  <div key={stat.alternative} className="relative">
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span className={`${isCorrect ? 'text-[#2ECC71]' : isSelected ? 'text-[#E74C3C]' : 'text-gray-400'}`}>
                        Alternativa {stat.alternative}
                        {isSelected && " (Você)"}
                      </span>
                      <span>{stat.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${stat.percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Difficulty Distribution */}
            {questionStats && (questionStats.difficultyDistribution.easy > 0 || questionStats.difficultyDistribution.medium > 0 || questionStats.difficultyDistribution.hard > 0) && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-3">Dificuldade percebida</h4>
                <div className="flex gap-2">
                  <div className="flex-1 text-center p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-lg font-bold text-green-500">{questionStats.difficultyDistribution.easy}</p>
                    <p className="text-[10px] text-gray-400">Fácil</p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-lg font-bold text-yellow-500">{questionStats.difficultyDistribution.medium}</p>
                    <p className="text-[10px] text-gray-400">Médio</p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-lg font-bold text-red-500">{questionStats.difficultyDistribution.hard}</p>
                    <p className="text-[10px] text-gray-400">Difícil</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pegadinha Explanation Modal */}
      {showPegadinhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl border border-orange-500 p-0 shadow-2xl overflow-hidden">
            <div className="bg-orange-500/10 p-4 border-b border-orange-500/30 flex justify-between items-center">
              <h3 className="font-bold text-orange-400 flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                Cuidado! É uma Pegadinha
              </h3>
              <button onClick={() => setShowPegadinhaModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6">
              <p className="text-gray-300 leading-relaxed text-sm">
                {question.explicacaoPegadinha || "Esta questão contém elementos projetados para induzir o candidato ao erro comum. Fique atento aos detalhes do enunciado!"}
              </p>

              <button
                onClick={() => setShowPegadinhaModal(false)}
                className="mt-6 w-full py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

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
          onShowToast?.('Report enviado com sucesso!', 'success');
        }}
      />
    </div>
  );
};

export default QuestionCard;
