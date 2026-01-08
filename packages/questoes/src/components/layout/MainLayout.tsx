import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';
import { ScrollToTop } from '../ui';
import { ProductTour } from '../tour';
import { BatteryConsumeToast } from '../battery/BatteryConsumeToast';
import { useUIStore, useBatteryStore } from '../../stores';

export function MainLayout() {
  const { isSidebarOpen, isTourActive, isTourCompleted, startTour, completeTour, skipTour } = useUIStore();
  const { consumeToast, hideConsumeToast } = useBatteryStore();
  const location = useLocation();

  // Check if we should start the tour (only on home page and if not completed)
  useEffect(() => {
    const shouldStartTour = localStorage.getItem('ousepassar_start_tour') === 'true';
    if (shouldStartTour && !isTourCompleted && location.pathname === '/') {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        localStorage.removeItem('ousepassar_start_tour');
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTourCompleted, location.pathname, startTour]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-main)] theme-transition bg-premium-light dark:bg-premium-dark scrollbar-hide">
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
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'}
        `}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-4">
          <Outlet key={location.pathname} />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
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
    </div>
  );
}

export default MainLayout;
