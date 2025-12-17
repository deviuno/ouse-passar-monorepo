/**
 * Service para geração automática de rodadas e missões via IA
 */

const MASTRA_URL = 'http://localhost:4000';

// ==================== TIPOS ====================

export interface TopicoParaGeracao {
    id: string;
    titulo: string;
    materia_id: string;
}

export interface MateriaOrdenada {
    id: string;
    titulo: string;
    prioridade: number;
    topicos: TopicoParaGeracao[];
}

export interface MateriaPriorizada {
    id: string;
    titulo: string;
    topicos_count: number;
    prioridade: number;
    score: number;
    justificativa: string;
}

export interface ResultadoPriorizacao {
    materias: MateriaPriorizada[];
    analise_geral: string;
    fonte_dados: 'banco_questoes' | 'conhecimento_geral' | 'hibrido';
}

export interface ConfiguracaoGeracao {
    missoes_por_rodada: number;
    max_topicos_por_missao: number;
    incluir_revisoes: boolean;
    incluir_simulado: boolean;
    gerar_filtros_questoes: boolean;
}

export interface MissaoGerada {
    numero: string;
    tipo: 'padrao' | 'revisao' | 'acao';
    materia: string | null;
    materia_id: string | null;
    assunto: string | null;
    instrucoes: string | null;
    tema: string | null;
    acao: string | null;
    topico_ids: string[];
    ordem: number;
}

export interface RodadaGerada {
    numero: number;
    titulo: string;
    missoes: MissaoGerada[];
}

export interface ResultadoGeracao {
    success: boolean;
    rodadas: RodadaGerada[];
    estatisticas: {
        total_rodadas: number;
        total_missoes: number;
        missoes_estudo: number;
        missoes_revisao: number;
        missoes_simulado: number;
    };
    persistencia?: {
        rodadas_criadas: number;
        missoes_criadas: number;
        vinculos_criados: number;
        filtros_criados: number;
    };
    error?: string;
}

// ==================== SERVICE ====================

export const rodadasGeneratorService = {
    /**
     * Busca matérias com tópicos do preparatório
     */
    async buscarMaterias(preparatorioId: string): Promise<MateriaOrdenada[]> {
        const response = await fetch(`${MASTRA_URL}/api/preparatorio/${preparatorioId}/materias`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar matérias');
        }

        return result.data;
    },

    /**
     * Analisa prioridade das matérias via IA
     */
    async analisarPrioridade(preparatorioId: string): Promise<ResultadoPriorizacao> {
        const response = await fetch(`${MASTRA_URL}/api/preparatorio/analisar-prioridade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preparatorio_id: preparatorioId }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao analisar prioridade');
        }

        return result.data;
    },

    /**
     * Gera preview das rodadas (sem persistir)
     */
    async gerarPreview(
        preparatorioId: string,
        materiasOrdenadas: MateriaOrdenada[],
        config?: Partial<ConfiguracaoGeracao>
    ): Promise<ResultadoGeracao> {
        const response = await fetch(`${MASTRA_URL}/api/preparatorio/gerar-rodadas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preparatorio_id: preparatorioId,
                materias_ordenadas: materiasOrdenadas,
                config,
                persistir: false,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao gerar preview');
        }

        return result.data;
    },

    /**
     * Gera e persiste as rodadas
     */
    async gerarRodadas(
        preparatorioId: string,
        materiasOrdenadas: MateriaOrdenada[],
        config?: Partial<ConfiguracaoGeracao>,
        banca?: string,
        substituirExistentes: boolean = true
    ): Promise<ResultadoGeracao> {
        const response = await fetch(`${MASTRA_URL}/api/preparatorio/gerar-rodadas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preparatorio_id: preparatorioId,
                materias_ordenadas: materiasOrdenadas,
                config,
                banca,
                substituir_existentes: substituirExistentes,
                persistir: true,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao gerar rodadas');
        }

        return result.data;
    },

    /**
     * Aplica priorização da IA às matérias do edital
     */
    aplicarPriorizacao(
        materias: MateriaOrdenada[],
        priorizacao: ResultadoPriorizacao
    ): MateriaOrdenada[] {
        // Criar mapa de prioridade
        const prioridadeMap = new Map<string, number>();
        priorizacao.materias.forEach(m => {
            prioridadeMap.set(m.id, m.prioridade);
        });

        // Ordenar matérias pela prioridade da IA
        return [...materias].sort((a, b) => {
            const prioA = prioridadeMap.get(a.id) || 999;
            const prioB = prioridadeMap.get(b.id) || 999;
            return prioA - prioB;
        }).map((m, idx) => ({
            ...m,
            prioridade: idx + 1,
        }));
    },

    /**
     * Reordena matérias manualmente
     */
    reordenarMaterias(
        materias: MateriaOrdenada[],
        fromIndex: number,
        toIndex: number
    ): MateriaOrdenada[] {
        const result = [...materias];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);

        // Atualizar prioridades
        return result.map((m, idx) => ({
            ...m,
            prioridade: idx + 1,
        }));
    },
};
