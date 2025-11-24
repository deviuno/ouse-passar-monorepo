import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AIChat } from './AIChat';
import { ViewState } from '../types';

export const Layout: React.FC = () => {
    // Mock view state for Navbar since we're moving to routing
    // In a real refactor, Navbar would need to be updated to use Links instead of onClick handlers
    const currentView = ViewState.HOME;
    const handleViewChange = () => { };

    return (
        <div className="min-h-screen flex flex-col bg-brand-dark font-sans selection:bg-brand-yellow selection:text-brand-darker">
            <Navbar currentView={currentView} onChangeView={handleViewChange} />

            <main className="flex-grow">
                <Outlet />
            </main>

            <AIChat />
            <Footer />
        </div>
    );
};
