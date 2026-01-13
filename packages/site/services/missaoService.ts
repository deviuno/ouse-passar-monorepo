import { supabase } from '../lib/supabase';

export interface MissaoExecutada {
    id: string;
    user_id: string;
    planejamento_id: string;
    rodada_numero: number;
    missao_numero: number;
    completed_at: string;
    created_at: string;
}

export interface MissaoKey {
    rodada_numero: number;
    missao_numero: number;
}

export const missaoService = {
    /**
     * Marca uma missão como executada
     */
    async marcarExecutada(
        userId: string,
        planejamentoId: string,
        rodadaNumero: number,
        missaoNumero: number
    ): Promise<MissaoExecutada> {
        const { data, error } = await supabase
            .from('missoes_executadas')
            .insert({
                user_id: userId,
                planejamento_id: planejamentoId,
                rodada_numero: rodadaNumero,
                missao_numero: missaoNumero
            })
            .select()
            .single();

        if (error) throw error;
        return data as any;
    },

    /**
     * Remove a marcação de uma missão executada
     */
    async desmarcarExecutada(
        userId: string,
        planejamentoId: string,
        rodadaNumero: number,
        missaoNumero: number
    ): Promise<void> {
        const { error } = await supabase
            .from('missoes_executadas')
            .delete()
            .eq('user_id', userId)
            .eq('planejamento_id', planejamentoId)
            .eq('rodada_numero', rodadaNumero)
            .eq('missao_numero', missaoNumero);

        if (error) throw error;
    },

    /**
     * Busca todas as missões executadas de um planejamento por um usuário
     */
    async getExecutadasByPlanejamento(
        userId: string,
        planejamentoId: string
    ): Promise<MissaoExecutada[]> {
        const { data, error } = await supabase
            .from('missoes_executadas')
            .select('*')
            .eq('user_id', userId)
            .eq('planejamento_id', planejamentoId)
            .order('rodada_numero')
            .order('missao_numero');

        if (error) throw error;
        return (data as any[] || []);
    },

    /**
     * Verifica se uma missão específica foi executada
     */
    async isMissaoExecutada(
        userId: string,
        planejamentoId: string,
        rodadaNumero: number,
        missaoNumero: number
    ): Promise<boolean> {
        const { data, error } = await supabase
            .from('missoes_executadas')
            .select('id')
            .eq('user_id', userId)
            .eq('planejamento_id', planejamentoId)
            .eq('rodada_numero', rodadaNumero)
            .eq('missao_numero', missaoNumero)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    /**
     * Retorna um Set com as chaves das missões executadas para lookup rápido
     */
    async getExecutadasSet(
        userId: string,
        planejamentoId: string
    ): Promise<Set<string>> {
        const executadas = await this.getExecutadasByPlanejamento(userId, planejamentoId);
        return new Set(
            executadas.map(m => `${m.rodada_numero}-${m.missao_numero}`)
        );
    },

    /**
     * Conta o progresso do aluno (missões executadas / total)
     */
    async getProgresso(
        userId: string,
        planejamentoId: string,
        totalMissoes: number
    ): Promise<{ executadas: number; total: number; percentual: number }> {
        const executadas = await this.getExecutadasByPlanejamento(userId, planejamentoId);
        const count = executadas.length;
        return {
            executadas: count,
            total: totalMissoes,
            percentual: totalMissoes > 0 ? Math.round((count / totalMissoes) * 100) : 0
        };
    }
};
