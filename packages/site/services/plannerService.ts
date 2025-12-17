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
      .maybeSingle();

    if (error) {
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
  },

  /**
   * Busca histórico de registros (últimos N dias) para o calendário de contribuições
   */
  async getHistorico(planejamentoId: string, dias: number = 90): Promise<PlannerDiario[]> {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - dias);

    const { data, error } = await supabase
      .from('planner_diario')
      .select('*')
      .eq('planejamento_id', planejamentoId)
      .gte('data', formatDate(inicio))
      .lte('data', formatDate(hoje))
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Calcula a sequência atual de dias verdes (streak)
   */
  async getStreak(planejamentoId: string): Promise<{ atual: number; melhor: number }> {
    const { data: records, error } = await supabase
      .from('planner_diario')
      .select('data, semaforo')
      .eq('planejamento_id', planejamentoId)
      .order('data', { ascending: false });

    if (error || !records) {
      return { atual: 0, melhor: 0 };
    }

    // Calcular streak atual (dias verdes consecutivos mais recentes)
    let streakAtual = 0;
    const hoje = formatDate(new Date());
    const ontem = formatDate(new Date(Date.now() - 86400000));

    for (const record of records) {
      // Só conta se for hoje ou ontem para iniciar, depois dias consecutivos
      if (streakAtual === 0 && record.data !== hoje && record.data !== ontem) {
        break;
      }
      if (record.semaforo === 'verde') {
        streakAtual++;
      } else {
        break;
      }
    }

    // Calcular melhor streak
    let melhorStreak = 0;
    let streakTemp = 0;
    const sortedRecords = [...records].sort((a, b) => a.data.localeCompare(b.data));

    for (const record of sortedRecords) {
      if (record.semaforo === 'verde') {
        streakTemp++;
        if (streakTemp > melhorStreak) {
          melhorStreak = streakTemp;
        }
      } else {
        streakTemp = 0;
      }
    }

    return { atual: streakAtual, melhor: melhorStreak };
  },

  /**
   * Busca os blocos de atividade planejados para hoje
   */
  async getAtividadesHoje(planejamentoId: string): Promise<Array<{
    hora: string;
    atividade: string;
    cor: string;
    duracao: number; // em minutos
  }>> {
    const diaSemana = new Date().getDay();

    // Buscar slots do dia (incluindo atividades padrão e personalizadas)
    const { data: slots, error } = await supabase
      .from('planejador_semanal')
      .select(`
        hora_inicio,
        atividade_tipo_id,
        atividade_usuario_id,
        atividade_tipos (
          nome,
          cor
        ),
        atividade_tipos_usuario (
          nome,
          cor
        )
      `)
      .eq('planejamento_id', planejamentoId)
      .eq('dia_semana', diaSemana)
      .order('hora_inicio', { ascending: true });

    if (error || !slots) {
      return [];
    }

    // Agrupar slots consecutivos da mesma atividade
    const atividades: Array<{ hora: string; atividade: string; cor: string; duracao: number }> = [];
    let atividadeAtual: { hora: string; atividade: string; cor: string; duracao: number } | null = null;

    for (const slot of slots) {
      // Verificar atividade padrão ou personalizada
      const atividadeTipo = slot.atividade_tipos as unknown as { nome: string; cor: string } | null;
      const atividadeUsuario = slot.atividade_tipos_usuario as unknown as { nome: string; cor: string } | null;
      const atividade = atividadeTipo || atividadeUsuario;

      if (!atividade) continue;

      if (atividadeAtual && atividadeAtual.atividade === atividade.nome) {
        // Continua a mesma atividade, aumenta duração
        atividadeAtual.duracao += 15;
      } else {
        // Nova atividade
        if (atividadeAtual) {
          atividades.push(atividadeAtual);
        }
        atividadeAtual = {
          hora: slot.hora_inicio,
          atividade: atividade.nome,
          cor: atividade.cor,
          duracao: 15
        };
      }
    }

    if (atividadeAtual) {
      atividades.push(atividadeAtual);
    }

    return atividades;
  },

  /**
   * Gera insights baseados no histórico
   */
  async getInsights(planejamentoId: string): Promise<Array<{ tipo: 'success' | 'warning' | 'tip'; texto: string }>> {
    const historico = await this.getHistorico(planejamentoId, 30);
    const insights: Array<{ tipo: 'success' | 'warning' | 'tip'; texto: string }> = [];

    if (historico.length < 7) {
      insights.push({
        tipo: 'tip',
        texto: 'Continue registrando seus dias para receber insights personalizados!'
      });
      return insights;
    }

    // Análise de dias verdes
    const diasVerdes = historico.filter(r => r.semaforo === 'verde');
    const percentualVerde = (diasVerdes.length / historico.length) * 100;

    if (percentualVerde >= 70) {
      insights.push({
        tipo: 'success',
        texto: `Excelente! ${Math.round(percentualVerde)}% dos seus dias foram verdes. Continue assim!`
      });
    } else if (percentualVerde < 40) {
      insights.push({
        tipo: 'warning',
        texto: `Apenas ${Math.round(percentualVerde)}% dos dias foram verdes. Vamos identificar o que está atrapalhando?`
      });
    }

    // Análise de sono vs produtividade
    const diasComSono = historico.filter(r => r.horas_sono && r.semaforo);
    if (diasComSono.length >= 5) {
      const sonoVerdes = diasComSono.filter(r => r.semaforo === 'verde');
      const mediaSonoVerdes = sonoVerdes.reduce((acc, r) => acc + (r.horas_sono || 0), 0) / (sonoVerdes.length || 1);
      const sonoNaoVerdes = diasComSono.filter(r => r.semaforo !== 'verde');
      const mediaSonoNaoVerdes = sonoNaoVerdes.reduce((acc, r) => acc + (r.horas_sono || 0), 0) / (sonoNaoVerdes.length || 1);

      if (mediaSonoVerdes > mediaSonoNaoVerdes + 0.5) {
        insights.push({
          tipo: 'tip',
          texto: `Você rende mais com ${Math.round(mediaSonoVerdes)}h de sono. Priorize o descanso!`
        });
      }
    }

    // Análise de exercício vs produtividade
    const diasComExercicio = historico.filter(r => r.exercicio_fisico && r.semaforo === 'verde').length;
    const diasSemExercicio = historico.filter(r => !r.exercicio_fisico && r.semaforo === 'verde').length;
    const totalComExercicio = historico.filter(r => r.exercicio_fisico).length;
    const totalSemExercicio = historico.filter(r => !r.exercicio_fisico).length;

    if (totalComExercicio >= 5 && totalSemExercicio >= 5) {
      const taxaComExercicio = diasComExercicio / totalComExercicio;
      const taxaSemExercicio = diasSemExercicio / totalSemExercicio;

      if (taxaComExercicio > taxaSemExercicio + 0.2) {
        insights.push({
          tipo: 'success',
          texto: 'Dias com exercício = mais dias verdes! Mantenha a atividade física.'
        });
      }
    }

    // Análise de dia da semana
    const diasPorSemana: { [key: number]: { total: number; verdes: number } } = {};
    for (const r of historico) {
      const dia = new Date(r.data).getDay();
      if (!diasPorSemana[dia]) {
        diasPorSemana[dia] = { total: 0, verdes: 0 };
      }
      diasPorSemana[dia].total++;
      if (r.semaforo === 'verde') {
        diasPorSemana[dia].verdes++;
      }
    }

    const nomesDias = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
    let melhorDia = -1;
    let melhorTaxa = 0;
    let piorDia = -1;
    let piorTaxa = 1;

    for (const [dia, stats] of Object.entries(diasPorSemana)) {
      if (stats.total >= 2) {
        const taxa = stats.verdes / stats.total;
        if (taxa > melhorTaxa) {
          melhorTaxa = taxa;
          melhorDia = parseInt(dia);
        }
        if (taxa < piorTaxa) {
          piorTaxa = taxa;
          piorDia = parseInt(dia);
        }
      }
    }

    if (melhorDia !== -1 && melhorTaxa > 0.6) {
      insights.push({
        tipo: 'success',
        texto: `Você rende mais nas ${nomesDias[melhorDia]}! (${Math.round(melhorTaxa * 100)}% verdes)`
      });
    }

    if (piorDia !== -1 && piorTaxa < 0.4 && piorDia !== melhorDia) {
      insights.push({
        tipo: 'warning',
        texto: `${nomesDias[piorDia].charAt(0).toUpperCase() + nomesDias[piorDia].slice(1)} são difíceis (${Math.round(piorTaxa * 100)}% verdes). Precisa de estratégia diferente?`
      });
    }

    return insights.slice(0, 3); // Máximo 3 insights
  },

  /**
   * Busca dados para revisão semanal
   */
  async getRevisaoSemanal(planejamentoId: string): Promise<{
    semanaAtual: PlannerSemanal;
    semanaAnterior: PlannerSemanal;
    melhoriaSugerida: string | null;
  }> {
    const hoje = new Date();
    const semanaPassada = new Date(hoje);
    semanaPassada.setDate(semanaPassada.getDate() - 7);

    const semanaAtual = await this.getWeekSummary(planejamentoId, hoje);
    const semanaAnterior = await this.getWeekSummary(planejamentoId, semanaPassada);

    let melhoriaSugerida: string | null = null;

    // Sugestão baseada na comparação
    if (semanaAtual.diasVerdes < semanaAnterior.diasVerdes) {
      melhoriaSugerida = 'Você teve menos dias verdes esta semana. O que mudou?';
    } else if (semanaAtual.horasEstudadas < semanaAnterior.horasEstudadas * 0.8) {
      melhoriaSugerida = 'Suas horas de estudo diminuíram. Revise seu planejamento.';
    } else if (semanaAtual.diasVerdes > semanaAnterior.diasVerdes) {
      melhoriaSugerida = 'Parabéns! Você melhorou em relação à semana passada!';
    }

    return {
      semanaAtual,
      semanaAnterior,
      melhoriaSugerida
    };
  }
};
