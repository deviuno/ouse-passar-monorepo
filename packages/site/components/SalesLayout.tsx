import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { FooterMinimal } from './FooterMinimal';

export const SalesLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] font-sans selection:bg-brand-yellow selection:text-brand-darker theme-transition">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      <FooterMinimal />
    </div>
  );
};
