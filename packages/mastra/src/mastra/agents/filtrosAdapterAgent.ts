/**
 * Agente de Adaptação de Filtros de Questões
 *
 * Este agente é responsável por adaptar TODOS os termos de filtros
 * (matérias, assuntos, bancas, órgãos) do edital para os termos
 * que existem no banco de questões.
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
    materias?: string[];
    assuntos?: string[];
    bancas?: string[];
    orgaos?: string[];
    anos?: number[];
    questao_revisada?: boolean;
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

// Cache de valores únicos do banco de questões
interface CacheValoresUnicos {
    materias: string[];
    assuntos: string[];
    bancas: string[];
    orgaos: string[];
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Busca valores únicos de uma coluna usando estratégia de sampling
 */
async function buscarValoresUnicosDoBanco(
    coluna: string,
    numSamplesMax: number = 20
): Promise<string[]> {
    const supabase = getSupabaseQuestoesClient();

    try {
        console.log(`[FiltrosAdapter] Buscando ${coluna} únicos do banco de questões...`);

        const { count: totalCount, error: countError } = await supabase
            .from('questoes_concurso')
            .select('*', { count: 'exact', head: true });

        const total = totalCount || 0;
        if (countError) {
            console.error(`[FiltrosAdapter] Erro ao contar questões:`, countError);
        }

        const valoresSet = new Set<string>();
        const SAMPLE_SIZE = 1000;
        const numSamples = Math.min(numSamplesMax, Math.ceil(total / 10000));
        const step = Math.floor(total / Math.max(numSamples, 1));

        console.log(`[FiltrosAdapter] ${coluna}: ${numSamples} samples com step de ${step}...`);

        for (let i = 0; i < numSamples; i++) {
            const offset = i * step;

            const { data, error } = await supabase
                .from('questoes_concurso')
                .select(coluna)
                .not(coluna, 'is', null)
                .neq(coluna, '')
                .range(offset, offset + SAMPLE_SIZE - 1);

            if (error) {
                console.error(`[FiltrosAdapter] Erro no sample ${i + 1} de ${coluna}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                for (const row of data) {
                    const valor = (row as any)[coluna];
                    if (valor && typeof valor === 'string' && valor.trim()) {
                        valoresSet.add(valor.trim());
                    }
                }
            }
        }

        const valores = Array.from(valoresSet).sort();
        console.log(`[FiltrosAdapter] Total: ${valores.length} ${coluna} únicos encontrados`);

        return valores;
    } catch (error) {
        console.error(`[FiltrosAdapter] Erro ao buscar ${coluna}:`, error);
        return [];
    }
}

/**
 * Busca todos os valores únicos do banco de questões (matérias, assuntos, bancas, órgãos)
 */
async function buscarTodosValoresUnicos(): Promise<CacheValoresUnicos> {
    console.log('[FiltrosAdapter] Buscando todos os valores únicos do banco de questões...');

    const [materias, assuntos, bancas, orgaos] = await Promise.all([
        buscarValoresUnicosDoBanco('materia', 20),
        buscarValoresUnicosDoBanco('assunto', 25), // Mais samples para assuntos (maior variedade)
        buscarValoresUnicosDoBanco('banca', 10),
        buscarValoresUnicosDoBanco('orgao', 15),
    ]);

    console.log(`[FiltrosAdapter] Cache carregado: ${materias.length} matérias, ${assuntos.length} assuntos, ${bancas.length} bancas, ${orgaos.length} órgãos`);

    return { materias, assuntos, bancas, orgaos };
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

        if (filtros.assuntos && filtros.assuntos.length > 0) {
            query = query.in('assunto', filtros.assuntos);
        }

        if (filtros.bancas && filtros.bancas.length > 0) {
            query = query.in('banca', filtros.bancas);
        }

        if (filtros.orgaos && filtros.orgaos.length > 0) {
            query = query.in('orgao', filtros.orgaos);
        }

        if (filtros.anos && filtros.anos.length > 0) {
            query = query.in('ano', filtros.anos);
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
1. Receber um termo do edital (matéria, assunto, banca ou órgão)
2. Analisar a lista de termos disponíveis no banco de questões
3. Encontrar o termo mais adequado que represente o mesmo conteúdo

Regras importantes:
- Sempre busque correspondência semântica, não apenas textual
- "Língua Portuguesa" e "Português" são equivalentes
- "Raciocínio Lógico" e "Lógica" são equivalentes
- "Direito Constitucional" pode estar como "Constitucional"
- IDECAN = Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional
- FGV = Fundação Getúlio Vargas
- CESPE = Centro de Seleção e de Promoção de Eventos (CEBRASPE)
- FCC = Fundação Carlos Chagas
- Considere variações de acentuação e capitalização
- Se não encontrar correspondência, retorne null
- Sempre retorne uma explicação clara da adaptação feita`,
    model: google("gemini-2.0-flash"),
});

// ==================== FUNÇÕES DE ADAPTAÇÃO ====================

/**
 * Tenta encontrar correspondência exata (case-insensitive)
 */
function buscarCorrespondenciaExata(termo: string, disponiveis: string[]): string | null {
    return disponiveis.find(d => d.toLowerCase() === termo.toLowerCase()) || null;
}

/**
 * Tenta encontrar correspondência por sigla ou nome parcial
 */
function buscarCorrespondenciaParcial(termo: string, disponiveis: string[]): string | null {
    const termoLower = termo.toLowerCase();

    return disponiveis.find(d => {
        const dLower = d.toLowerCase();

        // Verifica se um contém o outro
        if (dLower.includes(termoLower) || termoLower.includes(dLower)) {
            return true;
        }

        // Verifica se é uma sigla (primeiras letras de cada palavra)
        const sigla = d.split(/\s+/).map(w => w[0]).join('').toLowerCase();
        if (sigla === termoLower) {
            return true;
        }

        // Verifica correspondência parcial (primeiros 5 caracteres)
        if (termoLower.length >= 5 && dLower.length >= 5) {
            if (dLower.includes(termoLower.substring(0, 5)) ||
                termoLower.includes(dLower.substring(0, 5))) {
                return true;
            }
        }

        return false;
    }) || null;
}

/**
 * Usa IA para encontrar correspondência semântica
 */
async function buscarCorrespondenciaIA(
    termo: string,
    disponiveis: string[],
    tipoFiltro: string,
    contextoExtra: string = ''
): Promise<{ termo: string | null; explicacao: string }> {
    try {
        const prompt = `
Termo do edital (${tipoFiltro}): "${termo}"

Lista de ${tipoFiltro}s disponíveis no banco de questões:
${disponiveis.slice(0, 150).join('\n')}

${contextoExtra}

Qual item da lista acima melhor corresponde ao termo "${termo}"?
Considere sinônimos, abreviações, siglas e variações de nomenclatura.

Responda APENAS no formato JSON:
{
  "termoEncontrado": "nome exato do termo encontrado ou null se não encontrar",
  "explicacao": "breve explicação da adaptação ou motivo de não encontrar"
}`;

        const result = await filtrosAdapterAgent.generate([
            { role: "user", content: prompt }
        ]);

        const responseText = result.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.termoEncontrado && parsed.termoEncontrado !== 'null') {
                // Validar se o termo retornado realmente existe na lista
                const termoValido = disponiveis.find(
                    d => d.toLowerCase() === parsed.termoEncontrado.toLowerCase()
                );

                if (termoValido) {
                    return { termo: termoValido, explicacao: parsed.explicacao };
                }
            }

            return { termo: null, explicacao: parsed.explicacao || 'Sem correspondência' };
        }

        return { termo: null, explicacao: 'Erro ao processar resposta da IA' };
    } catch (error) {
        console.error(`[FiltrosAdapter] Erro na adaptação IA de ${tipoFiltro}:`, error);
        return { termo: null, explicacao: 'Erro na adaptação por IA' };
    }
}

/**
 * Adapta um array de termos para os valores disponíveis no banco
 */
async function adaptarFiltros(
    termosOriginais: string[],
    disponiveis: string[],
    tipoFiltro: string,
    contextoExtra: string = ''
): Promise<{ termosAdaptados: string[]; observacoes: string[] }> {
    const termosAdaptados: string[] = [];
    const observacoes: string[] = [];

    for (const termo of termosOriginais) {
        // 1. Tentar correspondência exata
        const exato = buscarCorrespondenciaExata(termo, disponiveis);
        if (exato) {
            termosAdaptados.push(exato);
            continue;
        }

        // 2. Tentar correspondência parcial/sigla
        const parcial = buscarCorrespondenciaParcial(termo, disponiveis);
        if (parcial) {
            termosAdaptados.push(parcial);
            observacoes.push(`${tipoFiltro}: "${termo}" → "${parcial}" (correspondência encontrada)`);
            console.log(`[FiltrosAdapter] ${tipoFiltro} adaptado: ${termo} → ${parcial}`);
            continue;
        }

        // 3. Usar IA para encontrar correspondência semântica
        const { termo: termoIA, explicacao } = await buscarCorrespondenciaIA(
            termo, disponiveis, tipoFiltro, contextoExtra
        );

        if (termoIA) {
            termosAdaptados.push(termoIA);
            observacoes.push(`${tipoFiltro}: "${termo}" → "${termoIA}" (${explicacao})`);
            console.log(`[FiltrosAdapter] ${tipoFiltro} adaptado por IA: ${termo} → ${termoIA}`);
        } else {
            observacoes.push(`${tipoFiltro}: "${termo}" - Não encontrado (${explicacao})`);
            console.log(`[FiltrosAdapter] ${tipoFiltro} não encontrado: ${termo}`);
        }
    }

    return { termosAdaptados, observacoes };
}

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
        // 1. Buscar todos os valores únicos do banco de questões
        const cache = await buscarTodosValoresUnicos();

        if (cache.materias.length === 0) {
            return {
                success: false,
                missoesProcessadas: 0,
                missoesOtimizadas: 0,
                adaptacoes: [],
                error: 'Não foi possível buscar matérias do banco de questões',
            };
        }

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

        // Contextos extras para ajudar a IA
        const contextoBancas = `
Siglas comuns de bancas:
- IDECAN = Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional
- FGV = Fundação Getúlio Vargas
- CESPE/CEBRASPE = Centro de Seleção e de Promoção de Eventos
- FCC = Fundação Carlos Chagas
- VUNESP = Fundação para o Vestibular da Universidade Estadual Paulista
- IBFC = Instituto Brasileiro de Formação e Capacitação
- IADES = Instituto Americano de Desenvolvimento
- CONSULPLAN = Consultoria e Planejamento
- FUNCAB = Fundação Professor Carlos Augusto Bittencourt`;

        const contextoOrgaos = `
Siglas comuns de órgãos:
- TRF = Tribunal Regional Federal
- TRT = Tribunal Regional do Trabalho
- TJ = Tribunal de Justiça
- STF = Supremo Tribunal Federal
- STJ = Superior Tribunal de Justiça
- MPF = Ministério Público Federal
- MPU = Ministério Público da União
- AGU = Advocacia-Geral da União
- PF = Polícia Federal
- PRF = Polícia Rodoviária Federal
- INSS = Instituto Nacional do Seguro Social`;

        // 3. Para cada missão, adaptar os filtros
        const adaptacoes: AdaptacaoResultado[] = [];
        let missoesOtimizadas = 0;

        for (const missao of missoes) {
            console.log(`[FiltrosAdapter] Processando missão ${missao.numero}: ${missao.materia}`);

            const filtrosOriginais = { ...missao.filtros };
            const observacoesTodas: string[] = [];
            let filtrosOtimizados: FiltrosMissao = { ...filtrosOriginais };

            // Adaptar MATÉRIAS
            if (filtrosOtimizados.materias && filtrosOtimizados.materias.length > 0) {
                const { termosAdaptados, observacoes } = await adaptarFiltros(
                    filtrosOtimizados.materias,
                    cache.materias,
                    'Matéria'
                );

                if (termosAdaptados.length > 0) {
                    filtrosOtimizados.materias = termosAdaptados;
                } else {
                    delete filtrosOtimizados.materias;
                    observacoes.push('Matérias: Removido filtro (nenhuma correspondência encontrada)');
                }
                observacoesTodas.push(...observacoes);
            }

            // Adaptar ASSUNTOS
            if (filtrosOtimizados.assuntos && filtrosOtimizados.assuntos.length > 0) {
                const { termosAdaptados, observacoes } = await adaptarFiltros(
                    filtrosOtimizados.assuntos,
                    cache.assuntos,
                    'Assunto'
                );

                if (termosAdaptados.length > 0) {
                    filtrosOtimizados.assuntos = termosAdaptados;
                } else {
                    delete filtrosOtimizados.assuntos;
                    observacoes.push('Assuntos: Removido filtro (nenhuma correspondência encontrada)');
                }
                observacoesTodas.push(...observacoes);
            }

            // Adaptar BANCAS
            if (filtrosOtimizados.bancas && filtrosOtimizados.bancas.length > 0) {
                const { termosAdaptados, observacoes } = await adaptarFiltros(
                    filtrosOtimizados.bancas,
                    cache.bancas,
                    'Banca',
                    contextoBancas
                );

                if (termosAdaptados.length > 0) {
                    filtrosOtimizados.bancas = termosAdaptados;
                } else {
                    delete filtrosOtimizados.bancas;
                    observacoes.push('Bancas: Removido filtro (nenhuma correspondência - busca em todas as bancas)');
                }
                observacoesTodas.push(...observacoes);
            }

            // Adaptar ÓRGÃOS
            if (filtrosOtimizados.orgaos && filtrosOtimizados.orgaos.length > 0) {
                const { termosAdaptados, observacoes } = await adaptarFiltros(
                    filtrosOtimizados.orgaos,
                    cache.orgaos,
                    'Órgão',
                    contextoOrgaos
                );

                if (termosAdaptados.length > 0) {
                    filtrosOtimizados.orgaos = termosAdaptados;
                } else {
                    delete filtrosOtimizados.orgaos;
                    observacoes.push('Órgãos: Removido filtro (nenhuma correspondência encontrada)');
                }
                observacoesTodas.push(...observacoes);
            }

            // Anos não precisam de adaptação (são números)
            // questao_revisada também não precisa (é boolean)

            // Contar questões com os novos filtros
            const questoesCount = await contarQuestoesComFiltros(filtrosOtimizados);

            // Só considerar otimizado se houve alguma adaptação
            const foiOtimizado = observacoesTodas.length > 0;

            // Salvar filtros otimizados
            const salvou = await salvarFiltrosOtimizados(
                missao.id,
                filtrosOriginais,
                filtrosOtimizados,
                observacoesTodas,
                questoesCount
            );

            if (salvou && foiOtimizado) {
                missoesOtimizadas++;
            }

            adaptacoes.push({
                missaoId: missao.id,
                filtrosOriginais,
                filtrosOtimizados,
                observacoes: observacoesTodas,
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
    buscarValoresUnicosDoBanco,
    buscarTodosValoresUnicos,
};
