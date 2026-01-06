import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  validateAndSanitizeQuestion,
  detectCorruptedHTML,
  QuestionValidationResult,
} from '../utils/htmlValidator.js';

// Interface para alternativas
interface Alternative {
  letter: string;
  text: string;
}

// Interface para detalhes da questão
interface QuestionDetails {
  ano?: number;
  órgão?: string;
  cargo_área_especialidade_edição?: string;
  prova?: string;
  banca?: string;
}

// Interface para questão recebida do scraper
export interface ScrapedQuestion {
  id: string;
  materia: string;
  assunto: string;
  concurso: string;
  imagens_enunciado: string[];
  enunciado: string;
  alternativas: Alternative[];
  gabarito: string | null;
  comentario: string | null;
  detalhes: QuestionDetails;
  extracted_at?: string;
  imagens_comentario?: string[];
}

// Interface para payload do scraper
export interface ScraperPayload {
  timestamp: string;
  total_questions: number;
  source: string;
  account: string;
  data: ScrapedQuestion[];
}

// Interface para resultado do processamento
export interface ProcessingResult {
  inserted: number;
  skipped: number;
  errors: number;
  details: {
    insertedIds: string[];
    skippedIds: string[];
    errorIds: { id: string; error: string }[];
  };
}

export class QuestionScraperService {
  private db: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.db = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Verifica se uma questão já existe no banco
   */
  async checkExists(id: string): Promise<boolean> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('id')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`[QuestionScraperService] Erro ao verificar existência do ID ${id}:`, error);
    }

    return !!data;
  }

  /**
   * Valida o conteúdo de uma questão
   */
  validateQuestion(question: ScrapedQuestion): QuestionValidationResult {
    return validateAndSanitizeQuestion(
      question.enunciado,
      question.alternativas,
      question.comentario
    );
  }

  /**
   * Insere ou atualiza uma questão (com validação e sanitização)
   */
  async upsertQuestion(question: ScrapedQuestion, skipValidation: boolean = false): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
    try {
      // Validar e sanitizar conteúdo
      if (!skipValidation) {
        const validation = this.validateQuestion(question);

        if (!validation.isValid) {
          console.warn(`[QuestionScraperService] Questão ${question.id} rejeitada: ${validation.errors.join(', ')}`);
          return { success: false, error: validation.errors.join(', '), skipped: true };
        }

        // Usar conteúdo sanitizado
        question.enunciado = validation.sanitizedEnunciado;
        question.alternativas = validation.sanitizedAlternativas;
        if (validation.sanitizedComentario !== null) {
          question.comentario = validation.sanitizedComentario;
        }

        // Log warnings
        if (validation.warnings.length > 0) {
          console.log(`[QuestionScraperService] Questão ${question.id} sanitizada: ${validation.warnings.join(', ')}`);
        }
      }

      const { error } = await this.db
        .from('questoes_concurso')
        .upsert({
          id: parseInt(question.id),
          materia: question.materia,
          assunto: question.assunto,
          concurso: question.concurso,
          enunciado: question.enunciado,
          alternativas: question.alternativas,
          gabarito: question.gabarito,
          comentario: question.comentario,
          ano: question.detalhes?.ano || null,
          orgao: question.detalhes?.órgão || null,
          cargo_area_especialidade_edicao: question.detalhes?.cargo_área_especialidade_edição || null,
          prova: question.detalhes?.prova || null,
          banca: question.detalhes?.banca || null,
          imagens_enunciado: question.imagens_enunciado?.length > 0
            ? `{${question.imagens_enunciado.join(',')}}`
            : null,
          imagens_comentario: question.imagens_comentario && question.imagens_comentario.length > 0
            ? question.imagens_comentario
            : null,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`[QuestionScraperService] Erro ao inserir questão ${question.id}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error(`[QuestionScraperService] Exceção ao inserir questão ${question.id}:`, err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  /**
   * Processa um lote de questões (com validação)
   */
  async processBatch(questions: ScrapedQuestion[]): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      inserted: 0,
      skipped: 0,
      errors: 0,
      details: {
        insertedIds: [],
        skippedIds: [],
        errorIds: [],
      },
    };

    let validationRejected = 0;

    for (const question of questions) {
      try {
        // Verificar se já existe
        const exists = await this.checkExists(question.id);

        if (exists) {
          result.skipped++;
          result.details.skippedIds.push(question.id);
          continue;
        }

        // Inserir nova questão (com validação)
        const insertResult = await this.upsertQuestion(question);

        if (insertResult.success) {
          result.inserted++;
          result.details.insertedIds.push(question.id);
        } else if (insertResult.skipped) {
          // Rejeitada pela validação
          validationRejected++;
          result.details.errorIds.push({ id: question.id, error: `Validação: ${insertResult.error}` });
        } else {
          result.errors++;
          result.details.errorIds.push({ id: question.id, error: insertResult.error || 'Falha ao inserir' });
        }
      } catch (err) {
        result.errors++;
        result.details.errorIds.push({
          id: question.id,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`[QuestionScraperService] Processamento concluído: ${result.inserted} inseridas, ${result.skipped} duplicadas, ${validationRejected} rejeitadas por validação, ${result.errors} erros`);

    return result;
  }

  /**
   * Lista todos os IDs de questões existentes
   */
  async getAllIds(): Promise<string[]> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('id')
      .order('id', { ascending: false });

    if (error) {
      console.error('[QuestionScraperService] Erro ao listar IDs:', error);
      return [];
    }

    return data?.map(row => String(row.id)) || [];
  }

  /**
   * Busca uma questão por ID
   */
  async getQuestionById(id: string): Promise<ScrapedQuestion | null> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[QuestionScraperService] Erro ao buscar questão ${id}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Busca questões com imagens pendentes de processamento
   */
  async getQuestionsWithPendingImages(limit: number = 100): Promise<any[]> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('*')
      .not('imagens_enunciado', 'is', null)
      .neq('imagens_enunciado', '{}')
      .is('imagens_enunciado_local', null)
      .limit(limit);

    if (error) {
      console.error('[QuestionScraperService] Erro ao buscar questões com imagens pendentes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Atualiza questão com URLs locais das imagens
   */
  async updateQuestionWithLocalImages(questionId: string, localUrls: string[]): Promise<boolean> {
    const { error } = await this.db
      .from('questoes_concurso')
      .update({
        imagens_enunciado_local: `{${localUrls.join(',')}}`,
      })
      .eq('id', questionId);

    if (error) {
      console.error(`[QuestionScraperService] Erro ao atualizar imagens locais da questão ${questionId}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Busca questões não revisadas (para IA revisar)
   */
  async getUnreviewedQuestions(limit: number = 100): Promise<any[]> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('*')
      .is('questao_revisada', null)
      .not('gabarito', 'is', null)
      .limit(limit);

    if (error) {
      console.error('[QuestionScraperService] Erro ao buscar questões não revisadas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Atualiza questão com gabarito e comentário da IA
   */
  async updateQuestionReview(
    questionId: string,
    gabarito: string,
    comentario: string
  ): Promise<boolean> {
    const { error } = await this.db
      .from('questoes_concurso')
      .update({
        gabarito,
        comentario,
        questao_revisada: true,
      })
      .eq('id', questionId);

    if (error) {
      console.error(`[QuestionScraperService] Erro ao atualizar revisão da questão ${questionId}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Busca questões potencialmente corrompidas (para limpeza)
   * Procura por padrões de HTML corrompido no enunciado
   */
  async findCorruptedQuestions(limit: number = 100): Promise<any[]> {
    // Busca questões que contêm padrões de AngularJS corrompido
    const patterns = [
      '%ng-if%',
      '%ng-repeat%',
      '%ng-model%',
      '%ng-click%',
      '%ng-scope%',
      '%<!-- ngIf%',
      '%<!-- ngRepeat%',
      '%vm.questao%',
      '%aria-labelledby%',
    ];

    const queries = patterns.map(pattern =>
      this.db
        .from('questoes_concurso')
        .select('id, enunciado, alternativas, comentario')
        .ilike('enunciado', pattern)
        .limit(Math.ceil(limit / patterns.length))
    );

    const results = await Promise.all(queries);
    const allCorrupted = results.flatMap(r => r.data || []);

    // Remove duplicates by id
    const uniqueIds = new Set<string>();
    const uniqueQuestions = allCorrupted.filter(q => {
      if (uniqueIds.has(q.id)) return false;
      uniqueIds.add(q.id);
      return true;
    });

    return uniqueQuestions.slice(0, limit);
  }

  /**
   * Tenta sanitizar e atualizar uma questão corrompida
   */
  async sanitizeAndUpdateQuestion(questionId: string): Promise<{ success: boolean; action: 'updated' | 'deactivated' | 'error'; details?: string }> {
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

      // Validar e sanitizar
      const validation = validateAndSanitizeQuestion(
        question.enunciado,
        question.alternativas,
        question.comentario
      );

      if (!validation.isValid) {
        // Se não é possível sanitizar, desativar a questão
        const { error: updateError } = await this.db
          .from('questoes_concurso')
          .update({ ativo: false })
          .eq('id', questionId);

        if (updateError) {
          return { success: false, action: 'error', details: updateError.message };
        }

        return { success: true, action: 'deactivated', details: validation.errors.join(', ') };
      }

      // Atualizar com conteúdo sanitizado
      const { error: updateError } = await this.db
        .from('questoes_concurso')
        .update({
          enunciado: validation.sanitizedEnunciado,
          alternativas: validation.sanitizedAlternativas,
          comentario: validation.sanitizedComentario,
        })
        .eq('id', questionId);

      if (updateError) {
        return { success: false, action: 'error', details: updateError.message };
      }

      return { success: true, action: 'updated', details: validation.warnings.join(', ') };
    } catch (err) {
      return { success: false, action: 'error', details: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  /**
   * Executa limpeza em lote de questões corrompidas
   */
  async cleanupCorruptedQuestions(batchSize: number = 50): Promise<{ updated: number; deactivated: number; errors: number }> {
    const result = { updated: 0, deactivated: 0, errors: 0 };

    const corrupted = await this.findCorruptedQuestions(batchSize);
    console.log(`[QuestionScraperService] Encontradas ${corrupted.length} questões potencialmente corrompidas`);

    for (const question of corrupted) {
      const cleanupResult = await this.sanitizeAndUpdateQuestion(question.id);

      if (cleanupResult.action === 'updated') {
        result.updated++;
      } else if (cleanupResult.action === 'deactivated') {
        result.deactivated++;
        console.log(`[QuestionScraperService] Questão ${question.id} desativada: ${cleanupResult.details}`);
      } else {
        result.errors++;
        console.error(`[QuestionScraperService] Erro ao processar questão ${question.id}: ${cleanupResult.details}`);
      }
    }

    console.log(`[QuestionScraperService] Limpeza concluída: ${result.updated} atualizadas, ${result.deactivated} desativadas, ${result.errors} erros`);
    return result;
  }
}
