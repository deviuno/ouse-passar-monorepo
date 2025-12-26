import React, { useState, MouseEvent, TouchEvent } from 'react';

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  duration?: number;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * Componente de efeito ripple (Material Design / iOS-like)
 * Adiciona feedback visual ao toque, como apps nativos
 */
export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  duration = 600
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = (event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();

    // Detectar posição do toque/clique
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Tamanho do ripple (maior dimensão do container * 2)
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      x: x - size / 2,
      y: y - size / 2,
      size,
      id: Date.now()
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remover ripple após animação
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, duration);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
    >
      {children}

      {/* Container de ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            transform: 'scale(0)',
            animation: `ripple ${duration}ms ease-out`,
            opacity: 0
          }}
        />
      ))}
    </div>
  );
};

export default RippleEffect;
