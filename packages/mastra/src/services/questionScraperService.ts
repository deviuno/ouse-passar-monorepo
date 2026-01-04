import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
   * Insere ou atualiza uma questão
   */
  async upsertQuestion(question: ScrapedQuestion): Promise<boolean> {
    try {
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
        return false;
      }

      return true;
    } catch (err) {
      console.error(`[QuestionScraperService] Exceção ao inserir questão ${question.id}:`, err);
      return false;
    }
  }

  /**
   * Processa um lote de questões
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

    for (const question of questions) {
      try {
        // Verificar se já existe
        const exists = await this.checkExists(question.id);

        if (exists) {
          result.skipped++;
          result.details.skippedIds.push(question.id);
          continue;
        }

        // Inserir nova questão
        const success = await this.upsertQuestion(question);

        if (success) {
          result.inserted++;
          result.details.insertedIds.push(question.id);
        } else {
          result.errors++;
          result.details.errorIds.push({ id: question.id, error: 'Falha ao inserir' });
        }
      } catch (err) {
        result.errors++;
        result.details.errorIds.push({
          id: question.id,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`[QuestionScraperService] Processamento concluído: ${result.inserted} inseridas, ${result.skipped} ignoradas, ${result.errors} erros`);

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
}
