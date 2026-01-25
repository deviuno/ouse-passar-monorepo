/**
 * User Content Service - Serviço para conteúdos gerados por IA do usuário
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type ContentType = 'audio_explanation' | 'podcast' | 'text_summary' | 'music';

export interface UserGeneratedContent {
  id: string;
  user_id: string;
  preparatorio_id: string | null;
  content_type: ContentType;
  title: string;
  materia: string | null;
  assunto: string | null;
  audio_url: string | null;
  text_content: string | null;
  duration_seconds: number | null;
  question_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateContentParams {
  userId: string;
  preparatorioId?: string;
  contentType: ContentType;
  title: string;
  materia?: string;
  assunto?: string;
  audioUrl?: string;
  textContent?: string;
  durationSeconds?: number;
  questionId?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

export const userContentService = {
  /**
   * Lista todos os conteúdos do usuário
   */
  async getAll(userId: string): Promise<UserGeneratedContent[]> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Lista conteúdos por tipo
   */
  async getByType(userId: string, contentType: ContentType): Promise<UserGeneratedContent[]> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .select('*')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Conta conteúdos por tipo
   */
  async countByType(userId: string): Promise<Record<ContentType, number>> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .select('content_type')
      .eq('user_id', userId);

    if (error) throw error;

    const counts: Record<ContentType, number> = {
      audio_explanation: 0,
      podcast: 0,
      text_summary: 0,
      music: 0,
    };

    (data || []).forEach((item) => {
      const type = item.content_type as ContentType;
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  },

  /**
   * Busca um conteúdo específico
   */
  async getById(id: string, userId: string): Promise<UserGeneratedContent | null> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Cria um novo registro de conteúdo
   */
  async create(params: CreateContentParams): Promise<UserGeneratedContent> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .insert({
        user_id: params.userId,
        preparatorio_id: params.preparatorioId || null,
        content_type: params.contentType,
        title: params.title,
        materia: params.materia || null,
        assunto: params.assunto || null,
        audio_url: params.audioUrl || null,
        text_content: params.textContent || null,
        duration_seconds: params.durationSeconds || null,
        question_id: params.questionId || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deleta um conteúdo
   */
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_generated_content')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Verifica se um conteúdo similar já existe (evitar duplicatas)
   */
  async exists(
    userId: string,
    contentType: ContentType,
    title: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_generated_content')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('title', title)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  },
};

export default userContentService;
