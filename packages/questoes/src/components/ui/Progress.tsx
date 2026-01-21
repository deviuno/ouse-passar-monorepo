import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'success' | 'error' | 'info' | 'retaFinal';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const heights = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colors = {
  brand: 'bg-[#FFB800]',
  success: 'bg-[#2ECC71]',
  error: 'bg-[#E74C3C]',
  info: 'bg-[#3498DB]',
  retaFinal: 'bg-gradient-to-r from-[#FFD700] to-[#FF6B00]',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'brand',
  showLabel = false,
  animated = true,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-[#3A3A3A] rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-[#A0A0A0] mt-1 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}

// Circular progress variant
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'brand' | 'success' | 'error' | 'info' | 'retaFinal';
  showLabel?: boolean;
  children?: React.ReactNode;
}

const circleColors = {
  brand: '#FFB800',
  success: '#2ECC71',
  error: '#E74C3C',
  info: '#3498DB',
  retaFinal: '#FFD700',
};

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 4,
  color = 'brand',
  showLabel = true,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle - uses CSS variable for theme support */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[var(--color-progress-track)]"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleColors[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className="text-white font-bold text-lg">
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default Progress;
