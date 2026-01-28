import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Play, CheckCircle } from 'lucide-react';
import { ContextualTour, ContextualTourStep } from './ContextualTour';
import { useUIStore } from '../../stores';

interface PageHelpButtonProps {
  tourId: string;
  title: string;
  description: string;
  features: string[];
  steps: ContextualTourStep[];
  autoStartOnFirstVisit?: boolean;
  pageIsReady?: boolean;
}

export function PageHelpButton({
  tourId,
  title,
  description,
  features,
  steps,
  autoStartOnFirstVisit = true,
  pageIsReady = true,
}: PageHelpButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    activeContextualTour,
    startContextualTour,
    completeContextualTour,
    isContextualTourCompleted,
  } = useUIStore();

  const isTourActive = activeContextualTour === tourId;
  const isCompleted = isContextualTourCompleted(tourId);

  // Auto-start tour on first visit
  useEffect(() => {
    if (autoStartOnFirstVisit && pageIsReady && !isCompleted && !activeContextualTour) {
      const timer = setTimeout(() => {
        startContextualTour(tourId);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoStartOnFirstVisit, pageIsReady, isCompleted, activeContextualTour, tourId, startContextualTour]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPopupOpen &&
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopupOpen]);

  const handleStartTour = () => {
    setIsPopupOpen(false);
    startContextualTour(tourId);
  };

  const handleCompleteTour = () => {
    completeContextualTour(tourId);
  };

  const handleSkipTour = () => {
    completeContextualTour(tourId);
  };

  return (
    <>
      {/* Help Button */}
      <motion.button
        ref={buttonRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setIsPopupOpen(!isPopupOpen)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-12 h-12 rounded-full bg-[#FFB800] text-black shadow-lg hover:bg-[#FFC933] transition-colors flex items-center justify-center group"
        aria-label="Ajuda"
      >
        <HelpCircle size={24} className="group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Help Popup */}
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-36 right-4 lg:bottom-20 lg:right-6 z-50 w-[calc(100vw-32px)] max-w-[320px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
                  <HelpCircle size={20} className="text-[#FFB800]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text-main)] text-sm">{title}</h3>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-500">
                      <CheckCircle size={12} />
                      Tour concluido
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="p-1.5 -m-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-[var(--color-text-sec)] mb-4 leading-relaxed">
                {description}
              </p>

              {/* Features List */}
              <ul className="space-y-2 mb-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[var(--color-text-main)]">
                    <span className="text-[#FFB800] mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Start Tour Button */}
              <button
                onClick={handleStartTour}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFB800] text-black font-medium text-sm rounded-lg hover:bg-[#FFC933] transition-colors"
              >
                <Play size={16} fill="currentColor" />
                {isCompleted ? 'Rever Tour Guiado' : 'Tour Guiado'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Tour */}
      <ContextualTour
        tourId={tourId}
        steps={steps}
        isActive={isTourActive}
        onComplete={handleCompleteTour}
        onSkip={handleSkipTour}
      />
    </>
  );
}

export default PageHelpButton;
