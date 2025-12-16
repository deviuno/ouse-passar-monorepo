import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Chave para verificar se onboarding foi completado
const ONBOARDING_COMPLETED_KEY = 'ousepassar_onboarding_completed';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Verificar se onboarding foi completado no localStorage
  const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);

  // Se onboarding foi completado (mesmo sem auth real), permitir acesso (modo demo)
  if (onboardingCompleted) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para onboarding (onde o cadastro acontece)
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
