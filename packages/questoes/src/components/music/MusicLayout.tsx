import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { MusicSidebar } from './MusicSidebar';
import { useUIStore } from '../../stores';

export const MusicLayout: React.FC = () => {
    const { setSidebarOpen, isSidebarOpen } = useUIStore();
    const previousSidebarState = useRef<boolean | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Recolher sidebar ao entrar na página de música e restaurar ao sair
    useEffect(() => {
        // Salvar estado anterior do sidebar
        previousSidebarState.current = isSidebarOpen;

        // Recolher sidebar
        setSidebarOpen(false);

        // Restaurar estado anterior ao sair
        return () => {
            if (previousSidebarState.current !== null) {
                setSidebarOpen(previousSidebarState.current);
            }
        };
    }, []);

    // Fechar menu mobile quando mudar de rota
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex min-h-[calc(100vh-80px)] lg:h-screen bg-black text-white overflow-hidden">
            {/* Music Sidebar - Desktop only */}
            <div className="hidden lg:flex flex-col h-full z-20">
                <MusicSidebar />
            </div>

            {/* Mobile Menu Button - Fixed position */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 right-4 z-30 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Abrir menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/60 z-40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="lg:hidden fixed top-0 right-0 h-full w-72 bg-black z-50 shadow-2xl animate-slide-in-right">
                        {/* Close button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Fechar menu"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Sidebar content */}
                        <MusicSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
                    </div>
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-[#121212] lg:rounded-lg lg:my-2 lg:mr-2 overflow-hidden">
                {/* Top Gradient Overlay */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-900/40 to-[#121212] pointer-events-none z-0" />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
