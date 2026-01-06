/**
 * Serviço de Limpeza de Questões Corrompidas
 *
 * Usa o agente de IA para extrair conteúdo limpo de questões com HTML corrompido
 * e atualiza o banco de dados.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { questionCleanupAgent } from '../mastra/agents/questionCleanupAgent.js';

interface CleanupResult {
  success: boolean;
  enunciado?: string;
  alternativas?: { letter: string; text: string }[];
  imagensEnunciado?: string[];
  tipoQuestao?: string;
  confianca?: number;
  observacoes?: string;
  error?: string;
}

interface ProcessingStats {
  total: number;
  cleaned: number;
  failed: number;
  skipped: number;
  errors: { id: number; error: string }[];
}

export class QuestionCleanupService {
  private db: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.db = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Busca questões corrompidas do banco
   */
  async getCorruptedQuestions(limit: number = 100, offset: number = 0): Promise<any[]> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('id, enunciado, alternativas, comentario, materia, assunto, banca, ano, orgao')
      .eq('ativo', false)
      .or('enunciado.ilike.%ng-if%,enunciado.ilike.%ng-repeat%,enunciado.ilike.%<!-- ngIf%')
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      console.error('[QuestionCleanupService] Erro ao buscar questões corrompidas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Conta total de questões corrompidas
   */
  async countCorruptedQuestions(): Promise<number> {
    const { count, error } = await this.db
      .from('questoes_concurso')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', false)
      .or('enunciado.ilike.%ng-if%,enunciado.ilike.%ng-repeat%,enunciado.ilike.%<!-- ngIf%');

    if (error) {
      console.error('[QuestionCleanupService] Erro ao contar questões:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Usa IA para extrair conteúdo limpo do HTML corrompido
   */
  async cleanQuestionWithAI(htmlContent: string): Promise<CleanupResult> {
    try {
      const response = await questionCleanupAgent.generate(
        `Extraia o conteúdo limpo desta questão corrompida:\n\n${htmlContent}`
      );

      // Parse the JSON response
      const responseText = response.text.trim();

      // Remove markdown code blocks if present
      let jsonText = responseText;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(jsonText);
      return result as CleanupResult;
    } catch (error) {
      console.error('[QuestionCleanupService] Erro ao processar com IA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar com IA',
      };
    }
  }

  /**
   * Limpa uma questão específica e atualiza no banco
   */
  async cleanAndUpdateQuestion(questionId: number): Promise<{ success: boolean; action: string; details?: string }> {
    try {
      // Buscar questão
      const { data: question, error: fetchError } = await this.db
        .from('questoes_concurso')
        .select('*')
        .eq('id', questionId)
        .single();

      if (fetchError || !question) {
        return { success: false, action: 'error', details: 'Questão não encontrada' };
      }

      // Verificar se está corrompida
      if (!question.enunciado?.includes('ng-if') && !question.enunciado?.includes('ng-repeat')) {
        return { success: false, action: 'skipped', details: 'Questão não está corrompida' };
      }

      // Processar com IA
      console.log(`[QuestionCleanupService] Processando questão ${questionId}...`);
      const cleanResult = await this.cleanQuestionWithAI(question.enunciado);

      if (!cleanResult.success) {
        console.log(`[QuestionCleanupService] Falha ao limpar questão ${questionId}: ${cleanResult.error}`);
        return { success: false, action: 'failed', details: cleanResult.error };
      }

      // Validar resultado
      if (!cleanResult.enunciado || cleanResult.enunciado.length < 20) {
        return { success: false, action: 'failed', details: 'Enunciado extraído muito curto' };
      }

      if (!cleanResult.alternativas || cleanResult.alternativas.length < 2) {
        return { success: false, action: 'failed', details: 'Alternativas não extraídas corretamente' };
      }

      // Atualizar no banco
      const { error: updateError } = await this.db
        .from('questoes_concurso')
        .update({
          enunciado: cleanResult.enunciado,
          alternativas: cleanResult.alternativas,
          imagens_enunciado: cleanResult.imagensEnunciado?.length
            ? `{${cleanResult.imagensEnunciado.join(',')}}`
            : null,
          ativo: true, // Reativar questão
        })
        .eq('id', questionId);

      if (updateError) {
        return { success: false, action: 'error', details: updateError.message };
      }

      console.log(`[QuestionCleanupService] Questão ${questionId} limpa e reativada com sucesso`);
      return {
        success: true,
        action: 'cleaned',
        details: `Confiança: ${cleanResult.confianca}, Tipo: ${cleanResult.tipoQuestao}`
      };
    } catch (error) {
      return {
        success: false,
        action: 'error',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processa um lote de questões corrompidas
   */
  async processBatch(batchSize: number = 10, delayMs: number = 1000): Promise<ProcessingStats> {
    const stats: ProcessingStats = {
      total: 0,
      cleaned: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Buscar questões
    const questions = await this.getCorruptedQuestions(batchSize);
    stats.total = questions.length;

    console.log(`[QuestionCleanupService] Processando lote de ${questions.length} questões...`);

    for (const question of questions) {
      try {
        const result = await this.cleanAndUpdateQuestion(question.id);

        if (result.action === 'cleaned') {
          stats.cleaned++;
        } else if (result.action === 'failed') {
          stats.failed++;
          stats.errors.push({ id: question.id, error: result.details || 'Falha desconhecida' });
        } else if (result.action === 'skipped') {
          stats.skipped++;
        } else {
          stats.failed++;
          stats.errors.push({ id: question.id, error: result.details || 'Erro' });
        }

        // Delay entre requisições para não sobrecarregar a API
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: question.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`[QuestionCleanupService] Lote concluído: ${stats.cleaned} limpas, ${stats.failed} falhas, ${stats.skipped} ignoradas`);
    return stats;
  }

  /**
   * Inicia processamento contínuo em background
   */
  async startContinuousProcessing(
    batchSize: number = 10,
    delayBetweenBatches: number = 5000,
    maxBatches: number = 100,
    onProgress?: (stats: ProcessingStats, batch: number) => void
  ): Promise<ProcessingStats> {
    const totalStats: ProcessingStats = {
      total: 0,
      cleaned: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    console.log(`[QuestionCleanupService] Iniciando processamento contínuo (máx ${maxBatches} lotes de ${batchSize})...`);

    for (let batch = 1; batch <= maxBatches; batch++) {
      const batchStats = await this.processBatch(batchSize, 500);

      totalStats.total += batchStats.total;
      totalStats.cleaned += batchStats.cleaned;
      totalStats.failed += batchStats.failed;
      totalStats.skipped += batchStats.skipped;
      totalStats.errors.push(...batchStats.errors);

      if (onProgress) {
        onProgress(totalStats, batch);
      }

      // Se não há mais questões para processar, parar
      if (batchStats.total === 0) {
        console.log('[QuestionCleanupService] Não há mais questões corrompidas para processar');
        break;
      }

      // Delay entre lotes
      if (batch < maxBatches && delayBetweenBatches > 0) {
        console.log(`[QuestionCleanupService] Aguardando ${delayBetweenBatches}ms antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`[QuestionCleanupService] Processamento finalizado: ${totalStats.cleaned} limpas, ${totalStats.failed} falhas`);
    return totalStats;
  }
}

export default QuestionCleanupService;
