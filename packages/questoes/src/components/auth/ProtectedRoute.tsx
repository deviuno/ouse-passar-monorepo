import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Chave para verificar se onboarding foi completado
const ONBOARDING_COMPLETED_KEY = 'ousepassar_onboarding_completed';

// Skeleton de trilha para loading
function TrailLoadingSkeleton() {
  const skeletonNodes = [0, 1, 2, 3, 4];
  const getPosition = (index: number) => {
    const side = index % 2 === 0 ? -1 : 1;
    const xOffset = side * 86;
    const y = 80 + index * 140;
    return { x: xOffset, y };
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="relative w-full pt-20" style={{ height: getPosition(4).y + 150 }}>
        <div className="absolute left-1/2 top-0 w-1 h-full">
          <div className="w-full h-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-[#2A2A2A] dark:via-[#3A3A3A] dark:to-[#2A2A2A] opacity-30 rounded-full" />
        </div>
        {skeletonNodes.map((_, index) => {
          const pos = getPosition(index);
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ top: pos.y, left: `calc(50% + ${pos.x}px)` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-[#2A2A2A] border-2 border-gray-300 dark:border-[#3A3A3A] rotate-45 animate-pulse" />
              <div className="mt-8 w-20 h-6 rounded-lg bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    return <TrailLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    // Redirecionar para onboarding (onde o cadastro acontece)
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
