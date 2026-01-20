import { useState, useCallback, useEffect } from 'react';
import { Caderno, PracticeMode } from '../types';
import {
  createNotebook,
  getUserNotebooks,
  deleteNotebook,
  getNotebookFromId,
} from '../services/notebooksService';
import { supabase } from '../services/supabase';
import { FilterOptions, ToggleFilters } from '../utils/filterUtils';

export interface NotebookSettings {
  questionCount: number;
  studyMode: PracticeMode;
}

export interface UseNotebooksOptions {
  userId?: string;
}

export interface UseNotebooksReturn {
  // State
  notebooks: Caderno[];
  editingNotebook: Caderno | null;
  editingTitle: string;
  editingDescription: string;
  isSavingNotebook: boolean;
  notebookSettings: Record<string, NotebookSettings>;

  // Actions
  loadNotebooks: () => Promise<void>;
  saveNotebook: (
    name: string,
    description: string,
    filters: FilterOptions,
    settings: {
      questionCount: number;
      studyMode: PracticeMode;
      toggleFilters: ToggleFilters;
    },
    questionsCount: number
  ) => Promise<Caderno | null>;
  updateNotebook: (
    notebookId: string,
    title: string,
    description: string,
    filters: FilterOptions,
    settings: {
      questionCount: number;
      studyMode: PracticeMode;
      toggleFilters: ToggleFilters;
    },
    questionsCount: number
  ) => Promise<boolean>;
  handleDeleteNotebook: (id: string) => Promise<boolean>;
  getNotebookById: (notebookId: string) => Promise<Caderno | null>;

  // Editing
  startEditing: (notebook: Caderno) => void;
  cancelEditing: () => void;
  setEditingTitle: React.Dispatch<React.SetStateAction<string>>;
  setEditingDescription: React.Dispatch<React.SetStateAction<string>>;

  // Settings
  updateNotebookSettings: (
    notebookId: string,
    settings: Partial<NotebookSettings>
  ) => void;
  setNotebookSettings: React.Dispatch<
    React.SetStateAction<Record<string, NotebookSettings>>
  >;

  // Setters for external control
  setNotebooks: React.Dispatch<React.SetStateAction<Caderno[]>>;
  setEditingNotebook: React.Dispatch<React.SetStateAction<Caderno | null>>;
  setIsSavingNotebook: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook to manage notebooks (cadernos) state and operations
 */
export function useNotebooks(
  options: UseNotebooksOptions = {}
): UseNotebooksReturn {
  const { userId } = options;

  // State
  const [notebooks, setNotebooks] = useState<Caderno[]>([]);
  const [editingNotebook, setEditingNotebook] = useState<Caderno | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isSavingNotebook, setIsSavingNotebook] = useState(false);
  const [notebookSettings, setNotebookSettings] = useState<
    Record<string, NotebookSettings>
  >({});

  const loadNotebooks = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getUserNotebooks(userId);
      setNotebooks(data);

      // Initialize editable settings for each notebook
      const initialSettings: Record<string, NotebookSettings> = {};
      data.forEach((notebook) => {
        initialSettings[notebook.id] = {
          questionCount: notebook.settings?.questionCount || 120,
          studyMode: notebook.settings?.studyMode || 'zen',
        };
      });
      setNotebookSettings(initialSettings);
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    }
  }, [userId]);

  const saveNotebook = useCallback(
    async (
      name: string,
      description: string,
      filters: FilterOptions,
      settings: {
        questionCount: number;
        studyMode: PracticeMode;
        toggleFilters: ToggleFilters;
      },
      questionsCount: number
    ): Promise<Caderno | null> => {
      if (!userId || !name.trim()) return null;

      setIsSavingNotebook(true);
      try {
        const newNotebook = await createNotebook(
          userId,
          name,
          filters,
          settings,
          description.trim() || undefined,
          questionsCount
        );

        if (newNotebook) {
          await loadNotebooks();
        }

        return newNotebook;
      } catch (error) {
        console.error('Erro ao salvar caderno:', error);
        return null;
      } finally {
        setIsSavingNotebook(false);
      }
    },
    [userId, loadNotebooks]
  );

  const updateNotebook = useCallback(
    async (
      notebookId: string,
      title: string,
      description: string,
      filters: FilterOptions,
      settings: {
        questionCount: number;
        studyMode: PracticeMode;
        toggleFilters: ToggleFilters;
      },
      questionsCount: number
    ): Promise<boolean> => {
      if (!userId || !title.trim()) return false;

      setIsSavingNotebook(true);
      try {
        const { error } = await supabase
          .from('cadernos')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            filters,
            settings,
            questions_count: questionsCount,
          })
          .eq('id', notebookId);

        if (error) throw error;

        await loadNotebooks();
        return true;
      } catch (error) {
        console.error('Erro ao atualizar caderno:', error);
        return false;
      } finally {
        setIsSavingNotebook(false);
      }
    },
    [userId, loadNotebooks]
  );

  const handleDeleteNotebook = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await deleteNotebook(id);
      if (success) {
        setNotebooks((prev) => prev.filter((n) => n.id !== id));
      }
      return success;
    },
    []
  );

  const getNotebookById = useCallback(
    async (notebookId: string): Promise<Caderno | null> => {
      if (!userId) return null;
      try {
        return await getNotebookFromId(notebookId, userId);
      } catch (error) {
        console.error('Erro ao buscar caderno:', error);
        return null;
      }
    },
    [userId]
  );

  const startEditing = useCallback((notebook: Caderno) => {
    setEditingNotebook(notebook);
    setEditingTitle(notebook.title);
    setEditingDescription(notebook.description || '');
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingNotebook(null);
    setEditingTitle('');
    setEditingDescription('');
  }, []);

  const updateNotebookSettings = useCallback(
    (notebookId: string, settings: Partial<NotebookSettings>) => {
      setNotebookSettings((prev) => ({
        ...prev,
        [notebookId]: {
          ...prev[notebookId],
          ...settings,
        },
      }));
    },
    []
  );

  // Load notebooks when userId changes
  useEffect(() => {
    if (userId) {
      loadNotebooks();
    }
  }, [userId, loadNotebooks]);

  return {
    // State
    notebooks,
    editingNotebook,
    editingTitle,
    editingDescription,
    isSavingNotebook,
    notebookSettings,

    // Actions
    loadNotebooks,
    saveNotebook,
    updateNotebook,
    handleDeleteNotebook,
    getNotebookById,

    // Editing
    startEditing,
    cancelEditing,
    setEditingTitle,
    setEditingDescription,

    // Settings
    updateNotebookSettings,
    setNotebookSettings,

    // Setters for external control
    setNotebooks,
    setEditingNotebook,
    setIsSavingNotebook,
  };
}
