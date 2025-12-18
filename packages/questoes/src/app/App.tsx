import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '../stores';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Skeleton de trilha para loading inicial
function AppLoadingSkeleton() {
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
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="relative w-full pt-20" style={{ height: getPosition(skeletonNodes.length - 1).y + 150 }}>
        {/* Skeleton path line */}
        <div className="absolute left-1/2 top-0 w-1 h-full">
          <div className="w-full h-full bg-gradient-to-b from-[#2A2A2A] via-[#3A3A3A] to-[#2A2A2A] opacity-30 rounded-full" />
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
                className="w-16 h-16 rounded-2xl bg-[#2A2A2A] border-2 border-[#3A3A3A] rotate-45 animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
              {/* Skeleton label */}
              <div
                className="mt-8 w-20 h-6 rounded-lg bg-[#2A2A2A] animate-pulse"
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppContent() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <AppLoadingSkeleton />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
