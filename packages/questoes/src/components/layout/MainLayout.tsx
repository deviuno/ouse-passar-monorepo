import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';
import { ScrollToTop } from '../ui';
import { ProductTour } from '../tour';
import { BatteryConsumeToast } from '../battery/BatteryConsumeToast';
import { AudioEngine, TopMusicPlayer } from '../music';
import { FloatingStudyTimer } from '../study-timer';
import { useUIStore, useBatteryStore } from '../../stores';
import { useMusicPlayerStore } from '../../stores/useMusicPlayerStore';

export function MainLayout() {
  const { isSidebarOpen, isTourActive, isTourCompleted, startTour, completeTour, skipTour } = useUIStore();
  const { consumeToast, hideConsumeToast } = useBatteryStore();
  const { currentTrack } = useMusicPlayerStore();
  const location = useLocation();

  // Check if we're on a music page
  const isMusicPage = location.pathname.startsWith('/music');

  // Check if music player should be shown (has current track)
  const showMusicPlayer = !!currentTrack;

  // Check if we should start the tour (only on home page and if not completed)
  useEffect(() => {
    const shouldStartTour = localStorage.getItem('ousepassar_start_tour') === 'true';
    console.log('[MainLayout] Checking tour flag:', { shouldStartTour, isTourCompleted, pathname: location.pathname });

    if (shouldStartTour && !isTourCompleted && location.pathname === '/') {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        console.log('[MainLayout] Starting tour from localStorage flag');
        localStorage.removeItem('ousepassar_start_tour');
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTourCompleted, location.pathname, startTour]);

  // Listen for the start-product-tour event (triggered by PromotionalTrialModal)
  useEffect(() => {
    const handleStartTour = () => {
      console.log('[MainLayout] Received start-product-tour event', { isTourCompleted, pathname: location.pathname });
      // Aguardar um pouco para garantir que estamos na home
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const tourCompleted = localStorage.getItem('ousepassar_tour_completed') === 'true';
        console.log('[MainLayout] Starting tour from event', { currentPath, tourCompleted });

        if (!tourCompleted && currentPath === '/') {
          localStorage.removeItem('ousepassar_start_tour');
          startTour();
        }
      }, 100);
    };

    window.addEventListener('start-product-tour', handleStartTour);
    return () => window.removeEventListener('start-product-tour', handleStartTour);
  }, [startTour]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--color-bg-main)] text-[var(--color-text-main)] theme-transition scrollbar-hide">
      {/* Scroll to top on route change */}
      <ScrollToTop />

      {/* Desktop Left Sidebar */}
      <aside
        className={`
          hidden lg:block fixed left-0 top-0 bottom-0
          bg-[var(--color-bg-card)] border-r border-[var(--color-border)] theme-transition
          transition-all duration-300
          z-40
          ${isSidebarOpen ? 'w-64' : 'w-[72px]'}
        `}
      >
        <Sidebar isCollapsed={!isSidebarOpen} />
      </aside>

      {/* Main Content */}
      <div
        className={`
          min-h-screen flex flex-col
          transition-all duration-300
          ${isSidebarOpen
            ? 'lg:ml-64 lg:w-[calc(100%-16rem)]'
            : 'lg:ml-[72px] lg:w-[calc(100%-72px)]'}
          w-full
          lg:h-screen lg:overflow-y-auto
        `}
      >
        {/* Header - Hidden on music pages */}
        {!isMusicPage && <Header />}

        {/* Page Content */}
        <main className={`flex-1 w-full max-w-full overflow-x-hidden ${
          showMusicPlayer ? 'pt-14' : '' // Padding top for fixed top player
        } ${
          isMusicPage
            ? 'pb-20 lg:pb-0' // Music page: just nav padding
            : 'pb-20 lg:pb-4 p-4 lg:p-6' // Other pages: normal padding
        }`}>
          <Outlet key={location.pathname} />
        </main>

        {/* Mobile Bottom Navigation - Sempre visível no mobile */}
        <MobileNav />

        {/* Floating Study Timer - Pomodoro (inside main content area) */}
        <FloatingStudyTimer sidebarWidth={isSidebarOpen ? 256 : 72} />
      </div>

      {/* Toast Container */}
      <ToastContainer />

      {/* Battery Consume Toast */}
      {consumeToast && (
        <BatteryConsumeToast
          key={consumeToast.key}
          amount={consumeToast.amount}
          isVisible={true}
          onComplete={hideConsumeToast}
          x={consumeToast.x}
          y={consumeToast.y}
        />
      )}

      {/* Product Tour */}
      <ProductTour
        isActive={isTourActive}
        onComplete={completeTour}
        onSkip={skipTour}
      />

      {/* Audio Engine - sempre montado para manter a reprodução entre páginas */}
      <AudioEngine />

      {/* Top Music Player - Fixed at top, visible on all pages when playing */}
      {showMusicPlayer && <TopMusicPlayer />}
    </div>
  );
}

export default MainLayout;
