import { supabase } from './supabaseClient';

export type TicketMotivo =
  | 'duvida_acesso'
  | 'problema_tecnico'
  | 'erro_pagamento'
  | 'cancelamento'
  | 'sugestao'
  | 'reclamacao'
  | 'outro';

export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_usuario' | 'resolvido' | 'fechado';

export const TICKET_MOTIVOS: { value: TicketMotivo; label: string }[] = [
  { value: 'duvida_acesso', label: 'Dúvida sobre acesso' },
  { value: 'problema_tecnico', label: 'Problema técnico' },
  { value: 'erro_pagamento', label: 'Erro no pagamento' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'outro', label: 'Outro' },
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
  prioridade: string;
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

export interface CreateTicketData {
  userId: string;
  userName: string;
  userEmail: string;
  motivo: TicketMotivo;
  motivoOutro?: string;
  mensagem: string;
  anexos?: TicketAnexo[];
}

/**
 * Upload de arquivo para o Storage
 */
export async function uploadTicketFile(file: File, userId: string): Promise<TicketAnexo | null> {
  try {
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}_${safeFileName}`;

    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Tickets] Error uploading file:', error);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(data.path);

    return {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('[Tickets] Error uploading file:', error);
    return null;
  }
}

/**
 * Criar novo ticket
 */
export async function createTicket(data: CreateTicketData): Promise<string | null> {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        user_id: data.userId,
        user_name: data.userName,
        user_email: data.userEmail,
        motivo: data.motivo,
        motivo_outro: data.motivoOutro || null,
        mensagem: data.mensagem,
        anexos: data.anexos || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Tickets] Error creating ticket:', error);
      return null;
    }

    return ticket.id;
  } catch (error) {
    console.error('[Tickets] Error creating ticket:', error);
    return null;
  }
}

/**
 * Buscar tickets do usuário
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Tickets] Error fetching tickets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Tickets] Error fetching tickets:', error);
    return [];
  }
}

/**
 * Buscar mensagens de um ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Tickets] Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Tickets] Error fetching messages:', error);
    return [];
  }
}

/**
 * Enviar mensagem em um ticket
 */
export async function sendTicketMessage(
  ticketId: string,
  senderId: string,
  mensagem: string,
  anexos?: TicketAnexo[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_type: 'user',
        mensagem,
        anexos: anexos || [],
      });

    if (error) {
      console.error('[Tickets] Error sending message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Tickets] Error sending message:', error);
    return false;
  }
}

/**
 * Buscar um ticket por ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('[Tickets] Error fetching ticket:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Tickets] Error fetching ticket:', error);
    return null;
  }
}
