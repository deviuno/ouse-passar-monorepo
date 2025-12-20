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

/**
 * Plataformas onde a missão pode aparecer
 * - questoes: App de questões (estudo com questões)
 * - planejador: Planejador de estudos
 * - plataforma: Plataforma web completa
 */
export type Plataforma = 'questoes' | 'planejador' | 'plataforma';

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
    materias_por_rodada: number;     // Default: 5 (5 matérias diferentes)
    max_topicos_por_missao: number;  // Default: 3
    incluir_revisao_op: boolean;     // Default: true (Revisão Ouse Passar)
    incluir_tecnicas_op: boolean;    // Default: true (Aplicar Técnicas)
    incluir_simulado: boolean;       // Default: true
    gerar_filtros_questoes: boolean; // Default: true
}

export interface MissaoGerada {
    numero: string;
    tipo: 'estudo' | 'revisao' | 'tecnicas' | 'simulado';
    materia: string | null;
    materia_id: string | null;
    assunto: string | null;
    instrucoes: string | null;
    tema: string | null;
    topico_ids: string[];
    ordem: number;
    /** Plataformas onde esta missão aparece */
    plataformas: Plataforma[];
    /** IDs das matérias incluídas (para revisão e simulado) */
    materias_ids?: string[];
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
        missoes_tecnicas: number;
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
 * Estado de uma matéria durante a geração
 */
interface EstadoMateria {
    materia: MateriaOrdenada;
    topicosRestantes: TopicoParaGeracao[];
    topicosEstudados: TopicoParaGeracao[];
    finalizada: boolean;
    rodadaFinalizacao: number | null;
}

/**
 * Pega os próximos N tópicos de uma matéria
 */
function pegarProximosTopicos(estado: EstadoMateria, quantidade: number): TopicoParaGeracao[] {
    const topicos = estado.topicosRestantes.splice(0, quantidade);
    estado.topicosEstudados.push(...topicos);
    return topicos;
}

/**
 * Cria uma missão de estudo
 */
function criarMissaoEstudo(
    materia: MateriaOrdenada,
    topicos: TopicoParaGeracao[]
): MissaoGerada {
    return {
        numero: '',
        tipo: 'estudo',
        materia: materia.titulo,
        materia_id: materia.id,
        assunto: topicos.map(t => t.titulo).join('\n'),
        instrucoes: 'Estudar os tópicos indicados e resolver questões relacionadas.',
        tema: null,
        topico_ids: topicos.map(t => t.id),
        ordem: 0,
        plataformas: ['questoes', 'planejador', 'plataforma'],
    };
}

/**
 * Cria a missão "Revisão Ouse Passar"
 * Esta missão unifica todas as revisões: matérias da rodada atual + matérias finalizadas
 */
function criarMissaoRevisaoOusePassar(
    materiasRodada: MateriaOrdenada[],
    materiasFinalizadas: MateriaOrdenada[],
    topicosRodada: string[]
): MissaoGerada {
    const todasMaterias = [...materiasRodada, ...materiasFinalizadas];
    const materiasUnicas = [...new Map(todasMaterias.map(m => [m.id, m])).values()];

    return {
        numero: '',
        tipo: 'revisao',
        materia: 'REVISÃO OUSE PASSAR',
        materia_id: null,
        assunto: null,
        instrucoes: 'Revisão das matérias estudadas nesta rodada e das matérias finalizadas anteriormente. No app Questões, serão incluídas questões das matérias que você errou ou marcou como difíceis.',
        tema: `Revisão: ${materiasUnicas.map(m => m.titulo).join(', ')}`,
        topico_ids: topicosRodada,
        ordem: 0,
        plataformas: ['questoes', 'planejador', 'plataforma'],
        materias_ids: materiasUnicas.map(m => m.id),
    };
}

/**
 * Cria a missão "Aplicar Técnicas Ouse Passar"
 * Esta missão aparece APENAS no Planejador
 */
function criarMissaoTecnicasOusePassar(): MissaoGerada {
    return {
        numero: '',
        tipo: 'tecnicas',
        materia: 'TÉCNICAS OUSE PASSAR',
        materia_id: null,
        assunto: null,
        instrucoes: 'Aplicar as técnicas de estudo do método Ouse Passar para fixação do conteúdo estudado nesta rodada.',
        tema: 'Aplicar as técnicas Ouse Passar',
        topico_ids: [],
        ordem: 0,
        plataformas: ['planejador'], // Só aparece no planejador
    };
}

/**
 * Cria a missão de Simulado
 * Esta missão aparece no app Questões (modo simulado)
 */
function criarMissaoSimulado(
    rodadaNumero: number,
    materiasRodada: MateriaOrdenada[],
    topicosRodada: string[]
): MissaoGerada {
    return {
        numero: '',
        tipo: 'simulado',
        materia: 'SIMULADO',
        materia_id: null,
        assunto: null,
        instrucoes: 'Realizar simulado com tempo cronometrado. Após finalizar, corrigir e revisar as questões erradas.',
        tema: `SIMULADO DA RODADA ${rodadaNumero}\nMatérias: ${materiasRodada.map(m => m.titulo).join(', ')}`,
        topico_ids: topicosRodada,
        ordem: 0,
        plataformas: ['questoes', 'planejador', 'plataforma'],
        materias_ids: materiasRodada.map(m => m.id),
    };
}

/**
 * Algoritmo principal de geração de rodadas
 *
 * NOVA ESTRUTURA (10 missões por rodada):
 * 1. Missões 1-5: Uma missão de cada uma das 5 primeiras matérias (alternância garantida)
 * 2. Missões 6-7: Repetição das 2 matérias com mais tópicos restantes
 * 3. Missão 8: "Revisão Ouse Passar" (todas plataformas)
 * 4. Missão 9: "Aplicar Técnicas Ouse Passar" (só Planejador)
 * 5. Missão 10: Simulado (app Questões)
 *
 * Quando uma matéria finaliza, ela entra na Revisão Ouse Passar das rodadas seguintes.
 */
export function gerarRodadas(
    materias: MateriaOrdenada[],
    config: ConfiguracaoGeracao
): ResultadoGeracao {
    try {
        const rodadas: RodadaGerada[] = [];

        // Inicializar estado de cada matéria
        const estados: EstadoMateria[] = materias.map(m => ({
            materia: m,
            topicosRestantes: [...m.topicos],
            topicosEstudados: [],
            finalizada: false,
            rodadaFinalizacao: null,
        }));

        // Matérias que já finalizaram (para revisão)
        const materiasFinalizadas: MateriaOrdenada[] = [];

        let rodadaAtual = 1;
        const maxRodadas = 100;
        const materiasNaRodada = Math.min(config.materias_por_rodada || 5, materias.length);

        while (rodadaAtual <= maxRodadas) {
            const missoesRodada: MissaoGerada[] = [];
            const topicosRodada: string[] = [];
            const materiasUsadasNaRodada: MateriaOrdenada[] = [];

            // Pegar as N primeiras matérias que ainda têm tópicos
            const materiasAtivas = estados
                .filter(e => !e.finalizada)
                .slice(0, materiasNaRodada);

            if (materiasAtivas.length === 0) {
                // Todas as matérias finalizaram
                break;
            }

            // ========== MISSÕES 1-5: Uma de cada matéria ==========
            for (const estado of materiasAtivas) {
                const topicos = pegarProximosTopicos(estado, config.max_topicos_por_missao);

                if (topicos.length === 0) continue;

                const missao = criarMissaoEstudo(estado.materia, topicos);
                missao.numero = String(missoesRodada.length + 1);
                missao.ordem = missoesRodada.length + 1;
                missoesRodada.push(missao);

                topicosRodada.push(...missao.topico_ids);
                materiasUsadasNaRodada.push(estado.materia);

                // Verificar se a matéria finalizou
                if (estado.topicosRestantes.length === 0) {
                    estado.finalizada = true;
                    estado.rodadaFinalizacao = rodadaAtual;
                    materiasFinalizadas.push(estado.materia);
                }
            }

            if (missoesRodada.length === 0) {
                break;
            }

            // ========== MISSÕES 6-7: Repetição das 2 matérias com mais tópicos restantes ==========
            const materiasComMaisTopicos = estados
                .filter(e => !e.finalizada && e.topicosRestantes.length > 0)
                .sort((a, b) => b.topicosRestantes.length - a.topicosRestantes.length)
                .slice(0, 2);

            for (const estado of materiasComMaisTopicos) {
                const topicos = pegarProximosTopicos(estado, config.max_topicos_por_missao);

                if (topicos.length === 0) continue;

                const missao = criarMissaoEstudo(estado.materia, topicos);
                missao.numero = String(missoesRodada.length + 1);
                missao.ordem = missoesRodada.length + 1;
                missoesRodada.push(missao);

                topicosRodada.push(...missao.topico_ids);
                if (!materiasUsadasNaRodada.includes(estado.materia)) {
                    materiasUsadasNaRodada.push(estado.materia);
                }

                // Verificar se a matéria finalizou
                if (estado.topicosRestantes.length === 0) {
                    estado.finalizada = true;
                    estado.rodadaFinalizacao = rodadaAtual;
                    materiasFinalizadas.push(estado.materia);
                }
            }

            // ========== MISSÃO 8: Revisão Ouse Passar ==========
            if (config.incluir_revisao_op) {
                const missaoRevisao = criarMissaoRevisaoOusePassar(
                    materiasUsadasNaRodada,
                    materiasFinalizadas,
                    topicosRodada
                );
                missaoRevisao.numero = String(missoesRodada.length + 1);
                missaoRevisao.ordem = missoesRodada.length + 1;
                missoesRodada.push(missaoRevisao);
            }

            // ========== MISSÃO 9: Aplicar Técnicas Ouse Passar ==========
            if (config.incluir_tecnicas_op) {
                const missaoTecnicas = criarMissaoTecnicasOusePassar();
                missaoTecnicas.numero = String(missoesRodada.length + 1);
                missaoTecnicas.ordem = missoesRodada.length + 1;
                missoesRodada.push(missaoTecnicas);
            }

            // ========== MISSÃO 10: Simulado ==========
            if (config.incluir_simulado && topicosRodada.length > 0) {
                const missaoSimulado = criarMissaoSimulado(
                    rodadaAtual,
                    materiasUsadasNaRodada,
                    topicosRodada
                );
                missaoSimulado.numero = String(missoesRodada.length + 1);
                missaoSimulado.ordem = missoesRodada.length + 1;
                missoesRodada.push(missaoSimulado);
            }

            // Adicionar rodada
            rodadas.push({
                numero: rodadaAtual,
                titulo: `${rodadaAtual}ª RODADA`,
                missoes: missoesRodada,
            });

            rodadaAtual++;

            // Condição de parada: todas as matérias finalizaram
            const todasFinalizadas = estados.every(e => e.finalizada);
            if (todasFinalizadas) {
                break;
            }
        }

        // Calcular estatísticas
        let missoes_estudo = 0;
        let missoes_revisao = 0;
        let missoes_tecnicas = 0;
        let missoes_simulado = 0;

        for (const rodada of rodadas) {
            for (const missao of rodada.missoes) {
                switch (missao.tipo) {
                    case 'estudo': missoes_estudo++; break;
                    case 'revisao': missoes_revisao++; break;
                    case 'tecnicas': missoes_tecnicas++; break;
                    case 'simulado': missoes_simulado++; break;
                }
            }
        }

        return {
            success: true,
            rodadas,
            estatisticas: {
                total_rodadas: rodadas.length,
                total_missoes: missoes_estudo + missoes_revisao + missoes_tecnicas + missoes_simulado,
                missoes_estudo,
                missoes_revisao,
                missoes_tecnicas,
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
                missoes_tecnicas: 0,
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
                        materia_id: missao.materia_id,
                        assunto: missao.assunto,
                        instrucoes: missao.instrucoes,
                        tema: missao.tema,
                        ordem: missao.ordem,
                        plataformas: missao.plataformas,
                        materias_ids: missao.materias_ids || null,
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
 * Verifica se um título de matéria é "Português" ou variações
 */
function isPortugues(titulo: string): boolean {
    const normalizado = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (
        normalizado.includes('portugues') ||
        normalizado.includes('lingua portuguesa') ||
        normalizado === 'lp' ||
        normalizado.includes('redacao') ||
        normalizado.includes('interpretacao de texto')
    );
}

/**
 * Busca matérias com tópicos do preparatório
 *
 * REGRAS DE PRIORIDADE:
 * 1. Português SEMPRE primeiro (mais importante em todo concurso brasileiro)
 * 2. Matérias que ocupam um bloco inteiro ou quase inteiro são mais relevantes
 * 3. Ordem do edital como critério secundário
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

    // Filtrar matérias e blocos
    const materias = (items || []).filter(i => i.tipo === 'materia');
    const blocos = (items || []).filter(i => i.tipo === 'bloco');

    // Calcular relevância por bloco (matérias que dominam um bloco são mais importantes)
    const materiasporBloco = new Map<string, string[]>();
    for (const bloco of blocos) {
        const materiasDoBloco = materias.filter(m => m.parent_id === bloco.id);
        materiasporBloco.set(bloco.id, materiasDoBloco.map(m => m.id));
    }

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
            // Calcular relevância baseada na estrutura do bloco
            let relevanciaBloco = 0;
            const blocoId = materia.parent_id;
            if (blocoId && materiasporBloco.has(blocoId)) {
                const materiasNoBloco = materiasporBloco.get(blocoId)!.length;
                // Se a matéria é única ou uma de duas em um bloco, ela é muito relevante
                if (materiasNoBloco === 1) {
                    relevanciaBloco = 100; // Matéria = Bloco inteiro
                } else if (materiasNoBloco === 2) {
                    relevanciaBloco = 50; // Bloco com apenas 2 matérias
                } else if (materiasNoBloco <= 4) {
                    relevanciaBloco = 25; // Bloco pequeno
                }
            }

            materiasComTopicos.push({
                id: materia.id,
                titulo: materia.titulo,
                prioridade: idx + 1, // Será recalculado depois
                topicos,
                // @ts-ignore - Campos temporários para ordenação
                _isPortugues: isPortugues(materia.titulo),
                _relevanciaBloco: relevanciaBloco,
                _ordemOriginal: idx,
                _qtdTopicos: topicos.length,
            });
        }
    }

    // Ordenar matérias: Português primeiro, depois por relevância de bloco, depois ordem original
    materiasComTopicos.sort((a, b) => {
        // @ts-ignore
        const aPortugues = a._isPortugues ? 1 : 0;
        // @ts-ignore
        const bPortugues = b._isPortugues ? 1 : 0;

        // Português sempre primeiro
        if (aPortugues !== bPortugues) {
            return bPortugues - aPortugues;
        }

        // Depois por relevância de bloco (maior relevância primeiro)
        // @ts-ignore
        const aRelevancia = a._relevanciaBloco || 0;
        // @ts-ignore
        const bRelevancia = b._relevanciaBloco || 0;
        if (aRelevancia !== bRelevancia) {
            return bRelevancia - aRelevancia;
        }

        // Por fim, ordem original do edital
        // @ts-ignore
        return (a._ordemOriginal || 0) - (b._ordemOriginal || 0);
    });

    // Atualizar prioridades após ordenação e limpar campos temporários
    return materiasComTopicos.map((m, idx) => {
        // Limpar campos temporários
        // @ts-ignore
        delete m._isPortugues;
        // @ts-ignore
        delete m._relevanciaBloco;
        // @ts-ignore
        delete m._ordemOriginal;
        // @ts-ignore
        delete m._qtdTopicos;

        return {
            ...m,
            prioridade: idx + 1,
        };
    });
}

// ==================== CRIAÇÃO DE EDITAL VERTICALIZADO ====================

export interface EditalSubtopico {
    titulo: string;
}

export interface EditalTopico {
    titulo: string;
    subtopicos: EditalSubtopico[];
}

export interface EditalMateria {
    titulo: string;
    topicos: EditalTopico[];
}

export interface EditalBloco {
    titulo: string;
    materias: EditalMateria[];
}

export interface EditalEstrutura {
    blocos: EditalBloco[];
}

export interface ResultadoEditalVerticalizado {
    success: boolean;
    blocos_criados: number;
    materias_criadas: number;
    topicos_criados: number;
    subtopicos_criados: number;
    error?: string;
}

/**
 * Cria o edital verticalizado a partir da estrutura extraída do PDF
 */
export async function criarEditalVerticalizado(
    preparatorioId: string,
    estrutura: EditalEstrutura
): Promise<ResultadoEditalVerticalizado> {
    const supabase = getSupabaseClient();

    try {
        let blocos_criados = 0;
        let materias_criadas = 0;
        let topicos_criados = 0;
        let subtopicos_criados = 0;
        let ordemGlobal = 1;

        // Deletar itens existentes do preparatório
        await supabase
            .from('edital_verticalizado_items')
            .delete()
            .eq('preparatorio_id', preparatorioId);

        // Criar blocos
        for (const bloco of estrutura.blocos) {
            const { data: blocoCriado, error: blocoError } = await supabase
                .from('edital_verticalizado_items')
                .insert({
                    preparatorio_id: preparatorioId,
                    tipo: 'bloco',
                    titulo: bloco.titulo,
                    ordem: ordemGlobal++,
                    parent_id: null,
                })
                .select()
                .single();

            if (blocoError) {
                console.error('[EditalVerticalizado] Erro ao criar bloco:', blocoError);
                continue;
            }

            blocos_criados++;

            // Criar matérias do bloco
            for (const materia of bloco.materias) {
                const { data: materiaCriada, error: materiaError } = await supabase
                    .from('edital_verticalizado_items')
                    .insert({
                        preparatorio_id: preparatorioId,
                        tipo: 'materia',
                        titulo: materia.titulo,
                        ordem: ordemGlobal++,
                        parent_id: blocoCriado.id,
                    })
                    .select()
                    .single();

                if (materiaError) {
                    console.error('[EditalVerticalizado] Erro ao criar matéria:', materiaError);
                    continue;
                }

                materias_criadas++;

                // Criar tópicos da matéria
                for (const topico of materia.topicos) {
                    const { data: topicoCriado, error: topicoError } = await supabase
                        .from('edital_verticalizado_items')
                        .insert({
                            preparatorio_id: preparatorioId,
                            tipo: 'topico',
                            titulo: topico.titulo,
                            ordem: ordemGlobal++,
                            parent_id: materiaCriada.id,
                        })
                        .select()
                        .single();

                    if (topicoError) {
                        console.error('[EditalVerticalizado] Erro ao criar tópico:', topicoError);
                        continue;
                    }

                    topicos_criados++;

                    // Criar subtópicos (se houver)
                    for (const subtopico of topico.subtopicos || []) {
                        const { error: subtopicoError } = await supabase
                            .from('edital_verticalizado_items')
                            .insert({
                                preparatorio_id: preparatorioId,
                                tipo: 'topico', // Subtópicos também são do tipo 'topico'
                                titulo: subtopico.titulo,
                                ordem: ordemGlobal++,
                                parent_id: topicoCriado.id,
                            });

                        if (!subtopicoError) {
                            subtopicos_criados++;
                        }
                    }
                }
            }
        }

        console.log(`[EditalVerticalizado] Criados: ${blocos_criados} blocos, ${materias_criadas} matérias, ${topicos_criados} tópicos, ${subtopicos_criados} subtópicos`);

        return {
            success: true,
            blocos_criados,
            materias_criadas,
            topicos_criados,
            subtopicos_criados,
        };

    } catch (error: any) {
        console.error('[EditalVerticalizado] Erro:', error);
        return {
            success: false,
            blocos_criados: 0,
            materias_criadas: 0,
            topicos_criados: 0,
            subtopicos_criados: 0,
            error: error.message || 'Erro ao criar edital verticalizado',
        };
    }
}

// ==================== MENSAGENS DE INCENTIVO ====================

const MENSAGENS_INCENTIVO_PADRAO = [
    "Cada questão resolvida é um passo mais perto da sua aprovação!",
    "Disciplina é a ponte entre metas e conquistas. Continue firme!",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Você não está apenas estudando, está construindo seu futuro!",
    "A dor do estudo é temporária, a alegria da aprovação é eterna!",
    "Grandes conquistas começam com a decisão de tentar. Você já começou!",
    "Cada página lida, cada questão feita, te aproxima do seu sonho.",
    "Não desista! Os campeões são aqueles que não param quando estão cansados.",
    "Você é mais forte do que imagina e mais capaz do que pensa!",
    "Hoje é mais um dia para provar que você pode. Bora estudar!",
    "A aprovação não é para os mais inteligentes, é para os mais persistentes.",
    "Seu esforço de hoje será sua história de sucesso amanhã!",
];

export interface ResultadoMensagensIncentivo {
    success: boolean;
    mensagens_criadas: number;
    error?: string;
}

/**
 * Cria mensagens de incentivo padrão para um preparatório
 */
export async function criarMensagensIncentivoPadrao(
    preparatorioId: string
): Promise<ResultadoMensagensIncentivo> {
    const supabase = getSupabaseClient();

    try {
        // Verificar se já existem mensagens
        const { data: existentes } = await supabase
            .from('mensagens_incentivo')
            .select('id')
            .eq('preparatorio_id', preparatorioId);

        if (existentes && existentes.length > 0) {
            console.log('[MensagensIncentivo] Preparatório já possui mensagens');
            return {
                success: true,
                mensagens_criadas: 0,
            };
        }

        // Criar mensagens
        const mensagens = MENSAGENS_INCENTIVO_PADRAO.map((mensagem, index) => ({
            preparatorio_id: preparatorioId,
            mensagem,
            ordem: index + 1,
            is_active: true,
        }));

        const { error } = await supabase
            .from('mensagens_incentivo')
            .insert(mensagens);

        if (error) {
            console.error('[MensagensIncentivo] Erro ao criar:', error);
            return {
                success: false,
                mensagens_criadas: 0,
                error: error.message,
            };
        }

        console.log(`[MensagensIncentivo] Criadas ${mensagens.length} mensagens`);

        return {
            success: true,
            mensagens_criadas: mensagens.length,
        };

    } catch (error: any) {
        console.error('[MensagensIncentivo] Erro:', error);
        return {
            success: false,
            mensagens_criadas: 0,
            error: error.message || 'Erro ao criar mensagens de incentivo',
        };
    }
}

// ==================== CRIAÇÃO DE PREPARATÓRIO ====================

export interface PreparatorioInput {
    nome: string;
    banca?: string | null;
    orgao?: string | null;
    cargo?: string | null;
    nivel?: string | null;
    escolaridade?: string | null;
    requisitos?: string | null;
    salario?: number | null;
    vagas?: number | null;
    carga_horaria?: string | null;
    taxa_inscricao?: number | null;
    inscricoes_inicio?: string | null;
    inscricoes_fim?: string | null;
    data_prevista?: string | null;
    regiao?: string | null;
    modalidade?: string | null;
}

export interface ResultadoPreparatorio {
    success: boolean;
    preparatorio_id?: string;
    slug?: string;
    error?: string;
}

/**
 * Gera um slug único a partir do nome
 */
function gerarSlug(nome: string): string {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por -
        .replace(/^-+|-+$/g, '') // Remove - do início e fim
        .substring(0, 50); // Limita a 50 caracteres
}

/**
 * Gera uma descrição persuasiva para o preparatório
 * Focada em motivar o aluno a alcançar seu objetivo
 */
function gerarDescricaoPersuasiva(input: PreparatorioInput): string {
    const cargo = input.cargo || 'servidor público';
    const orgao = input.orgao || '';
    const salario = input.salario;

    // Formatador de moeda
    const formatarSalario = (valor: number) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Frases de abertura motivacionais
    const aberturas = [
        `Seu sonho de se tornar ${cargo} está mais perto do que você imagina.`,
        `Chegou a hora de transformar sua vida e conquistar o cargo de ${cargo}.`,
        `O caminho para se tornar ${cargo} começa aqui.`,
        `Sua aprovação como ${cargo} é o nosso objetivo.`,
    ];

    // Selecionar abertura baseada no hash do nome
    const hash = input.nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const abertura = aberturas[hash % aberturas.length];

    // Construir descrição
    let descricao = abertura + ' ';

    // Adicionar benefício do salário se disponível
    if (salario && salario > 0) {
        descricao += `Com remuneração de ${formatarSalario(salario)}, `;

        if (salario >= 20000) {
            descricao += 'você terá a estabilidade e o reconhecimento que sempre mereceu. ';
        } else if (salario >= 10000) {
            descricao += 'você conquistará estabilidade financeira e qualidade de vida. ';
        } else {
            descricao += 'você terá a segurança de um cargo público estável. ';
        }
    } else {
        descricao += 'A estabilidade e os benefícios do serviço público esperam por você. ';
    }

    // Adicionar órgão se disponível
    if (orgao) {
        descricao += `Atuar no ${orgao} é fazer parte de uma instituição que transforma a sociedade. `;
    }

    // Fechamento motivacional
    descricao += 'Este preparatório foi desenvolvido com a metodologia Ouse Passar, unindo inteligência artificial e estratégia para maximizar suas chances de aprovação. Não deixe para amanhã o que pode mudar sua vida hoje.';

    return descricao;
}

/**
 * Cria o preparatório no banco de dados
 */
export async function criarPreparatorio(
    input: PreparatorioInput
): Promise<ResultadoPreparatorio> {
    const supabase = getSupabaseClient();

    try {
        // Gerar slug base
        let slug = gerarSlug(input.nome);

        // Verificar se slug já existe e adicionar sufixo se necessário
        const { data: existente } = await supabase
            .from('preparatorios')
            .select('slug')
            .eq('slug', slug)
            .single();

        if (existente) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Converter ano_previsto da data_prevista
        let ano_previsto: number | null = null;
        if (input.data_prevista) {
            const ano = new Date(input.data_prevista).getFullYear();
            if (!isNaN(ano)) {
                ano_previsto = ano;
            }
        }

        // Gerar descrição persuasiva
        const descricao = gerarDescricaoPersuasiva(input);

        // Criar preparatório
        const { data, error } = await supabase
            .from('preparatorios')
            .insert({
                nome: input.nome,
                slug,
                descricao,
                banca: input.banca,
                orgao: input.orgao,
                cargo: input.cargo,
                nivel: input.nivel,
                escolaridade: input.escolaridade,
                requisitos: input.requisitos,
                salario: input.salario,
                vagas: input.vagas,
                carga_horaria: input.carga_horaria,
                taxa_inscricao: input.taxa_inscricao,
                inscricoes_inicio: input.inscricoes_inicio,
                inscricoes_fim: input.inscricoes_fim,
                data_prevista: input.data_prevista,
                ano_previsto,
                regiao: input.regiao,
                modalidade: input.modalidade || 'presencial',
                is_active: false, // Começa inativo até finalizar processo
                content_types: ['plano', 'questoes', 'preparatorio'],
            })
            .select()
            .single();

        if (error) {
            console.error('[CriarPreparatorio] Erro:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        console.log(`[CriarPreparatorio] Criado: ${data.id} (${data.slug})`);

        return {
            success: true,
            preparatorio_id: data.id,
            slug: data.slug,
        };

    } catch (error: any) {
        console.error('[CriarPreparatorio] Erro:', error);
        return {
            success: false,
            error: error.message || 'Erro ao criar preparatório',
        };
    }
}

/**
 * Atualiza o raio_x do preparatório com análise de prioridades
 */
export async function atualizarRaioX(
    preparatorioId: string,
    raioX: Record<string, unknown>
): Promise<boolean> {
    const supabase = getSupabaseClient();

    try {
        const { error } = await supabase
            .from('preparatorios')
            .update({ raio_x: raioX })
            .eq('id', preparatorioId);

        if (error) {
            console.error('[AtualizarRaioX] Erro:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[AtualizarRaioX] Erro:', error);
        return false;
    }
}

/**
 * Ativa o preparatório após todas as etapas serem concluídas
 */
export async function ativarPreparatorio(
    preparatorioId: string
): Promise<boolean> {
    const supabase = getSupabaseClient();

    try {
        const { error } = await supabase
            .from('preparatorios')
            .update({ is_active: true })
            .eq('id', preparatorioId);

        if (error) {
            console.error('[AtivarPreparatorio] Erro:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[AtivarPreparatorio] Erro:', error);
        return false;
    }
}

/**
 * Deleta um preparatório (usado para rollback em caso de erro)
 */
export async function deletarPreparatorio(
    preparatorioId: string
): Promise<boolean> {
    const supabase = getSupabaseClient();

    try {
        // Cascade delete cuidará de rodadas, missões, edital items, etc.
        const { error } = await supabase
            .from('preparatorios')
            .delete()
            .eq('id', preparatorioId);

        if (error) {
            console.error('[DeletarPreparatorio] Erro:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[DeletarPreparatorio] Erro:', error);
        return false;
    }
}
