/**
 * Serviço de Limpeza de Questões Corrompidas
 *
 * Usa o agente de IA para extrair conteúdo limpo de questões com HTML corrompido
 * e atualiza o banco de dados.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { questionCleanupAgent } from '../mastra/agents/questionCleanupAgent.js';
import { questionReviewAgent } from '../mastra/agents/questionReviewAgent.js';

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

interface ReviewResult {
  aprovada: boolean;
  confianca: number;
  motivo: string;
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
      // Limitar tamanho do HTML para evitar problemas com conteúdo muito grande
      const maxLength = 50000;
      const truncatedHtml = htmlContent.length > maxLength
        ? htmlContent.substring(0, maxLength) + '... [truncado]'
        : htmlContent;

      const response = await questionCleanupAgent.generate(
        `Extraia o conteúdo limpo desta questão corrompida:\n\n${truncatedHtml}`
      );

      // Parse the JSON response
      const responseText = response.text.trim();

      // Se resposta vazia, retornar erro
      if (!responseText) {
        return {
          success: false,
          error: 'Resposta vazia da IA',
        };
      }

      // Remove markdown code blocks if present
      let jsonText = responseText;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // Tentar extrair JSON de qualquer lugar na resposta
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[QuestionCleanupService] Resposta não contém JSON válido:', responseText.substring(0, 200));
        return {
          success: false,
          error: 'Resposta da IA não contém JSON válido',
        };
      }

      const result = JSON.parse(jsonMatch[0]);
      return result as CleanupResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[QuestionCleanupService] Erro ao processar com IA:', errorMsg);
      return {
        success: false,
        error: `Erro ao processar com IA: ${errorMsg}`,
      };
    }
  }

  /**
   * Extrai URLs de imagens do HTML original
   */
  extractImagesFromHTML(html: string): string[] {
    const images: string[] = [];

    // Padrão 1: <img src="URL">
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgSrcRegex.exec(html)) !== null) {
      const url = match[1];
      // Ignorar data URLs e placeholders
      if (url && !url.startsWith('data:') && !url.includes('placeholder')) {
        images.push(url);
      }
    }

    // Padrão 2: URLs diretas de imagem
    const imageUrlRegex = /https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/gi;
    while ((match = imageUrlRegex.exec(html)) !== null) {
      if (!images.includes(match[0])) {
        images.push(match[0]);
      }
    }

    return images;
  }

  /**
   * Usa agente de IA para revisar questão limpa e decidir se deve ser reativada
   */
  async reviewCleanedQuestion(enunciado: string, alternativas: { letter: string; text: string }[]): Promise<ReviewResult> {
    try {
      // Validar entrada
      if (!enunciado || enunciado.length < 10) {
        return {
          aprovada: false,
          confianca: 1,
          motivo: 'Enunciado muito curto ou vazio'
        };
      }

      const alternativasText = alternativas.map(a => `${a.letter}) ${a.text}`).join('\n');
      const prompt = `Revise esta questão de concurso:\n\nEnunciado:\n${enunciado}\n\nAlternativas:\n${alternativasText}`;

      const response = await questionReviewAgent.generate(prompt);

      // Parse the JSON response
      let jsonText = response.text.trim();

      // Se resposta vazia, retornar não aprovada
      if (!jsonText) {
        return {
          aprovada: false,
          confianca: 0,
          motivo: 'Resposta vazia do agente de revisão'
        };
      }

      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // Tentar extrair JSON de qualquer lugar na resposta
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[QuestionCleanupService] Revisão não contém JSON válido');
        return {
          aprovada: false,
          confianca: 0,
          motivo: 'Resposta de revisão não contém JSON válido'
        };
      }

      const result = JSON.parse(jsonMatch[0]) as ReviewResult;

      // Validar campos obrigatórios
      if (typeof result.aprovada !== 'boolean') {
        return {
          aprovada: false,
          confianca: 0,
          motivo: 'Resposta de revisão inválida'
        };
      }

      return {
        aprovada: result.aprovada,
        confianca: result.confianca || 0,
        motivo: result.motivo || 'Sem motivo especificado'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'desconhecido';
      console.error('[QuestionCleanupService] Erro ao revisar questão:', errorMsg);
      // Em caso de erro, retornar não aprovada para segurança
      return {
        aprovada: false,
        confianca: 0,
        motivo: `Erro ao revisar: ${errorMsg}`
      };
    }
  }

  /**
   * Valida o resultado da limpeza
   */
  validateCleanResult(cleanResult: CleanupResult, originalHtml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Verificar confiança mínima
    if (!cleanResult.confianca || cleanResult.confianca < 0.7) {
      errors.push(`Confiança muito baixa: ${cleanResult.confianca || 0}`);
    }

    // 2. Verificar enunciado
    if (!cleanResult.enunciado || cleanResult.enunciado.length < 30) {
      errors.push(`Enunciado muito curto: ${cleanResult.enunciado?.length || 0} caracteres`);
    }

    // 3. Verificar se não contém lixo de template
    const templatePatterns = ['ng-if', 'ng-repeat', 'ng-model', 'vm.questao', '<!-- ngIf'];
    for (const pattern of templatePatterns) {
      if (cleanResult.enunciado?.includes(pattern)) {
        errors.push(`Enunciado ainda contém template: ${pattern}`);
      }
    }

    // 4. Verificar alternativas
    if (!cleanResult.alternativas || cleanResult.alternativas.length < 2) {
      errors.push('Menos de 2 alternativas');
    } else {
      // Verificar se alternativas têm conteúdo
      for (const alt of cleanResult.alternativas) {
        if (!alt.text || alt.text.length === 0) {
          errors.push(`Alternativa ${alt.letter} sem texto`);
        }
      }
    }

    // 5. Verificar se original tinha imagens que precisam ser preservadas
    const originalImages = this.extractImagesFromHTML(originalHtml);
    if (originalImages.length > 0) {
      const extractedImages = cleanResult.imagensEnunciado || [];
      if (extractedImages.length < originalImages.length) {
        // Não é erro crítico, mas vamos adicionar as imagens faltantes
        console.log(`[QuestionCleanupService] Aviso: ${originalImages.length - extractedImages.length} imagens não foram extraídas pela IA`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Wrapper com timeout para operações assíncronas
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms em ${operation}`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Limpa uma questão específica e atualiza no banco
   */
  async cleanAndUpdateQuestion(questionId: number): Promise<{ success: boolean; action: string; details?: string }> {
    const TIMEOUT_MS = 60000; // 60 segundos de timeout

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

      // Verificar se tem enunciado
      if (!question.enunciado) {
        return { success: false, action: 'skipped', details: 'Questão sem enunciado' };
      }

      // Verificar se está corrompida
      if (!question.enunciado.includes('ng-if') && !question.enunciado.includes('ng-repeat') && !question.enunciado.includes('<!-- ngIf')) {
        return { success: false, action: 'skipped', details: 'Questão não está corrompida' };
      }

      // Extrair imagens do HTML original ANTES de limpar
      let originalImages: string[] = [];
      try {
        originalImages = this.extractImagesFromHTML(question.enunciado);
        if (originalImages.length > 0) {
          console.log(`[QuestionCleanupService] Questão ${questionId} tem ${originalImages.length} imagens no original`);
        }
      } catch (imgError) {
        console.warn(`[QuestionCleanupService] Erro ao extrair imagens da questão ${questionId}, continuando sem imagens`);
      }

      // Processar com IA (com timeout)
      console.log(`[QuestionCleanupService] Processando questão ${questionId}...`);
      const cleanResult = await this.withTimeout(
        this.cleanQuestionWithAI(question.enunciado),
        TIMEOUT_MS,
        'limpeza com IA'
      );

      if (!cleanResult.success) {
        console.log(`[QuestionCleanupService] Falha ao limpar questão ${questionId}: ${cleanResult.error}`);
        return { success: false, action: 'failed', details: cleanResult.error };
      }

      // Validar resultado
      const validation = this.validateCleanResult(cleanResult, question.enunciado);
      if (!validation.valid) {
        console.log(`[QuestionCleanupService] Questão ${questionId} falhou na validação: ${validation.errors.join(', ')}`);
        return { success: false, action: 'validation_failed', details: validation.errors.join('; ') };
      }

      // Combinar imagens: as extraídas pela IA + as do HTML original (sem duplicatas)
      const allImages = [...(cleanResult.imagensEnunciado || [])];
      for (const img of originalImages) {
        if (!allImages.includes(img)) {
          allImages.push(img);
        }
      }

      // Se tem imagens, garantir que estão embedadas no enunciado
      let finalEnunciado = cleanResult.enunciado || '';
      if (allImages.length > 0 && finalEnunciado) {
        // Verificar se as imagens já estão no enunciado como markdown
        for (const imgUrl of allImages) {
          if (!finalEnunciado.includes(imgUrl)) {
            // Adicionar imagem ao final do enunciado
            finalEnunciado += `\n\n![Imagem](${imgUrl})`;
            console.log(`[QuestionCleanupService] Imagem adicionada ao enunciado: ${imgUrl.substring(0, 50)}...`);
          }
        }
      }

      // Decidir se reativa baseado em confiança
      let shouldReactivate = false;
      let reviewInfo = '';

      const cleanupConfianca = cleanResult.confianca || 0;

      if (cleanupConfianca >= 0.90) {
        // Alta confiança - reativar direto
        shouldReactivate = true;
        reviewInfo = 'Alta confiança na limpeza';
      } else if (cleanupConfianca >= 0.70) {
        // Confiança média - passar pelo agente de revisão
        console.log(`[QuestionCleanupService] Questão ${questionId} com confiança ${cleanupConfianca}, enviando para revisão...`);
        try {
          const reviewResult = await this.withTimeout(
            this.reviewCleanedQuestion(finalEnunciado, cleanResult.alternativas || []),
            30000, // 30 segundos para revisão
            'revisão com IA'
          );

          if (reviewResult.aprovada && reviewResult.confianca >= 0.80) {
            shouldReactivate = true;
            reviewInfo = `Aprovada na revisão: ${reviewResult.motivo}`;
          } else {
            reviewInfo = `Reprovada na revisão: ${reviewResult.motivo}`;
          }
        } catch (reviewError) {
          // Se a revisão falhar, não reativar mas salvar o conteúdo limpo
          reviewInfo = `Erro na revisão: ${reviewError instanceof Error ? reviewError.message : 'desconhecido'}`;
          console.warn(`[QuestionCleanupService] Erro na revisão da questão ${questionId}: ${reviewInfo}`);
        }
      } else {
        reviewInfo = 'Confiança muito baixa na limpeza';
      }

      // Atualizar no banco
      const { error: updateError } = await this.db
        .from('questoes_concurso')
        .update({
          enunciado: finalEnunciado,
          alternativas: cleanResult.alternativas,
          imagens_enunciado: allImages.length > 0
            ? `{${allImages.join(',')}}`
            : question.imagens_enunciado, // Preservar imagens existentes se houver
          ativo: shouldReactivate,
        })
        .eq('id', questionId);

      if (updateError) {
        return { success: false, action: 'error', details: updateError.message };
      }

      const actionMsg = shouldReactivate ? 'limpa e REATIVADA' : 'limpa (não reativada)';
      console.log(`[QuestionCleanupService] Questão ${questionId} ${actionMsg}. ${reviewInfo}`);

      return {
        success: true,
        action: shouldReactivate ? 'cleaned_reactivated' : 'cleaned_pending_review',
        details: `Confiança: ${cleanResult.confianca}, Tipo: ${cleanResult.tipoQuestao}, Imagens: ${allImages.length}, Reativada: ${shouldReactivate}`
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

    let reactivated = 0;
    let pendingReview = 0;
    let validationFailed = 0;

    // Buscar questões
    const questions = await this.getCorruptedQuestions(batchSize);
    stats.total = questions.length;

    console.log(`[QuestionCleanupService] Processando lote de ${questions.length} questões...`);

    for (const question of questions) {
      try {
        const result = await this.cleanAndUpdateQuestion(question.id);

        if (result.action === 'cleaned_reactivated') {
          stats.cleaned++;
          reactivated++;
        } else if (result.action === 'cleaned_pending_review') {
          stats.cleaned++;
          pendingReview++;
        } else if (result.action === 'validation_failed') {
          validationFailed++;
          stats.errors.push({ id: question.id, error: result.details || 'Falha na validação' });
        } else if (result.action === 'failed') {
          stats.failed++;
          stats.errors.push({ id: question.id, error: result.details || 'Falha desconhecida' });
        } else if (result.action === 'skipped') {
          stats.skipped++;
        } else if (result.action === 'error') {
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

    console.log(`[QuestionCleanupService] Lote concluído: ${stats.cleaned} limpas (${reactivated} reativadas, ${pendingReview} pendentes revisão), ${validationFailed} falhas validação, ${stats.failed} erros, ${stats.skipped} ignoradas`);
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
