import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '../ui';

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

// Steps for mobile (uses MobileNav at bottom)
const MOBILE_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: 'tour-welcome',
    title: 'Bem-vindo ao Ouse Questões! 🎉',
    description: 'Parabéns pelo seu período de teste gratuito! Vou te mostrar como aproveitar ao máximo a plataforma. O tour leva apenas 2 minutinhos.',
    position: 'center',
  },
  {
    id: 'nav-praticar',
    target: 'nav-praticar',
    title: '📚 Praticar Questões',
    description: 'Este é o coração do Ouse Questões! Aqui você pratica questões de concursos reais com filtros avançados: matéria, banca, ano, órgão e muito mais. Perfeito para treinar exatamente o que você precisa!',
    position: 'top',
    mobileOnly: true,
  },
  {
    id: 'nav-raiox',
    target: 'nav-raiox',
    title: '📊 Estatísticas (Raio-X)',
    description: 'Acompanhe sua evolução! Veja taxa de acerto por matéria, identifique pontos fracos e acompanhe seu progresso ao longo do tempo. Dados são essenciais para uma preparação estratégica.',
    position: 'top',
    mobileOnly: true,
  },
  {
    id: 'header-xp',
    target: 'header-xp',
    title: '⭐ Seu Nível e XP',
    description: 'Cada questão correta te dá pontos de experiência (XP)! Conforme sobe de nível, você desbloqueia conquistas e mostra seu progresso. Gamificação para tornar o estudo mais divertido!',
    position: 'bottom',
  },
  {
    id: 'header-streak',
    target: 'header-streak',
    title: '🔥 Ofensiva (Streak)',
    description: 'Mantenha sua sequência de dias estudando! A consistência é a chave para aprovação. Estudar um pouco todo dia é mais efetivo que maratonas esporádicas.',
    position: 'bottom',
  },
  {
    id: 'header-battery',
    target: 'header-battery',
    title: '🔋 Bateria Ilimitada!',
    description: 'Como você está no período de teste PREMIUM, sua bateria é ILIMITADA! Estude à vontade, sem limites. Aproveite seu período de teste para acelerar sua preparação!',
    position: 'bottom',
  },
  {
    id: 'header-profile',
    target: 'header-profile',
    title: '👤 Seu Perfil',
    description: 'Acesse seu perfil para ver conquistas, ajustar configurações e personalizar sua experiência. Você também pode alterar tema claro/escuro e configurar notificações.',
    position: 'bottom',
  },
  {
    id: 'final',
    target: 'tour-welcome',
    title: '🚀 Tudo pronto!',
    description: 'Agora você conhece os principais recursos. Minha dica: comece praticando questões na área "Praticar". Selecione uma matéria e faça pelo menos 10 questões por dia. Consistência é o segredo! Bons estudos!',
    position: 'center',
  },
];

// Steps for desktop (uses Sidebar on left)
const DESKTOP_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: 'tour-welcome',
    title: 'Bem-vindo ao Ouse Questões! 🎉',
    description: 'Parabéns pelo seu período de teste gratuito! Vou te mostrar como aproveitar ao máximo a plataforma. O tour leva apenas 2 minutinhos.',
    position: 'center',
  },
  {
    id: 'sidebar-praticar',
    target: 'sidebar-praticar',
    title: '📚 Praticar Questões',
    description: 'Este é o coração do Ouse Questões! Aqui você pratica questões de concursos reais com filtros avançados: matéria, banca, ano, órgão e muito mais. Perfeito para treinar exatamente o que você precisa!',
    position: 'right',
    desktopOnly: true,
  },
  {
    id: 'sidebar-raiox',
    target: 'sidebar-raiox',
    title: '📊 Estatísticas (Raio-X)',
    description: 'Acompanhe sua evolução! Veja taxa de acerto por matéria, identifique pontos fracos e acompanhe seu progresso ao longo do tempo. Dados são essenciais para uma preparação estratégica.',
    position: 'right',
    desktopOnly: true,
  },
  {
    id: 'header-xp',
    target: 'header-xp',
    title: '⭐ Seu Nível e XP',
    description: 'Cada questão correta te dá pontos de experiência (XP)! Conforme sobe de nível, você desbloqueia conquistas e mostra seu progresso. Gamificação para tornar o estudo mais divertido!',
    position: 'bottom',
  },
  {
    id: 'header-streak',
    target: 'header-streak',
    title: '🔥 Ofensiva (Streak)',
    description: 'Mantenha sua sequência de dias estudando! A consistência é a chave para aprovação. Estudar um pouco todo dia é mais efetivo que maratonas esporádicas.',
    position: 'bottom',
  },
  {
    id: 'header-battery',
    target: 'header-battery',
    title: '🔋 Bateria Ilimitada!',
    description: 'Como você está no período de teste PREMIUM, sua bateria é ILIMITADA! Estude à vontade, sem limites. Aproveite seu período de teste para acelerar sua preparação!',
    position: 'bottom',
  },
  {
    id: 'header-profile',
    target: 'header-profile',
    title: '👤 Seu Perfil',
    description: 'Acesse seu perfil para ver conquistas, ajustar configurações e personalizar sua experiência. Você também pode alterar tema claro/escuro e configurar notificações.',
    position: 'bottom',
  },
  {
    id: 'final',
    target: 'tour-welcome',
    title: '🚀 Tudo pronto!',
    description: 'Agora você conhece os principais recursos. Minha dica: comece praticando questões na área "Praticar". Selecione uma matéria e faça pelo menos 10 questões por dia. Consistência é o segredo! Bons estudos!',
    position: 'center',
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ProductTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function ProductTour({ isActive, onComplete, onSkip }: ProductTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get appropriate steps based on device
  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Find element and get its position
  const getElementRect = useCallback((target: string): TargetRect | null => {
    // Special case for welcome step - no target element
    if (target === 'tour-welcome') {
      return null;
    }

    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!element) {
      console.warn(`[Tour] Element not found: ${target}`);
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Calculate tooltip position
  const getTooltipStyle = useCallback((rect: TargetRect | null, position: string): React.CSSProperties => {
    const padding = 16;
    const tooltipWidth = isMobile ? Math.min(300, window.innerWidth - 32) : 320;
    const tooltipHeight = 180; // Approximate

    // Center position (for welcome step)
    if (position === 'center' || !rect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.top + rect.height + padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left + rect.width + padding;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

    return {
      position: 'fixed',
      top,
      left,
      width: tooltipWidth,
    };
  }, [isMobile]);

  // Update target position
  const updatePosition = useCallback(() => {
    if (!currentStep || !isActive) return;

    const rect = getElementRect(currentStep.target);
    setTargetRect(rect);
    setIsVisible(true);

    // Scroll element into view if needed (not for fixed elements like nav)
    if (rect && currentStep.target !== 'tour-welcome') {
      const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (element) {
        const isFixed = window.getComputedStyle(element).position === 'fixed' ||
                       element.closest('[class*="fixed"]') !== null;

        if (!isFixed && (rect.top < 80 || rect.top > window.innerHeight - 150)) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Update position after scroll
          setTimeout(() => {
            const newRect = getElementRect(currentStep.target);
            setTargetRect(newRect);
          }, 400);
        }
      }
    }
  }, [currentStep, isActive, getElementRect]);

  // Handle step changes
  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(updatePosition, 300);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [isActive, currentStepIndex, updatePosition]);

  // Handle resize/scroll
  useEffect(() => {
    if (!isActive || !isVisible) return;

    const handleUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(updatePosition, 100);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isActive, isVisible, updatePosition]);

  // Skip to next valid step if current element not found
  useEffect(() => {
    if (!isActive || !isVisible || !currentStep) return;

    // Welcome step doesn't need element
    if (currentStep.target === 'tour-welcome') return;

    const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!element) {
      // Skip this step
      if (currentStepIndex < steps.length - 1) {
        setTimeout(() => setCurrentStepIndex(prev => prev + 1), 100);
      } else {
        onComplete();
      }
    }
  }, [isActive, isVisible, currentStep, currentStepIndex, steps.length, onComplete]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setIsVisible(false);
      setTimeout(() => setCurrentStepIndex(prev => prev + 1), 200);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setIsVisible(false);
      setTimeout(() => setCurrentStepIndex(prev => prev - 1), 200);
    }
  };

  if (!isActive || !isVisible || !currentStep) return null;

  const isWelcomeStep = currentStep.target === 'tour-welcome';
  const tooltipStyle = getTooltipStyle(targetRect, currentStep.position || 'bottom');

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay com cutout para highlight */}
          {targetRect && !isWelcomeStep ? (
            <>
              {/* SVG mask for cutout - único overlay com 40% de opacidade */}
              <motion.svg
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <defs>
                  <mask id="tour-highlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={targetRect.left - 8}
                      y={targetRect.top - 8}
                      width={targetRect.width + 16}
                      height={targetRect.height + 16}
                      rx="12"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.4)"
                  mask="url(#tour-highlight-mask)"
                />
              </motion.svg>

              {/* Highlight border */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute pointer-events-none rounded-xl"
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  border: '2px solid #FFB800',
                  boxShadow: '0 0 0 4px rgba(255, 184, 0, 0.3), 0 0 30px rgba(255, 184, 0, 0.4)',
                }}
              />
            </>
          ) : (
            /* Overlay simples para steps sem target (welcome/final) */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#1F1F1F] rounded-2xl shadow-2xl border border-[#3A3A3A] overflow-hidden"
            style={tooltipStyle}
          >
            {/* Header with icon */}
            {isWelcomeStep && (
              <div className="bg-gradient-to-r from-[#FFB800]/20 to-[#FF8C00]/20 p-4 flex justify-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles size={40} className="text-[#FFB800]" />
                </motion.div>
              </div>
            )}

            <div className="p-5">
              {/* Close button */}
              <button
                onClick={onSkip}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#3A3A3A] text-[#6E6E6E] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              {/* Progress bar */}
              <div className="flex gap-1 mb-4">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx < currentStepIndex
                        ? 'bg-[#FFB800]'
                        : idx === currentStepIndex
                        ? 'bg-[#FFB800]'
                        : 'bg-[#3A3A3A]'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-lg mb-2 pr-6">
                {currentStep.title}
              </h3>
              <p className="text-[#A0A0A0] text-sm leading-relaxed mb-5">
                {currentStep.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={onSkip}
                  className="text-[#6E6E6E] hover:text-white text-sm transition-colors"
                >
                  Pular tour
                </button>

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={handlePrev}
                      className="p-2 rounded-lg hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-white transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="min-w-[100px]"
                  >
                    {isLastStep ? (
                      <>
                        Começar!
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    ) : (
                      <>
                        Próximo
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step counter */}
              <p className="text-center text-[#6E6E6E] text-xs mt-4">
                Passo {currentStepIndex + 1} de {steps.length}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductTour;
