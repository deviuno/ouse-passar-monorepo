import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, ChevronLeft } from 'lucide-react';
import { useUIStore, useAuthStore, useTrailStore } from '../../stores';
import { LOGO_URL } from '../../constants';
import { PreparatorioDropdown } from '../trail/PreparatorioDropdown';
import { UserPreparatorio } from '../../types';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar } = useUIStore();
  const { profile } = useAuthStore();
  const {
    userPreparatorios,
    selectedPreparatorioId,
    setSelectedPreparatorioId,
    isLoading: isTrailLoading,
  } = useTrailStore();

  // Determine if we should show back button
  const showBackButton = location.pathname.includes('/missao/');

  // Check if we're on home page to show preparatorio dropdown
  const isHomePage = location.pathname === '/' || location.pathname === '/trilha';

  const handlePreparatorioSelect = useCallback((prep: UserPreparatorio) => {
    setSelectedPreparatorioId(prep.id);
  }, [setSelectedPreparatorioId]);

  const handleAddNewPreparatorio = useCallback(() => {
    navigate('/loja/preparatorios');
  }, [navigate]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/trilha') return 'Minhas Trilhas';
    if (path === '/praticar') return 'Praticar Questoes';
    if (path === '/simulados') return 'Meus Simulados';
    if (path === '/estatisticas') return 'Raio-X do Aluno';
    if (path === '/loja') return 'Loja';
    if (path === '/perfil') return 'Perfil';
    if (path.includes('/missao/')) return 'Missao';
    return 'Ouse Questoes';
  };

  return (
    <header className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#3A3A3A] z-30">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-[#3A3A3A] transition-colors active:scale-95"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          ) : (
            <>
              {/* Desktop Menu Toggle */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 rounded-full hover:bg-[#3A3A3A] transition-colors"
              >
                <Menu size={20} className="text-white" />
              </button>

              {/* Mobile Logo */}
              <img
                src={LOGO_URL}
                alt="Ouse Passar"
                className="h-8 lg:hidden"
              />
            </>
          )}

          {/* Page Title or Preparatorio Dropdown (Desktop) */}
          {isHomePage && userPreparatorios.length > 0 ? (
            <PreparatorioDropdown
              preparatorios={userPreparatorios}
              selectedId={selectedPreparatorioId}
              onSelect={handlePreparatorioSelect}
              onAddNew={handleAddNewPreparatorio}
              isLoading={isTrailLoading}
            />
          ) : (
            <h1 className="hidden lg:block text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-[#3A3A3A] transition-colors">
            <Bell size={20} className="text-[#A0A0A0]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E74C3C] rounded-full"></span>
          </button>

          {/* Profile (Desktop) */}
          <button
            onClick={() => navigate('/perfil')}
            className="hidden lg:block p-1 rounded-full hover:ring-2 hover:ring-[#FFB800] transition-all"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center">
                <User size={18} className="text-[#A0A0A0]" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
