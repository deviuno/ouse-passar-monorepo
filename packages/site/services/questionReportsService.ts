import { supabase } from '../lib/supabase';

export type ReportMotivo =
  | 'resposta_errada'
  | 'questao_desatualizada'
  | 'enunciado_confuso'
  | 'alternativas_incorretas'
  | 'imagem_quebrada'
  | 'outro';

export type ReportStatus = 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';

export const REPORT_MOTIVOS: { value: ReportMotivo; label: string }[] = [
  { value: 'resposta_errada', label: 'Resposta errada' },
  { value: 'questao_desatualizada', label: 'Questão desatualizada' },
  { value: 'enunciado_confuso', label: 'Enunciado confuso' },
  { value: 'alternativas_incorretas', label: 'Alternativas incorretas' },
  { value: 'imagem_quebrada', label: 'Imagem não carrega' },
  { value: 'outro', label: 'Outro motivo' },
];

export const REPORT_STATUS: { value: ReportStatus; label: string; color: string }[] = [
  { value: 'pendente', label: 'Pendente', color: 'yellow' },
  { value: 'em_analise', label: 'Em Análise', color: 'blue' },
  { value: 'resolvido', label: 'Resolvido', color: 'green' },
  { value: 'rejeitado', label: 'Rejeitado', color: 'red' },
];

export interface QuestionReport {
  id: string;
  question_id: number;
  user_id: string | null;
  question_materia: string | null;
  question_assunto: string | null;
  question_banca: string | null;
  question_ano: number | null;
  motivo: ReportMotivo;
  descricao: string | null;
  status: ReportStatus;
  admin_resposta: string | null;
  admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_profile?: {
    name: string | null;
    email: string | null;
  };
}

export interface ReportFilters {
  status?: ReportStatus;
  motivo?: ReportMotivo;
  searchTerm?: string;
  dateStart?: string;
  dateEnd?: string;
}

export interface ReportStats {
  total: number;
  pendentes: number;
  em_analise: number;
  resolvidos: number;
  rejeitados: number;
}

export const questionReportsService = {
  /**
   * Busca todos os reports com filtros
   */
  async getAll(filters?: ReportFilters): Promise<QuestionReport[]> {
    let query = supabase
      .from('question_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.motivo) {
      query = query.eq('motivo', filters.motivo);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim();
      // Busca por ID da questão (se for número)
      if (!isNaN(Number(term))) {
        query = query.eq('question_id', Number(term));
      } else {
        // Busca por matéria ou assunto
        query = query.or(`question_materia.ilike.%${term}%,question_assunto.ilike.%${term}%`);
      }
    }

    if (filters?.dateStart) {
      query = query.gte('created_at', `${filters.dateStart}T00:00:00`);
    }

    if (filters?.dateEnd) {
      query = query.lte('created_at', `${filters.dateEnd}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[QuestionReports] Error fetching reports:', error);
      throw error;
    }

    const reports = data || [];

    // Buscar informações dos usuários separadamente
    const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))] as string[];
    let userProfiles: Record<string, { name: string | null; email: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = { name: profile.name, email: profile.email };
          return acc;
        }, {} as Record<string, { name: string | null; email: string | null }>);
      }
    }

    return reports.map(report => ({
      ...report,
      user_profile: report.user_id ? userProfiles[report.user_id] || { name: null, email: null } : { name: null, email: null },
    })) as unknown as QuestionReport[];
  },

  /**
   * Busca um report por ID
   */
  async getById(id: string): Promise<QuestionReport | null> {
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Buscar informações do usuário separadamente
    let userProfile = { name: null as string | null, email: null as string | null };
    if (data.user_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, email')
        .eq('id', data.user_id)
        .single();

      if (profile) {
        userProfile = { name: profile.name, email: profile.email };
      }
    }

    return { ...data, user_profile: userProfile } as unknown as QuestionReport;
  },

  /**
   * Atualiza o status de um report
   */
  async updateStatus(
    id: string,
    status: ReportStatus,
    adminId: string,
    adminResposta?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      admin_id: adminId,
      updated_at: new Date().toISOString(),
    };

    if (adminResposta !== undefined) {
      updateData.admin_resposta = adminResposta;
    }

    if (status === 'resolvido' || status === 'rejeitado') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('question_reports')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[QuestionReports] Error updating status:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas dos reports
   */
  async getStats(): Promise<ReportStats> {
    const { data, error } = await supabase
      .from('question_reports')
      .select('status');

    if (error) {
      console.error('[QuestionReports] Error fetching stats:', error);
      throw error;
    }

    const reports = data || [];

    return {
      total: reports.length,
      pendentes: reports.filter(r => r.status === 'pendente').length,
      em_analise: reports.filter(r => r.status === 'em_analise').length,
      resolvidos: reports.filter(r => r.status === 'resolvido').length,
      rejeitados: reports.filter(r => r.status === 'rejeitado').length,
    };
  },

  /**
   * Deleta um report
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[QuestionReports] Error deleting report:', error);
      throw error;
    }
  },
};
