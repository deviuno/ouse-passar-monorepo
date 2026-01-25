import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  Zap,
  Loader2,
  CheckCircle,
  Save,
  PenLine,
} from "lucide-react";
import { Button, ConfirmModal } from "../components/ui";
import { BatteryEmptyModal } from "../components/battery";
import { QuestionCard } from "../components/question";
import QuestionErrorBoundary from "../components/question/QuestionErrorBoundary";
import { MentorChat } from "../components/question/MentorChat";
import { FloatingChatButton } from "../components/ui";
import { ParsedQuestion, PracticeMode } from "../types";
import { MOCK_QUESTIONS } from "../constants";
import {
  useUserStore,
  useUIStore,
  useBatteryStore,
  useTrailStore,
} from "../stores";
import { useAuthStore } from "../stores/useAuthStore";
import {
  fetchQuestions,
  fetchQuestionsByIds,
  parseRawQuestion,
} from "../services/questionsService";
import {
  EditalSidebar,
  SaveNotebookModal,
  ViewNotebookFiltersModal,
  PracticeFilterPanel,
  StudySettingsCard,
  NotebookEditForm,
  EditTimerModal,
} from "../components/practice";
import { Caderno } from "../types";
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
  getQuestionIdsByDifficulty,
} from "../services/questionFeedbackService";
import { createPracticeSession } from "../services/practiceSessionService";
import { getNotebookSavedQuestionIds } from "../services/notebooksService";
import { SessionResultsScreen } from "../components/practice/SessionResultsScreen";
import {
  getGamificationSettings,
  GamificationSettings,
} from "../services/gamificationSettingsService";
import { isOuseQuestoesSubscriber } from "../services/subscriptionService";

// Import extracted hooks
import {
  usePracticeFilters,
  useQuestionCount,
  useFilterOptions,
  useNotebooks,
  FilterOptions,
  ToggleFilters,
} from "../hooks";

// Import utility functions
import { normalizeFilters, normalizeToggleFilters, countActiveFilters } from "../utils/filterUtils";
import {
  calculateXPReward,
  calculateCoinsReward,
} from "../utils/practiceUtils";

export default function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, fetchProfile, updateProfile } = useAuthStore();
  const { incrementStats } = useUserStore();
  const { addToast, setPracticeMode, clearPracticeMode } = useUIStore();
  const { selectedPreparatorioId, getSelectedPreparatorio, userPreparatorios } =
    useTrailStore();
  const {
    isEmptyModalOpen,
    closeEmptyModal,
    consumeBattery,
  } = useBatteryStore();

  // Query params
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebook_id") || "";
  const isFromNotebook = !!notebookId;
  const trailPreparatorioId = searchParams.get("preparatorioId");
  const editalItemTitle = searchParams.get("editalItemTitle");
  const preparatorioSlug = searchParams.get("preparatorioSlug");
  const idsParam = searchParams.get("ids");
  const practiceSource = searchParams.get("source"); // 'errors' when coming from MyErrorsPage

  // Auto-start refs
  const autoStartTriggeredRef = React.useRef(false);
  const idsAutoStartTriggeredRef = React.useRef(false);
  const [autoStartPending, setAutoStartPending] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("autostart") === "true";
  });
  const [shouldAutoStart, setShouldAutoStart] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    // Don't auto-start if notebook_id is present - notebook loading will handle it
    const hasNotebookId = params.has("notebook_id");
    if (hasNotebookId) return false;

    const hasFilterParams =
      params.has("materia") ||
      params.has("materias") ||
      params.has("assunto") ||
      params.has("assuntos") ||
      params.has("banca") ||
      params.has("autostart") ||
      params.has("editNotebook");
    const showFiltersOnly = params.get("showFilters") === "true" && !hasFilterParams;
    return !hasFilterParams || showFiltersOnly;
  });

  // Mode state
  const [mode, setMode] = useState<"selection" | "practicing" | "results">("selection");
  const [isLoading, setIsLoading] = useState(false);

  // Subscriber status
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Session timing
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Practice session state
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(new Map());
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [showMentorChat, setShowMentorChat] = useState(false);

  // Study settings
  const [questionCount, setQuestionCount] = useState(120);
  const [studyMode, setStudyMode] = useState<PracticeMode>("zen");

  // Gamification settings
  const [gamificationSettings, setGamificationSettings] = useState<GamificationSettings | null>(null);

  // UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [deleteNotebookConfirm, setDeleteNotebookConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("showFilters") === "true";
  });
  const [showPracticingFilters, setShowPracticingFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("showFilters") === "true";
  });
  const [showEditalSidebar, setShowEditalSidebar] = useState(false);
  const [showSaveNotebookModal, setShowSaveNotebookModal] = useState(false);
  const [showEditTimerModal, setShowEditTimerModal] = useState(false);
  const [isSavingTimer, setIsSavingTimer] = useState(false);
  const [viewingNotebookFilters, setViewingNotebookFilters] = useState<Caderno | null>(null);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newNotebookDescription, setNewNotebookDescription] = useState("");
  const [activeNotebookName, setActiveNotebookName] = useState<string | null>(null);

  // Use extracted hooks
  const {
    filters,
    toggleFilters,
    setFilters,
    setToggleFilters,
    toggleFilter,
    toggleToggleFilter,
    clearFilters,
    totalFilters,
  } = usePracticeFilters();

  const {
    availableMaterias,
    availableAssuntos,
    availableBancas,
    availableOrgaos,
    availableCargos,
    availableAnos,
    globalTaxonomy,
    taxonomyByMateria,
    isLoadingFilters,
    isLoadingTaxonomy,
    isLoadingAssuntos,
    totalQuestions,
    usingMockData,
    updateAssuntosByMaterias,
    updateTaxonomyByMaterias,
    setTaxonomyByMateria,
    setAvailableAssuntos,
  } = useFilterOptions();

  const { filteredCount, isLoadingCount, setFilteredCount } = useQuestionCount({
    filters,
    toggleFilters,
    totalQuestions,
    usingMockData,
  });

  const {
    notebooks,
    editingNotebook,
    editingTitle,
    editingDescription,
    isSavingNotebook,
    notebookSettings,
    loadNotebooks,
    saveNotebook,
    updateNotebook,
    handleDeleteNotebook,
    getNotebookById,
    startEditing,
    cancelEditing,
    setEditingTitle,
    setEditingDescription,
    setNotebookSettings,
    setEditingNotebook,
    setIsSavingNotebook,
  } = useNotebooks({ userId: user?.id });

  // Load gamification settings
  useEffect(() => {
    const loadGamificationSettings = async () => {
      try {
        const settings = await getGamificationSettings();
        setGamificationSettings(settings);
      } catch (error) {
        console.error("[PracticePage] Error loading gamification settings:", error);
      }
    };
    loadGamificationSettings();
  }, []);

  // Check subscriber status
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.id) {
        const subscriberStatus = await isOuseQuestoesSubscriber(user.id);
        setIsSubscriber(subscriberStatus);
      }
    };
    checkSubscription();
  }, [user?.id]);

  // Sync showFilters with URL param
  useEffect(() => {
    const showFiltersParam = searchParams.get("showFilters");
    if (showFiltersParam === "true") {
      setShowFilters(true);
    }
  }, [searchParams]);

  // Update taxonomy when materias change
  useEffect(() => {
    updateTaxonomyByMaterias(filters.materia, globalTaxonomy);
  }, [filters.materia, globalTaxonomy, updateTaxonomyByMaterias]);

  // Load assuntos when materias change
  useEffect(() => {
    if (availableMaterias.length > 0) {
      updateAssuntosByMaterias(filters.materia);
    }
  }, [filters.materia, availableMaterias, updateAssuntosByMaterias]);

  // Filter assuntos that no longer exist
  useEffect(() => {
    if (filters.materia.length > 0 && availableAssuntos.length > 0) {
      setFilters((prev) => ({
        ...prev,
        assunto: prev.assunto.filter((a) => availableAssuntos.includes(a)),
      }));
    }
  }, [availableAssuntos, filters.materia.length, setFilters]);

  // Sync practice mode with UIStore
  useEffect(() => {
    if (mode === "practicing") {
      // Determine title and back path based on context
      let title = editalItemTitle;
      let backPath = preparatorioSlug ? `/trilhas/${preparatorioSlug}` : null;

      if (activeNotebookName) {
        title = activeNotebookName;
        backPath = "/cadernos";
      }

      setPracticeMode({
        isActive: true,
        correctCount: sessionStats.correct,
        wrongCount: sessionStats.total - sessionStats.correct,
        showFilters: showPracticingFilters,
        onBack: handleBack,
        onToggleFilters: () => {
          setShowPracticingFilters((prev) => !prev);
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.querySelector(".lg\\:overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
        },
        isTrailMode: !!trailPreparatorioId,
        onToggleEdital: () => setShowEditalSidebar((prev) => !prev),
        title,
        backPath,
      });
    } else {
      clearPracticeMode();
    }
  }, [mode, sessionStats, showPracticingFilters, trailPreparatorioId, editalItemTitle, preparatorioSlug, activeNotebookName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPracticeMode();
    };
  }, [clearPracticeMode]);

  // Start question timer
  useEffect(() => {
    if (mode === "practicing" && questions.length > 0) {
      setQuestionStartTime(Date.now());
    }
  }, [mode, currentIndex, questions.length]);

  // Process query params for filters
  useEffect(() => {
    const materiaParam = searchParams.get("materia");
    const materiasParam = searchParams.get("materias");
    const assuntoParam = searchParams.get("assunto");
    const assuntosParam = searchParams.get("assuntos");
    const bancaParam = searchParams.get("banca");
    const autostart = searchParams.get("autostart");

    let newMaterias: string[] = [];
    let newAssuntos: string[] = [];

    if (materiasParam) {
      try {
        newMaterias = JSON.parse(materiasParam);
      } catch (e) {
        console.error("[PracticePage] Erro ao parsear materias:", e);
      }
    } else if (materiaParam) {
      newMaterias = [materiaParam];
    }

    if (assuntosParam) {
      try {
        newAssuntos = JSON.parse(assuntosParam);
      } catch (e) {
        console.error("[PracticePage] Erro ao parsear assuntos:", e);
      }
    } else if (assuntoParam) {
      newAssuntos = [assuntoParam];
    }

    if (newMaterias.length > 0 || newAssuntos.length > 0 || bancaParam) {
      setFilters((prev) => ({
        ...prev,
        materia: newMaterias.length > 0 ? newMaterias : prev.materia,
        assunto: newAssuntos.length > 0 ? newAssuntos : prev.assunto,
        banca: bancaParam ? [bancaParam] : prev.banca,
      }));

      if (autostart === "true") {
        setAutoStartPending(true);
      }
    }
  }, [searchParams, setFilters]);

  // Process editNotebook param
  useEffect(() => {
    const editNotebookId = searchParams.get("editNotebook");
    if (!editNotebookId || notebooks.length === 0 || editingNotebook) return;

    const notebookToEdit = notebooks.find((nb) => nb.id === editNotebookId);
    if (notebookToEdit) {
      if (notebookToEdit.filters) setFilters(normalizeFilters(notebookToEdit.filters));
      if (notebookToEdit.settings?.toggleFilters) setToggleFilters(normalizeToggleFilters(notebookToEdit.settings.toggleFilters));
      if (notebookToEdit.settings?.questionCount) setQuestionCount(notebookToEdit.settings.questionCount);
      if (notebookToEdit.settings?.studyMode) setStudyMode(notebookToEdit.settings.studyMode as PracticeMode);

      startEditing(notebookToEdit);
      setShowFilters(true);
    }
  }, [searchParams, notebooks, editingNotebook, setFilters, setToggleFilters, startEditing]);

  // Auto-start with filters (skip if loading from notebook)
  useEffect(() => {
    if (isFromNotebook) return; // Notebook loading will handle it
    if (!autoStartPending || autoStartTriggeredRef.current) return;
    if (isLoadingFilters || isLoadingCount) return;

    const materiaParam = searchParams.get("materia");
    const materiasParam = searchParams.get("materias");
    const assuntoParam = searchParams.get("assunto");
    const assuntosParam = searchParams.get("assuntos");
    const bancaParam = searchParams.get("banca");

    const hasFilterParams = materiaParam || materiasParam || assuntoParam || assuntosParam || bancaParam;

    if (!hasFilterParams) {
      autoStartTriggeredRef.current = true;
      startPractice();
      return;
    }

    let expectedMaterias: string[] = [];
    let expectedAssuntos: string[] = [];

    if (materiasParam) {
      try { expectedMaterias = JSON.parse(materiasParam); } catch (e) { /* ignore */ }
    } else if (materiaParam) {
      expectedMaterias = [materiaParam];
    }

    if (assuntosParam) {
      try { expectedAssuntos = JSON.parse(assuntosParam); } catch (e) { /* ignore */ }
    } else if (assuntoParam) {
      expectedAssuntos = [assuntoParam];
    }

    const filtersApplied =
      (expectedMaterias.length === 0 || expectedMaterias.every((m) => filters.materia.includes(m))) &&
      (expectedAssuntos.length === 0 || expectedAssuntos.every((a) => filters.assunto.includes(a))) &&
      (!bancaParam || filters.banca.includes(bancaParam));

    if (filtersApplied) {
      autoStartTriggeredRef.current = true;
      startPractice();
    }
  }, [autoStartPending, isLoadingFilters, isLoadingCount, filters, searchParams, isFromNotebook]);

  // Auto-start without filters (skip if loading from notebook)
  useEffect(() => {
    if (isFromNotebook) return; // Notebook loading will handle it
    if (shouldAutoStart && !isLoadingFilters && !isLoadingCount && mode === "selection" && !isLoading) {
      setShouldAutoStart(false);
      startPractice();
    }
  }, [shouldAutoStart, isLoadingFilters, isLoadingCount, mode, isLoading, isFromNotebook]);

  // Reset autoStartPending
  useEffect(() => {
    if (mode === "practicing" && autoStartPending) {
      setAutoStartPending(false);
      autoStartTriggeredRef.current = false;
    }
  }, [mode, autoStartPending]);

  // Auto-start when specific IDs are provided (e.g., from MyErrorsPage)
  useEffect(() => {
    if (!idsParam || idsAutoStartTriggeredRef.current) return;
    if (isLoadingFilters || isLoadingCount || mode !== "selection") return;

    console.log('[PracticePage] Auto-starting with IDs from source:', practiceSource);
    idsAutoStartTriggeredRef.current = true;
    startPractice();
  }, [idsParam, isLoadingFilters, isLoadingCount, mode, practiceSource]);

  // Reset state on route change
  useEffect(() => {
    setMode("selection");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setSessionStats({ correct: 0, total: 0 });
    setSessionStartTime(null);

    const params = new URLSearchParams(window.location.search);
    // Don't auto-start if notebook_id is present - notebook loading will handle it
    const hasNotebookId = params.has("notebook_id");
    if (hasNotebookId) {
      setShouldAutoStart(false);
      return;
    }
    const hasFilterParams =
      params.has("materia") || params.has("materias") || params.has("assunto") ||
      params.has("assuntos") || params.has("banca") || params.has("autostart");
    setShouldAutoStart(!hasFilterParams);
  }, [location.pathname]);

  // Load notebook from URL
  useEffect(() => {
    const loadNotebook = async () => {
      if (!user?.id || !notebookId) return;
      try {
        const notebook = await getNotebookById(notebookId);
        if (notebook) {
          await handleStartFromNotebook(notebook);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadNotebook();
  }, [notebookId, user?.id]);

  // Handler functions
  const handleSaveNotebook = async () => {
    if (!user?.id || !newNotebookName.trim()) return;

    setIsSavingNotebook(true);
    try {
      const prep = getSelectedPreparatorio();
      const prepIdToUse = prep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;

      if (prepIdToUse && !isSubscriber) {
        const batteryResult = await consumeBattery(user.id, prepIdToUse, "notebook_create", {
          notebook_name: newNotebookName,
        });
        if (!batteryResult.success && batteryResult.error === "insufficient_battery") {
          setIsSavingNotebook(false);
          return;
        }
      }

      const questionsCount = filteredCount > 0 ? filteredCount : totalQuestions;
      const newNotebook = await saveNotebook(
        newNotebookName,
        newNotebookDescription,
        filters,
        { questionCount, studyMode, toggleFilters },
        questionsCount
      );

      if (newNotebook) {
        setShowSaveNotebookModal(false);
        setNewNotebookName("");
        setNewNotebookDescription("");
        addToast("success", "Caderno salvo com sucesso!");
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("[PracticePage] handleSaveNotebook erro:", error);
      addToast("error", "Erro ao salvar caderno.");
    } finally {
      setIsSavingNotebook(false);
    }
  };

  const handleEditNotebookFilters = (notebook: Caderno) => {
    if (notebook.filters) setFilters(normalizeFilters(notebook.filters));
    if (notebook.settings?.toggleFilters) setToggleFilters(normalizeToggleFilters(notebook.settings.toggleFilters));

    const settings = notebookSettings[notebook.id];
    if (settings) {
      setQuestionCount(settings.questionCount);
      setStudyMode(settings.studyMode);
    }

    startEditing(notebook);
    setViewingNotebookFilters(null);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    cancelEditing();
    clearFilters();
  };

  const handleSaveEditedNotebook = async (andStart: boolean = false) => {
    if (!user?.id || !editingNotebook || !editingTitle.trim()) return;

    const questionsCount = filteredCount > 0 ? filteredCount : totalQuestions;
    const success = await updateNotebook(
      editingNotebook.id,
      editingTitle,
      editingDescription,
      filters,
      { questionCount, studyMode, toggleFilters },
      questionsCount
    );

    if (success) {
      addToast("success", "Caderno atualizado com sucesso!");
      if (andStart) {
        const currentFilters = { ...filters };
        const currentToggleFilters = { ...toggleFilters };
        cancelEditing();
        await startPractice(currentFilters, currentToggleFilters);
      } else {
        cancelEditing();
      }
    } else {
      addToast("error", "Erro ao atualizar caderno.");
    }
  };

  const handleStartFromNotebook = async (notebook: Caderno, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    setActiveNotebookName(notebook.title);

    try {
      const notebookFilters = normalizeFilters(notebook.filters);
      const notebookToggleFilters = normalizeToggleFilters(notebook.settings?.toggleFilters);

      setFilters(notebookFilters);
      setToggleFilters(notebookToggleFilters);

      const settings = notebookSettings[notebook.id] || {
        questionCount: notebook.settings?.questionCount || 120,
        studyMode: (notebook.settings?.studyMode as PracticeMode) || 'zen',
      };
      setQuestionCount(settings.questionCount);
      setStudyMode(settings.studyMode);

      const hasSavedQuestions = (notebook.saved_questions_count || 0) > 0;
      const hasFilters = Object.values(notebookFilters).some(
        (v) => Array.isArray(v) && v.length > 0
      );

      let allQuestions: ParsedQuestion[] = [];

      // Fetch saved questions if any
      if (hasSavedQuestions) {
        const savedQuestionIds = await getNotebookSavedQuestionIds(notebook.id);
        if (savedQuestionIds.length > 0) {
          const savedQuestions = await fetchQuestionsByIds(savedQuestionIds);
          allQuestions = [...savedQuestions];
          console.log('[PracticePage] Saved questions loaded:', savedQuestions.length);
        }
      }

      // Fetch filter-based questions if there are filters
      if (hasFilters) {
        const remainingCount = Math.max(0, settings.questionCount - allQuestions.length);

        if (remainingCount > 0) {
          const filterQuestions = await fetchQuestions({
            materias: notebookFilters.materia.length > 0 ? notebookFilters.materia : undefined,
            assuntos: notebookFilters.assunto.length > 0 ? notebookFilters.assunto : undefined,
            bancas: notebookFilters.banca.length > 0 ? notebookFilters.banca : undefined,
            orgaos: notebookFilters.orgao.length > 0 ? notebookFilters.orgao : undefined,
            cargos: notebookFilters.cargo.length > 0 ? notebookFilters.cargo : undefined,
            anos: notebookFilters.ano.length > 0 ? notebookFilters.ano.map(Number) : undefined,
            escolaridade: notebookFilters.escolaridade.length > 0 ? notebookFilters.escolaridade : undefined,
            modalidade: notebookFilters.modalidade.length > 0 ? notebookFilters.modalidade : undefined,
            dificuldade: notebookFilters.dificuldade.length > 0 ? notebookFilters.dificuldade : undefined,
            apenasRevisadas: notebookToggleFilters.apenasRevisadas || undefined,
            apenasComComentario: notebookToggleFilters.apenasComComentario || undefined,
            apenasIneditasOuse: notebookToggleFilters.apenasIneditasOuse || undefined,
            limit: remainingCount + allQuestions.length,
            shuffle: true,
          });

          // Remove duplicates (questions already in saved list)
          const savedIds = new Set(allQuestions.map((q) => q.id));
          const uniqueFilterQuestions = filterQuestions.filter((q) => !savedIds.has(q.id));

          allQuestions = [...allQuestions, ...uniqueFilterQuestions.slice(0, remainingCount)];
          console.log('[PracticePage] Filter questions added:', uniqueFilterQuestions.slice(0, remainingCount).length);
        }
      }

      console.log('[PracticePage] Total questions for notebook:', allQuestions.length);

      if (allQuestions.length === 0) {
        addToast('info', 'Nenhuma questão encontrada neste caderno');
        setIsLoading(false);
        return;
      }

      // Limit to question count (saved questions are already first, filter questions follow)
      const finalQuestions = allQuestions.slice(0, settings.questionCount);

      setQuestions(finalQuestions);
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setSessionStartTime(Date.now());
      setMode("practicing");
    } catch (error) {
      console.error('[PracticePage] Error starting from notebook:', error);
      addToast('error', 'Erro ao carregar questões do caderno');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteNotebook = async () => {
    if (!deleteNotebookConfirm) return;
    const success = await handleDeleteNotebook(deleteNotebookConfirm);
    if (success) {
      addToast("success", "Caderno excluído.");
    }
    setDeleteNotebookConfirm(null);
  };

  const startPractice = async (
    overrideFilters?: FilterOptions,
    overrideToggleFilters?: ToggleFilters
  ) => {
    setIsLoading(true);

    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Ensure filters are always normalized to prevent undefined errors
    const activeFilters = normalizeFilters(overrideFilters || filters);
    const activeToggleFilters = normalizeToggleFilters(overrideToggleFilters || toggleFilters);

    try {
      const isTrailMode = !!trailPreparatorioId;

      let subscriberStatus = isSubscriber;
      if (!subscriberStatus && user?.id) {
        subscriberStatus = await isOuseQuestoesSubscriber(user.id);
        if (subscriberStatus) setIsSubscriber(true);
      }

      if (!isTrailMode && !subscriberStatus) {
        const selectedPrep = getSelectedPreparatorio();
        const prepIdToUse = selectedPrep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;

        if (user?.id && prepIdToUse) {
          const batteryResult = await consumeBattery(user.id, prepIdToUse, "practice_session", {
            question_count: questionCount,
          });
          if (!batteryResult.success && batteryResult.error === "insufficient_battery") {
            setIsLoading(false);
            return;
          }
        }
      }

      let questionsToUse: ParsedQuestion[] = [];

      // If specific question IDs are provided (e.g., from MyErrorsPage), fetch only those
      if (idsParam) {
        const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        console.log('[PracticePage] Fetching specific question IDs:', ids.length);
        if (ids.length > 0) {
          questionsToUse = await fetchQuestionsByIds(ids);
          console.log('[PracticePage] Fetched', questionsToUse.length, 'questions by IDs');
        }
      } else if (activeFilters.questionId) {
        // If a specific question ID is provided via filter (admin feature)
        const questionId = parseInt(activeFilters.questionId, 10);
        if (!isNaN(questionId)) {
          console.log('[PracticePage] Fetching specific question ID from filter:', questionId);
          questionsToUse = await fetchQuestionsByIds([questionId]);
          console.log('[PracticePage] Fetched', questionsToUse.length, 'questions by filter ID');
        }
      } else if (usingMockData) {
        let filtered = [...MOCK_QUESTIONS];
        if (activeFilters.materia.length > 0) {
          filtered = filtered.filter((q) => activeFilters.materia.includes(q.materia));
        }
        if (activeFilters.banca.length > 0) {
          filtered = filtered.filter((q) => activeFilters.banca.includes(q.banca));
        }
        if (activeFilters.ano.length > 0) {
          filtered = filtered.filter((q) => activeFilters.ano.includes(String(q.ano)));
        }
        if (filtered.length === 0) filtered = [...MOCK_QUESTIONS];
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        questionsToUse = shuffled.slice(0, Math.min(questionCount, shuffled.length)).map(parseRawQuestion);
      } else {
        const dbQuestions = await fetchQuestions({
          materias: activeFilters.materia.length > 0 ? activeFilters.materia : undefined,
          assuntos: activeFilters.assunto.length > 0 ? activeFilters.assunto : undefined,
          bancas: activeFilters.banca.length > 0 ? activeFilters.banca : undefined,
          orgaos: activeFilters.orgao.length > 0 ? activeFilters.orgao : undefined,
          cargos: activeFilters.cargo.length > 0 ? activeFilters.cargo : undefined,
          anos: activeFilters.ano.length > 0 ? activeFilters.ano.map(Number) : undefined,
          escolaridade: activeFilters.escolaridade.length > 0 ? activeFilters.escolaridade : undefined,
          modalidade: activeFilters.modalidade.length > 0 ? activeFilters.modalidade : undefined,
          dificuldade: activeFilters.dificuldade.length > 0 ? activeFilters.dificuldade : undefined,
          apenasRevisadas: activeToggleFilters.apenasRevisadas || undefined,
          apenasComComentario: activeToggleFilters.apenasComComentario || undefined,
          apenasIneditasOuse: activeToggleFilters.apenasIneditasOuse || undefined,
          limit: isTrailMode ? 500 : questionCount,
          shuffle: true,
        });

        if (dbQuestions.length > 0) {
          const activeDifficultyFilters: DifficultyRating[] = [];
          if (activeToggleFilters.facil) activeDifficultyFilters.push("easy");
          if (activeToggleFilters.medio) activeDifficultyFilters.push("medium");
          if (activeToggleFilters.dificil) activeDifficultyFilters.push("hard");

          if (activeDifficultyFilters.length > 0 && user?.id) {
            const difficultyIds = await getQuestionIdsByDifficulty(user.id, activeDifficultyFilters);
            const allDifficultyIds = [...difficultyIds.userRated, ...difficultyIds.communityRated];

            if (allDifficultyIds.length > 0) {
              const difficultyIdSet = new Set(allDifficultyIds);
              const filteredByDifficulty = dbQuestions.filter((q) => difficultyIdSet.has(q.id));

              const userRatedSet = new Set(difficultyIds.userRated);
              filteredByDifficulty.sort((a, b) => {
                const aIsUserRated = userRatedSet.has(a.id) ? 0 : 1;
                const bIsUserRated = userRatedSet.has(b.id) ? 0 : 1;
                return aIsUserRated - bIsUserRated;
              });

              questionsToUse = filteredByDifficulty.length > 0 ? filteredByDifficulty : dbQuestions;
            } else {
              questionsToUse = dbQuestions;
            }
          } else {
            questionsToUse = dbQuestions;
          }
        } else if (isTrailMode) {
          addToast("error", "Nenhuma questão encontrada para este tópico. Verifique os filtros do edital.");
          setIsLoading(false);
          return;
        } else {
          addToast("info", "Nenhuma questao encontrada. Usando questoes de exemplo.");
          const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
          questionsToUse = shuffled.slice(0, questionCount).map(parseRawQuestion);
        }
      }

      setQuestions(questionsToUse);
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setSessionStartTime(Date.now());
      setMode("practicing");
    } catch (error) {
      console.error("Erro ao carregar questoes:", error);
      if (trailPreparatorioId) {
        addToast("error", "Erro ao carregar questões. Tente novamente.");
        setIsLoading(false);
        return;
      }
      addToast("error", "Erro ao carregar questoes. Usando questoes de exemplo.");
      const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, questionCount).map(parseRawQuestion));
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setSessionStartTime(Date.now());
      setMode("practicing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (letter: string, clickX?: number, clickY?: number) => {
    const question = questions[currentIndex];
    const isCorrect = letter === question.gabarito;

    const timeSpentSeconds = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : null;

    setAnswers(new Map(answers.set(question.id, { letter, correct: isCorrect })));
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (!trailPreparatorioId && !isSubscriber) {
      try {
        const prep = getSelectedPreparatorio();
        const prepIdToUse = prep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;
        if (user?.id && prepIdToUse) {
          await consumeBattery(user.id, prepIdToUse, "question", {
            question_id: question.id.toString(), clickX, clickY,
          });
        }
      } catch (error) {
        console.error("[PracticePage] Erro ao consumir bateria:", error);
      }
    }

    const xpReward = calculateXPReward(isCorrect, studyMode, gamificationSettings);
    const coinsReward = calculateCoinsReward(isCorrect, studyMode, gamificationSettings);

    incrementStats({
      correctAnswers: isCorrect ? 1 : 0,
      totalAnswered: 1,
      xp: xpReward,
      coins: coinsReward,
    });

    saveUserAnswer(
      { questionId: question.id, selectedAlternative: letter, isCorrect, timeSpentSeconds: timeSpentSeconds || undefined },
      user?.id
    );
  };

  const handleRateDifficulty = (difficulty: DifficultyRating) => {
    const question = questions[currentIndex];
    if (user?.id) {
      saveDifficultyRating(question.id, difficulty, user.id);
    }
  };

  const handleNext = async () => {
    setShowPracticingFilters(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
      const isHardMode = studyMode === "hard";
      const xpPerCorrect = gamificationSettings
        ? isHardMode ? gamificationSettings.xp_per_correct_hard_mode : gamificationSettings.xp_per_correct_answer
        : isHardMode ? 100 : 50;
      const xpEarned = sessionStats.correct * xpPerCorrect;

      try {
        if (user?.id) {
          await createPracticeSession({
            user_id: user.id,
            study_mode: studyMode,
            total_questions: sessionStats.total,
            correct_answers: sessionStats.correct,
            wrong_answers: sessionStats.total - sessionStats.correct,
            time_spent_seconds: timeSpent,
            filters: { ...filters, toggleFilters },
            xp_earned: xpEarned,
          });
          await fetchProfile();
        }
      } catch (error) {
        console.error("[PracticePage] Erro ao salvar sessão:", error);
      }

      setMode("results");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Na primeira questão, scroll para o topo e abrir filtros
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector(".lg\\:overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
      setShowFilters(true);
    }
  };

  const handleBackToSelection = () => {
    // If practicing from a notebook, navigate back to notebooks page
    if (activeNotebookName) {
      setActiveNotebookName(null);
      navigate("/cadernos");
      return;
    }

    setMode("selection");
    setShowFilters(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".lg\\:overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (mode === "practicing") {
      if (answers.size > 0) {
        setShowExitConfirm(true);
      } else {
        handleBackToSelection();
      }
    }
  };

  const handleTimeout = async () => {
    addToast("error", "Tempo esgotado!");

    // No modo simulado, quando o tempo acaba, vai direto para os resultados
    // independentemente de quantas questões foram respondidas
    const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    const xpPerCorrect = gamificationSettings
      ? gamificationSettings.xp_per_correct_hard_mode
      : 100;
    const xpEarned = sessionStats.correct * xpPerCorrect;

    try {
      if (user?.id) {
        await createPracticeSession({
          user_id: user.id,
          study_mode: studyMode,
          total_questions: sessionStats.total,
          correct_answers: sessionStats.correct,
          wrong_answers: sessionStats.total - sessionStats.correct,
          time_spent_seconds: timeSpent,
          filters: { ...filters, toggleFilters },
          xp_earned: xpEarned,
        });
        await fetchProfile();
      }
    } catch (error) {
      console.error("[PracticePage] Erro ao salvar sessão após timeout:", error);
    }

    setMode("results");
  };

  const handleSaveTimer = async (minutes: number) => {
    if (!user?.id) return;

    setIsSavingTimer(true);
    try {
      await updateProfile({ simulado_timer_minutes: minutes });
      addToast("success", "Tempo do cronômetro atualizado!");
      setShowEditTimerModal(false);
    } catch (error) {
      console.error("[PracticePage] Erro ao salvar tempo:", error);
      addToast("error", "Erro ao salvar configuração de tempo.");
    } finally {
      setIsSavingTimer(false);
    }
  };

  const handleShowToast = (message: string, type: "success" | "error" | "info") => {
    addToast(type, message);
  };

  const currentQuestion = questions[currentIndex];

  // ==========================================
  // RENDER: PRACTICING MODE
  // ==========================================
  if (mode === "practicing" && currentQuestion) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--color-bg-main)] flex flex-col theme-transition">
        {/* Practicing Filters Panel */}
        <AnimatePresence>
          {showPracticingFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-main)] theme-transition"
            >
              <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Filter size={18} className="text-[var(--color-brand)]" />
                    <h3 className="text-base font-bold text-[var(--color-text-main)]">Filtrar Questões</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={clearFilters} className="text-xs text-[var(--color-error)] hover:underline font-medium">
                      Limpar Filtros
                    </button>
                    <button
                      onClick={() => setShowPracticingFilters(false)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Filter Panel */}
                <PracticeFilterPanel
                  filters={filters}
                  toggleFilters={toggleFilters}
                  availableMaterias={availableMaterias}
                  availableAssuntos={availableAssuntos}
                  availableBancas={availableBancas}
                  availableOrgaos={availableOrgaos}
                  availableCargos={availableCargos}
                  availableAnos={availableAnos}
                  taxonomyByMateria={taxonomyByMateria}
                  isLoadingAssuntos={isLoadingAssuntos}
                  isLoadingTaxonomy={isLoadingTaxonomy}
                  onToggleFilter={toggleFilter}
                  onSetFilters={setFilters}
                  onToggleToggleFilter={toggleToggleFilter}
                  onSetToggleFilters={setToggleFilters}
                  showDificuldade={true}
                  showQuestionIdFilter={profile?.role === 'admin' || profile?.show_answers || false}
                />

                {/* Summary + Actions */}
                <StudySettingsCard
                  filteredCount={filteredCount}
                  totalFilters={totalFilters}
                  questionCount={questionCount}
                  studyMode={studyMode}
                  isLoadingCount={isLoadingCount}
                  onQuestionCountChange={setQuestionCount}
                  onStudyModeChange={setStudyMode}
                />

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveNotebookModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] font-bold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-brand)] transition-colors whitespace-nowrap text-sm lg:text-base lg:px-5"
                    >
                      <Save size={16} className="lg:w-[18px] lg:h-[18px] flex-shrink-0" />
                      <span className="truncate">Salvar Caderno</span>
                    </button>
                    <button
                      onClick={() => { setShowPracticingFilters(false); startPractice(); }}
                      disabled={isLoading || filteredCount === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-[#ffac00] text-black font-bold rounded-xl hover:bg-[#ffbc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm lg:text-base lg:px-6"
                    >
                      {isLoading ? (
                        <><Loader2 size={16} className="animate-spin flex-shrink-0" /><span className="truncate">Carregando...</span></>
                      ) : (
                        <><Play size={16} className="lg:w-[18px] lg:h-[18px] flex-shrink-0" /><span className="truncate">Iniciar Treino</span></>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPracticingFilters(false)}
                    className="flex items-center justify-center gap-2 py-2 text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] font-medium transition-colors text-sm"
                  >
                    <ChevronUp size={16} /> Ocultar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Area */}
        <div className="flex-1">
          <div className="max-w-[1000px] mx-auto h-full">
            <QuestionErrorBoundary questionId={currentQuestion?.id} onSkip={handleNext} onRetry={() => {}}>
              <QuestionCard
                question={currentQuestion}
                isLastQuestion={currentIndex === questions.length - 1}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onOpenTutor={() => setShowMentorChat(true)}
                onAnswer={handleAnswer}
                onRateDifficulty={handleRateDifficulty}
                onTimeout={studyMode === "hard" ? handleTimeout : undefined}
                studyMode={studyMode}
                initialTime={studyMode === "hard" ? (profile?.simulado_timer_minutes || 120) : undefined}
                userId={user?.id}
                userRole={profile?.role}
                showCorrectAnswers={profile?.show_answers || false}
                onShowToast={handleShowToast}
                onEditTimer={studyMode === "hard" ? () => setShowEditTimerModal(true) : undefined}
              />
            </QuestionErrorBoundary>
          </div>
        </div>

        {/* Mentor Chat */}
        <MentorChat
          isVisible={showMentorChat}
          onClose={() => setShowMentorChat(false)}
          contentContext={{
            title: currentQuestion.assunto || currentQuestion.materia,
            text: currentQuestion.enunciado,
            question: currentQuestion,
          }}
          userContext={{ name: user?.user_metadata?.name }}
          userId={user?.id}
          preparatorioId={getSelectedPreparatorio()?.preparatorio_id || userPreparatorios[0]?.preparatorio_id}
          checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes || userPreparatorios[0]?.preparatorio?.checkout_ouse_questoes}
        />

        <FloatingChatButton
          isOpen={showMentorChat}
          onClick={() => setShowMentorChat(!showMentorChat)}
          sidebarWidth={0}
          isChatVisible={showMentorChat}
        />

        <ConfirmModal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setActiveNotebookName(null);
            navigate(activeNotebookName ? "/cadernos" : "/questoes");
          }}
          title="Sair da Prática?"
          message="Você tem progresso não salvo. Se sair agora, suas respostas serão perdidas."
          confirmText="Sair"
          cancelText="Continuar"
          variant="danger"
          icon="exit"
        />

        {trailPreparatorioId && (
          <EditalSidebar
            isOpen={showEditalSidebar}
            onClose={() => setShowEditalSidebar(false)}
            preparatorioId={trailPreparatorioId}
            banca={filters.banca[0]}
            currentAssuntos={filters.assunto}
            preparatorioSlug={preparatorioSlug || undefined}
          />
        )}

        <SaveNotebookModal
          isOpen={showSaveNotebookModal}
          onClose={() => setShowSaveNotebookModal(false)}
          onSave={handleSaveNotebook}
          notebookName={newNotebookName}
          onNotebookNameChange={setNewNotebookName}
          notebookDescription={newNotebookDescription}
          onNotebookDescriptionChange={setNewNotebookDescription}
          totalFilters={totalFilters}
          filteredCount={filteredCount}
          questionCount={questionCount}
          isSaving={isSavingNotebook}
          isLoadingCount={isLoadingCount}
        />

        <EditTimerModal
          isOpen={showEditTimerModal}
          onClose={() => setShowEditTimerModal(false)}
          currentMinutes={profile?.simulado_timer_minutes || 120}
          onSave={handleSaveTimer}
          isSaving={isSavingTimer}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: RESULTS MODE
  // ==========================================
  if (mode === "results") {
    const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    const xpEarned = sessionStats.correct * 10 + sessionStats.total * 2;
    return (
      <SessionResultsScreen
        totalQuestions={sessionStats.total}
        correctAnswers={sessionStats.correct}
        wrongAnswers={sessionStats.total - sessionStats.correct}
        studyMode={studyMode}
        timeSpent={timeSpent}
        xpEarned={xpEarned}
        onNewSession={startPractice}
        onBackToMenu={handleBackToSelection}
      />
    );
  }

  // ==========================================
  // RENDER: LOADING STATE
  // ==========================================
  const showFiltersParam = searchParams.get("showFilters") === "true";
  const editNotebookParam = searchParams.get("editNotebook");
  if (isLoadingFilters || isLoadingCount || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center font-sans text-[var(--color-text-main)] theme-transition">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">Carregando questões...</h2>
          <p className="text-[var(--color-text-sec)]">Preparando sua sessão de prática</p>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDER: SELECTION MODE (Dashboard)
  // ==========================================
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-2 py-4 md:p-8 lg:p-12 font-sans text-[var(--color-text-main)] theme-transition">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {editingNotebook ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg">
                  <PenLine size={24} className="text-[var(--color-brand)]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--color-text-main)] to-[var(--color-text-sec)] bg-clip-text text-transparent">
                  Edição - {editingNotebook.title}
                </h1>
              </div>
              <p className="text-sm md:text-base text-[var(--color-text-sec)] font-medium">
                Edite os parâmetros do seu caderno e depois clique em Salvar.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-[var(--color-text-main)] to-[var(--color-text-sec)] bg-clip-text text-transparent">
                Painel de Prática
              </h1>
              <p className="text-sm md:text-base text-[var(--color-text-sec)] font-medium">
                Configure seu treino de questões.
              </p>
            </>
          )}
        </motion.div>

        {/* User Quick Stats + Filter Toggle (Desktop) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-6 bg-[var(--color-bg-card)]/50 border border-[var(--color-border)] p-3 rounded-2xl backdrop-blur-sm theme-transition">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg">
                <Zap size={20} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider">Nível</p>
                <p className="font-bold text-lg leading-none">{profile?.level || 1}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--color-border)]" />
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-[var(--color-success)]/10 rounded-lg">
                <CheckCircle size={20} className="text-[var(--color-success)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider">Acertos</p>
                <p className="font-bold text-lg leading-none">{profile?.correct_answers || 0}</p>
              </div>
            </div>
          </div>

          {trailPreparatorioId ? (
            <button
              onClick={() => setShowEditalSidebar(true)}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all backdrop-blur-sm bg-[var(--color-bg-card)]/50 border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] theme-transition"
            >
              <ChevronLeft size={18} className="text-[var(--color-brand)]" />
              <div className="text-left">
                <p className="text-xs uppercase font-bold tracking-wider opacity-70">Ver</p>
                <p className="font-bold text-lg leading-none">Edital</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all backdrop-blur-sm theme-transition ${
                showFilters
                  ? "bg-[#ffac00] hover:bg-[#ffbc33] border-[#ffac00] hover:border-[#ffbc33] text-black"
                  : "bg-[var(--color-bg-card)]/50 border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              }`}
            >
              <div className={`p-2 rounded-lg ${showFilters ? "bg-black/10" : "bg-[var(--color-brand)]/10"}`}>
                <Filter size={20} className={showFilters ? "text-black" : "text-[var(--color-brand)]"} />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase font-bold tracking-wider opacity-70">{showFilters ? "Ocultar" : "Exibir"}</p>
                <p className="font-bold text-lg leading-none">Filtros</p>
              </div>
              {totalFilters > 0 && (
                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${showFilters ? "bg-black/20 text-black" : "bg-[#ffac00] hover:bg-[#ffbc33] text-black"}`}>
                  {totalFilters}
                </span>
              )}
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </motion.div>

        {/* Mobile Filter Toggle */}
        {trailPreparatorioId ? (
          <button
            onClick={() => setShowEditalSidebar(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-main)] theme-transition"
          >
            <ChevronLeft size={16} className="text-[var(--color-brand)]" />
            <span className="font-bold text-sm">Ver Edital</span>
          </button>
        ) : (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all theme-transition ${
              showFilters
                ? "bg-[#ffac00] hover:bg-[#ffbc33] border-[#ffac00] hover:border-[#ffbc33] text-black"
                : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-main)]"
            }`}
          >
            <Filter size={16} />
            <span className="font-bold text-sm">{showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}</span>
            {totalFilters > 0 && !showFilters && (
              <span className="px-1.5 py-0.5 bg-[#ffac00] text-black text-xs font-bold rounded">{totalFilters}</span>
            )}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Editing: Title and Description */}
        {editingNotebook && (
          <NotebookEditForm
            title={editingTitle}
            description={editingDescription}
            onTitleChange={setEditingTitle}
            onDescriptionChange={setEditingDescription}
          />
        )}

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider flex items-center gap-2">
                  <Filter size={14} /> Filtros
                </h3>
                <button onClick={clearFilters} className="text-xs text-[var(--color-error)] hover:underline font-medium">
                  Limpar Filtros
                </button>
              </div>

              <PracticeFilterPanel
                filters={filters}
                toggleFilters={toggleFilters}
                availableMaterias={availableMaterias}
                availableAssuntos={availableAssuntos}
                availableBancas={availableBancas}
                availableOrgaos={availableOrgaos}
                availableCargos={availableCargos}
                availableAnos={availableAnos}
                taxonomyByMateria={taxonomyByMateria}
                isLoadingAssuntos={isLoadingAssuntos}
                isLoadingTaxonomy={isLoadingTaxonomy}
                onToggleFilter={toggleFilter}
                onSetFilters={setFilters}
                onToggleToggleFilter={toggleToggleFilter}
                onSetToggleFilters={setToggleFilters}
                showQuestionIdFilter={profile?.role === 'admin' || profile?.show_answers || false}
              />

              {/* Summary Section with Actions */}
              <StudySettingsCard
                filteredCount={filteredCount}
                totalFilters={totalFilters}
                questionCount={questionCount}
                studyMode={studyMode}
                isLoadingCount={isLoadingCount}
                onQuestionCountChange={setQuestionCount}
                onStudyModeChange={setStudyMode}
                title={editingNotebook ? "Parâmetros do Caderno" : "Resumo do Treino"}
                className="mt-6"
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                {editingNotebook ? (
                  <>
                    <Button
                      size="lg"
                      onClick={() => handleSaveEditedNotebook(false)}
                      disabled={isSavingNotebook || isLoadingFilters || !editingTitle.trim()}
                      className="flex-1 bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-black font-extrabold hover:shadow-lg hover:shadow-[var(--color-brand)]/20 transition-all transform hover:scale-[1.02]"
                      leftIcon={<Save size={20} />}
                    >
                      {isSavingNotebook ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => handleSaveEditedNotebook(true)}
                      disabled={isSavingNotebook || isLoadingFilters || filteredCount === 0 || !editingTitle.trim()}
                      className="flex-1"
                      rightIcon={<Play size={18} fill="currentColor" />}
                    >
                      Salvar e Iniciar
                    </Button>
                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="lg" onClick={() => setShowFilters(false)} className="whitespace-nowrap" leftIcon={<ChevronUp size={18} />}>
                      Ocultar
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setShowSaveNotebookModal(true)} className="flex-1 whitespace-nowrap" leftIcon={<Save size={18} />}>
                      Salvar como Caderno
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => startPractice()}
                      disabled={isLoading || isLoadingFilters || filteredCount === 0}
                      className="flex-1 sm:flex-[2] whitespace-nowrap bg-gradient-to-r from-[#ffac00] to-[#e69b00] text-black font-extrabold hover:shadow-lg hover:shadow-[#ffac00]/20 transition-all transform hover:scale-[1.02]"
                      rightIcon={<Play size={20} fill="currentColor" />}
                    >
                      INICIAR PRÁTICA
                    </Button>
                  </>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <SaveNotebookModal
        isOpen={showSaveNotebookModal}
        onClose={() => setShowSaveNotebookModal(false)}
        onSave={handleSaveNotebook}
        notebookName={newNotebookName}
        onNotebookNameChange={setNewNotebookName}
        notebookDescription={newNotebookDescription}
        onNotebookDescriptionChange={setNewNotebookDescription}
        totalFilters={totalFilters}
        filteredCount={filteredCount}
        questionCount={questionCount}
        isSaving={isSavingNotebook}
        isLoadingCount={isLoadingCount}
      />

      <ViewNotebookFiltersModal
        notebook={viewingNotebookFilters}
        onClose={() => setViewingNotebookFilters(null)}
        onEdit={handleEditNotebookFilters}
        onDelete={(id, e) => { e.stopPropagation(); setDeleteNotebookConfirm(id); }}
      />

      <BatteryEmptyModal
        isOpen={isEmptyModalOpen}
        onClose={closeEmptyModal}
        checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes || userPreparatorios[0]?.preparatorio?.checkout_ouse_questoes}
        price={getSelectedPreparatorio()?.preparatorio?.price_questoes || userPreparatorios[0]?.preparatorio?.price_questoes}
        preparatorioNome={getSelectedPreparatorio()?.preparatorio?.nome || userPreparatorios[0]?.preparatorio?.nome}
      />

      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleBackToSelection}
        title="Sair da Prática?"
        message="Você tem progresso não salvo. Se sair agora, suas respostas serão perdidas."
        confirmText="Sair"
        cancelText="Continuar"
        variant="danger"
        icon="exit"
      />

      <ConfirmModal
        isOpen={deleteNotebookConfirm !== null}
        onClose={() => setDeleteNotebookConfirm(null)}
        onConfirm={confirmDeleteNotebook}
        title="Excluir Caderno?"
        message="Esta ação não pode ser desfeita. O caderno será removido permanentemente."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
      />

      {trailPreparatorioId && (
        <EditalSidebar
          isOpen={showEditalSidebar}
          onClose={() => setShowEditalSidebar(false)}
          preparatorioId={trailPreparatorioId}
          banca={filters.banca[0]}
          currentAssuntos={filters.assunto}
          preparatorioSlug={preparatorioSlug || undefined}
        />
      )}
    </div>
  );
}
