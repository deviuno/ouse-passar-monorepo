import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_FOR_LIGHT_THEME, LOGO_FOR_DARK_THEME, LOGO_URL } from '../../constants';

interface LogoProps {
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
  showText?: boolean;
}

export function Logo({ className = 'h-8', variant = 'auto', showText = true }: LogoProps) {
  const [hasError, setHasError] = useState(false);
  const { theme } = useTheme();

  const logoSrc = variant === 'auto'
    ? (theme === 'dark' ? LOGO_FOR_DARK_THEME : LOGO_FOR_LIGHT_THEME)
    : variant === 'dark'
      ? LOGO_FOR_DARK_THEME
      : LOGO_FOR_LIGHT_THEME;

  if (hasError && showText) {
    return (
      <span className={`text-[var(--color-brand)] font-bold tracking-tight ${className.includes('h-12') ? 'text-2xl' : 'text-lg'}`}>
        Ouse Passar
      </span>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="Ouse Passar"
      className={`object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
