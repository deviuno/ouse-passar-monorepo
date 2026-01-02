import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailTemplate {
  id: string;
  produto: string;
  nome_produto: string;
  assunto: string;
  corpo_html: string;
  corpo_texto: string;
  variaveis_disponiveis: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailSettings {
  resend_api_key: string;
  remetente_email: string;
  remetente_nome: string;
  emails_ativos: boolean;
}

export interface EmailLog {
  id: string;
  template_id: string;
  destinatario_email: string;
  destinatario_nome: string;
  assunto: string;
  status: 'pending' | 'sent' | 'failed';
  resend_id?: string;
  erro?: string;
  enviado_em?: string;
  created_at: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('nome_produto');

  if (error) {
    console.error('Erro ao buscar templates de e-mail:', error);
    throw error;
  }

  return data || [];
}

export async function getEmailTemplateByProduto(produto: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('produto', produto)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Erro ao buscar template:', error);
    throw error;
  }

  return data;
}

export async function updateEmailTemplate(
  id: string,
  updates: Partial<Pick<EmailTemplate, 'assunto' | 'corpo_html' | 'corpo_texto' | 'ativo'>>
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar template:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// EMAIL SETTINGS
// ============================================================================

export async function getEmailSettings(): Promise<EmailSettings> {
  const { data, error } = await supabase
    .from('email_settings')
    .select('chave, valor');

  if (error) {
    console.error('Erro ao buscar configurações de e-mail:', error);
    throw error;
  }

  const settings: EmailSettings = {
    resend_api_key: '',
    remetente_email: 'noreply@ousepassar.com.br',
    remetente_nome: 'Ouse Passar',
    emails_ativos: true,
  };

  for (const row of data || []) {
    if (row.chave === 'resend_api_key') settings.resend_api_key = row.valor;
    if (row.chave === 'remetente_email') settings.remetente_email = row.valor;
    if (row.chave === 'remetente_nome') settings.remetente_nome = row.valor;
    if (row.chave === 'emails_ativos') settings.emails_ativos = row.valor === 'true';
  }

  return settings;
}

export async function updateEmailSetting(chave: string, valor: string): Promise<void> {
  const { error } = await supabase
    .from('email_settings')
    .update({
      valor,
      updated_at: new Date().toISOString(),
    })
    .eq('chave', chave);

  if (error) {
    console.error('Erro ao atualizar configuração:', error);
    throw error;
  }
}

export async function updateEmailSettings(settings: Partial<EmailSettings>): Promise<void> {
  const updates: Promise<void>[] = [];

  if (settings.resend_api_key !== undefined) {
    updates.push(updateEmailSetting('resend_api_key', settings.resend_api_key));
  }
  if (settings.remetente_email !== undefined) {
    updates.push(updateEmailSetting('remetente_email', settings.remetente_email));
  }
  if (settings.remetente_nome !== undefined) {
    updates.push(updateEmailSetting('remetente_nome', settings.remetente_nome));
  }
  if (settings.emails_ativos !== undefined) {
    updates.push(updateEmailSetting('emails_ativos', String(settings.emails_ativos)));
  }

  await Promise.all(updates);
}

// ============================================================================
// EMAIL LOGS
// ============================================================================

export async function getEmailLogs(limit: number = 50): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar logs de e-mail:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// SEND EMAIL (via backend)
// ============================================================================

const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

export async function sendWelcomeEmail(
  produto: string,
  destinatarioEmail: string,
  destinatarioNome: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${MASTRA_SERVER_URL}/api/email/send-welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto,
        destinatarioEmail,
        destinatarioNome,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${MASTRA_SERVER_URL}/api/email/test`, {
      method: 'POST',
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Erro ao testar conexão:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export const PRODUTOS_EMAIL = [
  { id: 'planejador', label: 'Planejador de Estudos' },
  { id: 'ouse_questoes', label: 'Ouse Questões' },
  { id: 'simulados', label: 'Simulados' },
  { id: 'reta_final', label: 'Reta Final' },
  { id: 'plataforma_completa', label: 'Plataforma Completa' },
];
