import { useState, useEffect, useRef, TouchEvent } from 'react';
import { GESTURE_CONFIG } from '../config/animations';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface UseSwipeReturn {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  isSwiping: boolean;
  swipeDirection: SwipeDirection;
}

/**
 * Hook para detectar gestos de swipe em elementos touch
 * Perfeito para navegação entre questões no mobile
 */
export const useSwipe = (handlers: SwipeHandlers): UseSwipeReturn => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    // Calcular direção do swipe em tempo real
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
    }
  };

  const onTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    const { threshold } = GESTURE_CONFIG.swipe;

    // Detectar direção dominante
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      // Swipe vertical
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    // Reset
    setIsSwiping(false);
    setSwipeDirection(null);
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping,
    swipeDirection
  };
};

/**
 * Hook simplificado para swipe horizontal apenas (mais comum)
 */
export const useHorizontalSwipe = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  return useSwipe({ onSwipeLeft, onSwipeRight });
};

/**
 * Hook simplificado para swipe vertical apenas
 */
export const useVerticalSwipe = (onSwipeUp?: () => void, onSwipeDown?: () => void) => {
  return useSwipe({ onSwipeUp, onSwipeDown });
};
