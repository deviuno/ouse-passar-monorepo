import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AIChat } from './AIChat';


export const Layout: React.FC = () => {


    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] font-sans selection:bg-brand-yellow selection:text-brand-darker theme-transition">
            <Navbar />

            <main className="flex-grow">
                <Outlet />
            </main>

            <AIChat />
            <Footer />
        </div>
    );
};
