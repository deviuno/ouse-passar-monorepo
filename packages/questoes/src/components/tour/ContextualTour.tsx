import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui';

export interface ContextualTourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ContextualTourProps {
  tourId: string;
  steps: ContextualTourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function ContextualTour({ tourId, steps, isActive, onComplete, onSkip }: ContextualTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Find element and get its position
  const getElementRect = useCallback((target: string): TargetRect | null => {
    if (target === 'tour-center') {
      return null;
    }

    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!element) {
      console.warn(`[ContextualTour] Element not found: ${target}`);
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
    const tooltipHeight = 180;

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

    // Scroll element into view if needed
    if (rect && currentStep.target !== 'tour-center') {
      const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (element) {
        const isFixed = window.getComputedStyle(element).position === 'fixed' ||
                       element.closest('[class*="fixed"]') !== null;

        if (!isFixed && (rect.top < 80 || rect.top > window.innerHeight - 150)) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    if (currentStep.target === 'tour-center') return;

    const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!element) {
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

  const isCenterStep = currentStep.target === 'tour-center';
  const tooltipStyle = getTooltipStyle(targetRect, currentStep.position || 'bottom');

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay with cutout for highlight */}
          {targetRect && !isCenterStep ? (
            <>
              <motion.svg
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <defs>
                  <mask id={`tour-highlight-mask-${tourId}`}>
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
                  mask={`url(#tour-highlight-mask-${tourId})`}
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
                      idx <= currentStepIndex
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
                  Pular
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
                      'Entendi!'
                    ) : (
                      <>
                        Proximo
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step counter */}
              <p className="text-center text-[#6E6E6E] text-xs mt-4">
                {currentStepIndex + 1} de {steps.length}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ContextualTour;
