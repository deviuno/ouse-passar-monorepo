/**
 * Agente de Adaptação de Filtros de Questões
 *
 * Este agente é responsável por adaptar os termos de matéria e assuntos
 * do edital para os termos que existem no banco de questões.
 *
 * Exemplo:
 * - Edital: "Língua Portuguesa"
 * - Banco de Questões: "Português"
 * - Adaptação: "Língua Portuguesa" → "Português"
 *
 * O agente registra todas as adaptações feitas para auditoria pelo admin.
 */

import { Agent } from "@mastra/core";
import { google } from "@ai-sdk/google";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Lazy-loaded Supabase clients
let _supabaseApp: SupabaseClient | null = null;
let _supabaseQuestoes: SupabaseClient | null = null;

function getSupabaseAppClient(): SupabaseClient {
    if (!_supabaseApp) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase App URL and Key are required. Check your .env file.');
        }

        _supabaseApp = createClient(supabaseUrl, supabaseKey);
    }
    return _supabaseApp;
}

function getSupabaseQuestoesClient(): SupabaseClient {
    if (!_supabaseQuestoes) {
        const supabaseUrl = process.env.VITE_QUESTIONS_DB_URL || '';
        const supabaseKey = process.env.VITE_QUESTIONS_DB_ANON_KEY || '';

        console.log('[FiltrosAdapter] Questions DB URL:', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'NÃO DEFINIDA');
        console.log('[FiltrosAdapter] Questions DB Key:', supabaseKey ? `DEFINIDA (${supabaseKey.length} chars)` : 'NÃO DEFINIDA');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase Questions DB URL and Key are required. Check your .env file.');
        }

        _supabaseQuestoes = createClient(supabaseUrl, supabaseKey);
    }
    return _supabaseQuestoes;
}

// ==================== TIPOS ====================

interface FiltrosMissao {
    assuntos?: string[];
    bancas?: string[];
    materias?: string[];
}

interface MissaoComFiltros {
    id: string;
    numero: string;
    materia: string | null;
    assunto: string | null;
    filtros: FiltrosMissao;
}

interface AdaptacaoResultado {
    missaoId: string;
    filtrosOriginais: FiltrosMissao;
    filtrosOtimizados: FiltrosMissao;
    observacoes: string[];
    questoesEncontradas: number;
}

interface ResultadoOtimizacao {
    success: boolean;
    missoesProcessadas: number;
    missoesOtimizadas: number;
    adaptacoes: AdaptacaoResultado[];
    error?: string;
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Busca todas as matérias únicas do banco de questões
 * Usa estratégia de sampling com múltiplos offsets para cobrir toda a base
 */
async function buscarMateriasUnicasDoBanco(): Promise<string[]> {
    const supabase = getSupabaseQuestoesClient();

    try {
        console.log('[FiltrosAdapter] Buscando matérias únicas do banco de questões...');

        // Primeiro, verificar se a tabela existe e tem dados
        const { count: totalCount, error: countError } = await supabase
            .from('questoes_concurso')
            .select('*', { count: 'exact', head: true });

        const total = totalCount || 0;
        console.log(`[FiltrosAdapter] Total de questões no banco: ${total}`);
        if (countError) {
            console.error('[FiltrosAdapter] Erro ao contar questões:', countError);
        }

        // Estratégia: buscar samples em diferentes partes do banco
        // Isso é MUITO mais eficiente do que percorrer 155k registros
        const materiasSet = new Set<string>();
        const SAMPLE_SIZE = 1000;

        // Calcular offsets distribuídos ao longo do banco
        const numSamples = Math.min(20, Math.ceil(total / 10000)); // Max 20 samples
        const step = Math.floor(total / numSamples);

        console.log(`[FiltrosAdapter] Usando ${numSamples} samples com step de ${step}...`);

        for (let i = 0; i < numSamples; i++) {
            const offset = i * step;

            const { data, error } = await supabase
                .from('questoes_concurso')
                .select('materia')
                .not('materia', 'is', null)
                .neq('materia', '')
                .range(offset, offset + SAMPLE_SIZE - 1);

            if (error) {
                console.error(`[FiltrosAdapter] Erro no sample ${i + 1}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                for (const row of data) {
                    if (row.materia && typeof row.materia === 'string' && row.materia.trim()) {
                        materiasSet.add(row.materia.trim());
                    }
                }
                console.log(`[FiltrosAdapter] Sample ${i + 1}/${numSamples} (offset ${offset}): ${data.length} registros, ${materiasSet.size} matérias únicas até agora`);
            }
        }

        const materias = Array.from(materiasSet).sort();
        console.log(`[FiltrosAdapter] Total: ${materias.length} matérias únicas encontradas`);
        console.log(`[FiltrosAdapter] Matérias: ${materias.join(', ')}`);

        return materias;
    } catch (error) {
        console.error('[FiltrosAdapter] Erro:', error);
        return [];
    }
}

/**
 * Busca todas as bancas únicas do banco de questões
 * Usa estratégia de sampling similar à busca de matérias
 */
async function buscarBancasUnicasDoBanco(): Promise<string[]> {
    const supabase = getSupabaseQuestoesClient();

    try {
        console.log('[FiltrosAdapter] Buscando bancas únicas do banco de questões...');

        const { count: totalCount } = await supabase
            .from('questoes_concurso')
            .select('*', { count: 'exact', head: true });

        const total = totalCount || 0;
        const bancasSet = new Set<string>();
        const SAMPLE_SIZE = 1000;
        const numSamples = Math.min(10, Math.ceil(total / 20000)); // Menos samples para bancas
        const step = Math.floor(total / numSamples);

        for (let i = 0; i < numSamples; i++) {
            const offset = i * step;

            const { data, error } = await supabase
                .from('questoes_concurso')
                .select('banca')
                .not('banca', 'is', null)
                .neq('banca', '')
                .range(offset, offset + SAMPLE_SIZE - 1);

            if (error) continue;

            if (data && data.length > 0) {
                for (const row of data) {
                    if (row.banca && typeof row.banca === 'string' && row.banca.trim()) {
                        bancasSet.add(row.banca.trim());
                    }
                }
            }
        }

        const bancas = Array.from(bancasSet).sort();
        console.log(`[FiltrosAdapter] Total: ${bancas.length} bancas únicas encontradas`);

        return bancas;
    } catch (error) {
        console.error('[FiltrosAdapter] Erro ao buscar bancas:', error);
        return [];
    }
}

/**
 * Conta quantas questões existem para uma combinação de filtros
 */
async function contarQuestoesComFiltros(filtros: FiltrosMissao): Promise<number> {
    const supabase = getSupabaseQuestoesClient();

    try {
        let query = supabase
            .from('questoes_concurso')
            .select('*', { count: 'exact', head: true })
            .not('gabarito', 'is', null)
            .neq('gabarito', '');

        if (filtros.materias && filtros.materias.length > 0) {
            query = query.in('materia', filtros.materias);
        }

        if (filtros.bancas && filtros.bancas.length > 0) {
            query = query.in('banca', filtros.bancas);
        }

        const { count, error } = await query;

        if (error) {
            console.error('[FiltrosAdapter] Erro ao contar questões:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('[FiltrosAdapter] Erro:', error);
        return 0;
    }
}

/**
 * Busca todas as missões de um preparatório com seus filtros
 */
async function buscarMissoesComFiltros(preparatorioId: string): Promise<MissaoComFiltros[]> {
    const supabase = getSupabaseAppClient();

    try {
        // Buscar rodadas do preparatório
        const { data: rodadas, error: rodadasError } = await supabase
            .from('rodadas')
            .select('id')
            .eq('preparatorio_id', preparatorioId);

        if (rodadasError || !rodadas || rodadas.length === 0) {
            console.log('[FiltrosAdapter] Nenhuma rodada encontrada');
            return [];
        }

        const rodadaIds = rodadas.map(r => r.id);

        // Buscar missões dessas rodadas (apenas tipo 'estudo')
        const { data: missoes, error: missoesError } = await supabase
            .from('missoes')
            .select('id, numero, materia, assunto')
            .in('rodada_id', rodadaIds)
            .eq('tipo', 'estudo');

        if (missoesError || !missoes || missoes.length === 0) {
            console.log('[FiltrosAdapter] Nenhuma missão de estudo encontrada');
            return [];
        }

        // Buscar filtros de cada missão
        const missaoIds = missoes.map(m => m.id);
        const { data: filtros, error: filtrosError } = await supabase
            .from('missao_questao_filtros')
            .select('missao_id, filtros')
            .in('missao_id', missaoIds);

        if (filtrosError) {
            console.error('[FiltrosAdapter] Erro ao buscar filtros:', filtrosError);
        }

        // Mapear filtros por missão
        const filtrosMap = new Map<string, FiltrosMissao>();
        for (const f of filtros || []) {
            filtrosMap.set(f.missao_id, f.filtros as FiltrosMissao || {});
        }

        // Combinar missões com filtros
        const resultado: MissaoComFiltros[] = missoes.map(m => ({
            id: m.id,
            numero: m.numero,
            materia: m.materia,
            assunto: m.assunto,
            filtros: filtrosMap.get(m.id) || {
                materias: m.materia ? [m.materia] : [],
                assuntos: m.assunto ? [m.assunto] : [],
            },
        }));

        console.log(`[FiltrosAdapter] Encontradas ${resultado.length} missões com filtros`);
        return resultado;
    } catch (error) {
        console.error('[FiltrosAdapter] Erro:', error);
        return [];
    }
}

/**
 * Salva os filtros otimizados no banco
 */
async function salvarFiltrosOtimizados(
    missaoId: string,
    filtrosOriginais: FiltrosMissao,
    filtrosOtimizados: FiltrosMissao,
    observacoes: string[],
    questoesCount: number
): Promise<boolean> {
    const supabase = getSupabaseAppClient();

    try {
        const { error } = await supabase
            .from('missao_questao_filtros')
            .upsert({
                missao_id: missaoId,
                filtros: filtrosOtimizados,
                filtros_originais: filtrosOriginais,
                adaptacoes_observacoes: observacoes.join('\n'),
                otimizado_por_ia: true,
                questoes_count: questoesCount,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'missao_id',
            });

        if (error) {
            console.error('[FiltrosAdapter] Erro ao salvar filtros:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[FiltrosAdapter] Erro:', error);
        return false;
    }
}

// ==================== AGENTE ====================

export const filtrosAdapterAgent = new Agent({
    name: "FiltrosAdapterAgent",
    instructions: `Você é um agente especializado em adaptar termos de editais de concursos para os termos usados em bancos de questões.

Sua função é:
1. Receber um termo do edital (matéria ou assunto)
2. Analisar a lista de termos disponíveis no banco de questões
3. Encontrar o termo mais adequado que represente o mesmo conteúdo

Regras importantes:
- Sempre busque correspondência semântica, não apenas textual
- "Língua Portuguesa" e "Português" são equivalentes
- "Raciocínio Lógico" e "Lógica" são equivalentes
- "Direito Constitucional" pode estar como "Constitucional"
- Considere variações de acentuação e capitalização
- Se não encontrar correspondência, mantenha o termo original
- Sempre retorne uma explicação clara da adaptação feita`,
    model: google("gemini-2.0-flash"),
});

// ==================== FUNÇÃO PRINCIPAL ====================

/**
 * Otimiza os filtros de todas as missões de um preparatório
 * usando IA para adaptar os termos do edital para os termos do banco de questões
 */
export async function otimizarFiltrosPreparatorio(
    preparatorioId: string
): Promise<ResultadoOtimizacao> {
    console.log(`[FiltrosAdapter] Iniciando otimização de filtros para preparatório: ${preparatorioId}`);

    try {
        // 1. Buscar matérias e bancas únicas do banco de questões
        const [materiasDisponiveis, bancasDisponiveis] = await Promise.all([
            buscarMateriasUnicasDoBanco(),
            buscarBancasUnicasDoBanco(),
        ]);

        if (materiasDisponiveis.length === 0) {
            return {
                success: false,
                missoesProcessadas: 0,
                missoesOtimizadas: 0,
                adaptacoes: [],
                error: 'Não foi possível buscar matérias do banco de questões',
            };
        }

        console.log(`[FiltrosAdapter] Bancas disponíveis: ${bancasDisponiveis.slice(0, 10).join(', ')}${bancasDisponiveis.length > 10 ? '...' : ''}`);

        // 2. Buscar missões com seus filtros
        const missoes = await buscarMissoesComFiltros(preparatorioId);

        if (missoes.length === 0) {
            return {
                success: true,
                missoesProcessadas: 0,
                missoesOtimizadas: 0,
                adaptacoes: [],
            };
        }

        console.log(`[FiltrosAdapter] Processando ${missoes.length} missões...`);

        // 3. Para cada missão, adaptar os filtros
        const adaptacoes: AdaptacaoResultado[] = [];
        let missoesOtimizadas = 0;

        for (const missao of missoes) {
            console.log(`[FiltrosAdapter] Processando missão ${missao.numero}: ${missao.materia}`);

            const filtrosOriginais = { ...missao.filtros };
            const observacoes: string[] = [];
            let filtrosOtimizados: FiltrosMissao = { ...filtrosOriginais };

            // Adaptar matéria
            if (missao.materia && filtrosOriginais.materias) {
                const materiaOriginal = filtrosOriginais.materias[0] || missao.materia;

                // Verificar se a matéria original existe no banco
                const materiaExata = materiasDisponiveis.find(
                    m => m.toLowerCase() === materiaOriginal.toLowerCase()
                );

                if (materiaExata) {
                    // Matéria existe exatamente, não precisa adaptar
                    filtrosOtimizados.materias = [materiaExata];
                } else {
                    // Usar IA para encontrar a melhor correspondência
                    try {
                        const prompt = `
Termo do edital: "${materiaOriginal}"

Lista de matérias disponíveis no banco de questões:
${materiasDisponiveis.slice(0, 100).join('\n')}

Qual matéria da lista acima melhor corresponde ao termo "${materiaOriginal}"?

Responda APENAS no formato JSON:
{
  "materiaEncontrada": "nome exato da matéria encontrada ou null se não encontrar",
  "explicacao": "breve explicação da adaptação"
}`;

                        const result = await filtrosAdapterAgent.generate([
                            { role: "user", content: prompt }
                        ]);

                        const responseText = result.text || '';

                        // Extrair JSON da resposta
                        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);

                            if (parsed.materiaEncontrada && parsed.materiaEncontrada !== 'null') {
                                filtrosOtimizados.materias = [parsed.materiaEncontrada];
                                observacoes.push(`Matéria: "${materiaOriginal}" → "${parsed.materiaEncontrada}" (${parsed.explicacao})`);
                                console.log(`[FiltrosAdapter] Adaptação: ${materiaOriginal} → ${parsed.materiaEncontrada}`);
                            } else {
                                // Tentar busca parcial
                                const materiaParcial = materiasDisponiveis.find(m =>
                                    m.toLowerCase().includes(materiaOriginal.toLowerCase().substring(0, 5)) ||
                                    materiaOriginal.toLowerCase().includes(m.toLowerCase().substring(0, 5))
                                );

                                if (materiaParcial) {
                                    filtrosOtimizados.materias = [materiaParcial];
                                    observacoes.push(`Matéria: "${materiaOriginal}" → "${materiaParcial}" (correspondência parcial)`);
                                } else {
                                    observacoes.push(`Matéria: "${materiaOriginal}" - Mantido original (sem correspondência encontrada)`);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`[FiltrosAdapter] Erro ao adaptar matéria: ${error}`);
                        observacoes.push(`Matéria: "${materiaOriginal}" - Erro na adaptação, mantido original`);
                    }
                }
            }

            // Verificar e adaptar bancas
            if (filtrosOtimizados.bancas && filtrosOtimizados.bancas.length > 0) {
                const bancasOriginais = [...filtrosOtimizados.bancas];
                const bancasValidas: string[] = [];
                const bancasRemovidas: string[] = [];

                for (const banca of bancasOriginais) {
                    // Verificar se a banca existe no banco (case insensitive)
                    const bancaEncontrada = bancasDisponiveis.find(
                        b => b.toLowerCase() === banca.toLowerCase()
                    );

                    if (bancaEncontrada) {
                        bancasValidas.push(bancaEncontrada);
                    } else {
                        bancasRemovidas.push(banca);
                    }
                }

                if (bancasRemovidas.length > 0) {
                    if (bancasValidas.length > 0) {
                        filtrosOtimizados.bancas = bancasValidas;
                        observacoes.push(`Bancas: Removidas ${bancasRemovidas.join(', ')} (não encontradas no banco)`);
                    } else {
                        // Nenhuma banca válida, remover filtro de banca para buscar de todas
                        delete filtrosOtimizados.bancas;
                        observacoes.push(`Bancas: Removido filtro de banca (${bancasRemovidas.join(', ')} não encontradas - busca em todas as bancas)`);
                        console.log(`[FiltrosAdapter] Removido filtro de banca: ${bancasRemovidas.join(', ')}`);
                    }
                }
            }

            // Contar questões com os novos filtros
            const questoesCount = await contarQuestoesComFiltros(filtrosOtimizados);

            // Só considerar otimizado se houve alguma adaptação
            const foiOtimizado = observacoes.length > 0;

            // Salvar filtros otimizados
            const salvou = await salvarFiltrosOtimizados(
                missao.id,
                filtrosOriginais,
                filtrosOtimizados,
                observacoes,
                questoesCount
            );

            if (salvou && foiOtimizado) {
                missoesOtimizadas++;
            }

            adaptacoes.push({
                missaoId: missao.id,
                filtrosOriginais,
                filtrosOtimizados,
                observacoes,
                questoesEncontradas: questoesCount,
            });
        }

        console.log(`[FiltrosAdapter] Otimização concluída: ${missoesOtimizadas}/${missoes.length} missões adaptadas`);

        return {
            success: true,
            missoesProcessadas: missoes.length,
            missoesOtimizadas,
            adaptacoes,
        };

    } catch (error: any) {
        console.error('[FiltrosAdapter] Erro na otimização:', error);
        return {
            success: false,
            missoesProcessadas: 0,
            missoesOtimizadas: 0,
            adaptacoes: [],
            error: error.message || 'Erro ao otimizar filtros',
        };
    }
}

export default {
    filtrosAdapterAgent,
    otimizarFiltrosPreparatorio,
    buscarMateriasUnicasDoBanco,
};
