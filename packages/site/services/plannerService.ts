import { supabase } from '../lib/supabase';
import { PlannerDiario, PlannerSemanal, SemaforoCor } from '../lib/database.types';

// Helper para formatar data como YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper para obter início da semana (domingo)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper para obter fim da semana (sábado)
const getWeekEnd = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
};

export interface SavePlannerInput {
  planejamento_id: string;
  data: string;
  humor?: number | null;
  energia?: number | null;
  horas_planejadas?: number;
  horas_estudadas?: number;
  missoes_concluidas?: number;
  questoes_feitas?: number;
  percentual_acertos?: number | null;
  materia_principal?: string | null;
  fez_revisao?: boolean;
  usou_tecnica_estudo?: boolean;
  exercicio_fisico?: boolean;
  litros_agua?: number | null;
  horas_sono?: number | null;
  sem_celular_antes?: boolean;
  revisao_rapida?: boolean;
  registrou_erro?: boolean;
  oracao_devocional?: boolean;
  gratidao?: string | null;
  motivacao_dia?: string | null;
  semaforo?: SemaforoCor | null;
  semaforo_motivo?: string | null;
  meta_minima_amanha?: number | null;
  missao_prioritaria_amanha?: string | null;
}

export const plannerService = {
  /**
   * Busca o registro do planner para uma data específica
   */
  async getByDate(planejamentoId: string, data: string): Promise<PlannerDiario | null> {
    const { data: planner, error } = await supabase
      .from('planner_diario')
      .select('*')
      .eq('planejamento_id', planejamentoId)
      .eq('data', data)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar planner:', error);
      throw error;
    }

    return planner;
  },

  /**
   * Busca o registro do planner para hoje
   */
  async getToday(planejamentoId: string): Promise<PlannerDiario | null> {
    const today = formatDate(new Date());
    return this.getByDate(planejamentoId, today);
  },

  /**
   * Cria ou atualiza o registro do planner (upsert)
   */
  async save(input: SavePlannerInput): Promise<PlannerDiario> {
    const { data, error } = await supabase
      .from('planner_diario')
      .upsert(
        {
          ...input,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'planejamento_id,data' }
      )
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar planner:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca registros da semana atual
   */
  async getWeekRecords(planejamentoId: string, referenceDate?: Date): Promise<PlannerDiario[]> {
    const date = referenceDate || new Date();
    const weekStart = formatDate(getWeekStart(date));
    const weekEnd = formatDate(getWeekEnd(date));

    const { data, error } = await supabase
      .from('planner_diario')
      .select('*')
      .eq('planejamento_id', planejamentoId)
      .gte('data', weekStart)
      .lte('data', weekEnd)
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao buscar registros da semana:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Calcula o resumo semanal
   */
  async getWeekSummary(planejamentoId: string, referenceDate?: Date): Promise<PlannerSemanal> {
    const records = await this.getWeekRecords(planejamentoId, referenceDate);

    const diasVerdes = records.filter(r => r.semaforo === 'verde').length;
    const horasEstudadas = records.reduce((acc, r) => acc + (r.horas_estudadas || 0), 0);
    const missoesTotal = records.reduce((acc, r) => acc + (r.missoes_concluidas || 0), 0);
    const questoesTotal = records.reduce((acc, r) => acc + (r.questoes_feitas || 0), 0);

    // Calcular média de acertos (apenas dos dias que têm percentual)
    const diasComAcertos = records.filter(r => r.percentual_acertos !== null);
    const mediaAcertos = diasComAcertos.length > 0
      ? Math.round(diasComAcertos.reduce((acc, r) => acc + (r.percentual_acertos || 0), 0) / diasComAcertos.length)
      : null;

    return {
      diasVerdes,
      horasEstudadas: Math.round(horasEstudadas * 10) / 10,
      missoesTotal,
      questoesTotal,
      mediaAcertos
    };
  },

  /**
   * Calcula horas planejadas para um dia específico baseado no planejador semanal
   */
  async calcularHorasPlanejadas(planejamentoId: string, diaSemana: number): Promise<number> {
    // Buscar o ID da atividade "Estudar"
    const { data: atividadeEstudar } = await supabase
      .from('atividade_tipos')
      .select('id')
      .eq('nome', 'Estudar')
      .eq('is_default', true)
      .single();

    if (!atividadeEstudar) {
      return 0;
    }

    // Buscar slots de estudo para o dia da semana
    const { data: slots, error } = await supabase
      .from('planejador_semanal')
      .select('*')
      .eq('planejamento_id', planejamentoId)
      .eq('dia_semana', diaSemana)
      .eq('atividade_tipo_id', atividadeEstudar.id);

    if (error) {
      console.error('Erro ao buscar slots:', error);
      return 0;
    }

    // Cada slot é 15 minutos = 0.25 horas
    return (slots?.length || 0) * 0.25;
  },

  /**
   * Busca matérias disponíveis do preparatório
   */
  async getMaterias(preparatorioId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .select('titulo')
      .eq('preparatorio_id', preparatorioId)
      .eq('tipo', 'materia')
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar matérias:', error);
      return [];
    }

    return data?.map(d => d.titulo) || [];
  },

  /**
   * Obtém dados formatados para exibição
   */
  formatDayInfo(date: Date): { diaSemana: string; dataFormatada: string; diaSemanaNumero: number } {
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    return {
      diaSemana: diasSemana[date.getDay()],
      dataFormatada: `${date.getDate()} de ${meses[date.getMonth()]}`,
      diaSemanaNumero: date.getDay()
    };
  }
};
