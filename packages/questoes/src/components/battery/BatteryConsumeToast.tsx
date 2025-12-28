import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BatteryConsumeToastProps {
  amount: number;
  isVisible: boolean;
  onComplete: () => void;
  x?: number;
  y?: number;
}

export function BatteryConsumeToast({ amount, isVisible, onComplete, x, y }: BatteryConsumeToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  // Default to center-top if no coordinates provided
  const hasPosition = x !== undefined && y !== undefined;

  const content = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 1,
            scale: 0.5,
            y: 0,
            x: 0,
          }}
          animate={{
            opacity: [1, 1, 0.8, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: -120,
            x: [0, -5, 5, -3, 0],
          }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.1, 0.25, 1],
            opacity: {
              times: [0, 0.3, 0.7, 1],
              duration: 1.2,
            },
            scale: {
              times: [0, 0.15, 0.3, 1],
              duration: 1.2,
            },
            y: {
              type: 'tween',
              ease: [0.4, 0, 0.2, 1],
              duration: 1.2,
            },
            x: {
              times: [0, 0.2, 0.4, 0.6, 1],
              duration: 1.2,
            }
          }}
          style={hasPosition ? {
            position: 'fixed',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            pointerEvents: 'none' as const,
          } : {
            position: 'fixed',
            left: '50%',
            top: 80,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none' as const,
          }}
        >
          {/* Main floating element */}
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
            }}
          >
            <Zap className="w-4 h-4 text-white" fill="white" />
            <span className="text-white font-bold text-sm whitespace-nowrap">
              -{amount}
            </span>
          </motion.div>

          {/* Trailing particles - smoke effect */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0.6,
                scale: 0.3,
                y: 0,
              }}
              animate={{
                opacity: 0,
                scale: 0.8,
                y: -40 - (i * 20),
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 + (i * 0.1),
                ease: 'easeOut',
              }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '100%',
                width: 8 - (i * 2),
                height: 8 - (i * 2),
                borderRadius: '50%',
                background: `rgba(239, 68, 68, ${0.5 - (i * 0.15)})`,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// Hook para usar o toast de bateria
export function useBatteryToast() {
  const [toastState, setToastState] = useState<{ amount: number; key: number; x?: number; y?: number } | null>(null);

  const showToast = (amount: number, x?: number, y?: number) => {
    setToastState({ amount, key: Date.now(), x, y });
  };

  const hideToast = () => {
    setToastState(null);
  };

  const ToastComponent = toastState ? (
    <BatteryConsumeToast
      key={toastState.key}
      amount={toastState.amount}
      isVisible={true}
      onComplete={hideToast}
      x={toastState.x}
      y={toastState.y}
    />
  ) : null;

  return { showToast, ToastComponent };
}

export default BatteryConsumeToast;
