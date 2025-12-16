import React, { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { useTrailStore, useAuthStore, useUIStore } from '../stores';
import { Button, FadeIn } from '../components/ui';
import { TrailMission, MissionStatus } from '../types';
import { TrailMap } from '../components/trail/TrailMap';
import { userPreparatoriosService, trailService } from '../services';

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
        Sua trilha esta vazia
      </h2>
      <p className="text-[#A0A0A0] mb-6 max-w-xs">
        Parece que voce ainda nao tem uma trilha de estudos configurada.
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
        Nenhum preparatorio ainda
      </h2>
      <p className="text-[#A0A0A0] mb-6 max-w-xs">
        Adicione seu primeiro preparatorio para comecar sua jornada de estudos!
      </p>
      <Button onClick={onAddNew}>
        Adicionar Preparatorio
      </Button>
    </div>
  );
}

// Demo Trail Data (fallback when no real data)
const DEMO_ROUNDS = [
  {
    id: 'round-1',
    trail_id: 'demo',
    round_number: 1,
    status: 'active' as const,
    tipo: 'normal' as const,
    created_at: new Date().toISOString(),
    missions: [
      { id: 'm1', round_id: 'round-1', materia_id: '1', ordem: 1, status: 'completed' as MissionStatus, tipo: 'normal' as const, score: 85, attempts: 1, created_at: '', assunto: { id: '1', materia_id: '1', nome: 'Concordancia Verbal', ordem: 1, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm2', round_id: 'round-1', materia_id: '2', ordem: 2, status: 'completed' as MissionStatus, tipo: 'normal' as const, score: 72, attempts: 1, created_at: '', assunto: { id: '2', materia_id: '2', nome: 'Numeros Naturais', ordem: 1, nivel_dificuldade: 'iniciante' as const, created_at: '' } },
      { id: 'm3', round_id: 'round-1', materia_id: '1', ordem: 3, status: 'available' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '3', materia_id: '1', nome: 'Regencia Verbal', ordem: 2, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm4', round_id: 'round-1', materia_id: '2', ordem: 4, status: 'locked' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '4', materia_id: '2', nome: 'Fracoes', ordem: 2, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm5', round_id: 'round-1', materia_id: '1', ordem: 5, status: 'locked' as MissionStatus, tipo: 'normal' as const, attempts: 0, created_at: '', assunto: { id: '5', materia_id: '1', nome: 'Crase', ordem: 3, nivel_dificuldade: 'avancado' as const, created_at: '' } },
    ],
  },
  {
    id: 'round-2',
    trail_id: 'demo',
    round_number: 2,
    status: 'locked' as const,
    tipo: 'normal' as const,
    created_at: new Date().toISOString(),
    missions: [
      { id: 'm6', round_id: 'round-2', materia_id: '1', ordem: 1, status: 'locked' as MissionStatus, tipo: 'revisao' as const, attempts: 0, created_at: '', assunto: { id: '6', materia_id: '1', nome: 'Revisao Geral', ordem: 1, nivel_dificuldade: 'intermediario' as const, created_at: '' } },
      { id: 'm7', round_id: 'round-2', materia_id: '1', ordem: 2, status: 'locked' as MissionStatus, tipo: 'revisao' as const, attempts: 0, created_at: '', assunto: { id: '7', materia_id: '1', nome: 'Simulado Final', ordem: 2, nivel_dificuldade: 'avancado' as const, created_at: '' } },
    ],
  },
];

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
    isLoading,
    setLoading,
  } = useTrailStore();
  const { user } = useAuthStore();
  const { addToast, isSidebarOpen } = useUIStore();

  // Carregar preparatórios do usuário
  useEffect(() => {
    async function loadUserPreparatorios() {
      if (!user?.id) return;

      setLoading(true);
      try {
        const preparatorios = await userPreparatoriosService.getUserPreparatorios(user.id);

        // Calcular progresso para cada preparatório
        const preparatoriosWithProgress = await Promise.all(
          preparatorios.map(async (prep) => {
            const progress = await userPreparatoriosService.calculateProgress(prep.id);
            return {
              ...prep,
              totalMissions: progress.total,
              completedMissions: progress.completed,
              progressPercent: progress.percent,
            };
          })
        );

        setUserPreparatorios(preparatoriosWithProgress);

        // Se não há preparatório selecionado, selecionar o primeiro
        if (!selectedPreparatorioId && preparatoriosWithProgress.length > 0) {
          setSelectedPreparatorioId(preparatoriosWithProgress[0].id);
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

      setLoading(true);
      try {
        // Buscar rodadas com missões
        const roundsData = await trailService.fetchRoundsWithMissions(selectedPrep.id);
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
        // Usar dados demo como fallback
        setRounds(DEMO_ROUNDS);
      } finally {
        setLoading(false);
      }
    }

    loadTrailData();
  }, [selectedPreparatorioId, userPreparatorios]);

  // Use demo data if no real data
  const displayRounds = rounds.length > 0 ? rounds : (userPreparatorios.length > 0 ? DEMO_ROUNDS : []);

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

  const handleMissionClick = (mission: TrailMission) => {
    if (mission.status === 'locked') return;
    setSelectedMissionId(mission.id);
    navigate(`/missao/${mission.id}`);
  };

  const handleAddNewPreparatorio = useCallback(() => {
    navigate('/loja/preparatorios');
  }, [navigate]);

  // Loading state
  if (isLoading && userPreparatorios.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FFB800] mx-auto mb-4" />
          <p className="text-[#A0A0A0]">Carregando seus preparatorios...</p>
        </div>
      </div>
    );
  }

  // No preparatorios state
  if (!isLoading && userPreparatorios.length === 0) {
    return <NoPreparatoriosState onAddNew={handleAddNewPreparatorio} />;
  }

  return (
    <div className="min-h-full pb-20">
      {/* Trail Map */}
      {displayRounds.length === 0 ? (
        <EmptyTrailState />
      ) : (
        <FadeIn>
          <div className="pt-8 relative overflow-hidden" data-tour="trail-map">
            <TrailMap
              missions={allMissions}
              currentMissionIndex={currentMissionIndex}
              onMissionClick={handleMissionClick}
              userAvatar={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"}
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
                  navigate(`/missao/${nextMission.id}`);
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
    </div>
  );
}
