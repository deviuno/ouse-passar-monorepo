import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService, SavePlannerInput } from '../services/plannerService';
import { planejadorService } from '../services/planejadorService';
// import { PlannerDiario } from '../lib/database.types'; // REMOVED

// Keys para cache
export const plannerKeys = {
  all: ['planner'] as const,
  today: (id: string) => [...plannerKeys.all, 'today', id] as const,
  streak: (id: string) => [...plannerKeys.all, 'streak', id] as const,
  historico: (id: string) => [...plannerKeys.all, 'historico', id] as const,
  atividadesHoje: (id: string) => [...plannerKeys.all, 'atividadesHoje', id] as const,
};

export const planejadorKeys = {
  all: ['planejador'] as const,
  defaultActivities: () => [...planejadorKeys.all, 'defaultActivities'] as const,
  userActivities: (id: string) => [...planejadorKeys.all, 'userActivities', id] as const,
  slots: (id: string) => [...planejadorKeys.all, 'slots', id] as const,
};

// Hook para planner de hoje
export function usePlannerToday(planejamentoId: string | undefined) {
  return useQuery({
    queryKey: plannerKeys.today(planejamentoId || ''),
    queryFn: () => plannerService.getToday(planejamentoId!),
    enabled: !!planejamentoId,
  });
}

// Hook para streak
export function usePlannerStreak(planejamentoId: string | undefined) {
  return useQuery({
    queryKey: plannerKeys.streak(planejamentoId || ''),
    queryFn: () => plannerService.getStreak(planejamentoId!),
    enabled: !!planejamentoId,
  });
}

// Hook para histórico
export function usePlannerHistorico(planejamentoId: string | undefined, dias: number = 180) {
  return useQuery({
    queryKey: plannerKeys.historico(planejamentoId || ''),
    queryFn: () => plannerService.getHistorico(planejamentoId!, dias),
    enabled: !!planejamentoId,
  });
}

// Hook para atividades de hoje
export function useAtividadesHoje(planejamentoId: string | undefined) {
  return useQuery({
    queryKey: plannerKeys.atividadesHoje(planejamentoId || ''),
    queryFn: () => plannerService.getAtividadesHoje(planejamentoId!),
    enabled: !!planejamentoId,
    staleTime: 1000 * 60 * 2, // 2 minutos - atividades mudam mais frequentemente
    refetchOnMount: 'always', // Sempre refetch ao montar (dados mudam frequentemente)
  });
}

// Hook para atividades padrão (global, não muda por usuário)
export function useDefaultActivities() {
  return useQuery({
    queryKey: planejadorKeys.defaultActivities(),
    queryFn: () => planejadorService.getDefaultActivities(),
    staleTime: 1000 * 60 * 60, // 1 hora - raramente muda
  });
}

// Hook para atividades do usuário
export function useUserActivities(planejamentoId: string | undefined) {
  return useQuery({
    queryKey: planejadorKeys.userActivities(planejamentoId || ''),
    queryFn: () => planejadorService.getUserActivities(planejamentoId!),
    enabled: !!planejamentoId,
  });
}

// Hook para slots do planejador
export function usePlanejadorSlots(planejamentoId: string | undefined) {
  return useQuery({
    queryKey: planejadorKeys.slots(planejamentoId || ''),
    queryFn: () => planejadorService.getSlots(planejamentoId!),
    enabled: !!planejamentoId,
  });
}

// Hook para salvar planner com invalidação de cache
export function useSavePlanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SavePlannerInput) => plannerService.save(input),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas para forçar refetch
      queryClient.invalidateQueries({ queryKey: plannerKeys.today(variables.planejamento_id) });
      queryClient.invalidateQueries({ queryKey: plannerKeys.streak(variables.planejamento_id) });
      queryClient.invalidateQueries({ queryKey: plannerKeys.historico(variables.planejamento_id) });
    },
  });
}

// Hook para criar atividade do usuário
export function useCreateUserActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { planejamentoId: string; nome: string; descricao?: string; cor: string; icone?: string }) =>
      planejadorService.createUserActivity({
        planejamento_id: params.planejamentoId,
        nome: params.nome,
        descricao: params.descricao,
        cor: params.cor,
        icone: params.icone,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: planejadorKeys.userActivities(variables.planejamentoId) });
    },
  });
}

// Hook para atualizar atividade do usuário
export function useUpdateUserActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { planejamentoId: string; atividadeId: string; nome: string; descricao?: string; cor: string; icone?: string }) =>
      planejadorService.updateUserActivity(params.atividadeId, {
        nome: params.nome,
        descricao: params.descricao,
        cor: params.cor,
        icone: params.icone,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: planejadorKeys.userActivities(variables.planejamentoId) });
    },
  });
}

// Hook para deletar atividade do usuário
export function useDeleteUserActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { planejamentoId: string; atividadeId: string }) =>
      planejadorService.deleteUserActivity(params.atividadeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: planejadorKeys.userActivities(variables.planejamentoId) });
      queryClient.invalidateQueries({ queryKey: planejadorKeys.slots(variables.planejamentoId) });
    },
  });
}

// Hook para marcar/desmarcar slot
export function useSetSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      planejamentoId: string;
      diaSemana: number;
      hora: string;
      atividadeTipoId: string | null;
      atividadeUsuarioId: string | null;
    }) => {
      if (params.atividadeTipoId || params.atividadeUsuarioId) {
        await planejadorService.setSlot(
          params.planejamentoId,
          params.diaSemana,
          params.hora,
          params.atividadeTipoId,
          params.atividadeUsuarioId
        );
      } else {
        await planejadorService.clearSlot(params.planejamentoId, params.diaSemana, params.hora);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidar slots e atividades de hoje
      queryClient.invalidateQueries({ queryKey: planejadorKeys.slots(variables.planejamentoId) });
      queryClient.invalidateQueries({ queryKey: plannerKeys.atividadesHoje(variables.planejamentoId) });
    },
  });
}
