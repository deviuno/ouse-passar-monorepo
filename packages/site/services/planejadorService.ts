import { supabase } from '../lib/supabase';
import { AtividadeTipo, AtividadeUsuario, PlanejadorSlot } from '../lib/database.types';

export interface CreateAtividadeInput {
  planejamento_id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
}

export interface ResumoSemanal {
  totalHoras: number;
  horasPorAtividade: Record<string, { nome: string; horas: number; cor: string }>;
  horasPorDia: number[];
}

export const planejadorService = {
  /**
   * Busca todos os tipos de atividade padrão do sistema
   */
  async getDefaultActivities(): Promise<AtividadeTipo[]> {
    const { data, error } = await supabase
      .from('atividade_tipos')
      .select('*')
      .eq('is_default', true)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar atividades padrão:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Busca atividades personalizadas do usuário para um planejamento
   */
  async getUserActivities(planejamentoId: string): Promise<AtividadeUsuario[]> {
    const { data, error } = await supabase
      .from('atividade_tipos_usuario')
      .select('*')
      .eq('planejamento_id', planejamentoId)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar atividades do usuário:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Cria uma nova atividade personalizada
   */
  async createUserActivity(input: CreateAtividadeInput): Promise<AtividadeUsuario> {
    // Buscar última ordem
    const { data: existing } = await supabase
      .from('atividade_tipos_usuario')
      .select('ordem')
      .eq('planejamento_id', input.planejamento_id)
      .order('ordem', { ascending: false })
      .limit(1);

    const nextOrdem = (existing?.[0]?.ordem || 0) + 1;

    const { data, error } = await supabase
      .from('atividade_tipos_usuario')
      .insert({
        planejamento_id: input.planejamento_id,
        nome: input.nome,
        descricao: input.descricao || null,
        cor: input.cor,
        icone: input.icone || null,
        ordem: nextOrdem
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }

    return data;
  },

  /**
   * Deleta uma atividade personalizada
   */
  async deleteUserActivity(atividadeId: string): Promise<void> {
    const { error } = await supabase
      .from('atividade_tipos_usuario')
      .delete()
      .eq('id', atividadeId);

    if (error) {
      console.error('Erro ao deletar atividade:', error);
      throw error;
    }
  },

  /**
   * Busca todos os slots do planejador de um planejamento
   */
  async getSlots(planejamentoId: string): Promise<PlanejadorSlot[]> {
    const { data, error } = await supabase
      .from('planejador_semanal')
      .select('*')
      .eq('planejamento_id', planejamentoId);

    if (error) {
      console.error('Erro ao buscar slots:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Marca um slot com uma atividade (upsert)
   */
  async setSlot(
    planejamentoId: string,
    diaSemana: number,
    horaInicio: string,
    atividadeTipoId: string | null,
    atividadeUsuarioId: string | null
  ): Promise<PlanejadorSlot> {
    const { data, error } = await supabase
      .from('planejador_semanal')
      .upsert(
        {
          planejamento_id: planejamentoId,
          dia_semana: diaSemana,
          hora_inicio: horaInicio,
          atividade_tipo_id: atividadeTipoId,
          atividade_usuario_id: atividadeUsuarioId
        },
        { onConflict: 'planejamento_id,dia_semana,hora_inicio' }
      )
      .select()
      .single();

    if (error) {
      console.error('Erro ao marcar slot:', error);
      throw error;
    }

    return data;
  },

  /**
   * Remove um slot (desmarca)
   */
  async clearSlot(planejamentoId: string, diaSemana: number, horaInicio: string): Promise<void> {
    const { error } = await supabase
      .from('planejador_semanal')
      .delete()
      .eq('planejamento_id', planejamentoId)
      .eq('dia_semana', diaSemana)
      .eq('hora_inicio', horaInicio);

    if (error) {
      console.error('Erro ao limpar slot:', error);
      throw error;
    }
  },

  /**
   * Marca ou desmarca um slot (toggle)
   */
  async toggleSlot(
    planejamentoId: string,
    diaSemana: number,
    horaInicio: string,
    atividadeTipoId: string | null,
    atividadeUsuarioId: string | null,
    currentSlots: PlanejadorSlot[]
  ): Promise<{ action: 'added' | 'removed'; slot?: PlanejadorSlot }> {
    // Verificar se já existe um slot neste horário
    const existingSlot = currentSlots.find(
      s => s.dia_semana === diaSemana && s.hora_inicio === horaInicio
    );

    if (existingSlot) {
      // Se existe com a mesma atividade, remove
      if (
        existingSlot.atividade_tipo_id === atividadeTipoId &&
        existingSlot.atividade_usuario_id === atividadeUsuarioId
      ) {
        await this.clearSlot(planejamentoId, diaSemana, horaInicio);
        return { action: 'removed' };
      }
      // Se existe com outra atividade, substitui
      const slot = await this.setSlot(
        planejamentoId,
        diaSemana,
        horaInicio,
        atividadeTipoId,
        atividadeUsuarioId
      );
      return { action: 'added', slot };
    }

    // Se não existe, adiciona
    const slot = await this.setSlot(
      planejamentoId,
      diaSemana,
      horaInicio,
      atividadeTipoId,
      atividadeUsuarioId
    );
    return { action: 'added', slot };
  },

  /**
   * Calcula resumo semanal baseado nos slots
   */
  calcularResumo(
    slots: PlanejadorSlot[],
    atividades: (AtividadeTipo | AtividadeUsuario)[]
  ): ResumoSemanal {
    const horasPorAtividade: Record<string, { nome: string; horas: number; cor: string }> = {};
    const horasPorDia: number[] = [0, 0, 0, 0, 0, 0, 0]; // Dom a Sáb

    // Cada slot é de 15 minutos = 0.25 horas
    const horasPorSlot = 0.25;

    slots.forEach(slot => {
      const atividadeId = slot.atividade_tipo_id || slot.atividade_usuario_id;
      if (!atividadeId) return;

      const atividade = atividades.find(a => a.id === atividadeId);
      if (!atividade) return;

      // Acumular horas por atividade
      if (!horasPorAtividade[atividadeId]) {
        horasPorAtividade[atividadeId] = {
          nome: atividade.nome,
          horas: 0,
          cor: atividade.cor
        };
      }
      horasPorAtividade[atividadeId].horas += horasPorSlot;

      // Acumular horas por dia
      horasPorDia[slot.dia_semana] += horasPorSlot;
    });

    const totalHoras = slots.length * horasPorSlot;

    return {
      totalHoras,
      horasPorAtividade,
      horasPorDia
    };
  },

  /**
   * Gera array de horários entre hora de acordar e dormir (slots de 15 min)
   */
  gerarHorarios(horaAcordar: string, horaDormir: string): string[] {
    const horarios: string[] = [];

    const [inicioH, inicioM] = horaAcordar.split(':').map(Number);
    const [fimH, fimM] = horaDormir.split(':').map(Number);

    let currentH = inicioH;
    let currentM = inicioM;

    // Converter para minutos totais para facilitar comparação
    const fimMinutos = fimH * 60 + fimM;

    while (currentH * 60 + currentM < fimMinutos) {
      const horaStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
      horarios.push(horaStr);

      currentM += 15;
      if (currentM >= 60) {
        currentM = 0;
        currentH++;
      }
    }

    return horarios;
  },

  /**
   * Calcula horas de sono por dia
   */
  calcularHorasSono(horaAcordar: string, horaDormir: string): number {
    const [acordarH, acordarM] = horaAcordar.split(':').map(Number);
    const [dormirH, dormirM] = horaDormir.split(':').map(Number);

    // Minutos acordado
    const minutosAcordado = (dormirH * 60 + dormirM) - (acordarH * 60 + acordarM);

    // Horas de sono = 24h - horas acordado
    const horasSono = (24 * 60 - minutosAcordado) / 60;

    return Math.round(horasSono * 10) / 10; // Arredondar para 1 casa decimal
  }
};
