import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Flame, Eye, BookOpen, Filter, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrailStore, useAuthStore, useUIStore } from '../../stores';
import { PreparatorioDropdown } from '../trail/PreparatorioDropdown';
import { RoundSelector } from '../trail/RoundSelector';
import { UserPreparatorio } from '../../types';
import { RETA_FINAL_THEME } from '../../services/retaFinalService';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { practiceMode, headerOverride } = useUIStore();
  const [showAssuntosPopover, setShowAssuntosPopover] = useState(false);
  const eyeButtonRef = useRef<HTMLButtonElement>(null);

  // Close popover when location changes
  useEffect(() => {
    setShowAssuntosPopover(false);
  }, [location.pathname]);

  const {
    userPreparatorios,
    selectedPreparatorioId,
    setSelectedPreparatorioId,
    isLoading: isTrailLoading,
    getMissionById,
    getMissionByUrlParams,
    rounds,
    viewingRoundIndex,
    setViewingRoundIndex,
    getSelectedPreparatorio
  } = useTrailStore();

  // Get current trail mode from selected preparatorio
  const currentMode = useMemo(() => {
    const prep = getSelectedPreparatorio();
    return prep?.current_mode ?? 'normal';
  }, [getSelectedPreparatorio, userPreparatorios]);

  // Get current phase from URL query params
  const currentPhase = searchParams.get('fase');

  // Determine if we should show back button (support both URL formats)
  // Old format: /missao/:id
  // New format: /:prepSlug/r/:roundNum/m/:missionNum (e.g., /pcsc-2025-agente/r/1/m/1)
  const isMissionPage = location.pathname.includes('/missao/') || /\/r\/\d+\/m\/\d+/.test(location.pathname);
  const showBackButton = isMissionPage;

  // Check if we're on home page to show preparatorio dropdown
  const isHomePage = location.pathname === '/' || location.pathname === '/trilha';

  // Check if we're on a music page
  const isMusicPage = location.pathname.startsWith('/music');

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
    // Passa userId para persistir a seleção no banco de dados
    setSelectedPreparatorioId(prep.id, user?.id);
  }, [setSelectedPreparatorioId, user?.id]);

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
    if (path === '/questoes') return 'Ouse Questões';
    if (path === '/praticar') return 'Praticar';
    if (path === '/cadernos') return 'Meus Cadernos';
    if (path === '/trilhas') return 'Trilhas de Questões';
    if (path === '/simulados') return 'Meus Simulados';
    if (path === '/estatisticas') return 'Raio-X do Aluno';
    if (path === '/loja') return 'Loja';
    if (path === '/perfil') return 'Perfil';
    if (path === '/anotacoes') return 'Minhas Anotações';
    if (path === '/erros') return 'Meus Erros';
    // Support both old and new URL formats for missions
    if (isMissionPage) return getMissionTitle();
    return 'Ouse Questões';
  };

  // Render styled title for pages like "Ouse Questões" (matching "OUSE MUSIC" style)
  const renderStyledTitle = (title: string) => {
    // Check if title starts with "Ouse " to apply special styling
    if (title.startsWith('Ouse ')) {
      const restOfTitle = title.substring(5); // Remove "Ouse "
      return (
        <h1 className="text-lg font-sans uppercase tracking-wide">
          <span className="text-[var(--color-text-main)] font-medium">OUSE </span>
          <span className="text-[var(--color-brand)] font-semibold">{restOfTitle.toUpperCase()}</span>
        </h1>
      );
    }
    return (
      <h1 className="text-lg font-bold text-[var(--color-text-main)]">{title}</h1>
    );
  };

  // Practice Mode Header - quando está praticando questões
  if (practiceMode.isActive) {
    // Handler para voltar: usa backPath se disponível, senão chama onBack
    const handleBackClick = () => {
      if (practiceMode.backPath) {
        navigate(practiceMode.backPath);
      } else {
        practiceMode.onBack?.();
      }
    };

    return (
      <header className="sticky top-0 h-14 bg-[var(--color-bg-main)]/95 backdrop-blur-md border-b border-[var(--color-border)] z-30 theme-transition">
        <div className="flex items-center justify-between h-full px-4 relative">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={handleBackClick}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-[var(--color-text-sec)]" />
            </button>
            <span className="text-[var(--color-text-main)] font-bold truncate">{practiceMode.title || 'Praticar'}</span>
          </div>

          {/* Center: Counter */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-[var(--color-success)] font-bold">{practiceMode.correctCount}</span>
              <span className="text-[var(--color-border)]">/</span>
              <span className="text-[var(--color-error)] font-bold">{practiceMode.wrongCount}</span>
            </div>
          </div>

          {/* Right: Edital Button (trail mode) or Filter Button */}
          {practiceMode.isTrailMode ? (
            <button
              onClick={() => practiceMode.onToggleEdital?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium hover:bg-[var(--color-bg-card)] text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] flex-shrink-0"
            >
              <ChevronLeft size={16} className="text-[var(--color-brand)]" />
              <span>Edital</span>
            </button>
          ) : (
            <button
              onClick={() => practiceMode.onToggleFilters?.()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex-shrink-0 ${practiceMode.showFilters
                ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
                : 'hover:bg-[var(--color-bg-card)] text-[var(--color-text-sec)] hover:text-[var(--color-text-main)]'
                }`}
            >
              <Filter size={16} />
              <span>Filtrar</span>
              <ChevronDown size={14} className={`transition-transform ${practiceMode.showFilters ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </header>
    );
  }

  // Header Override Mode - quando uma página define header customizado
  if (headerOverride) {
    return (
      <header className="sticky top-0 h-14 bg-[var(--color-bg-main)]/95 backdrop-blur-md border-b border-[var(--color-border)] z-30 theme-transition">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            {headerOverride.showBackButton && (
              <button
                onClick={() => navigate(headerOverride.backPath)}
                className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
              >
                <ChevronLeft size={24} className="text-[var(--color-text-sec)]" />
              </button>
            )}
            {/* Simple mode: only title, no icon */}
            {headerOverride.hideIcon ? (
              <div>
                <h1 className="text-lg font-bold text-[var(--color-text-main)]">{headerOverride.title}</h1>
                {headerOverride.subtitle && (
                  <p className="text-sm text-[var(--color-text-sec)]">{headerOverride.subtitle}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {headerOverride.logoUrl ? (
                  <div className="w-10 h-10 bg-white rounded-lg p-1">
                    <img
                      src={headerOverride.logoUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Map size={24} className="text-emerald-500" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-[var(--color-text-main)]">{headerOverride.title}</h1>
                  {headerOverride.subtitle && (
                    <p className="text-sm text-[var(--color-brand)]">{headerOverride.subtitle}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Right content */}
          {headerOverride.rightContent && (
            <div className="flex items-center">
              {headerOverride.rightContent}
            </div>
          )}
        </div>
      </header>
    );
  }

  // Music Page Header - header customizado para o módulo de música
  if (isMusicPage) {
    return (
      <header className="sticky top-0 h-14 bg-[#121212]/95 backdrop-blur-md border-b border-white/10 z-30">
        <div className="flex items-center h-full px-4">
          {/* Mobile: Back button + Title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-400" />
            </button>
            <h1 className="text-xl font-sans uppercase tracking-wide">
              <span className="text-white font-medium">OUSE </span>
              <span className="text-[#FFB800] font-semibold">MUSIC</span>
            </h1>
          </div>
          {/* Desktop: Just title */}
          <div className="hidden lg:flex items-center">
            <h1 className="text-xl font-sans uppercase tracking-wide">
              <span className="text-white font-medium">OUSE </span>
              <span className="text-[#FFB800] font-semibold">MUSIC</span>
            </h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 h-14 bg-[var(--color-bg-main)]/95 backdrop-blur-md border-b border-[var(--color-border)] z-30 theme-transition">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <>
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-[var(--color-border)] transition-colors active:scale-95"
              >
                <ChevronLeft size={24} className="text-[var(--color-text-main)]" />
              </button>
              {/* Mobile mission title - next to back button */}
              {isMissionPage && (
                <div className="flex items-center gap-2 lg:hidden">
                  <h1 className="text-base font-semibold text-[var(--color-text-main)]">
                    {getMissionTitle()}
                    {currentMission?.materia?.materia && (
                      <span className="text-[var(--color-text-sec)] font-normal"> - {currentMission.materia.materia}</span>
                    )}
                  </h1>
                  {currentMission?.assunto?.nome && (
                    <div className="relative">
                      <button
                        ref={eyeButtonRef}
                        onClick={() => setShowAssuntosPopover(!showAssuntosPopover)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors"
                        title="Ver assuntos"
                      >
                        <Eye size={18} className="text-[var(--color-text-sec)] hover:text-[var(--color-brand)]" />
                      </button>

                      {/* Popover de Assuntos */}
                      <AnimatePresence>
                        {showAssuntosPopover && (
                          <>
                            {/* Backdrop para fechar ao clicar fora */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowAssuntosPopover(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="fixed left-4 right-4 top-16 w-auto max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 overflow-hidden theme-transition"
                            >
                              {/* Header do Popover */}
                              <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <BookOpen size={14} className="text-emerald-500" />
                                  <h3 className="font-bold text-sm leading-tight text-[var(--color-text-main)]">
                                    {getMissionTitle()}
                                  </h3>
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                                  {currentMission?.materia?.materia || 'Matéria'}
                                </p>
                              </div>

                              {/* Body do Popover */}
                              <div className="p-3 bg-[var(--color-bg-card)]">
                                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">Assuntos Abordados:</p>
                                {(() => {
                                  const assuntoName = currentMission?.assunto?.nome || '';
                                  const subjects = assuntoName
                                    .split(/(?=\b\d+\.\d+\s)|(?=\b\d+\.\s)/g)
                                    .map((s: string) => s.trim())
                                    .filter(Boolean);
                                  const items = subjects.length > 0 ? subjects : [assuntoName];

                                  return (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                      {items.map((subject: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-emerald-500" />
                                          <p className="text-xs text-[var(--color-text-sec)] font-medium leading-snug">
                                            {subject}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {currentMode === 'reta_final' && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary}30 0%, ${RETA_FINAL_THEME.colors.accent}30 100%)`,
                        color: RETA_FINAL_THEME.colors.primary,
                        border: `1px solid ${RETA_FINAL_THEME.colors.primary}50`,
                      }}
                    >
                      <Flame size={10} />
                      RETA FINAL
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Mobile: Show Preparatorio Dropdown on Home, Back + Title on other pages */}
              {isHomePage && userPreparatorios.length > 0 ? (
                <div className="lg:hidden">
                  <PreparatorioDropdown
                    preparatorios={userPreparatorios}
                    selectedId={selectedPreparatorioId}
                    onSelect={handlePreparatorioSelect}
                    onAddNew={handleAddNewPreparatorio}
                    isLoading={isTrailLoading}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:hidden">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
                  >
                    <ChevronLeft size={22} className="text-[var(--color-text-sec)]" />
                  </button>
                  {renderStyledTitle(getPageTitle())}
                </div>
              )}
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
            <div className="hidden lg:flex items-center gap-2">
              {renderStyledTitle(getPageTitle())}
              {isMissionPage && currentMode === 'reta_final' && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary}30 0%, ${RETA_FINAL_THEME.colors.accent}30 100%)`,
                    color: RETA_FINAL_THEME.colors.primary,
                    border: `1px solid ${RETA_FINAL_THEME.colors.primary}50`,
                  }}
                >
                  <Flame size={10} />
                  RETA FINAL
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Round Selector for Trail Page (Desktop only) */}
        <div className="hidden lg:flex items-center gap-3">
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