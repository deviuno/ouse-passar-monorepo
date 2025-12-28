import { supabase } from '../lib/supabase';

export type TicketMotivo =
  | 'duvida_acesso'
  | 'problema_tecnico'
  | 'erro_pagamento'
  | 'cancelamento'
  | 'sugestao'
  | 'reclamacao'
  | 'outro';

export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_usuario' | 'resolvido' | 'fechado';
export type TicketPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente';

export const TICKET_MOTIVOS: { value: TicketMotivo; label: string }[] = [
  { value: 'duvida_acesso', label: 'Dúvida sobre acesso' },
  { value: 'problema_tecnico', label: 'Problema técnico' },
  { value: 'erro_pagamento', label: 'Erro no pagamento' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'outro', label: 'Outro' },
];

export const TICKET_STATUS: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'aberto', label: 'Aberto', color: 'yellow' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'blue' },
  { value: 'aguardando_usuario', label: 'Aguardando Usuário', color: 'purple' },
  { value: 'resolvido', label: 'Resolvido', color: 'green' },
  { value: 'fechado', label: 'Fechado', color: 'gray' },
];

export const TICKET_PRIORIDADES: { value: TicketPrioridade; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'alta', label: 'Alta', color: 'orange' },
  { value: 'urgente', label: 'Urgente', color: 'red' },
];

export interface TicketAnexo {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  motivo: TicketMotivo;
  motivo_outro: string | null;
  mensagem: string;
  anexos: TicketAnexo[];
  status: TicketStatus;
  prioridade: TicketPrioridade;
  admin_id: string | null;
  admin_resposta: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  mensagem: string;
  anexos: TicketAnexo[];
  created_at: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  prioridade?: TicketPrioridade;
  motivo?: TicketMotivo;
  searchTerm?: string;
  dateStart?: string;
  dateEnd?: string;
}

export interface TicketStats {
  total: number;
  abertos: number;
  em_andamento: number;
  aguardando_usuario: number;
  resolvidos: number;
  fechados: number;
}

export const ticketsService = {
  /**
   * Busca todos os tickets com filtros
   */
  async getAll(filters?: TicketFilters): Promise<Ticket[]> {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.prioridade) {
      query = query.eq('prioridade', filters.prioridade);
    }

    if (filters?.motivo) {
      query = query.eq('motivo', filters.motivo);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim();
      query = query.or(`user_name.ilike.%${term}%,user_email.ilike.%${term}%,mensagem.ilike.%${term}%`);
    }

    if (filters?.dateStart) {
      query = query.gte('created_at', `${filters.dateStart}T00:00:00`);
    }

    if (filters?.dateEnd) {
      query = query.lte('created_at', `${filters.dateEnd}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Tickets] Error fetching tickets:', error);
      throw error;
    }

    return (data || []) as unknown as Ticket[];
  },

  /**
   * Busca um ticket por ID
   */
  async getById(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as unknown as Ticket;
  },

  /**
   * Busca mensagens de um ticket
   */
  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Tickets] Error fetching messages:', error);
      throw error;
    }

    return (data || []) as unknown as TicketMessage[];
  },

  /**
   * Envia resposta do admin
   */
  async sendAdminMessage(
    ticketId: string,
    adminId: string,
    mensagem: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: adminId,
        sender_type: 'admin',
        mensagem,
        anexos: [],
      });

    if (error) {
      console.error('[Tickets] Error sending message:', error);
      return false;
    }

    return true;
  },

  /**
   * Atualiza o status de um ticket
   */
  async updateStatus(
    id: string,
    status: TicketStatus,
    adminId: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      admin_id: adminId,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolvido' || status === 'fechado') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[Tickets] Error updating status:', error);
      throw error;
    }
  },

  /**
   * Atualiza a prioridade de um ticket
   */
  async updatePrioridade(
    id: string,
    prioridade: TicketPrioridade
  ): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .update({
        prioridade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[Tickets] Error updating priority:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas dos tickets
   */
  async getStats(): Promise<TicketStats> {
    const { data, error } = await supabase
      .from('tickets')
      .select('status');

    if (error) {
      console.error('[Tickets] Error fetching stats:', error);
      throw error;
    }

    const tickets = data || [];

    return {
      total: tickets.length,
      abertos: tickets.filter(t => t.status === 'aberto').length,
      em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
      aguardando_usuario: tickets.filter(t => t.status === 'aguardando_usuario').length,
      resolvidos: tickets.filter(t => t.status === 'resolvido').length,
      fechados: tickets.filter(t => t.status === 'fechado').length,
    };
  },
};
