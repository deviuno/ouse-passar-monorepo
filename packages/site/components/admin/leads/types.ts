import { Tables, Enums } from '../../../lib/database.types';
import { LeadWithVendedor } from '../../../services/adminUsersService';

export type LeadDifficulty = Enums<'lead_difficulty'>;
export type EducationLevel = Enums<'education_level'>;
export type LeadGender = Enums<'lead_gender'>;
export type AdminUser = Tables<'admin_users'>;

// Status do Kanban
export type LeadStatus = 'agendado' | 'apresentacao' | 'followup' | 'perdido' | 'ganho';

export interface KanbanColumn {
    id: LeadStatus;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface AgendamentoWithDetails {
    id: string;
    data_hora: string;
    duracao_minutos: number;
    status: string;
    notas?: string;
    preparatorio?: { slug: string };
    vendedor?: { name: string; email: string };
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'agendado',
        title: 'Agendado',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'apresentacao',
        title: 'Apresentacao',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'followup',
        title: 'Follow-up',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
    },
    {
        id: 'perdido',
        title: 'Perdido',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
    },
    {
        id: 'ganho',
        title: 'Ganho',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
    }
];

// Helper para gerar URL do portal do aluno (novo padrao: /plano/:slug/:id)
export const getPlanejamentoUrl = (planejamentoId: string, preparatorioSlug?: string | null) => {
    if (preparatorioSlug) {
        return `/plano/${preparatorioSlug}/${planejamentoId}`;
    }
    // Fallback para pagina legada se nao tiver slug
    return `/planejamento-prf/${planejamentoId}`;
};
