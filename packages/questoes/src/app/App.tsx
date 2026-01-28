import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '../stores';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import { PromotionalTrialModal } from '../components/promotional/PromotionalTrialModal';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Skeleton de trilha para loading inicial (usado em / e /trilha)
function TrailLoadingSkeleton() {
  const skeletonNodes = [0, 1, 2, 3, 4];
  const CONFIG = {
    ITEM_HEIGHT: 140,
    WAVE_AMPLITUDE: 86,
    START_Y: 80,
  };

  const getPosition = (index: number) => {
    const side = index % 2 === 0 ? -1 : 1;
    const xOffset = side * CONFIG.WAVE_AMPLITUDE;
    const y = CONFIG.START_Y + index * CONFIG.ITEM_HEIGHT;
    return { x: xOffset, y };
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="relative w-full pt-20" style={{ height: getPosition(skeletonNodes.length - 1).y + 150 }}>
        {/* Skeleton path line */}
        <div className="absolute left-1/2 top-0 w-1 h-full">
          <div className="w-full h-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-[#2A2A2A] dark:via-[#3A3A3A] dark:to-[#2A2A2A] opacity-30 rounded-full" />
        </div>

        {/* Skeleton nodes */}
        {skeletonNodes.map((_, index) => {
          const pos = getPosition(index);
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{
                top: pos.y,
                left: `calc(50% + ${pos.x}px)`
              }}
            >
              {/* Skeleton button */}
              <div
                className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-[#2A2A2A] border-2 border-gray-300 dark:border-[#3A3A3A] rotate-45 animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
              {/* Skeleton label */}
              <div
                className="mt-8 w-20 h-6 rounded-lg bg-gray-200 dark:bg-[#2A2A2A] animate-pulse"
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton de conteúdo para outras páginas
function ContentLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1A1A1A] p-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse" />
        </div>
      </div>

      {/* Card skeleton */}
      <div className="bg-white dark:bg-[#252525] rounded-xl p-4 mb-6 border border-gray-200 dark:border-[#3A3A3A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-[#3A3A3A] animate-pulse" />
          <div className="flex-1">
            <div className="h-2 bg-gray-300 dark:bg-[#3A3A3A] rounded-full animate-pulse" />
          </div>
          <div className="w-12 h-4 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton - multiple paragraphs */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-11/12" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-4/5" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-10/12" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-5/6" />
        </div>
      </div>

      {/* Button skeleton */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#3A3A3A]">
        <div className="h-12 bg-gray-300 dark:bg-[#3A3A3A] rounded-xl animate-pulse w-full" />
      </div>
    </div>
  );
}

// Determina qual skeleton mostrar baseado na rota atual
function AppLoadingSkeleton() {
  const pathname = window.location.pathname;
  // Trilha é a home (/) ou /trilha
  const isTrailPage = pathname === '/' || pathname === '/trilha';

  return isTrailPage ? <TrailLoadingSkeleton /> : <ContentLoadingSkeleton />;
}

function AppContent() {
  const { initialize, isLoading, promotionalTrial, clearPromotionalTrial } = useAuthStore();
  const [showTrialModal, setShowTrialModal] = React.useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Verificar se deve mostrar o modal do trial
  // Só mostrar após o onboarding estar completo
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('ousepassar_onboarding_completed') === 'true';
    const trialModalShown = localStorage.getItem('ousepassar_trial_modal_shown') === 'true';

    console.log('[App] Verificando trial modal:', {
      hasPromotionalTrial: promotionalTrial?.has_trial,
      onboardingCompleted,
      trialModalShown,
      promotionalTrial,
    });

    if (promotionalTrial?.has_trial) {
      // Mostrar o modal apenas se:
      // 1. Tem trial disponível
      // 2. Onboarding foi completado
      // 3. Modal ainda não foi mostrado nesta sessão
      if (onboardingCompleted && !trialModalShown) {
        console.log('[App] Condições atendidas, mostrando modal em 500ms');
        // Pequeno delay para garantir que a home carregou
        const timer = setTimeout(() => {
          setShowTrialModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [promotionalTrial]);

  // Handler para fechar o modal do trial
  const handleCloseTrialModal = () => {
    setShowTrialModal(false);
    localStorage.setItem('ousepassar_trial_modal_shown', 'true');
    clearPromotionalTrial();
  };

  // Handler para iniciar o tour após o modal promocional
  const handleStartTour = () => {
    setShowTrialModal(false);
    localStorage.setItem('ousepassar_trial_modal_shown', 'true');
    // Define flag para o MainLayout iniciar o tour
    localStorage.setItem('ousepassar_start_tour', 'true');
    clearPromotionalTrial();
    // Pequeno delay para fechar o modal antes de iniciar o tour
    setTimeout(() => {
      window.dispatchEvent(new Event('start-product-tour'));
    }, 300);
  };

  if (isLoading) {
    return <AppLoadingSkeleton />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <PromotionalTrialModal
        isOpen={showTrialModal}
        onClose={handleCloseTrialModal}
        onStartTour={handleStartTour}
        trialDays={promotionalTrial?.trial_days}
        expiresAt={promotionalTrial?.expires_at}
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
