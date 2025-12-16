import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';
import { ProductTour } from '../tour';
import { useUIStore } from '../../stores';

export function MainLayout() {
  const { isSidebarOpen, isTourActive, isTourCompleted, startTour, completeTour, skipTour } = useUIStore();
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
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block fixed left-0 top-0 bottom-0
          w-64 bg-[#252525] border-r border-[#3A3A3A]
          transform transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          z-40
        `}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div
        className={`
          min-h-screen flex flex-col
          transition-all duration-300
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        `}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-4">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Toast Container */}
      <ToastContainer />

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
