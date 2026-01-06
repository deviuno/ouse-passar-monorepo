const MASTRA_API_URL = import.meta.env.VITE_MASTRA_URL
  ? import.meta.env.VITE_MASTRA_URL
  : 'http://localhost:4000';

// ==================== TIPOS ====================

export interface QuestionGenerationParams {
  banca: string;
  materia: string;
  assunto?: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso';
  escolaridade: 'fundamental' | 'medio' | 'superior';
  quantidade: number;
  userId?: string;
}

export interface GeneratedAlternative {
  letter: string;
  text: string;
}

export interface GeneratedQuestion {
  id?: number;
  enunciado: string;
  alternativas: GeneratedAlternative[];
  gabarito: string;
  justificativa_gabarito: string;
  materia?: string;
  assunto?: string;
  banca?: string;
  generation_status?: 'pending' | 'published' | 'rejected' | 'active';
  is_ai_generated?: boolean;
  created_at?: string;
  comentario?: string;
}

export interface GenerationResult {
  success: boolean;
  questions: GeneratedQuestion[];
  totalGenerated: number;
  totalSaved: number;
  error?: string;
}

export interface GeneratedQuestionsListResult {
  success: boolean;
  questions: GeneratedQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export interface FiltersResult {
  success: boolean;
  bancas: string[];
  materias: string[];
  error?: string;
}

export interface AssuntosResult {
  success: boolean;
  assuntos: string[];
  error?: string;
}

// ==================== SERVICO ====================

export const questionGeneratorService = {
  /**
   * Gera novas questões usando IA
   */
  async generateQuestions(params: QuestionGenerationParams): Promise<GenerationResult> {
    const response = await fetch(`${MASTRA_API_URL}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerar questões');
    }

    return result;
  },

  /**
   * Gera comentário/explicação para uma questão
   */
  async generateComment(
    questionId: number | null,
    enunciado: string,
    alternativas: GeneratedAlternative[],
    gabarito: string
  ): Promise<string> {
    const response = await fetch(`${MASTRA_API_URL}/api/questions/generate-comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, enunciado, alternativas, gabarito }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerar comentário');
    }

    return result.comentario;
  },

  /**
   * Lista questões geradas por IA
   */
  async listGeneratedQuestions(
    status?: 'pending' | 'published' | 'rejected',
    page = 1,
    limit = 20
  ): Promise<GeneratedQuestionsListResult> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));

    const response = await fetch(`${MASTRA_API_URL}/api/questions/generated?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao listar questões');
    }

    return result;
  },

  /**
   * Atualiza uma questão gerada
   */
  async updateQuestion(id: number, updates: Partial<GeneratedQuestion>): Promise<GeneratedQuestion> {
    const response = await fetch(`${MASTRA_API_URL}/api/questions/generated/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao atualizar questão');
    }

    return result.question;
  },

  /**
   * Publica uma questão gerada
   */
  async publishQuestion(id: number): Promise<GeneratedQuestion> {
    const response = await fetch(`${MASTRA_API_URL}/api/questions/generated/${id}/publish`, {
      method: 'PUT',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao publicar questão');
    }

    return result.question;
  },

  /**
   * Exclui ou rejeita uma questão gerada
   */
  async deleteQuestion(id: number, softDelete = true): Promise<void> {
    const response = await fetch(
      `${MASTRA_API_URL}/api/questions/generated/${id}?softDelete=${softDelete}`,
      { method: 'DELETE' }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao excluir questão');
    }
  },

  /**
   * Busca opções de filtros disponíveis
   */
  async getFilters(): Promise<FiltersResult> {
    const response = await fetch(`${MASTRA_API_URL}/api/questions/filters`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar filtros');
    }

    return result;
  },

  /**
   * Busca assuntos por matéria
   */
  async getAssuntos(materia: string, banca?: string): Promise<AssuntosResult> {
    const params = new URLSearchParams();
    params.set('materia', materia);
    if (banca) params.set('banca', banca);

    const response = await fetch(`${MASTRA_API_URL}/api/questions/assuntos?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar assuntos');
    }

    return result;
  },
};

export default questionGeneratorService;
