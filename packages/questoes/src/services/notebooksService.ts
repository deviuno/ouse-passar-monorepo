import { supabase } from "./supabase";
import { FilterOptions } from "../utils/filterUtils";

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  filters: FilterOptions;
  settings?: {
    questionCount?: number;
    studyMode?: "zen" | "hard";
    toggleFilters?: any;
  };
  questions_count?: number;
  saved_questions_count?: number;
  is_favorite: boolean;
  created_at: string;
}

export async function createNotebook(
  userId: string,
  title: string,
  filters: FilterOptions,
  settings: any,
  description?: string,
  questionsCount?: number
) {
  console.log("[notebooksService] createNotebook iniciando...", {
    userId,
    title,
    questionsCount,
  });

  try {
    const { data, error } = await supabase
      .from("cadernos")
      .insert({
        user_id: userId,
        title,
        description,
        filters,
        settings,
        questions_count: questionsCount,
      })
      .select()
      .single();

    console.log("[notebooksService] createNotebook resultado:", {
      data,
      error,
    });

    if (error) {
      console.error("[notebooksService] createNotebook erro:", error);
      throw error;
    }

    console.log("[notebooksService] createNotebook sucesso:", data?.id);
    return data as Notebook;
  } catch (err) {
    console.error("[notebooksService] createNotebook exceção:", err);
    throw err;
  }
}

export async function getUserNotebooks(userId: string) {
  const { data, error } = await supabase
    .from("cadernos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Notebook[];
}

export async function getNotebookFromId(notebookId: string, userId: string) {
  const { data, error } = await supabase
    .from("cadernos")
    .select("*")
    .eq("user_id", userId)
    .eq("id", notebookId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteNotebook(id: string) {
  const { error } = await supabase.from("cadernos").delete().eq("id", id);

  if (error) {
    console.error("Error deleting notebook:", error);
    return false;
  }
  return true;
}

export async function toggleFavoriteNotebook(id: string, isFavorite: boolean) {
  const { error } = await supabase
    .from("cadernos")
    .update({ is_favorite: isFavorite })
    .eq("id", id);

  if (error) throw error;
}

// ============================================
// SAVED QUESTIONS FUNCTIONS
// ============================================

export interface CadernoQuestao {
  id: string;
  caderno_id: string;
  questao_id: number;
  nota?: string;
  created_at: string;
}

/**
 * Add a question to a notebook
 */
export async function addQuestionToNotebook(
  cadernoId: string,
  questaoId: number,
  nota?: string
): Promise<CadernoQuestao> {
  const { data, error } = await supabase
    .from("caderno_questoes")
    .insert({
      caderno_id: cadernoId,
      questao_id: questaoId,
      nota: nota || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[notebooksService] addQuestionToNotebook erro:", error);
    throw error;
  }

  return data as CadernoQuestao;
}

/**
 * Remove a question from a notebook
 */
export async function removeQuestionFromNotebook(
  cadernoId: string,
  questaoId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("caderno_questoes")
    .delete()
    .eq("caderno_id", cadernoId)
    .eq("questao_id", questaoId);

  if (error) {
    console.error("[notebooksService] removeQuestionFromNotebook erro:", error);
    throw error;
  }

  return true;
}

/**
 * Get all notebooks that contain a specific question (for a user)
 */
export async function getNotebooksContainingQuestion(
  userId: string,
  questaoId: number
): Promise<string[]> {
  // First get user's notebooks
  const { data: notebooks, error: notebooksError } = await supabase
    .from("cadernos")
    .select("id")
    .eq("user_id", userId);

  if (notebooksError) throw notebooksError;
  if (!notebooks || notebooks.length === 0) return [];

  const notebookIds = notebooks.map((n) => n.id);

  // Then find which ones contain the question
  const { data: savedQuestions, error: savedError } = await supabase
    .from("caderno_questoes")
    .select("caderno_id")
    .in("caderno_id", notebookIds)
    .eq("questao_id", questaoId);

  if (savedError) throw savedError;

  return (savedQuestions || []).map((sq) => sq.caderno_id);
}

/**
 * Get all saved question IDs for a notebook
 */
export async function getNotebookSavedQuestionIds(
  cadernoId: string
): Promise<number[]> {
  const { data, error } = await supabase
    .from("caderno_questoes")
    .select("questao_id")
    .eq("caderno_id", cadernoId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[notebooksService] getNotebookSavedQuestionIds erro:", error);
    throw error;
  }

  return (data || []).map((item) => item.questao_id);
}

/**
 * Toggle question in notebook (add if not saved, remove if saved)
 */
export async function toggleQuestionInNotebook(
  cadernoId: string,
  questaoId: number,
  isSaved: boolean
): Promise<boolean> {
  if (isSaved) {
    await removeQuestionFromNotebook(cadernoId, questaoId);
    return false; // Now not saved
  } else {
    await addQuestionToNotebook(cadernoId, questaoId);
    return true; // Now saved
  }
}
