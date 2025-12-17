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

export interface ConfiguracaoGeracao {
    missoes_por_rodada: number;      // Default: 5
    max_topicos_por_missao: number;  // Default: 3
    incluir_revisoes: boolean;       // Default: true
    incluir_simulado: boolean;       // Default: true
    gerar_filtros_questoes: boolean; // Default: true
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
    error?: string;
}

export interface ResultadoPersistencia {
    success: boolean;
    rodadas_criadas: number;
    missoes_criadas: number;
    vinculos_criados: number;
    filtros_criados: number;
    error?: string;
}

// ==================== ALGORITMO DE GERAÇÃO ====================

/**
 * Divide os tópicos de uma matéria em missões equilibradas
 */
function dividirTopicosEmMissoes(
    materia: MateriaOrdenada,
    maxTopicos: number
): MissaoGerada[] {
    const topicos = materia.topicos;
    const n = topicos.length;

    if (n === 0) return [];

    const numMissoes = Math.ceil(n / maxTopicos);
    const missoes: MissaoGerada[] = [];

    // Distribuir equilibradamente
    const base = Math.floor(n / numMissoes);
    const extra = n % numMissoes;

    let idx = 0;
    for (let i = 0; i < numMissoes; i++) {
        const qtd = base + (i < extra ? 1 : 0);
        const topicosSlice = topicos.slice(idx, idx + qtd);

        missoes.push({
            numero: '',
            tipo: 'padrao',
            materia: materia.titulo,
            materia_id: materia.id,
            assunto: topicosSlice.map(t => t.titulo).join('\n'),
            instrucoes: 'Estudar os tópicos indicados e resolver questões relacionadas.',
            tema: null,
            acao: null,
            topico_ids: topicosSlice.map(t => t.id),
            ordem: 0,
        });

        idx += qtd;
    }

    return missoes;
}

/**
 * Cria uma missão de revisão para uma matéria
 */
function criarMissaoRevisao(materia: MateriaOrdenada, topicosIds: string[]): MissaoGerada {
    return {
        numero: '',
        tipo: 'revisao',
        materia: materia.titulo,
        materia_id: materia.id,
        assunto: null,
        instrucoes: null,
        tema: `REVISÃO: ${materia.titulo}`,
        acao: null,
        topico_ids: topicosIds,
        ordem: 0,
    };
}

/**
 * Cria uma missão de simulado para uma rodada
 */
function criarMissaoSimulado(rodadaNumero: number, topicosIds: string[], materias: string[]): MissaoGerada {
    return {
        numero: '',
        tipo: 'acao',
        materia: 'SIMULADO',
        materia_id: null,
        assunto: null,
        instrucoes: 'Realizar simulado com tempo cronometrado. Após finalizar, corrigir e revisar as questões erradas.',
        tema: null,
        acao: `SIMULADO DA RODADA ${rodadaNumero}\nMatérias: ${materias.join(', ')}`,
        topico_ids: topicosIds,
        ordem: 0,
    };
}

/**
 * Algoritmo principal de geração de rodadas
 */
export function gerarRodadas(
    materias: MateriaOrdenada[],
    config: ConfiguracaoGeracao
): ResultadoGeracao {
    try {
        const rodadas: RodadaGerada[] = [];
        const materiasFinalizadas = new Set<string>();
        const materiasRevisadas = new Set<string>();
        const filaRevisao: MateriaOrdenada[] = [];

        // Preparar filas de missões por matéria
        const filaMissoes = new Map<string, MissaoGerada[]>();
        const topicosMateria = new Map<string, string[]>(); // materia_id -> todos os topico_ids

        for (const materia of materias) {
            const missoes = dividirTopicosEmMissoes(materia, config.max_topicos_por_missao);
            filaMissoes.set(materia.id, missoes);
            topicosMateria.set(materia.id, materia.topicos.map(t => t.id));
        }

        let rodadaAtual = 1;
        let ultimaMateriaId: string | null = null;
        const maxRodadas = 100; // Limite de segurança

        // Loop principal
        while (rodadaAtual <= maxRodadas) {
            const missoesRodada: MissaoGerada[] = [];
            const topicosRodada: string[] = [];
            const materiasRodada: string[] = [];

            // Gerar missões de estudo/revisão para esta rodada
            for (let i = 0; i < config.missoes_por_rodada; i++) {
                // Buscar próxima matéria/revisão disponível (diferente da anterior)
                let missaoAdicionada = false;

                // Primeiro, tentar adicionar missão de estudo
                for (const materia of materias) {
                    if (materia.id === ultimaMateriaId) continue; // Alternância
                    if (materiasFinalizadas.has(materia.id)) continue;

                    const fila = filaMissoes.get(materia.id);
                    if (!fila || fila.length === 0) continue;

                    const missao = fila.shift()!;
                    missao.numero = String(missoesRodada.length + 1);
                    missao.ordem = missoesRodada.length + 1;
                    missoesRodada.push(missao);
                    topicosRodada.push(...missao.topico_ids);
                    if (!materiasRodada.includes(materia.titulo)) {
                        materiasRodada.push(materia.titulo);
                    }

                    ultimaMateriaId = materia.id;
                    missaoAdicionada = true;

                    // Verificar se matéria finalizou
                    if (fila.length === 0) {
                        materiasFinalizadas.add(materia.id);
                        if (config.incluir_revisoes) {
                            filaRevisao.push(materia);
                        }
                    }

                    break;
                }

                // Se não adicionou estudo, tentar revisão
                if (!missaoAdicionada && config.incluir_revisoes && filaRevisao.length > 0) {
                    // Encontrar revisão de matéria diferente da última
                    const idxRevisao = filaRevisao.findIndex(m => m.id !== ultimaMateriaId);

                    if (idxRevisao >= 0) {
                        const materiaRevisao = filaRevisao[idxRevisao];
                        const topicos = topicosMateria.get(materiaRevisao.id) || [];

                        const missaoRevisao = criarMissaoRevisao(materiaRevisao, topicos);
                        missaoRevisao.numero = String(missoesRodada.length + 1);
                        missaoRevisao.ordem = missoesRodada.length + 1;
                        missoesRodada.push(missaoRevisao);
                        topicosRodada.push(...topicos);

                        ultimaMateriaId = materiaRevisao.id;
                        materiasRevisadas.add(materiaRevisao.id);

                        // Remover da fila de revisão
                        filaRevisao.splice(idxRevisao, 1);
                        missaoAdicionada = true;
                    }
                }

                // Se ainda não adicionou, tentar qualquer matéria (ignorar alternância)
                if (!missaoAdicionada) {
                    for (const materia of materias) {
                        if (materiasFinalizadas.has(materia.id)) continue;

                        const fila = filaMissoes.get(materia.id);
                        if (!fila || fila.length === 0) continue;

                        const missao = fila.shift()!;
                        missao.numero = String(missoesRodada.length + 1);
                        missao.ordem = missoesRodada.length + 1;
                        missoesRodada.push(missao);
                        topicosRodada.push(...missao.topico_ids);
                        if (!materiasRodada.includes(materia.titulo)) {
                            materiasRodada.push(materia.titulo);
                        }

                        ultimaMateriaId = materia.id;

                        if (fila.length === 0) {
                            materiasFinalizadas.add(materia.id);
                            if (config.incluir_revisoes) {
                                filaRevisao.push(materia);
                            }
                        }

                        break;
                    }
                }
            }

            // Se não há mais missões, verificar se todas matérias foram revisadas
            if (missoesRodada.length === 0) {
                break;
            }

            // Adicionar missão de simulado ao final da rodada
            if (config.incluir_simulado && topicosRodada.length > 0) {
                const missaoSimulado = criarMissaoSimulado(rodadaAtual, topicosRodada, materiasRodada);
                missaoSimulado.numero = String(missoesRodada.length + 1);
                missaoSimulado.ordem = missoesRodada.length + 1;
                missoesRodada.push(missaoSimulado);
            }

            // Criar rodada
            rodadas.push({
                numero: rodadaAtual,
                titulo: `${rodadaAtual}ª RODADA`,
                missoes: missoesRodada,
            });

            rodadaAtual++;

            // Condição de parada: todas matérias finalizadas E todas revisadas
            const todasFinalizadas = materiasFinalizadas.size === materias.length;
            const todasRevisadas = !config.incluir_revisoes ||
                materias.every(m => materiasRevisadas.has(m.id));

            if (todasFinalizadas && todasRevisadas && filaRevisao.length === 0) {
                break;
            }
        }

        // Calcular estatísticas
        let missoes_estudo = 0;
        let missoes_revisao = 0;
        let missoes_simulado = 0;

        for (const rodada of rodadas) {
            for (const missao of rodada.missoes) {
                if (missao.tipo === 'padrao') missoes_estudo++;
                else if (missao.tipo === 'revisao') missoes_revisao++;
                else if (missao.tipo === 'acao') missoes_simulado++;
            }
        }

        return {
            success: true,
            rodadas,
            estatisticas: {
                total_rodadas: rodadas.length,
                total_missoes: missoes_estudo + missoes_revisao + missoes_simulado,
                missoes_estudo,
                missoes_revisao,
                missoes_simulado,
            },
        };

    } catch (error: any) {
        console.error("[Generator] Erro ao gerar rodadas:", error);
        return {
            success: false,
            rodadas: [],
            estatisticas: {
                total_rodadas: 0,
                total_missoes: 0,
                missoes_estudo: 0,
                missoes_revisao: 0,
                missoes_simulado: 0,
            },
            error: error.message || "Erro ao gerar rodadas",
        };
    }
}

// ==================== PERSISTÊNCIA ====================

/**
 * Persiste as rodadas e missões geradas no Supabase
 */
export async function persistirRodadas(
    preparatorioId: string,
    rodadas: RodadaGerada[],
    substituirExistentes: boolean = true,
    gerarFiltrosQuestoes: boolean = true,
    banca?: string
): Promise<ResultadoPersistencia> {
    const supabase = getSupabaseClient();

    try {
        let rodadas_criadas = 0;
        let missoes_criadas = 0;
        let vinculos_criados = 0;
        let filtros_criados = 0;

        // Se substituir existentes, deletar rodadas atuais
        if (substituirExistentes) {
            // Buscar rodadas existentes
            const { data: rodadasExistentes } = await supabase
                .from('rodadas')
                .select('id')
                .eq('preparatorio_id', preparatorioId);

            if (rodadasExistentes && rodadasExistentes.length > 0) {
                const rodadaIds = rodadasExistentes.map(r => r.id);

                // Buscar missões dessas rodadas
                const { data: missoesExistentes } = await supabase
                    .from('missoes')
                    .select('id')
                    .in('rodada_id', rodadaIds);

                if (missoesExistentes && missoesExistentes.length > 0) {
                    const missaoIds = missoesExistentes.map(m => m.id);

                    // Deletar vínculos de edital
                    await supabase
                        .from('missao_edital_items')
                        .delete()
                        .in('missao_id', missaoIds);

                    // Deletar filtros de questões
                    await supabase
                        .from('missao_questao_filtros')
                        .delete()
                        .in('missao_id', missaoIds);

                    // Deletar missões
                    await supabase
                        .from('missoes')
                        .delete()
                        .in('rodada_id', rodadaIds);
                }

                // Deletar rodadas
                await supabase
                    .from('rodadas')
                    .delete()
                    .eq('preparatorio_id', preparatorioId);
            }
        }

        // Criar cada rodada e suas missões
        for (const rodada of rodadas) {
            // Criar rodada
            const { data: rodadaCriada, error: rodadaError } = await supabase
                .from('rodadas')
                .insert({
                    preparatorio_id: preparatorioId,
                    numero: rodada.numero,
                    titulo: rodada.titulo,
                    ordem: rodada.numero,
                })
                .select()
                .single();

            if (rodadaError) {
                console.error("[Persist] Erro ao criar rodada:", rodadaError);
                continue;
            }

            rodadas_criadas++;

            // Criar missões da rodada
            for (const missao of rodada.missoes) {
                const { data: missaoCriada, error: missaoError } = await supabase
                    .from('missoes')
                    .insert({
                        rodada_id: rodadaCriada.id,
                        numero: missao.numero,
                        tipo: missao.tipo,
                        materia: missao.materia,
                        assunto: missao.assunto,
                        instrucoes: missao.instrucoes,
                        tema: missao.tema,
                        acao: missao.acao,
                        ordem: missao.ordem,
                    })
                    .select()
                    .single();

                if (missaoError) {
                    console.error("[Persist] Erro ao criar missão:", missaoError);
                    continue;
                }

                missoes_criadas++;

                // Vincular tópicos do edital
                if (missao.topico_ids && missao.topico_ids.length > 0) {
                    const vinculos = missao.topico_ids.map(topicoId => ({
                        missao_id: missaoCriada.id,
                        edital_item_id: topicoId,
                    }));

                    const { error: vinculoError } = await supabase
                        .from('missao_edital_items')
                        .insert(vinculos);

                    if (!vinculoError) {
                        vinculos_criados += vinculos.length;
                    }
                }

                // Criar filtros de questões
                if (gerarFiltrosQuestoes && missao.topico_ids && missao.topico_ids.length > 0) {
                    // Buscar títulos dos tópicos para usar como assuntos
                    const { data: topicos } = await supabase
                        .from('edital_verticalizado_items')
                        .select('titulo')
                        .in('id', missao.topico_ids);

                    const assuntos = topicos?.map(t => t.titulo) || [];

                    const filtros = {
                        assuntos,
                        bancas: banca ? [banca] : [],
                        materias: missao.materia ? [missao.materia] : [],
                    };

                    const { error: filtroError } = await supabase
                        .from('missao_questao_filtros')
                        .insert({
                            missao_id: missaoCriada.id,
                            filtros,
                            questoes_count: 0, // Será calculado depois
                        });

                    if (!filtroError) {
                        filtros_criados++;
                    }
                }
            }
        }

        return {
            success: true,
            rodadas_criadas,
            missoes_criadas,
            vinculos_criados,
            filtros_criados,
        };

    } catch (error: any) {
        console.error("[Persist] Erro ao persistir rodadas:", error);
        return {
            success: false,
            rodadas_criadas: 0,
            missoes_criadas: 0,
            vinculos_criados: 0,
            filtros_criados: 0,
            error: error.message || "Erro ao persistir rodadas",
        };
    }
}

// ==================== FUNÇÃO DE CONVENIÊNCIA ====================

/**
 * Busca matérias com tópicos do preparatório
 */
export async function buscarMateriasComTopicos(
    preparatorioId: string
): Promise<MateriaOrdenada[]> {
    const supabase = getSupabaseClient();

    // Buscar todos os itens do edital
    const { data: items, error } = await supabase
        .from('edital_verticalizado_items')
        .select('id, titulo, tipo, parent_id, ordem')
        .eq('preparatorio_id', preparatorioId)
        .order('ordem');

    if (error) throw error;

    // Filtrar matérias
    const materias = (items || []).filter(i => i.tipo === 'materia');

    // Para cada matéria, buscar seus tópicos
    const materiasComTopicos: MateriaOrdenada[] = [];

    for (let idx = 0; idx < materias.length; idx++) {
        const materia = materias[idx];

        // Buscar tópicos diretos (filhos da matéria)
        const topicos = (items || [])
            .filter(i => i.tipo === 'topico' && i.parent_id === materia.id)
            .map(t => ({
                id: t.id,
                titulo: t.titulo,
                materia_id: materia.id,
            }));

        // Buscar tópicos de sub-itens (filhos de filhos da matéria)
        const subItems = (items || []).filter(i =>
            i.parent_id === materia.id && i.tipo !== 'topico'
        );

        for (const subItem of subItems) {
            const subTopicos = (items || [])
                .filter(i => i.tipo === 'topico' && i.parent_id === subItem.id)
                .map(t => ({
                    id: t.id,
                    titulo: t.titulo,
                    materia_id: materia.id,
                }));
            topicos.push(...subTopicos);
        }

        if (topicos.length > 0) {
            materiasComTopicos.push({
                id: materia.id,
                titulo: materia.titulo,
                prioridade: idx + 1,
                topicos,
            });
        }
    }

    return materiasComTopicos;
}
