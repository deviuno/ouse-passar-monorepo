import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingSizes = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const Component = onClick || hoverable ? motion.div : 'div';
  const motionProps = onClick || hoverable ? {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Component
      {...motionProps}
      onClick={onClick}
      className={`
        bg-[var(--color-bg-card)] rounded-2xl theme-transition
        ${paddingSizes[padding]}
        border border-[var(--color-border)]
        shadow-[var(--shadow-card)]
        ${onClick ? 'cursor-pointer' : ''}
        ${hoverable ? 'hover:bg-[var(--color-bg-elevated)] hover:shadow-[var(--shadow-elevated)] transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

export default Card;
