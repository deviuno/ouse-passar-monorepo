import { supabase } from '../lib/supabase';
import { Tables } from '../lib/database.types';

type AdminUser = Tables<'admin_users'>;
type Lead = Tables<'leads'>;

// Gera uma senha aleatória de 8 caracteres
export const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Formata o número de telefone para WhatsApp (adiciona +55 se necessário)
export const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Se já começa com 55, apenas retorna
    if (cleanPhone.startsWith('55')) {
        return cleanPhone;
    }

    // Adiciona o DDI do Brasil
    return `55${cleanPhone}`;
};

// Gera o texto de convite para o aluno
export const generateInviteMessage = (
    studentName: string,
    email: string,
    password: string,
    planningUrl: string
): string => {
    const firstName = studentName.split(' ')[0];

    return `Olá, ${firstName}! 🎯

Seu planejamento de estudos personalizado está pronto!

Preparamos um cronograma exclusivo para você alcançar sua aprovação. Acesse agora e comece sua jornada rumo à aprovação!

🔗 *Acesse seu planejamento:*
${planningUrl}

📧 *E-mail:* ${email}
🔑 *Senha:* ${password}

Qualquer dúvida, estamos à disposição!

Bons estudos! 📚
Equipe Ouse Passar`;
};

// Gera a URL do WhatsApp Web com a mensagem
export const generateWhatsAppUrl = (phone: string, message: string): string => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export interface CreateStudentInput {
    email: string;
    name: string;
    password: string;
    createdBy?: string;
}

export interface StudentWithLead extends AdminUser {
    lead?: Lead;
}

export const studentService = {
    // Cria um usuário aluno (role='cliente')
    async createStudent(input: CreateStudentInput): Promise<AdminUser> {
        const { data, error } = await supabase
            .from('admin_users')
            .insert({
                email: input.email,
                password_hash: input.password, // Em produção, usar hash
                name: input.name,
                role: 'cliente',
                is_active: true,
                created_by: input.createdBy || null
            })
            .select()
            .single();

        if (error) throw error;
        return data as any;
    },

    // Verifica se já existe um usuário com este email
    async checkEmailExists(email: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    // Busca usuário por email (para login de aluno)
    async getByEmail(email: string): Promise<AdminUser | null> {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data as any;
    },

    // Busca o lead associado a um usuário
    async getLeadByUserId(userId: string): Promise<Lead | null> {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data as any;
    },

    // Atualiza o lead com o user_id e senha temporária
    async linkUserToLead(leadId: string, userId: string, password: string): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .update({
                user_id: userId,
                senha_temporaria: password
            })
            .eq('id', leadId);

        if (error) throw error;
    },

    // Login de aluno
    async login(email: string, password: string): Promise<AdminUser | null> {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('password_hash', password)
            .eq('is_active', true)
            .eq('role', 'cliente')
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Atualiza último login
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.id);
        }

        return data as any;
    },

    // Verifica se um usuário tem acesso a um planejamento
    async canAccessPlanning(userId: string, userRole: string, planningId: string): Promise<boolean> {
        // Admin e vendedor podem ver qualquer planejamento
        if (userRole === 'admin' || userRole === 'vendedor') {
            return true;
        }

        // Cliente só pode ver seu próprio planejamento
        if (userRole === 'cliente') {
            // Método 1: Verificar se o lead do usuário tem este planejamento
            const lead = await this.getLeadByUserId(userId);
            if (lead && lead.planejamento_id === planningId) {
                return true;
            }

            // Método 2: Verificar se o planejamento tem o lead do usuário
            // (fallback para casos onde lead_id foi setado mas planejamento_id não)
            if (lead) {
                const { data: planejamento } = await supabase
                    .from('planejamentos')
                    .select('id, lead_id')
                    .eq('id', planningId)
                    .maybeSingle() as { data: { id: string; lead_id: string | null } | null };

                if (planejamento && planejamento.lead_id === lead.id) {
                    return true;
                }
            }
        }

        return false;
    }
};
