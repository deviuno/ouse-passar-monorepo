import { supabase } from './supabaseClient';
import { UserPreparatorio, Preparatorio, UserLevel } from '../types';

/**
 * Service para gerenciar os preparatórios do usuário
 */
export const userPreparatoriosService = {
  /**
   * Busca todos os preparatórios que o usuário possui (está matriculado)
   */
  async getUserPreparatorios(userId: string): Promise<UserPreparatorio[]> {
    console.log('[userPreparatoriosService] getUserPreparatorios - userId:', userId);
    try {
      const { data, error } = await supabase
        .from('user_trails')
        .select(`
          id,
          user_id,
          preparatorio_id,
          nivel_usuario,
          current_round,
          created_at,
          preparatorio:preparatorios(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('[userPreparatoriosService] Resultado:', { data, error });

      if (error) {
        console.error('[userPreparatoriosService] Erro ao buscar preparatórios do usuário:', error.message, error.code);
        return [];
      }

      // Mapear para o tipo UserPreparatorio
      const result = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        preparatorio_id: item.preparatorio_id,
        nivel_usuario: item.nivel_usuario,
        current_round: item.current_round,
        created_at: item.created_at,
        preparatorio: item.preparatorio,
      }));

      console.log('[userPreparatoriosService] Preparatórios encontrados:', result.length);
      return result;
    } catch (err) {
      console.error('[userPreparatoriosService] Erro ao buscar preparatórios do usuário:', err);
      return [];
    }
  },

  /**
   * Busca um preparatório específico do usuário
   */
  async getUserPreparatorio(userId: string, preparatorioId: string): Promise<UserPreparatorio | null> {
    try {
      const { data, error } = await supabase
        .from('user_trails')
        .select(`
          id,
          user_id,
          preparatorio_id,
          nivel_usuario,
          current_round,
          created_at,
          preparatorio:preparatorios(*)
        `)
        .eq('user_id', userId)
        .eq('preparatorio_id', preparatorioId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Erro ao buscar preparatório:', error.message);
        }
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        preparatorio_id: data.preparatorio_id,
        nivel_usuario: data.nivel_usuario,
        current_round: data.current_round,
        created_at: data.created_at,
        preparatorio: data.preparatorio,
      };
    } catch (err) {
      console.error('Erro ao buscar preparatório:', err);
      return null;
    }
  },

  /**
   * Busca preparatórios disponíveis para compra (que o usuário ainda não possui)
   */
  async getAvailablePreparatorios(userId: string): Promise<Preparatorio[]> {
    try {
      // Buscar IDs dos preparatórios que o usuário já possui
      const { data: userTrails } = await supabase
        .from('user_trails')
        .select('preparatorio_id')
        .eq('user_id', userId);

      const ownedIds = (userTrails || []).map((t) => t.preparatorio_id);

      // Buscar todos os preparatórios ativos que o usuário NÃO possui
      let query = supabase
        .from('preparatorios')
        .select('*')
        .eq('is_active', true)
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('nome', { ascending: true });

      // Excluir os que já possui
      if (ownedIds.length > 0) {
        query = query.not('id', 'in', `(${ownedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar preparatórios disponíveis:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erro ao buscar preparatórios disponíveis:', err);
      return [];
    }
  },

  /**
   * Adiciona um novo preparatório ao usuário (compra/matrícula)
   */
  async addPreparatorioToUser(
    userId: string,
    preparatorioId: string,
    nivelUsuario: UserLevel = 'iniciante'
  ): Promise<UserPreparatorio | null> {
    try {
      // Verificar se já possui
      const existing = await this.getUserPreparatorio(userId, preparatorioId);
      if (existing) {
        console.warn('Usuário já possui este preparatório');
        return existing;
      }

      // Criar nova trilha para o usuário
      const { data, error } = await supabase
        .from('user_trails')
        .insert({
          user_id: userId,
          preparatorio_id: preparatorioId,
          nivel_usuario: nivelUsuario,
          current_round: 1,
        })
        .select(`
          id,
          user_id,
          preparatorio_id,
          nivel_usuario,
          current_round,
          created_at,
          preparatorio:preparatorios(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao adicionar preparatório:', error.message);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        preparatorio_id: data.preparatorio_id,
        nivel_usuario: data.nivel_usuario,
        current_round: data.current_round,
        created_at: data.created_at,
        preparatorio: data.preparatorio,
      };
    } catch (err) {
      console.error('Erro ao adicionar preparatório:', err);
      return null;
    }
  },

  /**
   * Calcula o progresso de um preparatório do usuário
   */
  async calculateProgress(userTrailId: string): Promise<{ total: number; completed: number; percent: number }> {
    try {
      // Buscar rodadas da trilha
      const { data: rounds } = await supabase
        .from('trail_rounds')
        .select('id')
        .eq('trail_id', userTrailId);

      if (!rounds || rounds.length === 0) {
        return { total: 0, completed: 0, percent: 0 };
      }

      const roundIds = rounds.map((r) => r.id);

      // Contar total de missões
      const { count: total } = await supabase
        .from('trail_missions')
        .select('*', { count: 'exact', head: true })
        .in('round_id', roundIds);

      // Contar missões completadas
      const { count: completed } = await supabase
        .from('trail_missions')
        .select('*', { count: 'exact', head: true })
        .in('round_id', roundIds)
        .eq('status', 'completed');

      const totalNum = total || 0;
      const completedNum = completed || 0;
      const percent = totalNum > 0 ? Math.round((completedNum / totalNum) * 100) : 0;

      return { total: totalNum, completed: completedNum, percent };
    } catch (err) {
      console.error('Erro ao calcular progresso:', err);
      return { total: 0, completed: 0, percent: 0 };
    }
  },
};

export default userPreparatoriosService;
