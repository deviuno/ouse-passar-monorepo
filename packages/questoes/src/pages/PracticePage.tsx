import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  Zap,
  Loader2,
  BookOpen,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  SlidersHorizontal,
  Briefcase,
  CheckCircle,
  Save,
  PenLine,
} from 'lucide-react';
import { Button, Card, Progress, ConfirmModal } from '../components/ui';
import { BatteryEmptyModal } from '../components/battery';
import { QuestionCard } from '../components/question';
import QuestionErrorBoundary from '../components/question/QuestionErrorBoundary';
import { MentorChat } from '../components/question/MentorChat';
import { FloatingChatButton } from '../components/ui';
import { ParsedQuestion, RawQuestion, PracticeMode, Alternative } from '../types';
import { MOCK_QUESTIONS } from '../constants';
import { useUserStore, useUIStore, useBatteryStore, useTrailStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import {
  fetchQuestions,
  fetchFilterOptions,
  fetchAssuntosByMaterias,
  fetchTaxonomiaByMaterias,
  fetchAllTaxonomia,
  TaxonomyNode,
  getQuestionsCount,
  parseRawQuestion,
  OPTIONS_ESCOLARIDADE,
  OPTIONS_MODALIDADE,
  OPTIONS_DIFICULDADE,
} from '../services/questionsService';
import {
  HierarchicalAssuntosDropdown,
  EditalSidebar,
  MultiSelectDropdown,
  SaveNotebookModal,
  ViewNotebookFiltersModal,
} from '../components/practice';
import {
  createNotebook,
  getUserNotebooks,
  deleteNotebook,
} from '../services/notebooksService';
import { supabase } from '../services/supabase';
import { Caderno } from '../types';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
} from '../services/questionFeedbackService';
import { createPracticeSession } from '../services/practiceSessionService';
import { SessionResultsScreen } from '../components/practice/SessionResultsScreen';
import { getGamificationSettings, GamificationSettings } from '../services/gamificationSettingsService';
import { formatBancaDisplay, sortBancas } from '../utils/bancaFormatter';
import { isOuseQuestoesSubscriber } from '../services/subscriptionService';

export interface FilterOptions {
  materia: string[];
  assunto: string[];
  banca: string[];
  orgao: string[];
  cargo: string[];
  ano: string[];
  escolaridade: string[];
  modalidade: string[];
  dificuldade: string[];
}

interface ToggleFilters {
  apenasRevisadas: boolean;
  apenasComComentario: boolean;
}

// Valores padrao de fallback
const DEFAULT_MATERIAS = [
  'Lingua Portuguesa',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Informatica',
  'Raciocinio Logico',
  'Atualidades',
];

const DEFAULT_BANCAS = ['CEBRASPE', 'FGV', 'FCC', 'VUNESP', 'IDECAN', 'CESGRANRIO'];
const DEFAULT_ORGAOS = ['PF - Policia Federal', 'PRF - Policia Rodoviaria Federal'];
const DEFAULT_ANOS = ['2024', '2023', '2022', '2021', '2020'];

export default function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  const { incrementStats } = useUserStore();
  const { addToast, setPracticeMode, clearPracticeMode } = useUIStore();
  const { selectedPreparatorioId, getSelectedPreparatorio, userPreparatorios } = useTrailStore();
  const {
    batteryStatus,
    isEmptyModalOpen,
    closeEmptyModal,
    consumeBattery,
    fetchBatteryStatus,
  } = useBatteryStore();

  // Query params para abrir com filtros pré-definidos
  const [searchParams] = useSearchParams();
  // Inicializar autoStartPending baseado na URL para evitar flash da tela de seleção
  const [autoStartPending, setAutoStartPending] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === 'true';
  });
  // Ref para evitar múltiplas execuções do autostart
  const autoStartTriggeredRef = React.useRef(false);

  // Estado do modo (agora 'selection', 'practicing' ou 'results')
  const [mode, setMode] = useState<'selection' | 'practicing' | 'results'>('selection');

  // Debug: log mode changes
  React.useEffect(() => {
    console.log('[PracticePage] Mode changed to:', mode);
  }, [mode]);

  // Controle de tempo da sessão
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Assinante Ouse Questões (bateria ilimitada APENAS nesta rota /praticar)
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Dados do banco
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [availableMaterias, setAvailableMaterias] = useState<string[]>(DEFAULT_MATERIAS);
  const [availableAssuntos, setAvailableAssuntos] = useState<string[]>([]);
  const [taxonomyByMateria, setTaxonomyByMateria] = useState<Map<string, TaxonomyNode[]>>(new Map());
  const [globalTaxonomy, setGlobalTaxonomy] = useState<Map<string, TaxonomyNode[]>>(new Map());
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  const [availableBancas, setAvailableBancas] = useState<string[]>(DEFAULT_BANCAS);
  const [availableOrgaos, setAvailableOrgaos] = useState<string[]>(DEFAULT_ORGAOS);
  const [availableCargos, setAvailableCargos] = useState<string[]>([]);
  const [availableAnos, setAvailableAnos] = useState<string[]>(DEFAULT_ANOS);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isLoadingAssuntos, setIsLoadingAssuntos] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<FilterOptions>({
    materia: [],
    assunto: [],
    banca: [],
    orgao: [],
    cargo: [],
    ano: [],
    escolaridade: [],
    modalidade: [],
    dificuldade: [],
  });
  const [toggleFilters, setToggleFilters] = useState<ToggleFilters>({
    apenasRevisadas: false,
    apenasComComentario: false,
  });
  const [questionCount, setQuestionCount] = useState(10);

  // Modo de estudo (padrão: zen)
  const [studyMode, setStudyMode] = useState<PracticeMode>('zen');

  // Estado da sessao de pratica
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(new Map());
  const [showMentorChat, setShowMentorChat] = useState(false);

  // Rastreamento de tempo por questão
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Estatisticas da sessao
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  // Modais de confirmação
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [deleteNotebookConfirm, setDeleteNotebookConfirm] = useState<string | null>(null);

  // Gamification settings (loaded from database)
  const [gamificationSettings, setGamificationSettings] = useState<GamificationSettings | null>(null);

  // Notebooks (Cadernos)
  const [notebooks, setNotebooks] = useState<Caderno[]>([]);
  const [showSaveNotebookModal, setShowSaveNotebookModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookDescription, setNewNotebookDescription] = useState('');
  const [isSavingNotebook, setIsSavingNotebook] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Caderno | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  // Estado local para configurações editáveis de cada caderno
  const [notebookSettings, setNotebookSettings] = useState<Record<string, { questionCount: number; studyMode: PracticeMode }>>({});

  // Modal de visualização de filtros
  const [viewingNotebookFilters, setViewingNotebookFilters] = useState<Caderno | null>(null);

  // Controle de visibilidade dos filtros (oculto por padrão, exceto se showFilters=true na URL)
  const [showFilters, setShowFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('showFilters') === 'true';
  });

  // Sincronizar showFilters com o parâmetro da URL (garante que funcione com React Router)
  useEffect(() => {
    const showFiltersParam = searchParams.get('showFilters');
    if (showFiltersParam === 'true') {
      setShowFilters(true);
    }
  }, [searchParams]);

  // Controle de visibilidade dos filtros no modo practicing
  const [showPracticingFilters, setShowPracticingFilters] = useState(false);

  // Sidebar do edital (para modo trilha)
  const [showEditalSidebar, setShowEditalSidebar] = useState(false);
  const trailPreparatorioId = searchParams.get('preparatorioId');
  const editalItemTitle = searchParams.get('editalItemTitle');
  const preparatorioSlug = searchParams.get('preparatorioSlug');

  // Auto-iniciar prática com questões aleatórias (true se não houver query params)
  const [shouldAutoStart, setShouldAutoStart] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasFilterParams = params.has('materia') || params.has('materias') ||
                           params.has('assunto') || params.has('assuntos') ||
                           params.has('banca') || params.has('autostart') ||
                           params.has('showFilters') || params.has('editNotebook'); // Não auto-iniciar se os filtros devem estar abertos
    return !hasFilterParams; // Auto-start apenas se não houver filtros na URL
  });

  // Carregar cadernos
  useEffect(() => {
    if (user?.id) {
      loadNotebooks();
    }
  }, [user?.id]);

  // Processar parâmetro editNotebook da URL para carregar caderno para edição
  useEffect(() => {
    const editNotebookId = searchParams.get('editNotebook');
    if (!editNotebookId || notebooks.length === 0 || editingNotebook) return;

    const notebookToEdit = notebooks.find(nb => nb.id === editNotebookId);
    if (notebookToEdit) {
      console.log('[PracticePage] Carregando caderno para edição:', notebookToEdit.title);

      // Load notebook filters
      if (notebookToEdit.filters) setFilters(notebookToEdit.filters);
      if (notebookToEdit.settings?.toggleFilters) setToggleFilters(notebookToEdit.settings.toggleFilters);
      if (notebookToEdit.settings?.questionCount) setQuestionCount(notebookToEdit.settings.questionCount);
      if (notebookToEdit.settings?.studyMode) setStudyMode(notebookToEdit.settings.studyMode as PracticeMode);

      // Set editing mode
      setEditingNotebook(notebookToEdit);
      setEditingTitle(notebookToEdit.title);
      setEditingDescription(notebookToEdit.description || '');

      // Ensure filters are visible
      setShowFilters(true);
    }
  }, [searchParams, notebooks, editingNotebook]);

  // Verificar se é assinante do Ouse Questões (bateria ilimitada nesta rota)
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.id) {
        const subscriberStatus = await isOuseQuestoesSubscriber(user.id);
        setIsSubscriber(subscriberStatus);
        console.log('[PracticePage] Subscriber status:', subscriberStatus);
      }
    };
    checkSubscription();
  }, [user?.id]);

  // Carregar configurações de gamificação
  useEffect(() => {
    const loadGamificationSettings = async () => {
      try {
        const settings = await getGamificationSettings();
        setGamificationSettings(settings);
        console.log('[PracticePage] Gamification settings loaded:', settings);
      } catch (error) {
        console.error('[PracticePage] Error loading gamification settings:', error);
      }
    };
    loadGamificationSettings();
  }, []);

  // Sync practice mode with UIStore for Header integration
  useEffect(() => {
    if (mode === 'practicing') {
      setPracticeMode({
        isActive: true,
        correctCount: sessionStats.correct,
        wrongCount: sessionStats.total - sessionStats.correct,
        showFilters: showPracticingFilters,
        onBack: handleBack,
        onToggleFilters: () => setShowPracticingFilters(prev => !prev),
        // Trail mode
        isTrailMode: !!trailPreparatorioId,
        onToggleEdital: () => setShowEditalSidebar(prev => !prev),
        // Custom title and back path (for trail practice)
        title: editalItemTitle,
        backPath: preparatorioSlug ? `/trilhas/${preparatorioSlug}` : null,
      });
    } else {
      clearPracticeMode();
    }
  }, [mode, sessionStats, showPracticingFilters, trailPreparatorioId, editalItemTitle, preparatorioSlug]);

  // Clean up practice mode when unmounting
  useEffect(() => {
    return () => {
      clearPracticeMode();
    };
  }, [clearPracticeMode]);

  // Iniciar timer quando a questão muda ou quando entra no modo practicing
  useEffect(() => {
    if (mode === 'practicing' && questions.length > 0) {
      setQuestionStartTime(Date.now());
    }
  }, [mode, currentIndex, questions.length]);

  // Processar query params para aplicar filtros automaticamente
  useEffect(() => {
    // Suporta tanto parâmetros simples quanto arrays JSON
    const materiaParam = searchParams.get('materia');
    const materiasParam = searchParams.get('materias'); // JSON array
    const assuntoParam = searchParams.get('assunto');
    const assuntosParam = searchParams.get('assuntos'); // JSON array
    const bancaParam = searchParams.get('banca');
    const autostart = searchParams.get('autostart');

    // Parsear arrays JSON ou usar valores simples
    let newMaterias: string[] = [];
    let newAssuntos: string[] = [];

    if (materiasParam) {
      try {
        newMaterias = JSON.parse(materiasParam);
      } catch (e) {
        console.error('[PracticePage] Erro ao parsear materias:', e);
      }
    } else if (materiaParam) {
      newMaterias = [materiaParam];
    }

    if (assuntosParam) {
      try {
        newAssuntos = JSON.parse(assuntosParam);
      } catch (e) {
        console.error('[PracticePage] Erro ao parsear assuntos:', e);
      }
    } else if (assuntoParam) {
      newAssuntos = [assuntoParam];
    }

    if (newMaterias.length > 0 || newAssuntos.length > 0 || bancaParam) {
      console.log('[PracticePage] Query params detectados:', { newMaterias, newAssuntos, bancaParam, autostart });

      // Aplicar filtros dos query params
      setFilters(prev => ({
        ...prev,
        materia: newMaterias.length > 0 ? newMaterias : prev.materia,
        assunto: newAssuntos.length > 0 ? newAssuntos : prev.assunto,
        banca: bancaParam ? [bancaParam] : prev.banca,
      }));

      // Se autostart=true, marcar para iniciar automaticamente após carregar
      if (autostart === 'true') {
        setAutoStartPending(true);
      }
    }
  }, [searchParams]);

  // Iniciar prática automaticamente quando filtros estiverem carregados
  useEffect(() => {
    // Se não está em modo autostart, não fazer nada
    if (!autoStartPending || autoStartTriggeredRef.current) return;

    // Esperar filtros carregarem
    if (isLoadingFilters || isLoadingCount) return;

    const materiaParam = searchParams.get('materia');
    const materiasParam = searchParams.get('materias');
    const assuntoParam = searchParams.get('assunto');
    const assuntosParam = searchParams.get('assuntos');
    const bancaParam = searchParams.get('banca');

    // Verificar se há filtros na URL (além de autostart)
    const hasFilterParams = materiaParam || materiasParam || assuntoParam || assuntosParam || bancaParam;

    if (!hasFilterParams) {
      // Sem filtros: iniciar prática com questões aleatórias
      autoStartTriggeredRef.current = true;
      console.log('[PracticePage] Auto-iniciando prática com questões aleatórias (autostart sem filtros)');
      startPractice();
      return;
    }

    // Com filtros: verificar se já foram aplicados
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

    // Verificar se os filtros já foram aplicados corretamente
    const filtersApplied =
      (expectedMaterias.length === 0 || expectedMaterias.every(m => filters.materia.includes(m))) &&
      (expectedAssuntos.length === 0 || expectedAssuntos.every(a => filters.assunto.includes(a))) &&
      (!bancaParam || filters.banca.includes(bancaParam));

    if (filtersApplied) {
      autoStartTriggeredRef.current = true;
      console.log('[PracticePage] Auto-iniciando prática com filtros dos query params:', {
        materia: filters.materia,
        assunto: filters.assunto,
        banca: filters.banca
      });
      startPractice();
    }
  }, [autoStartPending, isLoadingFilters, isLoadingCount, filters, searchParams]);

  // Auto-iniciar prática com questões aleatórias quando não houver filtros na URL
  useEffect(() => {
    // Não auto-iniciar se showFilters=true (usuário quer ver os filtros)
    const showFiltersParam = searchParams.get('showFilters');
    if (showFiltersParam === 'true') return;

    if (shouldAutoStart && !isLoadingFilters && !isLoadingCount && mode === 'selection' && !isLoading) {
      console.log('[PracticePage] Auto-iniciando prática com questões aleatórias (modo Zen)');
      setShouldAutoStart(false);
      startPractice();
    }
  }, [shouldAutoStart, isLoadingFilters, isLoadingCount, mode, isLoading, searchParams]);

  // Resetar autoStartPending quando entrar no modo 'practicing'
  useEffect(() => {
    if (mode === 'practicing' && autoStartPending) {
      setAutoStartPending(false);
      autoStartTriggeredRef.current = false;
    }
  }, [mode, autoStartPending]);

  const loadNotebooks = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserNotebooks(user.id);
      setNotebooks(data);

      // Inicializar configurações editáveis para cada caderno
      const initialSettings: Record<string, { questionCount: number; studyMode: PracticeMode }> = {};
      data.forEach(notebook => {
        initialSettings[notebook.id] = {
          questionCount: notebook.settings?.questionCount || 10,
          studyMode: notebook.settings?.studyMode || 'zen',
        };
      });
      setNotebookSettings(initialSettings);
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    }
  };

  const handleSaveNotebook = async () => {
    if (!user?.id || !newNotebookName.trim()) return;

    setIsSavingNotebook(true);
    try {
      // Consumir bateria por criar caderno (pular se assinante Ouse Questões)
      const prep = getSelectedPreparatorio();
      const prepIdToUse = prep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;
      if (prepIdToUse && !isSubscriber) {
        const batteryResult = await consumeBattery(
          user.id,
          prepIdToUse,
          'notebook_create',
          { notebook_name: newNotebookName }
        );

        if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
          console.log('[PracticePage] Bateria insuficiente para criar caderno');
          setIsSavingNotebook(false);
          return; // Modal será aberto automaticamente pelo store
        }
      }

      const settings = {
        questionCount,
        studyMode,
        toggleFilters
      };

      // Use filteredCount, but fallback to totalQuestions if no filters are applied
      const questionsCount = filteredCount > 0 ? filteredCount : totalQuestions;

      const newNotebook = await createNotebook(
        user.id,
        newNotebookName,
        filters,
        settings,
        newNotebookDescription.trim() || undefined,
        questionsCount
      );

      if (newNotebook) {
        // Reload notebooks to get updated data
        await loadNotebooks();

        setShowSaveNotebookModal(false);
        setNewNotebookName('');
        setNewNotebookDescription('');
        addToast('success', 'Caderno salvo com sucesso!');

        // Scroll to top
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Erro ao salvar caderno:', error);
      addToast('error', 'Erro ao salvar caderno.');
    } finally {
      setIsSavingNotebook(false);
    }
  };

  const handleEditNotebookFilters = (notebook: Caderno) => {
    // Load notebook filters
    if (notebook.filters) setFilters(notebook.filters);
    if (notebook.settings?.toggleFilters) setToggleFilters(notebook.settings.toggleFilters);

    // Load settings into state
    const settings = notebookSettings[notebook.id];
    if (settings) {
      setQuestionCount(settings.questionCount);
      setStudyMode(settings.studyMode);
    }

    // Set editing mode with title and description
    setEditingNotebook(notebook);
    setEditingTitle(notebook.title);
    setEditingDescription(notebook.description || '');

    // Close modal and switch to edit mode
    setViewingNotebookFilters(null);

    // Scroll to top to see the filters
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNotebook(null);
    setEditingTitle('');
    setEditingDescription('');
    clearFilters();
  };

  const handleSaveEditedNotebook = async (andStart: boolean = false) => {
    if (!user?.id || !editingNotebook || !editingTitle.trim()) return;

    setIsSavingNotebook(true);
    try {
      // Use filteredCount, but fallback to totalQuestions if no filters are applied
      const questionsCount = filteredCount > 0 ? filteredCount : totalQuestions;

      // Update notebook in database
      const { error } = await supabase
        .from('cadernos')
        .update({
          title: editingTitle.trim(),
          description: editingDescription.trim() || null,
          filters,
          settings: {
            questionCount,
            studyMode,
            toggleFilters
          },
          questions_count: questionsCount
        })
        .eq('id', editingNotebook.id);

      if (error) throw error;

      // Reload notebooks
      await loadNotebooks();

      addToast('success', 'Caderno atualizado com sucesso!');

      if (andStart) {
        // Start practice with updated settings
        setEditingNotebook(null);
        setEditingTitle('');
        setEditingDescription('');
        await startPractice();
      } else {
        // Reset editing state
        setEditingNotebook(null);
        setEditingTitle('');
        setEditingDescription('');
      }
    } catch (error) {
      console.error('Erro ao atualizar caderno:', error);
      addToast('error', 'Erro ao atualizar caderno.');
    } finally {
      setIsSavingNotebook(false);
    }
  };

  const handleStartFromNotebook = async (notebook: Caderno, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Load notebook filters
    if (notebook.filters) setFilters(notebook.filters);
    if (notebook.settings?.toggleFilters) setToggleFilters(notebook.settings.toggleFilters);

    // Use the editable settings from state
    const settings = notebookSettings[notebook.id];
    if (settings) {
      setQuestionCount(settings.questionCount);
      setStudyMode(settings.studyMode);
    }

    // Start practice immediately (modo já foi selecionado no toggle)
    await startPractice();
  };

  const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteNotebookConfirm(id);
  };

  const confirmDeleteNotebook = async () => {
    if (!deleteNotebookConfirm) return;
    const success = await deleteNotebook(deleteNotebookConfirm);
    if (success) {
      setNotebooks(prev => prev.filter(n => n.id !== deleteNotebookConfirm));
      addToast('success', 'Caderno excluído.');
    }
    setDeleteNotebookConfirm(null);
  };

  // Contador para forçar reload quando navegar para a página
  const [loadKey, setLoadKey] = useState(0);

  // Reset state when component mounts or route changes (handles navigation)
  useEffect(() => {
    console.log('[PracticePage] Component mounted/route changed, resetting state...');
    setMode('selection');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setSessionStats({ correct: 0, total: 0 });
    setSessionStartTime(null);
    setIsLoadingFilters(true); // Reset loading state for fresh filter load
    // Incrementar key para forçar reload dos dados
    setLoadKey(prev => prev + 1);

    // Verificar se deve auto-iniciar (apenas se não houver filtros na URL)
    const params = new URLSearchParams(window.location.search);
    const hasFilterParams = params.has('materia') || params.has('materias') ||
                           params.has('assunto') || params.has('assuntos') ||
                           params.has('banca') || params.has('autostart');
    setShouldAutoStart(!hasFilterParams);
  }, [location.pathname]);

  // Carregar opcoes de filtro ao montar ou quando loadKey muda
  useEffect(() => {
    let isMounted = true;

    const loadFilterOptions = async () => {
      console.log('[PracticePage] Carregando opções de filtro... (loadKey:', loadKey, ')');

      try {
        const [filterOptions, count] = await Promise.all([fetchFilterOptions(), getQuestionsCount()]);

        if (!isMounted) return;

        console.log('[PracticePage] Filtros carregados:', {
          materias: filterOptions.materias.length,
          bancas: filterOptions.bancas.length,
          count
        });

        // Sempre usar dados do banco se conseguimos carregar algo
        setTotalQuestions(count);
        setFilteredCount(count);
        setAvailableMaterias(filterOptions.materias.length > 0 ? filterOptions.materias : DEFAULT_MATERIAS);
        setAvailableBancas(filterOptions.bancas.length > 0 ? filterOptions.bancas : DEFAULT_BANCAS);
        setAvailableOrgaos(filterOptions.orgaos.length > 0 ? filterOptions.orgaos : DEFAULT_ORGAOS);
        setAvailableCargos(filterOptions.cargos || []);
        setAvailableAnos(filterOptions.anos.length > 0 ? filterOptions.anos.map(String) : DEFAULT_ANOS);
        setUsingMockData(false);

        if (count === 0) {
          console.warn('[PracticePage] Nenhuma questão encontrada no banco de dados');
          addToast('info', 'Conectado ao banco, mas nenhuma questão encontrada.');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[PracticePage] Erro ao carregar filtros após retries:', error);
        addToast('error', 'Erro ao conectar ao banco de questões. Usando dados de exemplo.');
        setTotalQuestions(MOCK_QUESTIONS.length);
        setFilteredCount(MOCK_QUESTIONS.length);
        setUsingMockData(true);
      } finally {
        if (isMounted) {
          setIsLoadingFilters(false);
        }
      }
    };

    // Carregar taxonomia global (assíncrono, não bloqueia)
    const loadGlobalTaxonomy = async () => {
      setIsLoadingTaxonomy(true);
      try {
        const taxonomy = await fetchAllTaxonomia();
        if (isMounted) {
          setGlobalTaxonomy(taxonomy);
          // Se nenhuma matéria selecionada, usar taxonomia global
          if (filters.materia.length === 0) {
            setTaxonomyByMateria(taxonomy);
          }
        }
      } catch (error) {
        console.error('[PracticePage] Erro ao carregar taxonomia global:', error);
      } finally {
        if (isMounted) {
          setIsLoadingTaxonomy(false);
        }
      }
    };

    loadFilterOptions();
    loadGlobalTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [loadKey]);

  // Atualizar taxonomia IMEDIATAMENTE quando globalTaxonomy ou filtros mudam
  // Sem esperar pelos assuntos (que podem demorar)
  useEffect(() => {
    console.log('[PracticePage] Atualizando taxonomia - globalTaxonomy.size:', globalTaxonomy.size, 'matérias selecionadas:', filters.materia.length);

    // Se globalTaxonomy ainda não carregou, não fazer nada
    if (globalTaxonomy.size === 0) {
      console.log('[PracticePage] globalTaxonomy vazio, aguardando carregamento...');
      return;
    }

    let taxonomy: Map<string, TaxonomyNode[]>;
    if (filters.materia.length > 0) {
      // Filtrar taxonomia global pelas matérias selecionadas
      taxonomy = new Map();
      for (const materia of filters.materia) {
        const nodes = globalTaxonomy.get(materia);
        if (nodes && nodes.length > 0) {
          taxonomy.set(materia, nodes);
        }
      }
    } else {
      // Usar taxonomia global completa
      taxonomy = globalTaxonomy;
    }

    console.log('[PracticePage] Definindo taxonomyByMateria:', taxonomy.size, 'matérias');
    setTaxonomyByMateria(taxonomy);
  }, [filters.materia, globalTaxonomy]);

  // Carregar assuntos separadamente (pode demorar)
  useEffect(() => {
    const loadAssuntos = async () => {
      setIsLoadingAssuntos(true);
      try {
        // Determinar quais matérias usar para buscar assuntos
        const materiasParaBuscar = filters.materia.length > 0
          ? filters.materia
          : availableMaterias; // Usar todas as matérias disponíveis

        // Carregar assuntos
        const assuntos = await fetchAssuntosByMaterias(materiasParaBuscar);

        setAvailableAssuntos(assuntos);

        // Filtrar assuntos selecionados que não existem mais na lista atual
        if (filters.materia.length > 0) {
          setFilters((prev) => ({
            ...prev,
            assunto: prev.assunto.filter((a) => assuntos.includes(a)),
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar assuntos:', error);
        setAvailableAssuntos([]);
      } finally {
        setIsLoadingAssuntos(false);
      }
    };

    // Só carregar se temos matérias disponíveis (após o carregamento inicial)
    if (availableMaterias.length > 0) {
      loadAssuntos();
    }
  }, [filters.materia, availableMaterias]);

  // Atualizar contagem de questoes quando filtros mudam
  useEffect(() => {
    const updateCount = async () => {
      if (usingMockData) {
        let filtered = [...MOCK_QUESTIONS];
        if (filters.materia.length > 0) {
          filtered = filtered.filter((q) => filters.materia.includes(q.materia));
        }
        if (filters.banca.length > 0) {
          filtered = filtered.filter((q) => filters.banca.includes(q.banca));
        }
        if (filters.ano.length > 0) {
          filtered = filtered.filter((q) => filters.ano.includes(String(q.ano)));
        }
        setFilteredCount(filtered.length);
        return;
      }

      const hasFilters =
        filters.materia.length > 0 ||
        filters.assunto.length > 0 ||
        filters.banca.length > 0 ||
        filters.orgao.length > 0 ||
        filters.cargo.length > 0 ||
        filters.ano.length > 0 ||
        toggleFilters.apenasRevisadas ||
        toggleFilters.apenasComComentario;

      if (!hasFilters) {
        setFilteredCount(totalQuestions);
        return;
      }

      setIsLoadingCount(true);
      try {
        const count = await getQuestionsCount({
          materias: filters.materia.length > 0 ? filters.materia : undefined,
          assuntos: filters.assunto.length > 0 ? filters.assunto : undefined,
          bancas: filters.banca.length > 0 ? filters.banca : undefined,
          orgaos: filters.orgao.length > 0 ? filters.orgao : undefined,
          cargos: filters.cargo.length > 0 ? filters.cargo : undefined,
          anos: filters.ano.length > 0 ? filters.ano.map(Number) : undefined,
          apenasRevisadas: toggleFilters.apenasRevisadas || undefined,
          apenasComComentario: toggleFilters.apenasComComentario || undefined,
        });
        setFilteredCount(count);
      } catch (error) {
        console.error('Erro ao contar questoes:', error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    const debounce = setTimeout(updateCount, 300);
    return () => clearTimeout(debounce);
  }, [filters, toggleFilters, totalQuestions, usingMockData]);

  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      materia: [],
      assunto: [],
      banca: [],
      orgao: [],
      cargo: [],
      ano: [],
      escolaridade: [],
      modalidade: [],
      dificuldade: []
    });
    setToggleFilters({ apenasRevisadas: false, apenasComComentario: false });
  };

  const totalFilters =
    filters.materia.length +
    filters.assunto.length +
    filters.banca.length +
    filters.orgao.length +
    filters.cargo.length +
    filters.ano.length +
    filters.escolaridade.length +
    filters.modalidade.length +
    filters.dificuldade.length +
    (toggleFilters.apenasRevisadas ? 1 : 0) +
    (toggleFilters.apenasComComentario ? 1 : 0);

  // Iniciar pratica
  const startPractice = async () => {
    console.log('[PracticePage] startPractice iniciado');
    setIsLoading(true);

    try {
      // Consumir bateria se usuario nao for premium
      // Usa o preparatorio_id correto (não o user_trail.id)
      // No modo trilha, NÃO consumir bateria (usuário já pagou pelo acesso)
      // Assinantes Ouse Questões também não consomem bateria nesta rota
      const isTrailMode = !!trailPreparatorioId;

      if (!isTrailMode && !isSubscriber) {
        console.log('[PracticePage] Obtendo preparatório selecionado...');
        const selectedPrep = getSelectedPreparatorio();
        const prepIdToUse = selectedPrep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;
        console.log('[PracticePage] prepIdToUse:', prepIdToUse, 'user?.id:', user?.id);

        if (user?.id && prepIdToUse) {
          console.log('[PracticePage] Consumindo bateria...');
          const batteryResult = await consumeBattery(
            user.id,
            prepIdToUse,
            'practice_session',
            { question_count: questionCount }
          );
          console.log('[PracticePage] Resultado bateria:', batteryResult);

          if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
            console.log('[PracticePage] Bateria insuficiente');
            setIsLoading(false);
            return; // Modal sera aberto automaticamente pelo store
          }
        } else {
          console.log('[PracticePage] Pulando verificação de bateria (sem user ou prepId)');
        }
      } else {
        console.log('[PracticePage] Modo trilha ou assinante: pulando consumo de bateria');
      }

      let questionsToUse: ParsedQuestion[] = [];

      console.log('[PracticePage] usingMockData:', usingMockData);

      if (usingMockData) {
        console.log('[PracticePage] Usando dados mock');
        let filtered = [...MOCK_QUESTIONS];
        if (filters.materia.length > 0) {
          filtered = filtered.filter((q) => filters.materia.includes(q.materia));
        }
        if (filters.banca.length > 0) {
          filtered = filtered.filter((q) => filters.banca.includes(q.banca));
        }
        if (filters.ano.length > 0) {
          filtered = filtered.filter((q) => filters.ano.includes(String(q.ano)));
        }
        if (filtered.length === 0) {
          filtered = [...MOCK_QUESTIONS];
        }
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        questionsToUse = shuffled.slice(0, Math.min(questionCount, shuffled.length)).map(parseRawQuestion);
      } else {
        // No modo trilha, buscar todas as questões (sem limit)
        const isTrailMode = !!trailPreparatorioId;
        console.log('[PracticePage] Buscando questões do banco. Filtros:', {
          materias: filters.materia,
          assuntos: filters.assunto,
          bancas: filters.banca,
          questionCount: isTrailMode ? 'todas (modo trilha)' : questionCount
        });
        const dbQuestions = await fetchQuestions({
          materias: filters.materia.length > 0 ? filters.materia : undefined,
          assuntos: filters.assunto.length > 0 ? filters.assunto : undefined,
          bancas: filters.banca.length > 0 ? filters.banca : undefined,
          orgaos: filters.orgao.length > 0 ? filters.orgao : undefined,
          cargos: filters.cargo.length > 0 ? filters.cargo : undefined,
          anos: filters.ano.length > 0 ? filters.ano.map(Number) : undefined,
          escolaridade: filters.escolaridade.length > 0 ? filters.escolaridade : undefined,
          modalidade: filters.modalidade.length > 0 ? filters.modalidade : undefined,
          dificuldade: filters.dificuldade.length > 0 ? filters.dificuldade : undefined,
          apenasRevisadas: toggleFilters.apenasRevisadas || undefined,
          apenasComComentario: toggleFilters.apenasComComentario || undefined,
          limit: isTrailMode ? 500 : questionCount, // Modo trilha: buscar até 500 questões
          shuffle: true,
        });
        console.log('[PracticePage] Questões recebidas:', dbQuestions.length);

        if (dbQuestions.length > 0) {
          questionsToUse = dbQuestions;
        } else if (isTrailMode) {
          // No modo trilha, NUNCA usar questões de exemplo
          addToast('error', 'Nenhuma questão encontrada para este tópico. Verifique os filtros do edital.');
          setIsLoading(false);
          return;
        } else {
          // Modo livre: usar questões de exemplo como fallback
          addToast('info', 'Nenhuma questao encontrada. Usando questoes de exemplo.');
          const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
          questionsToUse = shuffled.slice(0, questionCount).map(parseRawQuestion);
        }
      }

      console.log('[PracticePage] Iniciando modo practicing com', questionsToUse.length, 'questões');
      setQuestions(questionsToUse);
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setSessionStartTime(Date.now()); // Iniciar cronômetro
      setMode('practicing');
    } catch (error) {
      console.error('Erro ao carregar questoes:', error);
      // No modo trilha, não usar fallback de questões de exemplo
      if (trailPreparatorioId) {
        addToast('error', 'Erro ao carregar questões. Tente novamente.');
        setIsLoading(false);
        return;
      }
      addToast('error', 'Erro ao carregar questoes. Usando questoes de exemplo.');
      const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, questionCount).map(parseRawQuestion));
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setSessionStartTime(Date.now()); // Iniciar cronômetro
      setMode('practicing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (letter: string, clickX?: number, clickY?: number) => {
    const question = questions[currentIndex];
    const isCorrect = letter === question.gabarito;

    // Calcular tempo gasto na questão
    const timeSpentSeconds = questionStartTime
      ? Math.round((Date.now() - questionStartTime) / 1000)
      : null;

    // PRIMEIRO: Atualizar estatísticas (sempre acontece)
    setAnswers(new Map(answers.set(question.id, { letter, correct: isCorrect })));
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // DEPOIS: Consumir bateria por responder a questão (não bloqueia stats)
    // No modo trilha, NÃO consumir bateria (usuário já pagou pelo acesso)
    // Assinantes Ouse Questões também não consomem bateria nesta rota
    if (!trailPreparatorioId && !isSubscriber) {
      try {
        const prep = getSelectedPreparatorio();
        const prepIdToUse = prep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;
        if (user?.id && prepIdToUse) {
          const batteryResult = await consumeBattery(
            user.id,
            prepIdToUse,
            'question',
            { question_id: question.id.toString(), clickX, clickY }
          );

          if (!batteryResult.success && batteryResult.error === 'insufficient_battery') {
            console.log('[PracticePage] Bateria insuficiente');
            // Modal será aberto automaticamente pelo store, mas não bloqueamos mais a resposta
          }
        }
      } catch (error) {
        console.error('[PracticePage] Erro ao consumir bateria:', error);
      }
    }

    // Calculate rewards based on gamification settings
    const isHardMode = studyMode === 'hard';
    let xpReward = 0;
    let coinsReward = 0;

    if (isCorrect) {
      if (gamificationSettings) {
        xpReward = isHardMode
          ? gamificationSettings.xp_per_correct_hard_mode
          : gamificationSettings.xp_per_correct_answer;
        coinsReward = isHardMode
          ? gamificationSettings.coins_per_correct_hard_mode
          : gamificationSettings.coins_per_correct_answer;
      } else {
        // Fallback values if settings not loaded
        xpReward = isHardMode ? 100 : 50;
        coinsReward = isHardMode ? 20 : 10;
      }
    }

    incrementStats({
      correctAnswers: isCorrect ? 1 : 0,
      totalAnswered: 1,
      xp: xpReward,
      coins: coinsReward,
    });

    // Save answer to database for statistics (including time spent)
    saveUserAnswer({
      questionId: question.id,
      selectedAlternative: letter,
      isCorrect: isCorrect,
      timeSpentSeconds: timeSpentSeconds || undefined,
    }, user?.id);
  };

  const handleRateDifficulty = (difficulty: DifficultyRating) => {
    const question = questions[currentIndex];
    if (user?.id) {
      saveDifficultyRating(question.id, difficulty, user.id);
    }
  };

  const handleNext = async () => {
    console.log('[PracticePage] handleNext called', { currentIndex, questionsLength: questions.length, isLast: currentIndex >= questions.length - 1 });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log('[PracticePage] Finalizando sessão...');
      // Finalizar sessão
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;

      // Calculate XP earned based on gamification settings
      const isHardMode = studyMode === 'hard';
      const xpPerCorrect = gamificationSettings
        ? (isHardMode ? gamificationSettings.xp_per_correct_hard_mode : gamificationSettings.xp_per_correct_answer)
        : (isHardMode ? 100 : 50);
      const xpEarned = sessionStats.correct * xpPerCorrect;

      // Salvar sessão no banco de dados (com tratamento de erro)
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

          // Refresh profile to sync streak and other stats from database
          await fetchProfile();
        }
      } catch (error) {
        console.error('[PracticePage] Erro ao salvar sessão:', error);
        // Continua para mostrar resultados mesmo se falhar ao salvar
      }

      // Mostrar tela de resultados (sempre executa)
      console.log('[PracticePage] Chamando setMode("results")');
      setMode('results');
      console.log('[PracticePage] setMode("results") chamado com sucesso');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBack = () => {
    if (mode === 'practicing') {
      if (answers.size > 0) {
        setShowExitConfirm(true);
      } else {
        navigate('/questoes');
      }
    }
  };

  const handleTimeout = () => {
    addToast('error', 'Tempo esgotado!');
    handleNext();
  };

  const handleShowToast = (message: string, type: 'success' | 'error' | 'info') => {
    addToast(type, message);
  };

  const currentQuestion = questions[currentIndex];

  // Modo de pratica
  if (mode === 'practicing' && currentQuestion) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--color-bg-main)] flex flex-col theme-transition">
        {/* Painel de filtros deslizante */}
        <AnimatePresence>
          {showPracticingFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
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

                {/* Filtros Grid */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5 theme-transition">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <MultiSelectDropdown
                      label="Matérias"
                      icon={<BookOpen size={16} />}
                      items={availableMaterias}
                      selected={filters.materia}
                      onToggle={(item) => toggleFilter('materia', item)}
                      onClear={() => setFilters(prev => ({ ...prev, materia: [] }))}
                      placeholder="Selecione matérias..."
                    />
                    <HierarchicalAssuntosDropdown
                      label="Assuntos"
                      icon={<FileText size={16} />}
                      taxonomyByMateria={taxonomyByMateria}
                      flatAssuntos={availableAssuntos}
                      selectedAssuntos={filters.assunto}
                      onToggleAssunto={(item) => toggleFilter('assunto', item)}
                      onToggleMultiple={(assuntos, select) => {
                        setFilters(prev => {
                          const current = new Set(prev.assunto);
                          assuntos.forEach(a => {
                            if (select) {
                              current.add(a);
                            } else {
                              current.delete(a);
                            }
                          });
                          return { ...prev, assunto: Array.from(current) };
                        });
                      }}
                      onClear={() => setFilters(prev => ({ ...prev, assunto: [] }))}
                      placeholder="Selecionar assuntos..."
                      isLoading={isLoadingAssuntos}
                      isLoadingTaxonomy={isLoadingTaxonomy}
                    />
                    <MultiSelectDropdown
                      label="Bancas"
                      icon={<Building2 size={16} />}
                      items={sortBancas(availableBancas)}
                      selected={filters.banca}
                      onToggle={(item) => toggleFilter('banca', item)}
                      onClear={() => setFilters(prev => ({ ...prev, banca: [] }))}
                      placeholder="Selecione bancas..."
                      displayFormatter={formatBancaDisplay}
                    />
                    <MultiSelectDropdown
                      label="Órgãos"
                      icon={<Building2 size={16} />}
                      items={availableOrgaos}
                      selected={filters.orgao}
                      onToggle={(item) => toggleFilter('orgao', item)}
                      onClear={() => setFilters(prev => ({ ...prev, orgao: [] }))}
                      placeholder="Selecione órgãos..."
                    />
                    <MultiSelectDropdown
                      label="Cargos"
                      icon={<Briefcase size={16} />}
                      items={availableCargos}
                      selected={filters.cargo}
                      onToggle={(item) => toggleFilter('cargo', item)}
                      onClear={() => setFilters(prev => ({ ...prev, cargo: [] }))}
                      placeholder="Selecione cargos..."
                    />
                    <MultiSelectDropdown
                      label="Anos"
                      icon={<Calendar size={16} />}
                      items={availableAnos}
                      selected={filters.ano}
                      onToggle={(item) => toggleFilter('ano', item)}
                      onClear={() => setFilters(prev => ({ ...prev, ano: [] }))}
                      placeholder="Selecione anos..."
                    />
                    <MultiSelectDropdown
                      label="Escolaridade"
                      icon={<GraduationCap size={16} />}
                      items={OPTIONS_ESCOLARIDADE.map(opt => opt.value)}
                      selected={filters.escolaridade}
                      onToggle={(item) => toggleFilter('escolaridade', item)}
                      onClear={() => setFilters(prev => ({ ...prev, escolaridade: [] }))}
                      placeholder="Selecione escolaridade..."
                    />
                    <MultiSelectDropdown
                      label="Modalidade"
                      icon={<CheckCircle size={16} />}
                      items={OPTIONS_MODALIDADE.map(opt => opt.value)}
                      selected={filters.modalidade}
                      onToggle={(item) => toggleFilter('modalidade', item)}
                      onClear={() => setFilters(prev => ({ ...prev, modalidade: [] }))}
                      placeholder="Selecione modalidade..."
                    />
                    <MultiSelectDropdown
                      label="Dificuldade"
                      icon={<Zap size={16} />}
                      items={OPTIONS_DIFICULDADE.map(opt => opt.value)}
                      selected={filters.dificuldade}
                      onToggle={(item) => toggleFilter('dificuldade', item)}
                      onClear={() => setFilters(prev => ({ ...prev, dificuldade: [] }))}
                      placeholder="Selecione dificuldade..."
                    />
                  </div>

                  {/* Toggle Filters */}
                  <div className="flex flex-wrap gap-6 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => setToggleFilters(prev => ({ ...prev, apenasRevisadas: !prev.apenasRevisadas }))}
                      className="flex items-center gap-3 group"
                    >
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${toggleFilters.apenasRevisadas ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleFilters.apenasRevisadas ? 'left-[22px]' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-sm transition-colors ${toggleFilters.apenasRevisadas ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sec)] group-hover:text-[var(--color-text-main)]'}`}>Apenas questões revisadas</span>
                    </button>
                    <button
                      onClick={() => setToggleFilters(prev => ({ ...prev, apenasComComentario: !prev.apenasComComentario }))}
                      className="flex items-center gap-3 group"
                    >
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${toggleFilters.apenasComComentario ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleFilters.apenasComComentario ? 'left-[22px]' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-sm transition-colors ${toggleFilters.apenasComComentario ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sec)] group-hover:text-[var(--color-text-main)]'}`}>Apenas com comentário</span>
                    </button>
                  </div>
                </div>

                {/* Resumo Section */}
                <section className="bg-[var(--color-bg-card)] border border-[var(--color-brand)]/20 rounded-2xl p-4 md:p-5 relative overflow-hidden theme-transition">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-brand)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                  <div className="relative">
                    <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <SlidersHorizontal size={14} /> Resumo do Treino
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-5">
                      {/* Questões Disponíveis */}
                      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">Disponíveis</p>
                        {isLoadingCount ? (
                          <Loader2 size={20} className="animate-spin text-[var(--color-brand)]" />
                        ) : (
                          <p className="text-2xl font-bold text-[var(--color-text-main)]">{filteredCount.toLocaleString()}</p>
                        )}
                      </div>

                      {/* Filtros Ativos */}
                      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">Filtros Ativos</p>
                        <p className="text-2xl font-bold text-[var(--color-brand)]">{totalFilters}</p>
                      </div>

                      {/* Questões por Sessão */}
                      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2 md:col-span-1 lg:col-span-2">
                        <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">Questões por Sessão</p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[var(--color-brand)] min-w-[3rem]">{questionCount}</span>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="flex-1 h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
                          />
                        </div>
                      </div>

                      {/* Modo de Estudo */}
                      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2">
                        <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">Modo de Estudo</p>
                        <button
                          onClick={() => setStudyMode(studyMode === 'zen' ? 'hard' : 'zen')}
                          className="relative inline-flex items-center h-8 rounded-full w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] transition-colors"
                        >
                          <span
                            className={`absolute inline-flex items-center justify-center h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                              studyMode === 'zen'
                                ? 'left-0.5 w-[calc(50%-0.25rem)] bg-[var(--color-success)] text-black'
                                : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.25rem)] bg-[var(--color-error)] text-white'
                            }`}
                          >
                            {studyMode === 'zen' ? 'Zen' : 'Simulado'}
                          </span>
                          <span className="absolute left-[25%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none" style={{ opacity: studyMode === 'zen' ? 0 : 1 }}>Zen</span>
                          <span className="absolute left-[75%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none" style={{ opacity: studyMode === 'hard' ? 0 : 1 }}>Simulado</span>
                        </button>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col gap-3">
                      {/* Linha 1: Botões lado a lado (50% cada) */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSaveNotebookModal(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] font-bold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-brand)] transition-colors whitespace-nowrap text-sm lg:text-base lg:px-5"
                        >
                          <Save size={16} className="lg:w-[18px] lg:h-[18px] flex-shrink-0" />
                          <span className="truncate">Salvar Caderno</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowPracticingFilters(false);
                            startPractice();
                          }}
                          disabled={isLoading || filteredCount === 0}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-[var(--color-brand)] text-black font-bold rounded-xl hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm lg:text-base lg:px-6"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin flex-shrink-0" />
                              <span className="truncate">Carregando...</span>
                            </>
                          ) : (
                            <>
                              <Play size={16} className="lg:w-[18px] lg:h-[18px] flex-shrink-0" />
                              <span className="truncate">Iniciar Treino</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Linha 2: Link para ocultar filtros */}
                      <button
                        onClick={() => setShowPracticingFilters(false)}
                        className="flex items-center justify-center gap-2 py-2 text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] font-medium transition-colors text-sm"
                      >
                        <ChevronUp size={16} />
                        Ocultar filtros
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-[1000px] mx-auto h-full">
          <QuestionErrorBoundary
            questionId={currentQuestion?.id}
            onSkip={handleNext}
            onRetry={() => {/* Force re-render */}}
          >
            <QuestionCard
              question={currentQuestion}
              isLastQuestion={currentIndex === questions.length - 1}
              onNext={handleNext}
              onPrevious={currentIndex > 0 ? handlePrevious : undefined}
              onOpenTutor={() => setShowMentorChat(true)}
              onAnswer={handleAnswer}
              onRateDifficulty={handleRateDifficulty}
              onTimeout={studyMode === 'hard' ? handleTimeout : undefined}
              studyMode={studyMode}
              initialTime={studyMode === 'hard' ? 3 : undefined}
              userId={user?.id}
              userRole={profile?.role}
              showCorrectAnswers={profile?.show_answers || false}
              onShowToast={handleShowToast}
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
            question: currentQuestion
          }}
          userContext={{ name: user?.user_metadata?.name }}
          userId={user?.id}
          preparatorioId={getSelectedPreparatorio()?.preparatorio_id || userPreparatorios[0]?.preparatorio_id}
          checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes || userPreparatorios[0]?.preparatorio?.checkout_ouse_questoes}
        />

        {/* Floating Chat Button */}
        <FloatingChatButton
          isOpen={showMentorChat}
          onClick={() => setShowMentorChat(!showMentorChat)}
          sidebarWidth={0}
          isChatVisible={showMentorChat}
        />

        {/* Exit Confirmation Modal */}
        <ConfirmModal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={() => navigate('/questoes')}
          title="Sair da Prática?"
          message="Você tem progresso não salvo. Se sair agora, suas respostas serão perdidas."
          confirmText="Sair"
          cancelText="Continuar"
          variant="danger"
          icon="exit"
        />

        {/* Edital Sidebar (modo trilha) */}
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

        {/* Modal Salvar Caderno (modo practicing) */}
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
      </div>
    );
  }

  // Tela de resultados
  if (mode === 'results') {
    const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    const xpEarned = (sessionStats.correct * 10) + (sessionStats.total * 2);
    return (
      <SessionResultsScreen
        totalQuestions={sessionStats.total}
        correctAnswers={sessionStats.correct}
        wrongAnswers={sessionStats.total - sessionStats.correct}
        studyMode={studyMode}
        timeSpent={timeSpent}
        xpEarned={xpEarned}
        onNewSession={startPractice}
        onBackToMenu={() => setMode('selection')}
      />
    );
  }

  // ==========================================
  // RENDER: LOADING STATE (Auto-start or Trail auto-start)
  // ==========================================
  // Não mostrar loading se showFilters=true ou editNotebook (usuário quer configurar filtros)
  const showFiltersParam = searchParams.get('showFilters') === 'true';
  const editNotebookParam = searchParams.get('editNotebook');
  const isAutoStarting = (shouldAutoStart || autoStartPending) && !showFiltersParam && !editNotebookParam;
  if (isAutoStarting && (isLoadingFilters || isLoadingCount || isLoading || mode === 'selection')) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center font-sans text-[var(--color-text-main)] theme-transition">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
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
  // RENDER: DASHBOARD "COCKPIT"
  // ==========================================
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-2 py-4 md:p-8 lg:p-12 font-sans text-[var(--color-text-main)] theme-transition">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

        {/* User Quick Stats + Filter Toggle */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex items-center gap-4"
        >
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

          {/* Filter Toggle Button OR Edital Button - same height as stats */}
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
                  ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-black'
                  : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
              }`}
            >
              <div className={`p-2 rounded-lg ${showFilters ? 'bg-black/10' : 'bg-[var(--color-brand)]/10'}`}>
                <Filter size={20} className={showFilters ? 'text-black' : 'text-[var(--color-brand)]'} />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase font-bold tracking-wider opacity-70">{showFilters ? 'Ocultar' : 'Exibir'}</p>
                <p className="font-bold text-lg leading-none">Filtros</p>
              </div>
              {totalFilters > 0 && (
                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${showFilters ? 'bg-black/20 text-black' : 'bg-[var(--color-brand)] text-black'}`}>
                  {totalFilters}
                </span>
              )}
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </motion.div>

        {/* Mobile Filter Toggle OR Edital Button */}
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
                ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-black'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-main)]'
            }`}
          >
            <Filter size={16} />
            <span className="font-bold text-sm">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
            {totalFilters > 0 && !showFilters && (
              <span className="px-1.5 py-0.5 bg-[var(--color-brand)] text-black text-xs font-bold rounded">{totalFilters}</span>
            )}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Editing: Title and Description */}
        {editingNotebook && (
          <section>
            <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <PenLine size={14} /> Dados do Caderno
            </h3>
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-5 theme-transition">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[var(--color-text-main)] text-sm font-medium mb-2 block">Nome do Caderno</label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Nome do caderno"
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors theme-transition"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-text-main)] text-sm font-medium mb-2 block">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="Descrição do caderno"
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors theme-transition"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters Section - Full Width, 3 Columns */}
        <AnimatePresence>
          {showFilters && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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

              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-5 theme-transition">
                {/* Main Filters - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <MultiSelectDropdown
                    label="Matérias"
                    icon={<BookOpen size={16} />}
                    items={availableMaterias}
                    selected={filters.materia}
                    onToggle={(item) => toggleFilter('materia', item)}
                    onClear={() => setFilters(prev => ({ ...prev, materia: [] }))}
                    placeholder="Selecione matérias..."
                  />
                  <HierarchicalAssuntosDropdown
                    label="Assuntos"
                    icon={<FileText size={16} />}
                    taxonomyByMateria={taxonomyByMateria}
                    flatAssuntos={availableAssuntos}
                    selectedAssuntos={filters.assunto}
                    onToggleAssunto={(item) => toggleFilter('assunto', item)}
                    onToggleMultiple={(assuntos, select) => {
                      setFilters(prev => {
                        const current = new Set(prev.assunto);
                        assuntos.forEach(a => {
                          if (select) {
                            current.add(a);
                          } else {
                            current.delete(a);
                          }
                        });
                        return { ...prev, assunto: Array.from(current) };
                      });
                    }}
                    onClear={() => setFilters(prev => ({ ...prev, assunto: [] }))}
                    placeholder="Selecionar assuntos..."
                    isLoading={isLoadingAssuntos}
                    isLoadingTaxonomy={isLoadingTaxonomy}
                  />
                  <MultiSelectDropdown
                    label="Bancas"
                    icon={<Building2 size={16} />}
                    items={sortBancas(availableBancas)}
                    selected={filters.banca}
                    onToggle={(item) => toggleFilter('banca', item)}
                    onClear={() => setFilters(prev => ({ ...prev, banca: [] }))}
                    placeholder="Selecione bancas..."
                    displayFormatter={formatBancaDisplay}
                  />
                  <MultiSelectDropdown
                    label="Órgãos"
                    icon={<Building2 size={16} />}
                    items={availableOrgaos}
                    selected={filters.orgao}
                    onToggle={(item) => toggleFilter('orgao', item)}
                    onClear={() => setFilters(prev => ({ ...prev, orgao: [] }))}
                    placeholder="Selecione órgãos..."
                  />
                  <MultiSelectDropdown
                    label="Cargos"
                    icon={<Briefcase size={16} />}
                    items={availableCargos}
                    selected={filters.cargo}
                    onToggle={(item) => toggleFilter('cargo', item)}
                    onClear={() => setFilters(prev => ({ ...prev, cargo: [] }))}
                    placeholder="Selecione cargos..."
                  />
                  <MultiSelectDropdown
                    label="Anos"
                    icon={<Calendar size={16} />}
                    items={availableAnos}
                    selected={filters.ano}
                    onToggle={(item) => toggleFilter('ano', item)}
                    onClear={() => setFilters(prev => ({ ...prev, ano: [] }))}
                    placeholder="Selecione anos..."
                  />
                  <MultiSelectDropdown
                    label="Escolaridade"
                    icon={<GraduationCap size={16} />}
                    items={OPTIONS_ESCOLARIDADE.map(opt => opt.value)}
                    selected={filters.escolaridade}
                    onToggle={(item) => toggleFilter('escolaridade', item)}
                    onClear={() => setFilters(prev => ({ ...prev, escolaridade: [] }))}
                    placeholder="Selecione escolaridade..."
                  />
                  <MultiSelectDropdown
                    label="Modalidade"
                    icon={<CheckCircle size={16} />}
                    items={OPTIONS_MODALIDADE.map(opt => opt.value)}
                    selected={filters.modalidade}
                    onToggle={(item) => toggleFilter('modalidade', item)}
                    onClear={() => setFilters(prev => ({ ...prev, modalidade: [] }))}
                    placeholder="Selecione modalidade..."
                  />
                  <MultiSelectDropdown
                    label="Dificuldade"
                    icon={<Zap size={16} />}
                    items={OPTIONS_DIFICULDADE.map(opt => opt.value)}
                    selected={filters.dificuldade}
                    onToggle={(item) => toggleFilter('dificuldade', item)}
                    onClear={() => setFilters(prev => ({ ...prev, dificuldade: [] }))}
                    placeholder="Selecione dificuldade..."
                  />
                </div>

                {/* Toggle Filters */}
                <div className="flex flex-wrap gap-6 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setToggleFilters(prev => ({ ...prev, apenasRevisadas: !prev.apenasRevisadas }))}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${toggleFilters.apenasRevisadas ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleFilters.apenasRevisadas ? 'left-[22px]' : 'left-0.5'}`} />
                    </div>
                    <span className={`text-sm transition-colors ${toggleFilters.apenasRevisadas ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sec)] group-hover:text-[var(--color-text-main)]'}`}>Apenas questões revisadas</span>
                  </button>
                  <button
                    onClick={() => setToggleFilters(prev => ({ ...prev, apenasComComentario: !prev.apenasComComentario }))}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${toggleFilters.apenasComComentario ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleFilters.apenasComComentario ? 'left-[22px]' : 'left-0.5'}`} />
                    </div>
                    <span className={`text-sm transition-colors ${toggleFilters.apenasComComentario ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sec)] group-hover:text-[var(--color-text-main)]'}`}>Apenas com comentário</span>
                  </button>
                </div>
              </div>
              {/* Summary Section - Horizontal Layout */}
              <section className="bg-[var(--color-bg-card)] border border-[var(--color-brand)]/20 rounded-2xl p-5 relative overflow-hidden mt-6 theme-transition">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-brand)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative">
                  <h3 className="text-sm font-bold text-[var(--color-text-sec)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={14} /> {editingNotebook ? 'Parâmetros do Caderno' : 'Resumo do Treino'}
                  </h3>

                  {/* Horizontal Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-5">
                    {/* Questões Disponíveis */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] theme-transition">
                      <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">Disponíveis</p>
                      {isLoadingCount ? (
                        <Loader2 size={20} className="animate-spin text-[var(--color-brand)]" />
                      ) : (
                        <p className="text-2xl font-bold text-[var(--color-text-main)]">{filteredCount.toLocaleString()}</p>
                      )}
                    </div>

                    {/* Filtros Ativos */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] theme-transition">
                      <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-1">Filtros Ativos</p>
                      <p className="text-2xl font-bold text-[var(--color-brand)]">{totalFilters}</p>
                    </div>

                    {/* Questões por Sessão */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2 md:col-span-1 lg:col-span-2 theme-transition">
                      <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">Questões por Sessão</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[var(--color-brand)] min-w-[3rem]">{questionCount}</span>
                        <input
                          type="range"
                          min="5"
                          max="120"
                          step="5"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          className="flex-1 h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
                        />
                      </div>
                    </div>

                    {/* Modo de Estudo */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border)] col-span-2 theme-transition">
                      <p className="text-xs text-[var(--color-text-sec)] uppercase font-bold tracking-wider mb-2">Modo de Estudo</p>
                      <button
                        onClick={() => setStudyMode(studyMode === 'zen' ? 'hard' : 'zen')}
                        className="relative inline-flex items-center h-8 rounded-full w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] transition-colors theme-transition"
                      >
                        <span
                          className={`absolute inline-flex items-center justify-center h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                            studyMode === 'zen'
                              ? 'left-0.5 w-[calc(50%-0.25rem)] bg-[var(--color-success)] text-black'
                              : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.25rem)] bg-[var(--color-error)] text-black'
                          }`}
                        >
                          {studyMode === 'zen' ? 'Zen' : 'Simulado'}
                        </span>
                        <span className="absolute left-[25%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none" style={{ opacity: studyMode === 'zen' ? 0 : 1 }}>Zen</span>
                        <span className="absolute left-[75%] -translate-x-1/2 text-[10px] text-[var(--color-text-muted)] pointer-events-none" style={{ opacity: studyMode === 'hard' ? 0 : 1 }}>Simulado</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Horizontal */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {editingNotebook ? (
                      <>
                        <Button
                          size="lg"
                          onClick={() => handleSaveEditedNotebook(false)}
                          disabled={isSavingNotebook || isLoadingFilters || !editingTitle.trim()}
                          className="flex-1 bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-black font-extrabold hover:shadow-lg hover:shadow-[var(--color-brand)]/20 transition-all transform hover:scale-[1.02]"
                          leftIcon={<Save size={20} />}
                        >
                          {isSavingNotebook ? 'Salvando...' : 'Salvar'}
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
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => setShowFilters(false)}
                          className="whitespace-nowrap"
                          leftIcon={<ChevronUp size={18} />}
                        >
                          Ocultar
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => setShowSaveNotebookModal(true)}
                          className="flex-1 whitespace-nowrap"
                          leftIcon={<Save size={18} />}
                        >
                          Salvar como Caderno
                        </Button>
                        <Button
                          size="lg"
                          onClick={startPractice}
                          disabled={isLoading || isLoadingFilters || filteredCount === 0}
                          className="flex-1 sm:flex-[2] whitespace-nowrap bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)] text-black font-extrabold hover:shadow-lg hover:shadow-[var(--color-brand)]/20 transition-all transform hover:scale-[1.02]"
                          rightIcon={<Play size={20} fill="currentColor" />}
                        >
                          INICIAR PRÁTICA
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Salvar Caderno */}
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

      {/* Modal Visualizar Filtros do Caderno */}
      <ViewNotebookFiltersModal
        notebook={viewingNotebookFilters}
        onClose={() => setViewingNotebookFilters(null)}
        onEdit={handleEditNotebookFilters}
        onDelete={handleDeleteNotebook}
      />

      {/* Battery Empty Modal */}
      <BatteryEmptyModal
        isOpen={isEmptyModalOpen}
        onClose={closeEmptyModal}
        checkoutUrl={getSelectedPreparatorio()?.preparatorio?.checkout_ouse_questoes || userPreparatorios[0]?.preparatorio?.checkout_ouse_questoes}
        price={getSelectedPreparatorio()?.preparatorio?.price_questoes || userPreparatorios[0]?.preparatorio?.price_questoes}
        preparatorioNome={getSelectedPreparatorio()?.preparatorio?.nome || userPreparatorios[0]?.preparatorio?.nome}
      />

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => setMode('selection')}
        title="Sair da Prática?"
        message="Você tem progresso não salvo. Se sair agora, suas respostas serão perdidas."
        confirmText="Sair"
        cancelText="Continuar"
        variant="danger"
        icon="exit"
      />

      {/* Delete Notebook Confirmation Modal */}
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

      {/* Edital Sidebar (modo trilha) */}
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