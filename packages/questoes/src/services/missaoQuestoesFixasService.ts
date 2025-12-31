/**
 * Serviço para gerenciar questões FIXAS de cada missão
 * Todas os usuários veem as mesmas questões por missão
 */

import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';
import { ParsedQuestion } from '../types';
import { getQuestoesParaMissao } from './missaoQuestoesService';

interface MissaoQuestao {
  id: string;
  missao_id: string;
  questao_id: number;
  ordem: number;
}

/**
 * Busca as questões fixas de uma missão
 * Se não existirem, gera e salva automaticamente
 */
export async function getQuestoesFixasDaMissao(
  missaoId: string,
  quantidadeDesejada: number = 20,
  trailMode: string = 'normal'
): Promise<ParsedQuestion[]> {
  console.log('[MissaoQuestoesFixas] Buscando questões fixas para missão:', missaoId);

  try {
    // 1. Verificar se já existem questões fixas para esta missão
    const { data: questoesFixas, error: fetchError } = await supabase
      .from('missao_questoes')
      .select('questao_id, ordem')
      .eq('missao_id', missaoId)
      .order('ordem', { ascending: true });

    if (fetchError) {
      console.error('[MissaoQuestoesFixas] Erro ao buscar questões fixas:', fetchError);
      // Fallback: gerar questões dinamicamente
      return await getQuestoesParaMissao(missaoId, quantidadeDesejada, trailMode);
    }

    // 2. Se já tem questões fixas, buscar os dados completos
    if (questoesFixas && questoesFixas.length > 0) {
      console.log('[MissaoQuestoesFixas] Encontradas', questoesFixas.length, 'questões fixas');

      const questaoIds = questoesFixas.map(q => q.questao_id);
      const questoesCompletas = await buscarQuestoesCompletas(questaoIds);

      if (questoesCompletas.length > 0) {
        // Ordenar conforme a ordem salva
        const orderedQuestions = questoesFixas
          .map(qf => questoesCompletas.find(qc => qc.id === qf.questao_id))
          .filter(Boolean) as ParsedQuestion[];

        console.log('[MissaoQuestoesFixas] Retornando', orderedQuestions.length, 'questões ordenadas');
        return orderedQuestions;
      }
    }

    // 3. Se não tem questões fixas, gerar e salvar
    console.log('[MissaoQuestoesFixas] Gerando questões fixas para missão:', missaoId);

    const novasQuestoes = await getQuestoesParaMissao(missaoId, quantidadeDesejada, trailMode);

    if (novasQuestoes.length > 0) {
      // Salvar as questões como fixas
      await salvarQuestoesFixas(missaoId, novasQuestoes);
    }

    return novasQuestoes;
  } catch (error) {
    console.error('[MissaoQuestoesFixas] Erro:', error);
    // Fallback: gerar questões dinamicamente
    return await getQuestoesParaMissao(missaoId, quantidadeDesejada, trailMode);
  }
}

/**
 * Salva questões como fixas para uma missão
 */
async function salvarQuestoesFixas(missaoId: string, questoes: ParsedQuestion[]): Promise<void> {
  console.log('[MissaoQuestoesFixas] Salvando', questoes.length, 'questões fixas para missão:', missaoId);

  try {
    const registros = questoes.map((q, index) => ({
      missao_id: missaoId,
      questao_id: q.id,
      ordem: index + 1,
    }));

    const { error } = await supabase
      .from('missao_questoes')
      .upsert(registros, {
        onConflict: 'missao_id,questao_id',
      });

    if (error) {
      // Código 23505 = duplicate key - significa que outra chamada já salvou (race condition)
      // Isso é esperado com React StrictMode que chama useEffect duas vezes
      if (error.code === '23505') {
        console.log('[MissaoQuestoesFixas] Questões já existem (race condition ignorada)');
      } else {
        console.error('[MissaoQuestoesFixas] Erro ao salvar questões fixas:', error);
      }
    } else {
      console.log('[MissaoQuestoesFixas] Questões fixas salvas com sucesso!');
    }
  } catch (error) {
    console.error('[MissaoQuestoesFixas] Exceção ao salvar:', error);
  }
}

/**
 * Busca dados completos das questões pelo ID
 */
async function buscarQuestoesCompletas(ids: number[]): Promise<ParsedQuestion[]> {
  if (!ids || ids.length === 0) return [];

  console.log('[MissaoQuestoesFixas] Buscando dados completos de', ids.length, 'questões');

  try {
    // Buscar em batches para evitar URLs muito longas
    const BATCH_SIZE = 10;
    let allData: any[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);

      const { data, error } = await questionsDb
        .from('questoes_concurso')
        .select('*')
        .in('id', batch);

      if (error) {
        console.error('[MissaoQuestoesFixas] Erro ao buscar batch:', error);
        continue;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }
    }

    console.log('[MissaoQuestoesFixas] Questões completas encontradas:', allData.length);

    if (allData.length === 0) return [];

    // Parse das questões
    return allData.map((q: any) => ({
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
  } catch (error) {
    console.error('[MissaoQuestoesFixas] Erro ao buscar questões completas:', error);
    return [];
  }
}

/**
 * Verifica se uma missão já tem questões fixas
 */
export async function missaoTemQuestoesFixas(missaoId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('missao_questoes')
      .select('*', { count: 'exact', head: true })
      .eq('missao_id', missaoId);

    if (error) {
      console.error('[MissaoQuestoesFixas] Erro ao verificar:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Retorna os IDs das questões fixas de uma missão
 */
export async function getQuestaoIdsDaMissao(missaoId: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('missao_questoes')
      .select('questao_id')
      .eq('missao_id', missaoId)
      .order('ordem', { ascending: true });

    if (error || !data) return [];

    return data.map(d => d.questao_id);
  } catch (error) {
    return [];
  }
}

/**
 * Limpa as questões fixas de uma missão para forçar regeneração
 * Útil quando as questões foram geradas incorretamente
 */
export async function limparQuestoesFixasDaMissao(missaoId: string): Promise<boolean> {
  console.log('[MissaoQuestoesFixas] Limpando questões fixas da missão:', missaoId);

  try {
    const { error } = await supabase
      .from('missao_questoes')
      .delete()
      .eq('missao_id', missaoId);

    if (error) {
      console.error('[MissaoQuestoesFixas] Erro ao limpar questões:', error);
      return false;
    }

    console.log('[MissaoQuestoesFixas] Questões fixas limpas com sucesso!');
    return true;
  } catch (error) {
    console.error('[MissaoQuestoesFixas] Exceção ao limpar:', error);
    return false;
  }
}

/**
 * Limpa todas as questões fixas de um preparatório
 * Útil quando precisa regenerar todas as missões
 */
export async function limparTodasQuestoesFixasDoPreparatorio(preparatorioId: string): Promise<{ success: boolean; count: number }> {
  console.log('[MissaoQuestoesFixas] Limpando TODAS as questões fixas do preparatório:', preparatorioId);

  try {
    // Primeiro buscar todas as missões do preparatório
    const { data: rodadas, error: rodadasError } = await supabase
      .from('rodadas')
      .select('id')
      .eq('preparatorio_id', preparatorioId);

    if (rodadasError || !rodadas || rodadas.length === 0) {
      console.log('[MissaoQuestoesFixas] Nenhuma rodada encontrada');
      return { success: true, count: 0 };
    }

    const rodadaIds = rodadas.map(r => r.id);

    // Buscar missões dessas rodadas
    const { data: missoes, error: missoesError } = await supabase
      .from('missoes')
      .select('id')
      .in('rodada_id', rodadaIds);

    if (missoesError || !missoes || missoes.length === 0) {
      console.log('[MissaoQuestoesFixas] Nenhuma missão encontrada');
      return { success: true, count: 0 };
    }

    const missaoIds = missoes.map(m => m.id);

    // Deletar questões fixas dessas missões
    const { error: deleteError } = await supabase
      .from('missao_questoes')
      .delete()
      .in('missao_id', missaoIds);

    if (deleteError) {
      console.error('[MissaoQuestoesFixas] Erro ao limpar questões:', deleteError);
      return { success: false, count: 0 };
    }

    console.log(`[MissaoQuestoesFixas] Limpas questões de ${missaoIds.length} missões`);
    return { success: true, count: missaoIds.length };
  } catch (error) {
    console.error('[MissaoQuestoesFixas] Exceção ao limpar:', error);
    return { success: false, count: 0 };
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

    if (!Array.isArray(alts)) return [];

    return alts.map((alt: any, index: number) => {
      if (typeof alt === 'string') {
        const letter = String.fromCharCode(65 + index);
        return { letter, text: alt };
      }
      return {
        letter: alt.letter || alt.letra || String.fromCharCode(65 + index),
        text: alt.text || alt.texto || alt.conteudo || String(alt),
      };
    });
  } catch (error) {
    return [];
  }
}
