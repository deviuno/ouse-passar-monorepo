// @ts-nocheck
// TODO: Regenerar tipos do Supabase
import { supabase } from '../lib/supabase';
import {
  VendedorSchedule,
  Agendamento,
  AgendamentoWithDetails,
  RoundRobinState,
  TimeSlot,
  AdminUser,
  Lead,
  Preparatorio,
  AgendamentoStatus
} from '../lib/database.types';

// ==================== TIPOS ====================

export interface ScheduleInput {
  dia_semana: number;
  is_active: boolean;
  manha_inicio: string | null;
  manha_fim: string | null;
  tarde_inicio: string | null;
  tarde_fim: string | null;
}

export interface CreateAgendamentoInput {
  lead_id: string;
  vendedor_id: string;
  preparatorio_id: string;
  data_hora: string;
  duracao_minutos?: number;
  notas?: string;
}

export interface CreateLeadFromObrigadoInput {
  nome: string;
  telefone: string;
  email?: string;
  concurso_almejado: string;
  preparatorio_id: string;
}

// ==================== VENDEDOR SCHEDULES ====================

export const vendedorScheduleService = {
  /**
   * Busca todos os schedules de um vendedor
   */
  async getByVendedor(vendedorId: string): Promise<VendedorSchedule[]> {
    const { data, error } = await supabase
      .from('vendedor_schedules')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .order('dia_semana');

    if (error) throw error;
    return data || [];
  },

  /**
   * Salva os schedules de um vendedor (upsert)
   */
  async save(vendedorId: string, schedules: ScheduleInput[]): Promise<void> {
    // Preparar dados para upsert
    const records = schedules.map(s => ({
      vendedor_id: vendedorId,
      dia_semana: s.dia_semana,
      is_active: s.is_active,
      manha_inicio: s.manha_inicio,
      manha_fim: s.manha_fim,
      tarde_inicio: s.tarde_inicio,
      tarde_fim: s.tarde_fim
    }));

    const { error } = await supabase
      .from('vendedor_schedules')
      .upsert(records, {
        onConflict: 'vendedor_id,dia_semana'
      });

    if (error) throw error;
  },

  /**
   * Cria schedules padrão para um novo vendedor
   */
  async createDefault(vendedorId: string): Promise<void> {
    const defaultSchedules: ScheduleInput[] = [];

    for (let dia = 0; dia <= 6; dia++) {
      defaultSchedules.push({
        dia_semana: dia,
        is_active: dia !== 0 && dia !== 6, // Sáb e Dom desativados
        manha_inicio: '08:00',
        manha_fim: '12:00',
        tarde_inicio: '14:00',
        tarde_fim: '18:00'
      });
    }

    await this.save(vendedorId, defaultSchedules);
  },

  /**
   * Verifica se um vendedor tem schedule configurado
   */
  async hasSchedule(vendedorId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('vendedor_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', vendedorId);

    if (error) throw error;
    return (count || 0) > 0;
  }
};

// ==================== SLOTS DISPONÍVEIS ====================

export const slotsService = {
  /**
   * Gera slots de tempo dentro de um período
   */
  generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number = 30
  ): { inicio: string; fim: string }[] {
    const slots: { inicio: string; fim: string }[] = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;

      slots.push({
        inicio: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`,
        fim: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`
      });

      currentMinutes += durationMinutes;
    }

    return slots;
  },

  /**
   * Busca todos os slots disponíveis para agendamento
   */
  async getAvailableSlots(days: number = 7): Promise<TimeSlot[]> {
    // 1. Buscar todos os vendedores ativos (incluindo avatar e genero)
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('admin_users')
      .select('id, name, avatar_url, genero')
      .eq('role', 'vendedor')
      .eq('is_active', true) as { data: { id: string; name: string; avatar_url: string | null; genero?: string | null }[] | null; error: Error | null };

    if (vendedoresError) throw vendedoresError;
    if (!vendedores || vendedores.length === 0) return [];

    // 2. Buscar schedules de todos os vendedores
    const vendedorIds = vendedores.map(v => v.id);
    const { data: schedules, error: schedulesError } = await supabase
      .from('vendedor_schedules')
      .select('*')
      .in('vendedor_id', vendedorIds)
      .eq('is_active', true);

    if (schedulesError) throw schedulesError;
    if (!schedules || schedules.length === 0) return [];

    // 3. Buscar agendamentos existentes nos próximos X dias
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const { data: existingAgendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('vendedor_id, data_hora, duracao_minutos')
      .in('vendedor_id', vendedorIds)
      .gte('data_hora', startDate.toISOString())
      .lt('data_hora', endDate.toISOString())
      .in('status', ['agendado', 'confirmado']);

    if (agendamentosError) throw agendamentosError;

    // 4. Gerar slots disponíveis
    const availableSlots: TimeSlot[] = [];
    const now = new Date();

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay(); // 0-6
      const dateStr = currentDate.toISOString().split('T')[0];

      // Para cada vendedor
      for (const vendedor of vendedores) {
        // Encontrar schedule do vendedor para este dia
        const schedule = schedules.find(
          s => s.vendedor_id === vendedor.id && s.dia_semana === dayOfWeek
        );

        if (!schedule || !schedule.is_active) continue;

        // Gerar slots da manhã
        if (schedule.manha_inicio && schedule.manha_fim) {
          const morningSlots = this.generateTimeSlots(
            schedule.manha_inicio,
            schedule.manha_fim
          );

          for (const slot of morningSlots) {
            // Verificar se o slot já passou
            const slotDateTime = new Date(`${dateStr}T${slot.inicio}:00`);
            if (slotDateTime <= now) continue;

            // Verificar se o slot está ocupado
            const isOccupied = (existingAgendamentos || []).some(a => {
              if (a.vendedor_id !== vendedor.id) return false;
              const agendamentoDate = new Date(a.data_hora);
              const agendamentoDateStr = agendamentoDate.toISOString().split('T')[0];
              const agendamentoTime = agendamentoDate.toTimeString().slice(0, 5);
              return agendamentoDateStr === dateStr && agendamentoTime === slot.inicio;
            });

            if (!isOccupied) {
              availableSlots.push({
                data: dateStr,
                hora_inicio: slot.inicio,
                hora_fim: slot.fim,
                vendedor_id: vendedor.id,
                vendedor_nome: vendedor.name,
                vendedor_avatar: vendedor.avatar_url,
                vendedor_genero: (vendedor.genero as 'masculino' | 'feminino') || 'feminino'
              });
            }
          }
        }

        // Gerar slots da tarde
        if (schedule.tarde_inicio && schedule.tarde_fim) {
          const afternoonSlots = this.generateTimeSlots(
            schedule.tarde_inicio,
            schedule.tarde_fim
          );

          for (const slot of afternoonSlots) {
            // Verificar se o slot já passou
            const slotDateTime = new Date(`${dateStr}T${slot.inicio}:00`);
            if (slotDateTime <= now) continue;

            // Verificar se o slot está ocupado
            const isOccupied = (existingAgendamentos || []).some(a => {
              if (a.vendedor_id !== vendedor.id) return false;
              const agendamentoDate = new Date(a.data_hora);
              const agendamentoDateStr = agendamentoDate.toISOString().split('T')[0];
              const agendamentoTime = agendamentoDate.toTimeString().slice(0, 5);
              return agendamentoDateStr === dateStr && agendamentoTime === slot.inicio;
            });

            if (!isOccupied) {
              availableSlots.push({
                data: dateStr,
                hora_inicio: slot.inicio,
                hora_fim: slot.fim,
                vendedor_id: vendedor.id,
                vendedor_nome: vendedor.name,
                vendedor_avatar: vendedor.avatar_url,
                vendedor_genero: (vendedor.genero as 'masculino' | 'feminino') || 'feminino'
              });
            }
          }
        }
      }
    }

    // Ordenar por data e hora
    availableSlots.sort((a, b) => {
      const dateCompare = a.data.localeCompare(b.data);
      if (dateCompare !== 0) return dateCompare;
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });

    return availableSlots;
  },

  /**
   * Agrupa slots por data
   */
  groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.data]) {
        acc[slot.data] = [];
      }
      acc[slot.data].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);
  }
};

// ==================== ROUND-ROBIN ====================

export const roundRobinService = {
  /**
   * Obtém o próximo vendedor disponível usando round-robin
   */
  async getNextVendedor(
    preparatorioId: string | null,
    slots: TimeSlot[]
  ): Promise<{ vendedor: AdminUser; slot: TimeSlot } | null> {
    if (slots.length === 0) return null;

    // 1. Buscar estado atual do round-robin
    const { data: state } = await supabase
      .from('round_robin_state')
      .select('*')
      .eq('preparatorio_id', preparatorioId || '')
      .single();

    // 2. Buscar todos os vendedores ativos
    const vendedorIds = [...new Set(slots.map(s => s.vendedor_id))];
    const { data: vendedores, error } = await supabase
      .from('admin_users')
      .select('*')
      .in('id', vendedorIds)
      .eq('is_active', true)
      .order('id');

    if (error) throw error;
    if (!vendedores || vendedores.length === 0) return null;

    // 3. Encontrar o próximo vendedor
    let startIndex = 0;
    if (state?.ultimo_vendedor_id) {
      const lastIndex = vendedores.findIndex(v => v.id === state.ultimo_vendedor_id);
      if (lastIndex !== -1) {
        startIndex = (lastIndex + 1) % vendedores.length;
      }
    }

    // 4. Encontrar um slot disponível para o próximo vendedor
    for (let i = 0; i < vendedores.length; i++) {
      const index = (startIndex + i) % vendedores.length;
      const vendedor = vendedores[index];

      // Encontrar primeiro slot disponível deste vendedor
      const slot = slots.find(s => s.vendedor_id === vendedor.id);
      if (slot) {
        return { vendedor: vendedor as AdminUser, slot };
      }
    }

    // Fallback: retornar o primeiro slot disponível
    const firstSlot = slots[0];
    const vendedor = vendedores.find(v => v.id === firstSlot.vendedor_id);
    if (vendedor) {
      return { vendedor: vendedor as AdminUser, slot: firstSlot };
    }

    return null;
  },

  /**
   * Atualiza o estado do round-robin
   */
  async updateState(preparatorioId: string | null, vendedorId: string): Promise<void> {
    const { error } = await supabase
      .from('round_robin_state')
      .upsert({
        preparatorio_id: preparatorioId,
        ultimo_vendedor_id: vendedorId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'preparatorio_id'
      });

    if (error) throw error;
  }
};

// ==================== AGENDAMENTOS ====================

export const agendamentosService = {
  /**
   * Cria um novo agendamento
   */
  async create(input: CreateAgendamentoInput): Promise<Agendamento> {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        lead_id: input.lead_id,
        vendedor_id: input.vendedor_id,
        preparatorio_id: input.preparatorio_id,
        data_hora: input.data_hora,
        duracao_minutos: input.duracao_minutos || 30,
        notas: input.notas,
        status: 'agendado'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Busca agendamento por ID
   */
  async getById(id: string): Promise<AgendamentoWithDetails | null> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        lead:leads!agendamentos_lead_id_fkey(*),
        vendedor:admin_users!agendamentos_vendedor_id_fkey(*),
        preparatorio:preparatorios!agendamentos_preparatorio_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as unknown as AgendamentoWithDetails;
  },

  /**
   * Busca agendamentos por vendedor
   */
  async getByVendedor(
    vendedorId: string,
    status?: AgendamentoStatus[]
  ): Promise<AgendamentoWithDetails[]> {
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        lead:leads!agendamentos_lead_id_fkey(*),
        vendedor:admin_users!agendamentos_vendedor_id_fkey(*),
        preparatorio:preparatorios!agendamentos_preparatorio_id_fkey(*)
      `)
      .eq('vendedor_id', vendedorId)
      .order('data_hora', { ascending: true });

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AgendamentoWithDetails[];
  },

  /**
   * Busca agendamentos de hoje
   */
  async getTodaysAgendamentos(vendedorId?: string): Promise<AgendamentoWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        lead:leads!agendamentos_lead_id_fkey(*),
        vendedor:admin_users!agendamentos_vendedor_id_fkey(*),
        preparatorio:preparatorios!agendamentos_preparatorio_id_fkey(*)
      `)
      .gte('data_hora', today.toISOString())
      .lt('data_hora', tomorrow.toISOString())
      .order('data_hora', { ascending: true });

    if (vendedorId) {
      query = query.eq('vendedor_id', vendedorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AgendamentoWithDetails[];
  },

  /**
   * Atualiza o status de um agendamento
   */
  async updateStatus(id: string, status: AgendamentoStatus): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Atualiza notas de um agendamento
   */
  async updateNotas(id: string, notas: string): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .update({ notas })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Atualiza o vendedor de um agendamento (transferência)
   */
  async updateVendedor(id: string, vendedorId: string): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .update({ vendedor_id: vendedorId })
      .eq('id', id);

    if (error) throw error;
  }
};

// ==================== FLUXO COMPLETO DE AGENDAMENTO ====================

export const schedulingService = {
  /**
   * Fluxo completo: criar lead + agendamento após checkout
   */
  async createLeadAndAgendamento(
    customerData: CreateLeadFromObrigadoInput,
    selectedSlot: TimeSlot
  ): Promise<{ lead: Lead; agendamento: Agendamento }> {
    // 1. Criar o lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: customerData.nome,
        telefone: customerData.telefone,
        email: customerData.email || null,
        concurso_almejado: customerData.concurso_almejado,
        vendedor_id: selectedSlot.vendedor_id,
        status: 'agendado',
        trabalha: false,
        e_concursado: false,
        possui_curso_concurso: false,
        minutos_domingo: 0,
        minutos_segunda: 0,
        minutos_terca: 0,
        minutos_quarta: 0,
        minutos_quinta: 0,
        minutos_sexta: 0,
        minutos_sabado: 0,
        principais_dificuldades: []
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // 2. Criar o agendamento
    // Forçar timezone de Brasília (-03:00) para que o banco salve corretamente (ex: 09:00 BRT -> 12:00 UTC)
    const dataHora = `${selectedSlot.data}T${selectedSlot.hora_inicio}:00-03:00`;
    const agendamento = await agendamentosService.create({
      lead_id: lead.id,
      vendedor_id: selectedSlot.vendedor_id,
      preparatorio_id: customerData.preparatorio_id,
      data_hora: dataHora,
      duracao_minutos: 30
    });

    // 3. Atualizar o lead com o agendamento_id
    await supabase
      .from('leads')
      .update({ agendamento_id: agendamento.id })
      .eq('id', lead.id);

    // 4. Atualizar round-robin state
    await roundRobinService.updateState(customerData.preparatorio_id, selectedSlot.vendedor_id);

    return { lead: lead as Lead, agendamento };
  },

  /**
   * Busca preparatório por slug
   */
  async getPreparatorioBySlug(slug: string): Promise<Preparatorio | null> {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }
};

export default schedulingService;
