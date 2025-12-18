import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTrailStore } from '../../stores';
import { LOGO_URL } from '../../constants';
import { PreparatorioDropdown } from '../trail/PreparatorioDropdown';
import { UserPreparatorio } from '../../types';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <header className="sticky top-0 h-14 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#3A3A3A] z-30">
      <div className="flex items-center justify-between h-full px-4">
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
            <div className="hidden lg:flex items-center gap-4">
              <PreparatorioDropdown
                preparatorios={userPreparatorios}
                selectedId={selectedPreparatorioId}
                onSelect={handlePreparatorioSelect}
                onAddNew={handleAddNewPreparatorio}
                isLoading={isTrailLoading}
              />
            </div>
          ) : (
            <h1 className="hidden lg:block text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
          )}
        </div>

        {/* Right Side - Empty, content moved to sidebars */}
        <div className="flex items-center gap-3 lg:hidden">
          {/* Mobile only - show page context if needed */}
        </div>
      </div>
    </header>
  );
}

export default Header;
