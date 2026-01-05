/**
 * Serviço para buscar questões de uma missão baseado nos filtros do planejamento
 * Suporta modo Reta Final com redução de questões
 */

import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';
import { ParsedQuestion, Alternative, StudyMode } from '../types';
import { getEffectiveQuestionCount } from './retaFinalService';

// Filtros de questões salvos para uma missão (TODOS os filtros disponíveis)
interface MissaoFiltros {
  materias?: string[];
  assuntos?: string[];
  bancas?: string[];
  orgaos?: string[];
  anos?: number[];
  escolaridade?: string[];
  modalidade?: string[];
  cargos?: string[];
}

interface MissaoQuestaoFiltros {
  id: string;
  missao_id: string;
  filtros: MissaoFiltros;
  questoes_count: number;
  created_at: string;
}

// Configurações padrão
const DEFAULT_QUESTIONS_PER_MISSION = 5;

/**
 * Busca os filtros de questões de uma missão
 */
export async function getMissaoFiltros(missaoId: string): Promise<MissaoFiltros | null> {
  try {
    const { data, error } = await supabase
      .from('missao_questao_filtros')
      .select('*')
      .eq('missao_id', missaoId)
      .maybeSingle();

    if (error) {
      console.error('[MissaoQuestoesService] Erro ao buscar filtros:', error);
      return null;
    }

    if (!data) {
      console.warn('[MissaoQuestoesService] Sem filtros para missão:', missaoId);
      return null;
    }

    return data.filtros || null;
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return null;
  }
}

/**
 * Busca os itens do edital vinculados a uma missão
 */
export async function getMissaoEditalItems(missaoId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('missao_edital_items')
      .select('edital_item_id')
      .eq('missao_id', missaoId);

    if (error) {
      if (error.code === '42P01') {
        console.warn('[MissaoQuestoesService] Tabela missao_edital_items não existe');
        return [];
      }
      console.error('[MissaoQuestoesService] Erro ao buscar itens do edital:', error);
      return [];
    }

    return (data || []).map(d => d.edital_item_id);
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return [];
  }
}

/**
 * Busca os títulos dos itens do edital para usar como filtro de assuntos
 */
export async function getEditalItemsTitulos(itemIds: string[]): Promise<string[]> {
  if (!itemIds || itemIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .select('titulo')
      .in('id', itemIds);

    if (error) {
      console.error('[MissaoQuestoesService] Erro ao buscar títulos:', error);
      return [];
    }

    return (data || []).map(d => d.titulo).filter(Boolean);
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return [];
  }
}

/**
 * Transforma questão do banco para o formato usado pelo app
 */
function transformQuestion(dbQuestion: any): ParsedQuestion {
  let parsedAlternativas: Alternative[] = [];

  try {
    if (Array.isArray(dbQuestion.alternativas)) {
      parsedAlternativas = dbQuestion.alternativas;
    } else if (typeof dbQuestion.alternativas === 'string') {
      parsedAlternativas = JSON.parse(dbQuestion.alternativas);
    }
  } catch (e) {
    console.error(`Erro ao parsear alternativas da questão ${dbQuestion.id}`, e);
  }

  return {
    id: dbQuestion.id,
    materia: dbQuestion.materia,
    assunto: dbQuestion.assunto || '',
    concurso: dbQuestion.concurso || '',
    enunciado: dbQuestion.enunciado,
    alternativas: typeof dbQuestion.alternativas === 'string'
      ? dbQuestion.alternativas
      : JSON.stringify(dbQuestion.alternativas),
    parsedAlternativas,
    gabarito: dbQuestion.gabarito,
    comentario: dbQuestion.comentario,
    orgao: dbQuestion.orgao || '',
    banca: dbQuestion.banca || '',
    ano: dbQuestion.ano || 0,
    imagens_enunciado: dbQuestion.imagens_enunciado,
    imagens_comentario: dbQuestion.imagens_comentario?.join(',') || null,
    isPegadinha: dbQuestion.is_pegadinha || false,
    explicacaoPegadinha: dbQuestion.explicacao_pegadinha,
  };
}

/**
 * Extrai palavras-chave de um texto removendo palavras comuns
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
    'para', 'por', 'com', 'sem', 'sobre', 'entre', 'sob',
    'e', 'ou', 'que', 'se', 'ao', 'aos', 'à', 'às',
    'seu', 'sua', 'seus', 'suas', 'esse', 'essa', 'este', 'esta',
    'noções', 'nocoes', 'conceito', 'conceitos', 'gerais', 'geral',
    'aspectos', 'introdução', 'introducao', 'básico', 'basico'
  ]);

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[\/\\]/g, ' ') // Substitui / e \ por espaço para separar palavras como "judiciaria/investigativa"
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Sanitiza uma keyword para uso seguro em queries ILIKE
 * Remove caracteres especiais que podem causar erros no PostgreSQL
 */
function sanitizeKeywordForQuery(keyword: string): string {
  // Remove caracteres que podem causar problemas em queries LIKE/ILIKE
  return keyword
    .replace(/[%_\\\/\[\](){}*+?^$|]/g, '') // Remove caracteres especiais de regex/LIKE
    .trim();
}

/**
 * Aplica filtros obrigatórios de qualidade a uma query
 * - Garante que a questão esteja ativa (ativo = true)
 * - Garante que a questão tenha gabarito válido
 * - Garante que tenha enunciado
 */
function applyQualityFilters(query: any): any {
  return query
    .eq('ativo', true) // Apenas questões ativas
    .not('gabarito', 'is', null)
    .neq('gabarito', '')
    .not('enunciado', 'is', null)
    .neq('enunciado', '');
}

/**
 * Valida se uma questão tem todos os campos obrigatórios
 */
function isValidQuestion(question: any): boolean {
  return !!(
    question.gabarito &&
    question.gabarito.trim() !== '' &&
    question.enunciado &&
    question.enunciado.trim() !== ''
  );
}

/**
 * Normaliza nome de matéria para comparação flexível
 * Remove acentos, converte para minúsculas, remove pontuação
 */
function normalizeMateria(materia: string): string {
  return materia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove pontuação
    .trim();
}

/**
 * Mapeamento de nomes de matérias do edital para nomes no banco de questões
 * Isso garante que encontremos questões mesmo com nomes diferentes
 */
const MATERIA_MAPPING: Record<string, string[]> = {
  'lingua portuguesa': ['Língua Portuguesa', 'Português', 'LÍNGUA PORTUGUESA', 'PORTUGUÊS', 'Lingua Portuguesa', 'PORTUGUES', 'portugues', 'Linguagem'],
  'portugues': ['Língua Portuguesa', 'Português', 'LÍNGUA PORTUGUESA', 'PORTUGUÊS', 'PORTUGUES', 'portugues'],
  'raciocinio logico': ['Raciocínio Lógico', 'RACIOCÍNIO LÓGICO', 'Raciocinio Logico', 'Lógica', 'LÓGICA', 'Logica', 'LOGICA', 'Raciocínio Lógico-Matemático'],
  'direito constitucional': ['Direito Constitucional', 'DIREITO CONSTITUCIONAL', 'Constitucional', 'CONSTITUCIONAL'],
  'direito administrativo': ['Direito Administrativo', 'DIREITO ADMINISTRATIVO', 'Administrativo', 'ADMINISTRATIVO'],
  'direito penal': ['Direito Penal', 'DIREITO PENAL', 'Penal', 'PENAL'],
  'direito processual penal': ['Direito Processual Penal', 'DIREITO PROCESSUAL PENAL', 'Processo Penal', 'PROCESSO PENAL', 'Processual Penal'],
  'informatica': ['Informática', 'INFORMÁTICA', 'Noções de Informática', 'NOÇÕES DE INFORMÁTICA', 'Informatica', 'INFORMATICA'],
  'legislacao': ['Legislação', 'LEGISLAÇÃO', 'Legislação Especial', 'Legislacao', 'LEGISLACAO'],
  'atualidades': ['Atualidades', 'ATUALIDADES', 'Conhecimentos Gerais', 'CONHECIMENTOS GERAIS'],
  'redacao': ['Redação', 'REDAÇÃO', 'Redação Oficial', 'Redacao', 'REDACAO'],
};

// Palavras-chave para busca ILIKE por matéria
const MATERIA_KEYWORDS: Record<string, string[]> = {
  'lingua portuguesa': ['portugu', 'lingua'],
  'portugues': ['portugu', 'lingua'],
  'raciocinio logico': ['logic', 'raciocin'],
  'direito constitucional': ['constitucional'],
  'direito administrativo': ['administrativ'],
  'direito penal': ['penal'],
  'direito processual penal': ['processual penal', 'processo penal'],
  'informatica': ['informatic', 'informatik'],
  'legislacao': ['legisla'],
  'atualidades': ['atualidade', 'conhecimentos gerais'],
  'redacao': ['redaca', 'redação'],
};

/**
 * Gera variações de um assunto para busca flexível (com e sem acentos)
 */
function getAssuntoVariations(assunto: string): string[] {
  const variations = new Set<string>();

  // Versão original
  variations.add(assunto);

  // Versão sem acentos
  const semAcento = assunto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  variations.add(semAcento);

  // Versões em maiúsculas e minúsculas
  variations.add(assunto.toLowerCase());
  variations.add(assunto.toUpperCase());
  variations.add(semAcento.toLowerCase());
  variations.add(semAcento.toUpperCase());

  return [...variations];
}

/**
 * Busca variações do nome da matéria para aumentar chances de match
 */
function getMateriaVariations(materia: string): string[] {
  const normalized = normalizeMateria(materia);

  // Se tem mapeamento direto, usar
  if (MATERIA_MAPPING[normalized]) {
    return MATERIA_MAPPING[normalized];
  }

  // Procurar mapeamento parcial
  for (const [key, values] of Object.entries(MATERIA_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return values;
    }
  }

  // Retornar a matéria original e variações comuns
  return [
    materia,
    materia.toUpperCase(),
    materia.toLowerCase(),
    // Versão sem acentos
    materia.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  ];
}

/**
 * Busca questões do banco de questões baseado nos filtros
 * IMPORTANTE: Aplica TODOS os filtros de forma RIGOROSA
 * Só retorna questões que atendem a TODOS os filtros especificados
 */
async function fetchQuestionsWithFilters(
  filtros: MissaoFiltros,
  limit: number = DEFAULT_QUESTIONS_PER_MISSION
): Promise<ParsedQuestion[]> {
  try {
    console.log('[MissaoQuestoesService] Aplicando filtros RIGOROSOS:', JSON.stringify(filtros, null, 2));

    // Construir query base
    let query = questionsDb
      .from('questoes_concurso')
      .select('*');

    // FILTRO RIGOROSO: Matérias (com variações de nome)
    if (filtros.materias && filtros.materias.length > 0) {
      const todasVariacoes = filtros.materias.flatMap(getMateriaVariations);
      const variacoesUnicas = [...new Set(todasVariacoes)];
      console.log('[MissaoQuestoesService] Filtro matérias:', variacoesUnicas);
      query = query.in('materia', variacoesUnicas);
    }

    // FILTRO RIGOROSO: Assuntos (com variações de acentuação para flexibilidade)
    if (filtros.assuntos && filtros.assuntos.length > 0) {
      const todasVariacoesAssuntos = filtros.assuntos.flatMap(getAssuntoVariations);
      const variacoesUnicasAssuntos = [...new Set(todasVariacoesAssuntos)];
      console.log('[MissaoQuestoesService] Filtro assuntos (com variações):', filtros.assuntos, '→', variacoesUnicasAssuntos.length, 'variações');
      query = query.in('assunto', variacoesUnicasAssuntos);
    }

    // FILTRO RIGOROSO: Bancas (com variações de sigla e nome completo)
    if (filtros.bancas && filtros.bancas.length > 0) {
      // Mapeamento completo: sigla ↔ nome completo (bidirecional)
      const bancaVariations: Record<string, string[]> = {
        // CEBRASPE / CESPE
        'cebraspe': ['CEBRASPE', 'Cebraspe', 'CESPE', 'Cespe', 'CESPE/CEBRASPE', 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos'],
        'cespe': ['CESPE', 'Cespe', 'CEBRASPE', 'Cebraspe', 'CESPE/CEBRASPE', 'Centro de Seleção e de Promoção de Eventos'],
        'centro brasileiro de pesquisa': ['CEBRASPE', 'Cebraspe', 'CESPE', 'Cespe'],
        // FGV
        'fgv': ['FGV', 'Fgv', 'Fundação Getúlio Vargas', 'Fundação Getulio Vargas', 'FUNDAÇÃO GETÚLIO VARGAS'],
        'fundação getúlio vargas': ['FGV', 'Fgv', 'Fundação Getúlio Vargas', 'Fundação Getulio Vargas'],
        'fundação getulio vargas': ['FGV', 'Fgv', 'Fundação Getúlio Vargas', 'Fundação Getulio Vargas'],
        'fundacao getulio vargas': ['FGV', 'Fgv', 'Fundação Getúlio Vargas', 'Fundação Getulio Vargas'],
        // FCC
        'fcc': ['FCC', 'Fcc', 'Fundação Carlos Chagas', 'FUNDAÇÃO CARLOS CHAGAS'],
        'fundação carlos chagas': ['FCC', 'Fcc', 'Fundação Carlos Chagas'],
        'fundacao carlos chagas': ['FCC', 'Fcc', 'Fundação Carlos Chagas'],
        // CESGRANRIO
        'cesgranrio': ['CESGRANRIO', 'Cesgranrio', 'Fundação Cesgranrio', 'FUNDAÇÃO CESGRANRIO'],
        'fundação cesgranrio': ['CESGRANRIO', 'Cesgranrio', 'Fundação Cesgranrio'],
        // VUNESP
        'vunesp': ['VUNESP', 'Vunesp', 'Fundação Vunesp', 'Fundação para o Vestibular da UNESP'],
        'fundação vunesp': ['VUNESP', 'Vunesp', 'Fundação Vunesp'],
        // IBFC
        'ibfc': ['IBFC', 'Ibfc', 'Instituto Brasileiro de Formação e Capacitação'],
        'instituto brasileiro de formação': ['IBFC', 'Ibfc'],
        // QUADRIX
        'quadrix': ['QUADRIX', 'Quadrix', 'Instituto Quadrix'],
        'instituto quadrix': ['QUADRIX', 'Quadrix', 'Instituto Quadrix'],
        // IADES
        'iades': ['IADES', 'Iades', 'Instituto Americano de Desenvolvimento'],
        'instituto americano': ['IADES', 'Iades'],
        // IDECAN
        'idecan': ['IDECAN', 'Idecan', 'Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional'],
        // FUNCAB
        'funcab': ['FUNCAB', 'Funcab', 'Fundação Professor Carlos Augusto Bittencourt'],
        // AOCP
        'aocp': ['AOCP', 'Aocp', 'Assessoria em Organização de Concursos Públicos'],
        // CONSULPLAN
        'consulplan': ['CONSULPLAN', 'Consulplan'],
        // INSTITUTO ACESSO
        'instituto acesso': ['INSTITUTO ACESSO', 'Instituto Acesso', 'Acesso'],
        'acesso': ['INSTITUTO ACESSO', 'Instituto Acesso', 'Acesso'],
      };

      const todasVariacoesBancas = filtros.bancas.flatMap(banca => {
        const normalized = banca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Procurar correspondência exata ou parcial no mapeamento
        for (const [key, values] of Object.entries(bancaVariations)) {
          if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
            return values;
          }
        }

        // Retornar variações básicas se não encontrou no mapeamento
        return [banca, banca.toUpperCase(), banca.toLowerCase()];
      });
      const variacoesUnicasBancas = [...new Set(todasVariacoesBancas)];
      console.log('[MissaoQuestoesService] Filtro bancas (com variações):', filtros.bancas, '→', variacoesUnicasBancas);
      query = query.in('banca', variacoesUnicasBancas);
    }

    // FILTRO RIGOROSO: Órgãos
    if (filtros.orgaos && filtros.orgaos.length > 0) {
      console.log('[MissaoQuestoesService] Filtro órgãos:', filtros.orgaos);
      query = query.in('orgao', filtros.orgaos);
    }

    // FILTRO RIGOROSO: Anos
    if (filtros.anos && filtros.anos.length > 0) {
      console.log('[MissaoQuestoesService] Filtro anos:', filtros.anos);
      query = query.in('ano', filtros.anos);
    }

    // NOTA: campos 'cargo', 'escolaridade' e 'modalidade' não existem na tabela questoes_concurso
    // Esses filtros são ignorados no banco mas podem ser usados para filtragem em memória se necessário

    // Aplicar filtros de qualidade (gabarito obrigatório, questão ativa)
    query = applyQualityFilters(query);

    // Buscar mais questões do que o limite para ter margem de seleção
    query = query.limit(limit * 5);

    const { data, error } = await query;

    if (error) {
      console.error('[MissaoQuestoesService] Erro na query:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[MissaoQuestoesService] Nenhuma questão encontrada com os filtros rigorosos');

      // FALLBACK: Se não encontrou com filtros exatos de assunto, tentar sem o filtro de assunto
      // mas MANTENDO todos os outros filtros
      if (filtros.assuntos && filtros.assuntos.length > 0 && filtros.materias && filtros.materias.length > 0) {
        console.log('[MissaoQuestoesService] Tentando fallback sem filtro de assunto exato...');

        const filtrosSemAssunto = { ...filtros };
        delete filtrosSemAssunto.assuntos;

        return fetchQuestionsWithFiltersFallback(filtrosSemAssunto, filtros.assuntos, limit);
      }

      return [];
    }

    // Filtro adicional de segurança no código
    const validData = data.filter(isValidQuestion);
    console.log('[MissaoQuestoesService] Encontradas', validData.length, 'questões válidas (de', data.length, 'total)');

    if (validData.length === 0) {
      console.warn('[MissaoQuestoesService] Nenhuma questão válida após filtro de qualidade');
      return [];
    }

    // Embaralhar e limitar
    const shuffled = validData.sort(() => Math.random() - 0.5).slice(0, limit);
    console.log('[MissaoQuestoesService] Retornando', shuffled.length, 'questões');

    return shuffled.map(transformQuestion);
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return [];
  }
}

/**
 * Fallback quando não encontra questões com assunto exato
 * Busca por matéria e prioriza questões que melhor combinam com os assuntos
 * MAS ainda respeita todos os outros filtros rigorosamente
 */
async function fetchQuestionsWithFiltersFallback(
  filtros: MissaoFiltros,
  assuntosOriginais: string[],
  limit: number
): Promise<ParsedQuestion[]> {
  try {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*');

    // Aplicar TODOS os filtros exceto assunto
    if (filtros.materias && filtros.materias.length > 0) {
      const todasVariacoes = filtros.materias.flatMap(getMateriaVariations);
      query = query.in('materia', [...new Set(todasVariacoes)]);
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

    query = applyQualityFilters(query);
    query = query.limit(limit * 10);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      console.warn('[MissaoQuestoesService] Fallback também não encontrou questões');
      return [];
    }

    const validData = data.filter(isValidQuestion);

    // Priorizar questões cujo assunto tenha palavras em comum com os assuntos originais
    const assuntoKeywords = assuntosOriginais.flatMap(extractKeywords);

    const scored = validData.map(q => {
      const qAssuntoNorm = normalizeMateria(q.assunto || '');
      let score = 0;
      for (const kw of assuntoKeywords) {
        if (qAssuntoNorm.includes(kw.toLowerCase())) {
          score += 1;
        }
      }
      return { question: q, score };
    });

    // Ordenar por score (maior primeiro) e embaralhar os de mesmo score
    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

    const selected = scored.slice(0, limit).map(s => s.question);
    console.log('[MissaoQuestoesService] Fallback retornando', selected.length, 'questões priorizadas por assunto');

    return selected.map(transformQuestion);
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro no fallback:', error);
    return [];
  }
}

/**
 * Busca questões para uma missão específica
 * Primeiro tenta usar os filtros salvos, depois os itens do edital
 * @param missaoId - ID da missão
 * @param limit - Número base de questões (será reduzido se modo Reta Final)
 * @param mode - Modo de estudo ('normal' ou 'reta_final')
 */
export async function getQuestoesParaMissao(
  missaoId: string,
  limit: number = DEFAULT_QUESTIONS_PER_MISSION,
  mode: StudyMode = 'normal'
): Promise<ParsedQuestion[]> {
  // Calcular número efetivo de questões baseado no modo
  const effectiveLimit = await getEffectiveQuestionCount(limit, mode);
  console.log(`[MissaoQuestoesService] Buscando questões para missão: ${missaoId} (modo: ${mode}, limit: ${effectiveLimit}/${limit})`);

  // 1. Tentar buscar filtros salvos
  const filtros = await getMissaoFiltros(missaoId);

  if (filtros && (filtros.assuntos?.length || filtros.materias?.length)) {
    console.log('[MissaoQuestoesService] Usando filtros salvos:', filtros);
    const questoes = await fetchQuestionsWithFilters(filtros, effectiveLimit);

    if (questoes.length > 0) {
      console.log('[MissaoQuestoesService] Encontradas', questoes.length, 'questões via filtros');
      return questoes;
    }
  }

  // 2. Buscar dados da missão (matéria e assunto) - SEMPRE necessário para garantir filtro correto
  let missaoData: { materia: string | null; assunto: string | null } | null = null;
  try {
    const { data: missao } = await supabase
      .from('missoes')
      .select('materia, assunto')
      .eq('id', missaoId)
      .single();
    missaoData = missao;
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro ao buscar dados da missão:', error);
  }

  // 3. Fallback: buscar via itens do edital + matéria da missão
  const editalItemIds = await getMissaoEditalItems(missaoId);

  if (editalItemIds.length > 0) {
    console.log('[MissaoQuestoesService] Buscando via itens do edital:', editalItemIds.length);
    const titulos = await getEditalItemsTitulos(editalItemIds);

    if (titulos.length > 0) {
      console.log('[MissaoQuestoesService] Títulos do edital:', titulos);

      // IMPORTANTE: Sempre incluir a matéria da missão para garantir filtro correto
      const editalFiltros: MissaoFiltros = {
        assuntos: titulos,
        materias: missaoData?.materia ? [missaoData.materia] : undefined,
      };

      const questoes = await fetchQuestionsWithFilters(editalFiltros, effectiveLimit);

      if (questoes.length > 0) {
        console.log('[MissaoQuestoesService] Encontradas', questoes.length, 'questões via edital');
        return questoes;
      }
    }
  }

  // 4. Fallback final: usar dados da missão diretamente
  if (missaoData) {
    const fallbackFiltros: MissaoFiltros = {};

    if (missaoData.materia) {
      fallbackFiltros.materias = [missaoData.materia];
    }
    if (missaoData.assunto) {
      fallbackFiltros.assuntos = [missaoData.assunto];
    }

    if (fallbackFiltros.materias?.length || fallbackFiltros.assuntos?.length) {
      console.log('[MissaoQuestoesService] Usando dados da missão:', fallbackFiltros);
      const questoes = await fetchQuestionsWithFilters(fallbackFiltros, effectiveLimit);

      if (questoes.length > 0) {
        console.log('[MissaoQuestoesService] Encontradas', questoes.length, 'questões via missão');
        return questoes;
      }
    }
  }

  console.warn(`[MissaoQuestoesService] Nenhuma questão encontrada para missão: ${missaoId} (modo: ${mode})`);
  return [];
}

/**
 * Conta quantas questões VÁLIDAS estão disponíveis para uma missão
 * Usa estratégias otimizadas para evitar timeout
 * IMPORTANTE: Só conta questões com gabarito válido
 */
export async function countQuestoesParaMissao(missaoId: string): Promise<number> {
  const filtros = await getMissaoFiltros(missaoId);

  if (!filtros) return 0;

  try {
    // Priorizar busca por matéria (usa índice)
    if (filtros.materias && filtros.materias.length > 0) {
      let query = questionsDb
        .from('questoes_concurso')
        .select('*', { count: 'exact', head: true })
        .in('materia', filtros.materias);

      if (filtros.bancas && filtros.bancas.length > 0) {
        query = query.in('banca', filtros.bancas);
      }

      // Aplicar filtros de qualidade (gabarito obrigatório)
      query = applyQualityFilters(query);

      const { count, error } = await query;
      if (!error && count && count > 0) {
        return count;
      }
    }

    // Fallback: contar por palavra-chave
    if (filtros.assuntos && filtros.assuntos.length > 0) {
      const allKeywords = filtros.assuntos.flatMap(extractKeywords);
      const topKeyword = [...new Set(allKeywords)]
        .sort((a, b) => b.length - a.length)[0];

      if (topKeyword) {
        const sanitizedKeyword = sanitizeKeywordForQuery(topKeyword);
        if (sanitizedKeyword && sanitizedKeyword.length >= 3) {
          let query = questionsDb
            .from('questoes_concurso')
            .select('*', { count: 'exact', head: true })
            .ilike('assunto', `%${sanitizedKeyword}%`);

          // Aplicar filtros de qualidade (gabarito obrigatório)
          query = applyQualityFilters(query);

          const { count, error } = await query;
          if (!error) return count || 0;
        }
      }
    }

    return 0;
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return 0;
  }
}

/**
 * Busca questões por IDs específicos (para restaurar progresso salvo)
 * Mantém a ordem dos IDs fornecidos
 */
export async function getQuestoesByIds(ids: (number | string)[]): Promise<ParsedQuestion[]> {
  if (!ids || ids.length === 0) return [];

  try {
    // Converter para números (banco pode retornar como strings)
    const numericIds = ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));

    console.log('[MissaoQuestoesService] Buscando questões por IDs:', numericIds.length, 'IDs:', numericIds.slice(0, 5));

    // Buscar em batches para evitar URLs muito longas
    const BATCH_SIZE = 10;
    let allData: any[] = [];

    for (let i = 0; i < numericIds.length; i += BATCH_SIZE) {
      const batch = numericIds.slice(i, i + BATCH_SIZE);
      console.log(`[MissaoQuestoesService] Buscando batch ${i / BATCH_SIZE + 1}:`, batch.length, 'IDs');

      const { data, error, status, statusText } = await questionsDb
        .from('questoes_concurso')
        .select('*')
        .in('id', batch)
        .eq('ativo', true); // Apenas questões ativas

      console.log('[MissaoQuestoesService] Resposta do batch:', {
        status,
        statusText,
        dataLength: data?.length || 0,
        error: error ? error.message : null,
      });

      if (error) {
        console.error('[MissaoQuestoesService] Erro no batch:', error);
        continue; // Tentar próximo batch mesmo com erro
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }
    }

    console.log('[MissaoQuestoesService] Total de questões encontradas:', allData.length);

    if (allData.length === 0) {
      console.warn('[MissaoQuestoesService] Nenhuma questão encontrada para os IDs:', numericIds.slice(0, 5));
      return [];
    }

    // Reordenar para manter a ordem original dos IDs
    const dataMap = new Map(allData.map(q => [q.id, q]));
    const orderedData = numericIds.map(id => dataMap.get(id)).filter(Boolean);

    console.log('[MissaoQuestoesService] Questões ordenadas:', orderedData.length);

    // Parse das questões (já ordenadas)
    const parsedQuestions: ParsedQuestion[] = orderedData.map((q: any) => ({
      id: q.id,
      materia: q.materia || 'Não especificada',
      assunto: q.assunto || '',
      concurso: q.concurso || '',
      enunciado: q.enunciado || '',
      alternativas: q.alternativas || '[]',
      parsedAlternativas: parseAlternativas(q.alternativas),
      gabarito: (q.gabarito || '').trim().toUpperCase(),
      comentario: q.comentario || '',
      orgao: q.orgao || '',
      banca: q.banca || '',
      ano: q.ano || 0,
    }));

    console.log('[MissaoQuestoesService] Questões recuperadas:', parsedQuestions.length);
    return parsedQuestions;
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
    return [];
  }
}

// Helper para parse de alternativas
function parseAlternativas(alternativas: string | any[]): Array<{ letter: string; text: string }> {
  if (!alternativas) return [];

  try {
    let alts = alternativas;
    if (typeof alternativas === 'string') {
      alts = JSON.parse(alternativas);
    }

    if (Array.isArray(alts)) {
      return alts.map((alt: any, index: number) => {
        if (typeof alt === 'string') {
          return { letter: String.fromCharCode(65 + index), text: alt };
        }
        return { letter: alt.letter || String.fromCharCode(65 + index), text: alt.text || alt.texto || '' };
      });
    }
  } catch (e) {
    console.error('[MissaoQuestoesService] Erro ao parsear alternativas:', e);
  }

  return [];
}

export default {
  getMissaoFiltros,
  getMissaoEditalItems,
  getEditalItemsTitulos,
  getQuestoesParaMissao,
  countQuestoesParaMissao,
  getQuestoesByIds,
};
