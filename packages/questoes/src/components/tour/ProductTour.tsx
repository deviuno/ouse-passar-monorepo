import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui';

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'preparatorio-selector',
    target: 'preparatorio-selector',
    title: 'Seus Preparatorios',
    description: 'Aqui voce vê seus preparatorios. Arraste para alternar entre eles ou adicione novos clicando em "Novo Preparatorio".',
    position: 'bottom',
  },
  {
    id: 'welcome',
    target: 'trail-header',
    title: 'Sua Trilha de Estudos',
    description: 'Veja o progresso do preparatorio selecionado: quantas missoes voce completou e quantas faltam.',
    position: 'bottom',
  },
  {
    id: 'gamification',
    target: 'gamification-stats',
    title: 'Gamificacao',
    description: 'Acompanhe sua ofensiva de estudos, moedas conquistadas e XP acumulado. Mantenha o foco para subir de nivel!',
    position: 'bottom',
  },
  {
    id: 'trail-map',
    target: 'trail-map',
    title: 'Mapa da Trilha',
    description: 'Cada bolinha e uma missao. Complete as missoes para avancar na trilha e desbloquear novos conteudos.',
    position: 'top',
  },
  {
    id: 'continue-button',
    target: 'continue-button',
    title: 'Continuar Estudando',
    description: 'Clique aqui para ir direto para a proxima missao disponivel. Pratico e rapido!',
    position: 'top',
  },
  {
    id: 'nav-trilha',
    target: 'nav-trilha',
    title: 'Trilha',
    description: 'Volte para a tela principal da trilha a qualquer momento.',
    position: 'top',
  },
  {
    id: 'nav-praticar',
    target: 'nav-praticar',
    title: 'Praticar',
    description: 'Resolva questoes avulsas com filtros por materia, banca e nivel de dificuldade.',
    position: 'top',
  },
  {
    id: 'nav-simulados',
    target: 'nav-simulados',
    title: 'Simulados',
    description: 'Faca simulados completos para testar seus conhecimentos em condicoes reais de prova.',
    position: 'top',
  },
  {
    id: 'nav-raiox',
    target: 'nav-raiox',
    title: 'Raio-X',
    description: 'Veja estatisticas detalhadas do seu desempenho, pontos fortes e fracos.',
    position: 'top',
  },
  {
    id: 'nav-loja',
    target: 'nav-loja',
    title: 'Loja',
    description: 'Use suas moedas para comprar power-ups, avatares e outros itens.',
    position: 'top',
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Check if element is fixed or sticky (sticky behaves like fixed when stuck)
  const isFixedOrSticky = useCallback((element: Element): boolean => {
    const computedStyle = window.getComputedStyle(element);
    const position = computedStyle.position;

    // Fixed elements always use viewport coordinates
    if (position === 'fixed') return true;

    // Sticky elements use viewport coordinates when they're stuck
    if (position === 'sticky') {
      // Check if element or any parent has sticky position
      // For sticky, we treat it as fixed for positioning purposes
      return true;
    }

    // Check parent elements for fixed/sticky positioning
    let parent = element.parentElement;
    while (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.position === 'fixed' || parentStyle.position === 'sticky') {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }, []);

  // Get absolute position of element (accounting for scroll)
  const getAbsoluteRect = useCallback((element: Element): TargetRect => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Check if element has fixed or sticky positioning
    const isFixed = isFixedOrSticky(element);

    if (isFixed) {
      // For fixed/sticky elements, use viewport coordinates directly
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      };
    }

    // For non-fixed elements, add scroll offset
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + scrollTop,
      right: rect.right + scrollLeft,
    };
  }, [isFixedOrSticky]);

  // Calculate tooltip position
  const calculateTooltipPosition = useCallback((rect: TargetRect, preferredPosition: string) => {
    const padding = 16;
    const tooltipWidth = 300;
    const tooltipHeight = 200;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if element is fixed/sticky (use viewport coords) or absolute (use scroll coords)
    const targetElement = document.querySelector(`[data-tour="${currentStep?.target}"]`);
    const isFixed = targetElement ? isFixedOrSticky(targetElement) : false;

    // For fixed/sticky elements, we need to position tooltip in viewport coordinates
    // For absolute elements, we use scroll-adjusted coordinates
    const scrollTop = isFixed ? 0 : (window.pageYOffset || document.documentElement.scrollTop);

    let top = 0;
    let left = 0;

    // Determine best position
    let position = preferredPosition;
    if (position === 'auto' || !position) {
      // Auto-detect best position
      const spaceAbove = rect.top - scrollTop;
      const spaceBelow = viewportHeight - (rect.bottom - scrollTop);
      position = spaceBelow > spaceAbove ? 'bottom' : 'top';
    }

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + padding;
        break;
    }

    // Keep tooltip on screen (viewport bounds)
    const minTop = scrollTop + padding;
    const maxTop = scrollTop + viewportHeight - tooltipHeight - padding;
    const minLeft = padding;
    const maxLeft = viewportWidth - tooltipWidth - padding;

    top = Math.max(minTop, Math.min(top, maxTop));
    left = Math.max(minLeft, Math.min(left, maxLeft));

    return { top, left };
  }, [currentStep, isFixedOrSticky]);

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!currentStep || !isActive) return;

    const targetElement = document.querySelector(`[data-tour="${currentStep.target}"]`);

    if (targetElement) {
      const rect = getAbsoluteRect(targetElement);
      setTargetRect(rect);

      const position = calculateTooltipPosition(rect, currentStep.position || 'auto');
      setTooltipPosition(position);

      setIsVisible(true);

      // Scroll element into view if needed (only for non-fixed/sticky elements)
      if (!isFixedOrSticky(targetElement)) {
        const viewportRect = targetElement.getBoundingClientRect();
        if (viewportRect.top < 100 || viewportRect.bottom > window.innerHeight - 100) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Update position after scroll
          setTimeout(() => {
            const newRect = getAbsoluteRect(targetElement);
            setTargetRect(newRect);
            const newPosition = calculateTooltipPosition(newRect, currentStep.position || 'auto');
            setTooltipPosition(newPosition);
          }, 400);
        }
      }
    } else {
      console.warn(`Tour target not found: ${currentStep.target}`);
      // Skip this step if element not found
      if (currentStepIndex < TOUR_STEPS.length - 1) {
        setTimeout(() => setCurrentStepIndex(prev => prev + 1), 100);
      } else {
        onComplete();
      }
    }
  }, [currentStep, currentStepIndex, isActive, getAbsoluteRect, calculateTooltipPosition, onComplete, isFixedOrSticky]);

  // Initial setup and step changes
  useEffect(() => {
    if (isActive) {
      setIsVisible(false);
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Small delay to ensure DOM is ready
      updateTimeoutRef.current = setTimeout(updateTargetPosition, 300);

      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }
  }, [isActive, currentStepIndex, updateTargetPosition]);

  // Update position on resize/scroll
  useEffect(() => {
    if (!isActive || !isVisible) return;

    const handleUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(updateTargetPosition, 50);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [isActive, isVisible, updateTargetPosition]);

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

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !targetRect || !isVisible) return null;

  // Check if target is fixed or sticky position
  const targetElement = document.querySelector(`[data-tour="${currentStep.target}"]`);
  const isTargetFixed = targetElement ? isFixedOrSticky(targetElement) : false;

  // For the highlight, we need viewport coordinates
  const highlightRect = isTargetFixed ? targetRect : {
    top: targetRect.top - (window.pageYOffset || document.documentElement.scrollTop),
    left: targetRect.left - (window.pageXOffset || document.documentElement.scrollLeft),
    width: targetRect.width,
    height: targetRect.height,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Overlay with hole for target */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={Math.max(0, highlightRect.left - 8)}
                  y={Math.max(0, highlightRect.top - 8)}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.8)"
              mask="url(#tour-mask)"
            />
          </svg>

          {/* Highlight border around target (viewport positioned) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute border-2 border-[#FFB800] rounded-xl pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 0 4px rgba(255, 184, 0, 0.3), 0 0 20px rgba(255, 184, 0, 0.4)',
            }}
          />

          {/* Tooltip (fixed position) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bg-[#252525] rounded-2xl p-5 shadow-2xl border border-[#3A3A3A] pointer-events-auto"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: 300,
              zIndex: 101,
            }}
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-[#3A3A3A] text-[#6E6E6E] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Progress indicator */}
            <div className="flex gap-1 mb-3">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx <= currentStepIndex ? 'bg-[#FFB800]' : 'bg-[#3A3A3A]'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <h3 className="text-white font-bold text-lg mb-2">{currentStep.title}</h3>
            <p className="text-[#A0A0A0] text-sm mb-4 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
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
                <Button onClick={handleNext} size="sm">
                  {isLastStep ? 'Concluir' : 'Proximo'}
                </Button>
              </div>
            </div>

            {/* Step counter */}
            <p className="text-center text-[#6E6E6E] text-xs mt-3">
              {currentStepIndex + 1} de {TOUR_STEPS.length}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductTour;
