/**
 * Configurações de animações para experiência mobile nativa
 */

export const ANIMATIONS = {
  // Transições de página
  pageTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // Fade simples
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Scale com bounce (para modals e cards)
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1] // cubic-bezier para bounce suave
    }
  },

  // Slide from bottom (para bottom sheets)
  slideFromBottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Slide from right (para sidebars)
  slideFromRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // Spring animation (para botões e interações)
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25
  },

  // Tap feedback (para botões)
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },

  // Hover/Active feedback
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
} as const;

// Easing functions personalizadas
export const EASING = {
  // iOS-like easing
  ios: [0.4, 0.0, 0.2, 1],
  // Material Design easing
  material: [0.4, 0.0, 0.2, 1],
  // Bounce suave
  bounce: [0.34, 1.56, 0.64, 1],
  // Ease out suave
  easeOut: [0.0, 0.0, 0.2, 1]
} as const;

// Durações padronizadas
export const DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800
} as const;

// Configurações de gesture
export const GESTURE_CONFIG = {
  swipe: {
    threshold: 50, // Pixels mínimos para detectar swipe
    velocityThreshold: 0.3, // Velocidade mínima
    directionThreshold: 30 // Graus de tolerância para direção
  },
  drag: {
    momentum: true,
    bounceStiffness: 300,
    bounceDamping: 40
  }
} as const;
