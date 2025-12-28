/**
 * Serviço para buscar questões de uma missão baseado nos filtros do planejamento
 * Suporta modo Reta Final com redução de questões
 */

import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';
import { ParsedQuestion, Alternative, StudyMode } from '../types';
import { getEffectiveQuestionCount } from './retaFinalService';

// Filtros de questões salvos para uma missão
interface MissaoFiltros {
  assuntos?: string[];
  bancas?: string[];
  materias?: string[];
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
 * - Garante que a questão tenha gabarito válido
 * - Garante que tenha enunciado
 */
function applyQualityFilters(query: any): any {
  return query
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
 * Busca questões do banco de questões baseado nos filtros
 * Usa estratégias otimizadas para evitar timeout
 * IMPORTANTE: Só retorna questões com gabarito válido
 */
async function fetchQuestionsWithFilters(
  filtros: MissaoFiltros,
  limit: number = DEFAULT_QUESTIONS_PER_MISSION
): Promise<ParsedQuestion[]> {
  try {
    // Estratégia 1: Buscar por matéria (mais rápido, usa índice)
    if (filtros.materias && filtros.materias.length > 0) {
      console.log('[MissaoQuestoesService] Buscando por matéria:', filtros.materias);

      let query = questionsDb
        .from('questoes_concurso')
        .select('*')
        .in('materia', filtros.materias);

      if (filtros.bancas && filtros.bancas.length > 0) {
        query = query.in('banca', filtros.bancas);
      }

      // Aplicar filtros de qualidade (gabarito obrigatório)
      query = applyQualityFilters(query);
      query = query.limit(limit * 3);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // Filtro adicional de segurança no código
        const validData = data.filter(isValidQuestion);
        console.log('[MissaoQuestoesService] Encontradas', validData.length, 'questões válidas por matéria (de', data.length, 'total)');
        const shuffled = validData.sort(() => Math.random() - 0.5).slice(0, limit);
        return shuffled.map(transformQuestion);
      }
    }

    // Estratégia 2: Buscar por palavras-chave extraídas dos assuntos
    if (filtros.assuntos && filtros.assuntos.length > 0) {
      // Extrair palavras-chave de todos os assuntos
      const allKeywords = filtros.assuntos.flatMap(extractKeywords);
      const uniqueKeywords = [...new Set(allKeywords)];

      console.log('[MissaoQuestoesService] Palavras-chave extraídas:', uniqueKeywords);

      // Tentar buscar com as 2-3 palavras mais relevantes (geralmente as mais longas)
      const topKeywords = uniqueKeywords
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);

      for (const keyword of topKeywords) {
        const sanitizedKeyword = sanitizeKeywordForQuery(keyword);
        if (!sanitizedKeyword || sanitizedKeyword.length < 3) continue;

        console.log('[MissaoQuestoesService] Tentando palavra-chave:', sanitizedKeyword);

        let query = questionsDb
          .from('questoes_concurso')
          .select('*')
          .ilike('assunto', `%${sanitizedKeyword}%`);

        // Aplicar filtros de qualidade (gabarito obrigatório)
        query = applyQualityFilters(query);
        query = query.limit(limit * 3);
        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          // Filtro adicional de segurança no código
          const validData = data.filter(isValidQuestion);
          console.log('[MissaoQuestoesService] Encontradas', validData.length, 'questões válidas com keyword:', keyword);
          const shuffled = validData.sort(() => Math.random() - 0.5).slice(0, limit);
          return shuffled.map(transformQuestion);
        }
      }
    }

    // Estratégia 3: Buscar por banca apenas (fallback)
    if (filtros.bancas && filtros.bancas.length > 0) {
      console.log('[MissaoQuestoesService] Fallback: buscando por banca apenas');

      let query = questionsDb
        .from('questoes_concurso')
        .select('*')
        .in('banca', filtros.bancas);

      // Aplicar filtros de qualidade (gabarito obrigatório)
      query = applyQualityFilters(query);
      query = query.limit(limit * 3);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // Filtro adicional de segurança no código
        const validData = data.filter(isValidQuestion);
        const shuffled = validData.sort(() => Math.random() - 0.5).slice(0, limit);
        return shuffled.map(transformQuestion);
      }
    }

    console.warn('[MissaoQuestoesService] Nenhuma questão encontrada com os filtros');
    return [];
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro:', error);
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

  // 2. Fallback: buscar via itens do edital
  const editalItemIds = await getMissaoEditalItems(missaoId);

  if (editalItemIds.length > 0) {
    console.log('[MissaoQuestoesService] Buscando via itens do edital:', editalItemIds.length);
    const titulos = await getEditalItemsTitulos(editalItemIds);

    if (titulos.length > 0) {
      console.log('[MissaoQuestoesService] Títulos do edital:', titulos);
      const questoes = await fetchQuestionsWithFilters({ assuntos: titulos }, effectiveLimit);

      if (questoes.length > 0) {
        console.log('[MissaoQuestoesService] Encontradas', questoes.length, 'questões via edital');
        return questoes;
      }
    }
  }

  // 3. Fallback: buscar dados da missão diretamente
  try {
    const { data: missao } = await supabase
      .from('missoes')
      .select('materia, assunto')
      .eq('id', missaoId)
      .single();

    if (missao) {
      const fallbackFiltros: MissaoFiltros = {};

      if (missao.materia) {
        fallbackFiltros.materias = [missao.materia];
      }
      if (missao.assunto) {
        fallbackFiltros.assuntos = [missao.assunto];
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
  } catch (error) {
    console.error('[MissaoQuestoesService] Erro ao buscar missão:', error);
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
        .in('id', batch);

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
