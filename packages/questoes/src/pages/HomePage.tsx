import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTrailStore, useAuthStore, useUIStore } from '../stores';
import { Button, FadeIn, RetaFinalUpsellModal } from '../components/ui';
import { TrailMission, StudyMode } from '../types';
import { TrailMap } from '../components/trail/TrailMap';
import { RoundSelector } from '../components/trail/RoundSelector';
import { ModeToggle, ModeToggleCompact } from '../components/trail/ModeToggle';
import { RetaFinalCountdown } from '../components/trail/RetaFinalCountdown';
import {
  userPreparatoriosService,
  getRodadasComProgresso,
  rodadasToTrailRounds,
  countMissoesProgress,
  switchUserMode,
  grantRetaFinalAccess,
  grantNormalAccess,
} from '../services';

// Skeleton Loading Component for Trail
function TrailSkeleton() {
  const skeletonNodes = [0, 1, 2, 3, 4];
  const CONFIG = {
    ITEM_HEIGHT: 140,
    WAVE_AMPLITUDE: 86,
    START_Y: 80,
  };

  const getPosition = (index: number) => {
    const side = index % 2 === 0 ? -1 : 1;
    const xOffset = side * CONFIG.WAVE_AMPLITUDE;
    const y = CONFIG.START_Y + index * CONFIG.ITEM_HEIGHT;
    return { x: xOffset, y };
  };

  return (
    <div className="relative w-full pt-20" style={{ height: getPosition(skeletonNodes.length - 1).y + 150 }}>
      {/* Skeleton path line */}
      <div className="absolute left-1/2 top-0 w-1 h-full">
        <div className="w-full h-full bg-gradient-to-b from-[#2A2A2A] via-[#3A3A3A] to-[#2A2A2A] opacity-30 rounded-full" />
      </div>

      {/* Skeleton nodes */}
      {skeletonNodes.map((_, index) => {
        const pos = getPosition(index);
        return (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{
              top: pos.y,
              left: `calc(50% + ${pos.x}px)`
            }}
          >
            {/* Skeleton button */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1,
              }}
              className="w-16 h-16 rounded-2xl bg-[#2A2A2A] border-2 border-[#3A3A3A] rotate-45"
            />
            {/* Skeleton label */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1 + 0.2,
              }}
              className="mt-8 w-20 h-6 rounded-lg bg-[#2A2A2A]"
            />
          </div>
        );
      })}

      {/* Loading text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[#6E6E6E] text-sm">
        <span>Carregando trilha...</span>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyTrailState() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-6xl mb-4"
      >
        🗺️
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">
        Sua trilha está vazia
      </h2>
      <p className="text-[#A0A0A0] mb-6 max-w-xs">
        Parece que você ainda não tem uma trilha de estudos configurada.
        Vamos criar uma agora!
      </p>
      <Button onClick={() => navigate('/onboarding')}>
        Configurar Trilha
      </Button>
    </div>
  );
}

// No Preparatorios State
function NoPreparatoriosState({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-6xl mb-4"
      >
        📚
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">
        Nenhum preparatório ainda
      </h2>
      <p className="text-[#A0A0A0] mb-6 max-w-xs">
        Adicione seu primeiro preparatório para começar sua jornada de estudos!
      </p>
      <Button onClick={onAddNew}>
        Adicionar Preparatório
      </Button>
    </div>
  );
}


export default function HomePage() {
  const navigate = useNavigate();
  const {
    rounds,
    setSelectedMissionId,
    userPreparatorios,
    selectedPreparatorioId,
    setUserPreparatorios,
    setSelectedPreparatorioId,
    setRounds,
    setCurrentTrail,
    setPreparatorio,
    preparatorio,
    isLoading,
    setLoading,
    viewingRoundIndex,
    setViewingRoundIndex,
    getMissionUrl,
    justCompletedMissionId,
    clearJustCompletedMission,
    reset,
  } = useTrailStore();
  const { user, profile } = useAuthStore();
  const { addToast, isSidebarOpen } = useUIStore();

  // Mode toggle state
  const [upsellModal, setUpsellModal] = useState<{
    isOpen: boolean;
    targetMode: StudyMode;
  }>({ isOpen: false, targetMode: 'reta_final' });
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  // Get the currently selected preparatorio with mode access info
  const selectedPrep = useMemo(() => {
    return userPreparatorios.find((p) => p.id === selectedPreparatorioId);
  }, [userPreparatorios, selectedPreparatorioId]);

  // Mode access from current preparatorio
  const hasNormalAccess = selectedPrep?.has_normal_access ?? true;
  const hasRetaFinalAccess = selectedPrep?.has_reta_final_access ?? false;
  const currentMode: StudyMode = selectedPrep?.current_mode ?? 'normal';

  // Handle mode change
  const handleModeChange = useCallback(async (mode: StudyMode) => {
    if (!user?.id || !selectedPrep) return;

    setIsSwitchingMode(true);
    try {
      const result = await switchUserMode(user.id, selectedPrep.preparatorio_id, mode);

      if (result.success) {
        // Update local state by reloading preparatorios
        const updatedPreparatorios = userPreparatorios.map((p) =>
          p.id === selectedPreparatorioId
            ? { ...p, current_mode: mode }
            : p
        );
        setUserPreparatorios(updatedPreparatorios);

        // Clear rounds to force reload with new mode
        setRounds([]);

        addToast(
          'success',
          mode === 'reta_final'
            ? 'Modo Reta Final ativado!'
            : 'Modo Normal ativado!'
        );
      } else {
        addToast('error', result.error || 'Erro ao alternar modo');
      }
    } catch (err) {
      console.error('Error switching mode:', err);
      addToast('error', 'Erro ao alternar modo');
    } finally {
      setIsSwitchingMode(false);
    }
  }, [user?.id, selectedPrep, selectedPreparatorioId, userPreparatorios, setUserPreparatorios, setRounds, addToast]);

  // Handle upsell click (when user doesn't have access)
  const handleUpsellClick = useCallback((targetMode: StudyMode) => {
    setUpsellModal({ isOpen: true, targetMode });
  }, []);

  // Close upsell modal
  const handleCloseUpsell = useCallback(() => {
    setUpsellModal({ isOpen: false, targetMode: 'reta_final' });
  }, []);

  // Handle unlock (for testing: auto-grant access and switch to mode)
  const handleUnlock = useCallback(async () => {
    if (!user?.id || !selectedPrep) return;

    const targetMode = upsellModal.targetMode;

    try {
      // Grant access based on target mode
      if (targetMode === 'reta_final') {
        const result = await grantRetaFinalAccess(user.id, selectedPrep.preparatorio_id);
        if (!result.success) {
          addToast('error', result.error || 'Erro ao desbloquear');
          return;
        }
      } else {
        const result = await grantNormalAccess(user.id, selectedPrep.preparatorio_id);
        if (!result.success) {
          addToast('error', result.error || 'Erro ao desbloquear');
          return;
        }
      }

      // Switch to the unlocked mode
      await switchUserMode(user.id, selectedPrep.preparatorio_id, targetMode);

      // Update local state with access and current mode
      const updatedPreparatorios = userPreparatorios.map((p) =>
        p.id === selectedPreparatorioId
          ? {
              ...p,
              has_reta_final_access: targetMode === 'reta_final' ? true : p.has_reta_final_access,
              has_normal_access: targetMode === 'normal' ? true : p.has_normal_access,
              current_mode: targetMode,
            }
          : p
      );
      setUserPreparatorios(updatedPreparatorios);

      // Clear rounds to force reload with new mode
      setRounds([]);

      addToast('success', `Modo ${targetMode === 'reta_final' ? 'Reta Final' : 'Normal'} ativado!`);
      handleCloseUpsell();
    } catch (err) {
      console.error('Error unlocking mode:', err);
      addToast('error', 'Erro ao desbloquear modo');
    }
  }, [user?.id, selectedPrep, upsellModal.targetMode, selectedPreparatorioId, userPreparatorios, setUserPreparatorios, setRounds, addToast, handleCloseUpsell]);

  // Carregar preparatórios do usuário
  useEffect(() => {
    async function loadUserPreparatorios() {
      if (!user?.id) return;

      // Se os dados em cache são de outro usuário, limpar estado
      if (userPreparatorios.length > 0 && userPreparatorios[0].user_id !== user.id) {
        console.warn('[HomePage] Dados de outro usuário detectados. Limpando estado...');
        reset();
      }
      // Sempre buscar dados frescos para garantir que preparatórios excluídos não apareçam

      console.log('[HomePage] Carregando preparatórios...');
      setLoading(true);
      try {
        const preparatorios = await userPreparatoriosService.getUserPreparatorios(user.id);

        // Calcular progresso para cada preparatório usando o novo serviço
        const preparatoriosWithProgress = await Promise.all(
          preparatorios.map(async (prep) => {
            // Usar o novo serviço que busca das tabelas rodadas/missoes
            const progress = await countMissoesProgress(user.id, prep.preparatorio_id);
            return {
              ...prep,
              totalMissions: progress.total,
              completedMissions: progress.completed,
              progressPercent: progress.percent,
            };
          })
        );

        setUserPreparatorios(preparatoriosWithProgress);

        // Determinar qual preparatório selecionar
        if (preparatoriosWithProgress.length > 0) {
          // Primeiro, verificar se já temos um selecionado válido
          const currentlySelected = preparatoriosWithProgress.find(
            (p) => p.id === selectedPreparatorioId
          );

          if (!currentlySelected) {
            // Buscar preparatório principal salvo no banco
            const { loadMainPreparatorioFromDb } = useTrailStore.getState();
            const mainPrepId = await loadMainPreparatorioFromDb(user.id);

            // Encontrar o user_preparatorio que corresponde ao main_preparatorio_id
            const mainPrep = mainPrepId
              ? preparatoriosWithProgress.find((p) => p.preparatorio_id === mainPrepId)
              : null;

            if (mainPrep) {
              // Usar o preparatório principal salvo
              console.log('[HomePage] Usando preparatório principal do banco:', mainPrepId);
              setSelectedPreparatorioId(mainPrep.id);
            } else {
              // Fallback: usar o primeiro e salvar como principal
              console.log('[HomePage] Definindo primeiro preparatório como principal');
              setSelectedPreparatorioId(preparatoriosWithProgress[0].id, user.id);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar preparatórios:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserPreparatorios();
  }, [user?.id]);

  // Carregar trilha do preparatório selecionado
  useEffect(() => {
    async function loadTrailData() {
      if (!selectedPreparatorioId || !user?.id) return;

      const selectedPrep = userPreparatorios.find((p) => p.id === selectedPreparatorioId);
      if (!selectedPrep) return;

      // Se já tem rounds carregados para este preparatório e não acabou de completar missão, não recarregar
      // Se acabou de completar uma missão (justCompletedMissionId), precisa recarregar para atualizar status
      if (rounds.length > 0 && preparatorio?.id === selectedPrep.preparatorio_id && !justCompletedMissionId) {
        console.log('[HomePage] Trilha já carregada, pulando fetch');
        setLoading(false);
        return;
      }

      console.log('[HomePage] Carregando trilha...');
      setLoading(true);
      try {
        // Buscar rodadas com missões do sistema de planejamento
        const rodadasComProgresso = await getRodadasComProgresso(
          user.id,
          selectedPrep.preparatorio_id
        );

        // Converter para o formato usado pela trilha
        const roundsData = rodadasToTrailRounds(rodadasComProgresso);
        setRounds(roundsData);

        // Atualizar dados do preparatório atual
        setPreparatorio(selectedPrep.preparatorio);
        setCurrentTrail({
          id: selectedPrep.id,
          user_id: selectedPrep.user_id,
          preparatorio_id: selectedPrep.preparatorio_id,
          nivel_usuario: selectedPrep.nivel_usuario,
          current_round: selectedPrep.current_round,
          created_at: selectedPrep.created_at,
        });
      } catch (err) {
        console.error('Erro ao carregar trilha:', err);
        // Não usar fallback - deixar vazio para mostrar estado empty
        setRounds([]);
      } finally {
        setLoading(false);
      }
    }

    loadTrailData();
  }, [selectedPreparatorioId, userPreparatorios, justCompletedMissionId]);

  // Use real data only - no demo fallback
  const displayRounds = rounds;

  // Flatten missions for the new TrailMap
  const allMissions = useMemo(() => {
    return displayRounds.flatMap((r) => r.missions);
  }, [displayRounds]);

  // Find the current active mission index
  const currentMissionIndex = useMemo(() => {
    const idx = allMissions.findIndex((m) => m.status === 'available' || m.status === 'in_progress');
    if (idx === -1) {
      if (allMissions.length > 0 && allMissions[allMissions.length - 1].status === 'completed') {
        return allMissions.length - 1;
      }
      return 0;
    }
    return idx;
  }, [allMissions]);

  const handleMissionClick = (mission: TrailMission, tab?: 'teoria' | 'questoes') => {
    if (mission.status === 'locked') return;
    setSelectedMissionId(mission.id);
    const url = getMissionUrl(mission);
    const finalUrl = tab ? `${url}?tab=${tab}` : url;
    navigate(finalUrl);
  };

  const handleAddNewPreparatorio = useCallback(() => {
    navigate('/loja/preparatorios');
  }, [navigate]);

  // No preparatorios state (só mostra quando terminou de carregar e não tem nenhum)
  if (!isLoading && userPreparatorios.length === 0) {
    return <NoPreparatoriosState onAddNew={handleAddNewPreparatorio} />;
  }

  // Só mostra skeleton se está carregando E não tem dados já carregados
  // Isso evita mostrar skeleton ao voltar da missão quando dados já estão no store
  const isLoadingAnything = isLoading && displayRounds.length === 0;

  return (
    <div className="min-h-full pb-20">
      {/* Trail Map - Centralizado */}
      {isLoadingAnything ? (
        <TrailSkeleton />
      ) : displayRounds.length === 0 ? (
        <EmptyTrailState />
      ) : (
        <FadeIn>
          {/* Controls Row: RoundSelector + ModeToggle (mobile only - compact versions) */}
          <div className={`flex px-4 pt-4 pb-2 lg:hidden ${
            selectedPrep?.preparatorio?.data_prova
              ? 'justify-between items-center'
              : 'justify-center'
          }`}>
            {/* RoundSelector - mobile only (compact version) */}
            {rounds.length > 0 && (
              <RoundSelector
                currentRoundIndex={viewingRoundIndex || 0}
                totalRounds={rounds.length}
                onRoundChange={setViewingRoundIndex}
                compact
              />
            )}

            {/* ModeToggle - only when preparatorio has data_prova (compact version) */}
            {selectedPrep?.preparatorio?.data_prova && (
              <ModeToggleCompact
                currentMode={currentMode}
                hasNormalAccess={hasNormalAccess}
                hasRetaFinalAccess={hasRetaFinalAccess}
                onModeChange={handleModeChange}
                onUpsellClick={handleUpsellClick}
                isLoading={isSwitchingMode}
              />
            )}
          </div>

          {/* ModeToggle for Desktop - only when preparatorio has data_prova */}
          {selectedPrep?.preparatorio?.data_prova && (
            <div className="hidden lg:flex justify-end px-4 pt-4 pb-2">
              <ModeToggle
                currentMode={currentMode}
                hasNormalAccess={hasNormalAccess}
                hasRetaFinalAccess={hasRetaFinalAccess}
                onModeChange={handleModeChange}
                onUpsellClick={handleUpsellClick}
                isLoading={isSwitchingMode}
              />
            </div>
          )}

          {/* Reta Final Countdown - only shown when in Reta Final mode */}
          {currentMode === 'reta_final' && selectedPrep?.preparatorio?.data_prova && (
            <div className="px-4">
              <RetaFinalCountdown
                dataProva={selectedPrep.preparatorio.data_prova}
                userName={profile?.full_name || user?.user_metadata?.full_name}
              />
            </div>
          )}

          <div className="relative overflow-hidden pt-12" data-tour="trail-map">
            <TrailMap
              rounds={displayRounds}
              onMissionClick={handleMissionClick}
              userAvatar={profile?.avatar_url || user?.user_metadata?.avatar_url}
              viewingRoundIndex={viewingRoundIndex}
              onViewingRoundChange={setViewingRoundIndex}
              justCompletedMissionId={justCompletedMissionId}
              onAnimationComplete={clearJustCompletedMission}
            />
          </div>
        </FadeIn>
      )}

      {/* Continue Button - centralizado na região de conteúdo */}
      {allMissions.length > 0 && (
        <div
          className={`fixed bottom-20 lg:bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-40 transition-all duration-300 ${isSidebarOpen ? 'lg:left-64' : 'lg:left-0'}`}
          data-tour="continue-button"
        >
          <div className="max-w-md mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                const nextMission = allMissions.find((m) => m.status === 'available' || m.status === 'in_progress');
                if (nextMission) {
                  const url = getMissionUrl(nextMission);
                  navigate(url);
                }
              }}
              leftIcon={<Play size={20} />}
              className="shadow-xl"
            >
              Continuar Estudando
            </Button>
          </div>
        </div>
      )}

      {/* Reta Final Upsell Modal */}
      <RetaFinalUpsellModal
        isOpen={upsellModal.isOpen}
        onClose={handleCloseUpsell}
        targetMode={upsellModal.targetMode}
        preparatorioName={selectedPrep?.preparatorio?.nome || 'Preparatório'}
        checkoutUrl={selectedPrep?.preparatorio?.checkout_url}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
