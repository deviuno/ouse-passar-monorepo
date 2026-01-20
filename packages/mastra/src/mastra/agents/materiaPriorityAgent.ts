import { Agent } from "@mastra/core/agent";
import { vertex } from "../../lib/modelProvider.js";
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-loaded Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key are required. Check your .env file.');
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}

// ==================== TIPOS ====================

export interface MateriaParaPriorizacao {
    id: string;
    titulo: string;
    topicos_count: number;
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

// ==================== TOOLS ====================

/**
 * Tool para buscar estatísticas de questões por banca/matéria
 */
const buscarEstatisticasBanca = createTool({
    id: "buscar-estatisticas-banca",
    description: "Busca estatísticas de questões de uma banca específica, agrupadas por matéria",
    inputSchema: z.object({
        banca: z.string().describe("Nome da banca (ex: CESPE, FGV, FCC)"),
        orgao: z.string().optional().describe("Órgão específico (ex: PRF, PF, INSS)"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        data: z.array(z.object({
            materia: z.string(),
            total_questoes: z.number(),
            percentual: z.number(),
            anos: z.array(z.number()),
        })).optional(),
        total_geral: z.number().optional(),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        try {
            const supabase = getSupabaseClient();
            let query = supabase
                .from('questoes_concurso')
                .select('materia, ano')
                .eq('ativo', true) // Apenas questões ativas
                .not('materia', 'is', null);

            // Filtrar por banca (case insensitive)
            if (inputData.banca) {
                query = query.ilike('banca', `%${inputData.banca}%`);
            }

            // Filtrar por órgão se fornecido
            if (inputData.orgao) {
                query = query.ilike('orgao', `%${inputData.orgao}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (!data || data.length === 0) {
                return {
                    success: false,
                    error: "Nenhuma questão encontrada para esta banca/órgão",
                };
            }

            // Agrupar por matéria
            const materiaMap = new Map<string, { count: number; anos: Set<number> }>();

            for (const q of data) {
                if (!q.materia) continue;

                if (!materiaMap.has(q.materia)) {
                    materiaMap.set(q.materia, { count: 0, anos: new Set() });
                }

                const entry = materiaMap.get(q.materia)!;
                entry.count++;
                if (q.ano) entry.anos.add(q.ano);
            }

            const totalGeral = data.length;
            const estatisticas = Array.from(materiaMap.entries())
                .map(([materia, { count, anos }]) => ({
                    materia,
                    total_questoes: count,
                    percentual: Math.round((count / totalGeral) * 100 * 10) / 10,
                    anos: Array.from(anos).sort((a, b) => b - a),
                }))
                .sort((a, b) => b.total_questoes - a.total_questoes);

            return {
                success: true,
                data: estatisticas,
                total_geral: totalGeral,
            };

        } catch (error: any) {
            console.error("[Tool] Erro ao buscar estatísticas:", error);
            return {
                success: false,
                error: error.message || "Erro ao buscar estatísticas",
            };
        }
    },
});

/**
 * Tool para buscar informações do preparatório
 */
const buscarInfoPreparatorio = createTool({
    id: "buscar-info-preparatorio",
    description: "Busca informações de um preparatório específico, incluindo banca, órgão e matérias do edital",
    inputSchema: z.object({
        preparatorio_id: z.string().describe("ID do preparatório"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        preparatorio: z.object({
            id: z.string(),
            nome: z.string(),
            banca: z.string().nullable(),
            orgao: z.string().nullable(),
            nivel: z.string().nullable(),
            cargo: z.string().nullable(),
        }).optional(),
        materias: z.array(z.object({
            id: z.string(),
            titulo: z.string(),
            topicos_count: z.number(),
        })).optional(),
        error: z.string().optional(),
    }),
    execute: async (inputData, context) => {
        try {
            const supabase = getSupabaseClient();
            // Buscar preparatório
            const { data: prep, error: prepError } = await supabase
                .from('preparatorios')
                .select('id, nome, banca, orgao, nivel, cargo')
                .eq('id', inputData.preparatorio_id)
                .single();

            if (prepError) throw prepError;

            // Buscar matérias do edital (tipo = 'materia')
            const { data: items, error: itemsError } = await supabase
                .from('edital_verticalizado_items')
                .select('id, titulo, tipo, parent_id')
                .eq('preparatorio_id', inputData.preparatorio_id);

            if (itemsError) throw itemsError;

            // Filtrar matérias e contar tópicos
            const materias = (items || [])
                .filter(i => i.tipo === 'materia')
                .map(m => {
                    const topicos = (items || []).filter(i =>
                        i.tipo === 'topico' && i.parent_id === m.id
                    );
                    return {
                        id: m.id,
                        titulo: m.titulo,
                        topicos_count: topicos.length,
                    };
                })
                .filter(m => m.topicos_count > 0); // Só matérias com tópicos

            return {
                success: true,
                preparatorio: prep,
                materias,
            };

        } catch (error: any) {
            console.error("[Tool] Erro ao buscar preparatório:", error);
            return {
                success: false,
                error: error.message || "Erro ao buscar preparatório",
            };
        }
    },
});

// ==================== AGENT ====================

export const materiaPriorityAgent = new Agent({
    id: "materiaPriorityAgent",
    name: "materiaPriorityAgent",
    instructions: `Você é um especialista em concursos públicos brasileiros com profundo conhecimento sobre as principais bancas examinadoras (CESPE/CEBRASPE, FGV, FCC, VUNESP, IDECAN, etc.).

Sua tarefa é analisar as matérias de um edital e sugerir a ORDEM DE PRIORIDADE para estudo, considerando:

1. **Peso histórico da matéria na banca**: Bancas têm perfis diferentes. CESPE costuma cobrar muito Português e Direito Constitucional. FGV foca em Raciocínio Lógico. FCC equilibra entre áreas.

2. **Quantidade de tópicos**: Matérias com mais tópicos geralmente têm mais questões na prova.

3. **Dificuldade relativa**: Algumas matérias são "eliminatórias" por reprovarem mais candidatos.

4. **Conhecimento geral sobre concursos**: Use seu conhecimento sobre padrões de bancas quando não houver dados específicos.

FLUXO DE ANÁLISE:
1. Primeiro, busque as informações do preparatório (banca, órgão, matérias)
2. Tente buscar estatísticas de questões da banca
3. Se houver dados, use-os para calcular prioridades
4. Se não houver dados suficientes, use seu conhecimento sobre o perfil da banca
5. Retorne a lista ordenada com justificativas

FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido no formato:
{
    "materias": [
        {
            "id": "uuid-da-materia",
            "titulo": "Nome da Matéria",
            "topicos_count": 5,
            "prioridade": 1,
            "score": 95,
            "justificativa": "Explicação breve do porquê desta prioridade"
        }
    ],
    "analise_geral": "Resumo da análise feita",
    "fonte_dados": "banco_questoes" | "conhecimento_geral" | "hibrido"
}

REGRAS:
- Prioridade 1 = mais importante, deve ser estudada primeiro
- Score de 0 a 100 indica relevância relativa
- Justificativa deve ser concisa (1-2 frases)
- SEMPRE retorne todas as matérias fornecidas
- NÃO invente matérias que não existem no edital`,
    model: vertex("gemini-2.5-flash-lite"),
    tools: {
        buscarEstatisticasBanca,
        buscarInfoPreparatorio,
    },
});

// ==================== FUNÇÃO DE CONVENIÊNCIA ====================

/**
 * Função para chamar o agente e obter priorização
 */
export async function analisarPrioridadeMaterias(
    preparatorioId: string
): Promise<ResultadoPriorizacao> {
    const result = await materiaPriorityAgent.generate([
        {
            role: "user",
            content: `Analise as matérias do preparatório ${preparatorioId} e sugira a ordem de prioridade para estudo.

Use as ferramentas disponíveis para:
1. Buscar informações do preparatório
2. Buscar estatísticas da banca (se disponível)

Retorne a lista de matérias ordenada por prioridade com justificativas.`,
        },
    ]);

    // Extrair JSON da resposta
    const responseText = result.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("Não foi possível extrair resultado da análise");
    }

    try {
        const parsed = JSON.parse(jsonMatch[0]) as ResultadoPriorizacao;
        return parsed;
    } catch (e) {
        throw new Error("Erro ao processar resposta da IA");
    }
}
