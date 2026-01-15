import { supabase } from "./supabase";
import { FilterOptions } from "../pages/PracticePage"; // Will be defined in page

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
