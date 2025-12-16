import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Chave para verificar se onboarding foi completado
const ONBOARDING_COMPLETED_KEY = 'ousepassar_onboarding_completed';

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { onboarding, isLoading } = useAuthStore();

  // Verificar localStorage para onboarding completado
  const localOnboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Verificar se onboarding está completo
  const isOnboardingComplete =
    localOnboardingCompleted === 'true' ||
    onboarding?.onboarding_step === 'completed' ||
    onboarding?.completed_at;

  // Se onboarding não foi completado, redirecionar para continuar
  if (!isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
