import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTrailStore } from '../../stores';
import { LOGO_URL } from '../../constants';
import { PreparatorioDropdown } from '../trail/PreparatorioDropdown';
import { RoundSelector } from '../trail/RoundSelector';
import { UserPreparatorio } from '../../types';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    userPreparatorios,
    selectedPreparatorioId,
    setSelectedPreparatorioId,
    isLoading: isTrailLoading,
    getMissionById,
    getMissionByUrlParams,
    rounds,
    viewingRoundIndex,
    setViewingRoundIndex
  } = useTrailStore();

  // Get current phase from URL query params
  const currentPhase = searchParams.get('fase');

  // Determine if we should show back button (support both URL formats)
  // Old format: /missao/:id
  // New format: /:prepSlug/r/:roundNum/m/:missionNum (e.g., /pcsc-2025-agente/r/1/m/1)
  const isMissionPage = location.pathname.includes('/missao/') || /\/r\/\d+\/m\/\d+/.test(location.pathname);
  const showBackButton = isMissionPage;

  // Check if we're on home page to show preparatorio dropdown
  const isHomePage = location.pathname === '/' || location.pathname === '/trilha';

  // Get current mission for title (support both URL formats)
  const currentMission = useMemo(() => {
    // Try old format first: /missao/:id
    const oldMatch = location.pathname.match(/\/missao\/([^/]+)/);
    if (oldMatch) {
      return getMissionById(oldMatch[1]);
    }

    // Try new format: /:prepSlug/r/:roundNum/m/:missionNum
    const newMatch = location.pathname.match(/\/([^/]+)\/r\/(\d+)\/m\/(\d+)/);
    if (newMatch) {
      const [, prepSlug, roundNum, missionNum] = newMatch;
      return getMissionByUrlParams({
        prepSlug,
        roundNum: parseInt(roundNum, 10),
        missionNum: parseInt(missionNum, 10),
      });
    }

    return null;
  }, [location.pathname, getMissionById, getMissionByUrlParams]);

  // Get mission number from URL or mission data
  const missionNumber = useMemo(() => {
    // Try new format: /:prepSlug/r/:roundNum/m/:missionNum
    const newMatch = location.pathname.match(/\/([^/]+)\/r\/(\d+)\/m\/(\d+)/);
    if (newMatch) {
      return parseInt(newMatch[3], 10);
    }
    // Fallback to mission ordem if available
    if (currentMission?.ordem) {
      return currentMission.ordem;
    }
    return null;
  }, [location.pathname, currentMission]);

  const handlePreparatorioSelect = useCallback((prep: UserPreparatorio) => {
    setSelectedPreparatorioId(prep.id);
  }, [setSelectedPreparatorioId]);

  const handleAddNewPreparatorio = useCallback(() => {
    navigate('/loja/preparatorios');
  }, [navigate]);

  const getMissionTitle = () => {
    // Show "Missão X" based on mission number
    if (missionNumber) {
      return `Missão ${missionNumber}`;
    }

    // Fallback if no mission number available
    return 'Missão';
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/trilha') return 'Minhas Trilhas';
    if (path === '/praticar') return 'Praticar Questões';
    if (path === '/simulados') return 'Meus Simulados';
    if (path === '/estatisticas') return 'Raio-X do Aluno';
    if (path === '/loja') return 'Loja';
    if (path === '/perfil') return 'Perfil';
    // Support both old and new URL formats for missions
    if (isMissionPage) return getMissionTitle();
    return 'Ouse Questões';
  };

  return (
    <header className="sticky top-0 h-14 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#3A3A3A] z-30">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <>
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-[#3A3A3A] transition-colors active:scale-95"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              {/* Mobile mission title - next to back button */}
              {isMissionPage && (
                <h1 className="text-base font-semibold text-white lg:hidden">
                  {getMissionTitle()}
                </h1>
              )}
            </>
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

        {/* Right Side - Round Selector for Trail Page */}
        <div className="flex items-center gap-3">
          {isHomePage && rounds.length > 0 && (
            <RoundSelector
              currentRoundIndex={viewingRoundIndex || 0}
              totalRounds={rounds.length}
              onRoundChange={setViewingRoundIndex}
            />
          )}
        </div>
      </div>
    </header>
  );
}