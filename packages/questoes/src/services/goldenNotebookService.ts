import { supabase } from "./supabase";

// ============================================
// TYPES
// ============================================

export interface GoldenNotebook {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  anotacoes_count: number;
  created_at: string;
  updated_at: string;
}

export interface GoldenAnnotation {
  id: string;
  caderno_id: string;
  user_id: string;
  question_id?: number;
  titulo?: string;
  conteudo: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateNotebookInput {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
}

export interface CreateAnnotationInput {
  caderno_id: string;
  question_id?: number;
  titulo?: string;
  conteudo: string;
  tags?: string[];
}

// ============================================
// NOTEBOOKS CRUD
// ============================================

/**
 * Get all golden notebooks for a user
 */
export async function getUserGoldenNotebooks(userId: string): Promise<GoldenNotebook[]> {
  const { data, error } = await supabase
    .from("cadernos_ouro")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[goldenNotebookService] getUserGoldenNotebooks erro:", error);
    throw error;
  }

  return data as GoldenNotebook[];
}

/**
 * Get a single golden notebook by ID
 */
export async function getGoldenNotebook(notebookId: string, userId: string): Promise<GoldenNotebook | null> {
  const { data, error } = await supabase
    .from("cadernos_ouro")
    .select("*")
    .eq("id", notebookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[goldenNotebookService] getGoldenNotebook erro:", error);
    throw error;
  }

  return data as GoldenNotebook | null;
}

/**
 * Create a new golden notebook
 */
export async function createGoldenNotebook(
  userId: string,
  input: CreateNotebookInput
): Promise<GoldenNotebook> {
  const { data, error } = await supabase
    .from("cadernos_ouro")
    .insert({
      user_id: userId,
      nome: input.nome,
      descricao: input.descricao || null,
      cor: input.cor || "#F59E0B",
      icone: input.icone || "book",
    })
    .select()
    .single();

  if (error) {
    console.error("[goldenNotebookService] createGoldenNotebook erro:", error);
    throw error;
  }

  return data as GoldenNotebook;
}

/**
 * Update a golden notebook
 */
export async function updateGoldenNotebook(
  notebookId: string,
  userId: string,
  updates: Partial<CreateNotebookInput>
): Promise<GoldenNotebook> {
  const { data, error } = await supabase
    .from("cadernos_ouro")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notebookId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[goldenNotebookService] updateGoldenNotebook erro:", error);
    throw error;
  }

  return data as GoldenNotebook;
}

/**
 * Delete a golden notebook (cascade deletes annotations)
 */
export async function deleteGoldenNotebook(notebookId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("cadernos_ouro")
    .delete()
    .eq("id", notebookId)
    .eq("user_id", userId);

  if (error) {
    console.error("[goldenNotebookService] deleteGoldenNotebook erro:", error);
    return false;
  }

  return true;
}

// ============================================
// ANNOTATIONS CRUD
// ============================================

/**
 * Get all annotations for a notebook
 */
export async function getNotebookAnnotations(
  notebookId: string,
  userId: string
): Promise<GoldenAnnotation[]> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .select("*")
    .eq("caderno_id", notebookId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[goldenNotebookService] getNotebookAnnotations erro:", error);
    throw error;
  }

  return data as GoldenAnnotation[];
}

/**
 * Get a single annotation by ID
 */
export async function getAnnotation(annotationId: string, userId: string): Promise<GoldenAnnotation | null> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .select("*")
    .eq("id", annotationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[goldenNotebookService] getAnnotation erro:", error);
    throw error;
  }

  return data as GoldenAnnotation | null;
}

/**
 * Create a new annotation
 */
export async function createAnnotation(
  userId: string,
  input: CreateAnnotationInput
): Promise<GoldenAnnotation> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .insert({
      user_id: userId,
      caderno_id: input.caderno_id,
      question_id: input.question_id || null,
      titulo: input.titulo || null,
      conteudo: input.conteudo,
      tags: input.tags || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[goldenNotebookService] createAnnotation erro:", error);
    throw error;
  }

  return data as GoldenAnnotation;
}

/**
 * Update an annotation
 */
export async function updateAnnotation(
  annotationId: string,
  userId: string,
  updates: Partial<Omit<CreateAnnotationInput, "caderno_id">>
): Promise<GoldenAnnotation> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", annotationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[goldenNotebookService] updateAnnotation erro:", error);
    throw error;
  }

  return data as GoldenAnnotation;
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("anotacoes_ouro")
    .delete()
    .eq("id", annotationId)
    .eq("user_id", userId);

  if (error) {
    console.error("[goldenNotebookService] deleteAnnotation erro:", error);
    return false;
  }

  return true;
}

// ============================================
// SEARCH / STATS
// ============================================

/**
 * Search annotations across all notebooks
 */
export async function searchAnnotations(
  userId: string,
  searchTerm: string
): Promise<(GoldenAnnotation & { caderno_nome: string })[]> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .select(`
      *,
      cadernos_ouro!inner(nome)
    `)
    .eq("user_id", userId)
    .or(`titulo.ilike.%${searchTerm}%,conteudo.ilike.%${searchTerm}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[goldenNotebookService] searchAnnotations erro:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    caderno_nome: item.cadernos_ouro?.nome || "",
  }));
}

/**
 * Get total stats for golden notebooks
 */
export async function getGoldenNotebookStats(userId: string): Promise<{
  totalNotebooks: number;
  totalAnnotations: number;
}> {
  const { data: notebooks, error: notebooksError } = await supabase
    .from("cadernos_ouro")
    .select("id, anotacoes_count")
    .eq("user_id", userId);

  if (notebooksError) {
    console.error("[goldenNotebookService] getGoldenNotebookStats erro:", notebooksError);
    throw notebooksError;
  }

  const totalNotebooks = notebooks?.length || 0;
  const totalAnnotations = notebooks?.reduce((acc, n) => acc + (n.anotacoes_count || 0), 0) || 0;

  return { totalNotebooks, totalAnnotations };
}

/**
 * Get annotations for a specific question
 */
export async function getQuestionAnnotations(
  userId: string,
  questionId: number
): Promise<(GoldenAnnotation & { caderno_nome: string })[]> {
  const { data, error } = await supabase
    .from("anotacoes_ouro")
    .select(`
      *,
      cadernos_ouro!inner(nome)
    `)
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[goldenNotebookService] getQuestionAnnotations erro:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    caderno_nome: item.cadernos_ouro?.nome || "",
  }));
}
