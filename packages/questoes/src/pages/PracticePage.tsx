import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  Coffee,
  Zap,
  Timer,
  Loader2,
  Search,
  Check,
  BookOpen,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  SlidersHorizontal,
  Briefcase,
  CheckCircle,
  MessageSquare,
  Save,
  MoreVertical,
  Trash2,
  PenLine,
  Eye,
  Edit,
} from 'lucide-react';
import { Button, Card, Progress, ConfirmModal } from '../components/ui';
import { BatteryEmptyModal } from '../components/battery';
import { QuestionCard } from '../components/question';
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
import { HierarchicalAssuntosDropdown } from '../components/practice/HierarchicalAssuntosDropdown';
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

interface FilterOptions {
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

// Componente de dropdown multi-select com busca
interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

function MultiSelectDropdown({
  label,
  icon,
  items,
  selected,
  onToggle,
  onClear,
  placeholder = 'Selecionar...',
  isLoading = false,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter((item) => item.toLowerCase().includes(searchLower));
  }, [items, search]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#FFB800]">{icon}</span>
        <span className="text-white text-sm font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 bg-[#FFB800] text-black text-xs font-bold rounded">
            {selected.length}
          </span>
        )}
        <span className="text-[#6E6E6E] text-xs">({items.length})</span>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors
          ${disabled
            ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#4A4A4A] cursor-not-allowed'
            : isOpen
              ? 'bg-[#252525] border-[#FFB800] text-white'
              : 'bg-[#1E1E1E] border-[#3A3A3A] text-white hover:border-[#4A4A4A]'
          }
        `}
      >
        <span className={selected.length === 0 ? 'text-[#6E6E6E]' : 'text-white truncate'}>
          {selected.length === 0
            ? placeholder
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selecionados`
          }
        </span>
        <ChevronDown size={16} className={`text-[#6E6E6E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-[#3A3A3A]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-[#252525] border border-[#3A3A3A] rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-[#6E6E6E] focus:outline-none focus:border-[#FFB800]"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-[#FFB800]" />
                  <span className="ml-2 text-[#6E6E6E] text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-[#6E6E6E] text-xs text-center py-4">Nenhum resultado</p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selected.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => onToggle(item)}
                      className={`
                        w-full flex items-start gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'text-white hover:bg-[#252525]'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected ? 'bg-[#FFB800] border-[#FFB800]' : 'border-[#4A4A4A]'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="break-words whitespace-normal leading-tight">{item}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-[#3A3A3A] flex justify-between items-center">
                <span className="text-[#6E6E6E] text-xs">{selected.length} selecionado(s)</span>
                <button
                  onClick={() => { onClear(); setSearch(''); }}
                  className="text-[#E74C3C] text-xs hover:underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PracticePage() {
  const location = useLocation();
  const { user, profile, fetchProfile } = useAuthStore();
  const { incrementStats } = useUserStore();
  const { addToast } = useUIStore();
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
  const [autoStartPending, setAutoStartPending] = useState(false);

  // Estado do modo (agora 'selection', 'practicing' ou 'results')
  const [mode, setMode] = useState<'selection' | 'practicing' | 'results'>('selection');

  // Controle de tempo da sessão
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

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

  // Carregar cadernos
  useEffect(() => {
    if (user?.id) {
      loadNotebooks();
    }
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
    const materiaParam = searchParams.get('materia');
    const materiasParam = searchParams.get('materias');
    const assuntoParam = searchParams.get('assunto');
    const assuntosParam = searchParams.get('assuntos');
    const bancaParam = searchParams.get('banca');

    // Parsear arrays para verificação
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

    if (autoStartPending && !isLoadingFilters && !isLoadingCount && filtersApplied) {
      console.log('[PracticePage] Auto-iniciando prática com filtros dos query params:', {
        materia: filters.materia,
        assunto: filters.assunto,
        banca: filters.banca
      });
      setAutoStartPending(false);
      startPractice();
    }
  }, [autoStartPending, isLoadingFilters, isLoadingCount, filters, searchParams]);

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
      // Consumir bateria por criar caderno
      const prep = getSelectedPreparatorio();
      const prepIdToUse = prep?.preparatorio_id || userPreparatorios[0]?.preparatorio_id;
      if (prepIdToUse) {
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
        console.log('[PracticePage] Buscando questões do banco. Filtros:', {
          materias: filters.materia,
          assuntos: filters.assunto,
          bancas: filters.banca,
          questionCount
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
          limit: questionCount,
          shuffle: true,
        });
        console.log('[PracticePage] Questões recebidas:', dbQuestions.length);

        if (dbQuestions.length > 0) {
          questionsToUse = dbQuestions;
        } else {
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
      addToast('error', 'Erro ao carregar questoes.');
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

    // Consumir bateria por responder a questão
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
        console.log('[PracticePage] Bateria insuficiente para responder questão');
        return; // Modal será aberto automaticamente pelo store
      }
    }

    setAnswers(new Map(answers.set(question.id, { letter, correct: isCorrect })));
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

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

    // Save answer to database for statistics
    saveUserAnswer({
      questionId: question.id,
      selectedAlternative: letter,
      isCorrect: isCorrect,
    }, user?.id);
  };

  const handleRateDifficulty = (difficulty: DifficultyRating) => {
    const question = questions[currentIndex];
    if (user?.id) {
      saveDifficultyRating(question.id, difficulty, user.id);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finalizar sessão
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;

      // Calculate XP earned based on gamification settings
      const isHardMode = studyMode === 'hard';
      const xpPerCorrect = gamificationSettings
        ? (isHardMode ? gamificationSettings.xp_per_correct_hard_mode : gamificationSettings.xp_per_correct_answer)
        : (isHardMode ? 100 : 50);
      const xpEarned = sessionStats.correct * xpPerCorrect;

      // Salvar sessão no banco de dados
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

      // Mostrar tela de resultados
      setMode('results');
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
        setMode('selection');
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
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
        <div className="p-4 border-b border-[#3A3A3A] bg-[#1A1A1A]">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-[#252525] transition-colors">
              <ChevronLeft size={24} className="text-[#A0A0A0]" />
            </button>
            <Progress value={((currentIndex + 1) / questions.length) * 100} size="md" className="flex-1" />
            <span className="text-[#A0A0A0] text-sm font-medium">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="text-[#2ECC71]">✓ {sessionStats.correct}</span>
            <span className="text-[#E74C3C]">✗ {sessionStats.total - sessionStats.correct}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
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
          onConfirm={() => setMode('selection')}
          title="Sair da Prática?"
          message="Você tem progresso não salvo. Se sair agora, suas respostas serão perdidas."
          confirmText="Sair"
          cancelText="Continuar"
          variant="danger"
          icon="exit"
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
  // RENDER: DASHBOARD "COCKPIT"
  // ==========================================
  return (
    <div className="min-h-screen bg-[#121212] px-2 py-4 md:p-8 lg:p-12 font-sans text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {editingNotebook ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#FFB800]/10 rounded-lg">
                  <PenLine size={24} className="text-[#FFB800]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-[#A0A0A0] bg-clip-text text-transparent">
                  Edição - {editingNotebook.title}
                </h1>
              </div>
              <p className="text-sm md:text-base text-[#A0A0A0] font-medium">
                Edite os parâmetros do seu caderno e depois clique em Salvar.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-[#A0A0A0] bg-clip-text text-transparent">
                Painel de Prática
              </h1>
              <p className="text-sm md:text-base text-[#A0A0A0] font-medium">
                Configure seu treino personalizado ou retome seus cadernos.
              </p>
            </>
          )}
        </motion.div>

        {/* User Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex items-center gap-6 bg-[#1E1E1E]/50 border border-[#3A3A3A] p-3 rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-[#FFB800]/10 rounded-lg">
              <Zap size={20} className="text-[#FFB800]" />
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Nível</p>
              <p className="font-bold text-lg leading-none">{profile?.level || 1}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[#3A3A3A]" />
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-[#2ECC71]/10 rounded-lg">
              <CheckCircle size={20} className="text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Acertos</p>
              <p className="font-bold text-lg leading-none">{profile?.correct_answers || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 lg:gap-8">

        {/* LEFT COLUMN: Configuration */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Editing: Title and Description */}
                {editingNotebook && (
                  <section>
                    <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <PenLine size={14} /> Dados do Caderno
                    </h3>
                    <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-2xl p-5 space-y-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Nome do Caderno</label>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Nome do caderno"
                          className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Descrição (opcional)</label>
                        <textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Descrição do caderno"
                          rows={2}
                          className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Filters */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2">
                      <Filter size={14} /> Filtros
                    </h3>
                    <button onClick={clearFilters} className="text-xs text-[#E74C3C] hover:underline font-medium">
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelectDropdown
                        label="Matérias"
                        icon={<BookOpen size={16} />}
                        items={availableMaterias}
                        selected={filters.materia}
                        onToggle={(item) => toggleFilter('materia', item)}
                        onClear={() => setFilters(prev => ({ ...prev, materia: [] }))}
                        placeholder="Selecione matérias..."
                      />
                      <MultiSelectDropdown
                        label="Bancas"
                        icon={<Building2 size={16} />}
                        items={availableBancas}
                        selected={filters.banca}
                        onToggle={(item) => toggleFilter('banca', item)}
                        onClear={() => setFilters(prev => ({ ...prev, banca: [] }))}
                        placeholder="Selecione bancas..."
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
                        label="Órgãos"
                        icon={<Building2 size={16} />}
                        items={availableOrgaos}
                        selected={filters.orgao}
                        onToggle={(item) => toggleFilter('orgao', item)}
                        onClear={() => setFilters(prev => ({ ...prev, orgao: [] }))}
                        placeholder="Selecione órgãos..."
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
                        label="Cargos"
                        icon={<Briefcase size={16} />}
                        items={availableCargos}
                        selected={filters.cargo}
                        onToggle={(item) => toggleFilter('cargo', item)}
                        onClear={() => setFilters(prev => ({ ...prev, cargo: [] }))}
                        placeholder="Selecione cargos..."
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
                  </div>
                </section>

                {/* 3. Quantity Slider */}
                <section>
                  <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <SlidersHorizontal size={14} /> Quantidade
                  </h3>
                  <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">Questões por sessão</span>
                      <span className="text-2xl font-bold text-[#FFB800]">{questionCount}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full h-2 bg-[#3A3A3A] rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                    />
                    <div className="flex justify-between mt-2 text-xs text-[#6E6E6E] font-medium">
                      <span>5</span>
                      <span>60</span>
                      <span>120</span>
                    </div>
                  </div>
                </section>
        </div>

        {/* RIGHT COLUMN: Stats & Action (Sticky) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-8 space-y-6">

            {/* Action Card */}
            <Card className="border border-[#FFB800]/20 bg-[#1E1E1E] shadow-2xl shadow-black/50 p-6 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <h3 className="text-lg font-bold text-white mb-4">
                {editingNotebook ? 'Parâmetros do Caderno' : 'Resumo do Treino'}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0A0A0]">Questões disponíveis</span>
                  {isLoadingCount ? (
                    <Loader2 size={14} className="animate-spin text-[#FFB800]" />
                  ) : (
                    <span className="font-bold text-white">{filteredCount.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0A0A0]">Filtros ativos</span>
                  <span className="font-bold text-[#FFB800]">{totalFilters}</span>
                </div>
                <div className="h-px bg-[#3A3A3A] my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0A0A0]">Seleção atual</span>
                  <span className="font-bold text-white">{questionCount} questões</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#A0A0A0]">Modo de Estudo</span>
                  {/* Toggle entre Zen e Simulado */}
                  <button
                    onClick={() => setStudyMode(studyMode === 'zen' ? 'hard' : 'zen')}
                    className="relative inline-flex items-center h-7 rounded-full w-36 bg-[#252525] border border-[#3A3A3A] transition-colors"
                  >
                    <span
                      className={`absolute inline-flex items-center justify-center h-6 rounded-full text-xs font-bold transition-all duration-300 ${
                        studyMode === 'zen'
                          ? 'left-0.5 w-[calc(50%-0.25rem)] bg-[#2ECC71] text-black'
                          : 'left-[calc(50%+0.125rem)] w-[calc(50%-0.25rem)] bg-[#E74C3C] text-black'
                      }`}
                    >
                      {studyMode === 'zen' ? 'Zen' : 'Simulado'}
                    </span>
                  </button>
                </div>
              </div>

              {editingNotebook ? (
                <>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => handleSaveEditedNotebook(false)}
                    disabled={isSavingNotebook || isLoadingFilters || !editingTitle.trim()}
                    className="mb-3 bg-gradient-to-r from-[#FFB800] to-[#E5A600] text-black font-extrabold hover:shadow-lg hover:shadow-[#FFB800]/20 transition-all transform hover:scale-[1.02]"
                    leftIcon={<Save size={20} />}
                  >
                    {isSavingNotebook ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    size="lg"
                    onClick={() => handleSaveEditedNotebook(true)}
                    disabled={isSavingNotebook || isLoadingFilters || filteredCount === 0 || !editingTitle.trim()}
                    rightIcon={<Play size={18} fill="currentColor" />}
                  >
                    Salvar e Iniciar
                  </Button>
                  <button
                    onClick={handleCancelEdit}
                    className="w-full mt-3 text-sm text-[#6E6E6E] hover:text-white transition-colors"
                  >
                    Cancelar edição
                  </button>
                </>
              ) : (
                <>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={startPractice}
                    disabled={isLoading || isLoadingFilters || filteredCount === 0}
                    className="mb-3 bg-gradient-to-r from-[#FFB800] to-[#E5A600] text-black font-extrabold hover:shadow-lg hover:shadow-[#FFB800]/20 transition-all transform hover:scale-[1.02]"
                    rightIcon={<Play size={20} fill="currentColor" />}
                  >
                    INICIAR PRÁTICA
                  </Button>

                  <Button
                    fullWidth
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowSaveNotebookModal(true)}
                    leftIcon={<Save size={18} />}
                  >
                    Salvar como Caderno
                  </Button>
                </>
              )}
            </Card>

            {/* Quick Tips or Last Session */}
            <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#3A3A3A]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#121212] rounded-lg">
                  <GraduationCap size={18} className="text-[#A0A0A0]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Dica do Dia</h4>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    Alterne entre o Modo Zen para aprender com os comentários e o Modo Simulado para treinar seu tempo de prova.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal Salvar Caderno */}
      <AnimatePresence>
        {showSaveNotebookModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveNotebookModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[114px] left-0 right-0 mx-4 w-auto max-w-md bg-[#252525] rounded-3xl p-8 shadow-2xl z-50 border border-[#3A3A3A] lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#FFB800]/10 rounded-xl">
                  <Save size={24} className="text-[#FFB800]" />
                </div>
                <h3 className="text-2xl font-bold text-white">Salvar Caderno</h3>
              </div>

              <div className="mb-4">
                <label className="text-[#A0A0A0] text-sm font-bold uppercase tracking-wider mb-2 block">Nome do Caderno</label>
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="Ex: Constitucional - Revisão CPC"
                  className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="text-[#A0A0A0] text-sm font-bold uppercase tracking-wider mb-2 block">Descrição (opcional)</label>
                <textarea
                  value={newNotebookDescription}
                  onChange={(e) => setNewNotebookDescription(e.target.value)}
                  placeholder="Ex: Questões de revisão para a prova da PF"
                  rows={2}
                  className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors resize-none"
                />
              </div>

              <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 space-y-2 border border-[#3A3A3A]">
                <div className="flex justify-between text-xs text-[#A0A0A0]">
                  <span>Filtros ativos:</span>
                  <span className="text-white">{totalFilters}</span>
                </div>
                <div className="flex justify-between text-xs text-[#A0A0A0]">
                  <span>Questões disponíveis:</span>
                  <span className="text-white">{filteredCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-[#A0A0A0]">
                  <span>Questões por sessão:</span>
                  <span className="text-white">{questionCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => setShowSaveNotebookModal(false)}
                  className="rounded-xl py-3 border-[#3A3A3A] hover:bg-[#333]"
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  onClick={handleSaveNotebook}
                  disabled={!newNotebookName.trim() || isSavingNotebook || isLoadingCount}
                  className="rounded-xl py-3 bg-[#FFB800] text-black font-bold hover:bg-[#E5A600]"
                >
                  {isSavingNotebook ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Caderno'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Visualizar Filtros do Caderno */}
      <AnimatePresence>
        {viewingNotebookFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingNotebookFilters(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[114px] left-0 right-0 mx-4 w-auto max-w-2xl bg-[#1A1A1A] rounded-2xl border border-[#3A3A3A] p-4 lg:p-6 z-50 shadow-2xl max-h-[calc(100vh-180px)] overflow-y-auto lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-base lg:text-xl font-bold text-white pr-2">Filtros de "{viewingNotebookFilters.title}"</h3>
                <button
                  onClick={() => setViewingNotebookFilters(null)}
                  className="p-2 text-[#6E6E6E] hover:text-white hover:bg-[#252525] rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
                {/* Matérias */}
                {viewingNotebookFilters.filters?.materia && viewingNotebookFilters.filters.materia.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Matérias ({viewingNotebookFilters.filters.materia.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.materia.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assuntos */}
                {viewingNotebookFilters.filters?.assunto && viewingNotebookFilters.filters.assunto.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Assuntos ({viewingNotebookFilters.filters.assunto.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.assunto.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bancas */}
                {viewingNotebookFilters.filters?.banca && viewingNotebookFilters.filters.banca.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Bancas ({viewingNotebookFilters.filters.banca.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.banca.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Órgãos */}
                {viewingNotebookFilters.filters?.orgao && viewingNotebookFilters.filters.orgao.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Órgãos ({viewingNotebookFilters.filters.orgao.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.orgao.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anos */}
                {viewingNotebookFilters.filters?.ano && viewingNotebookFilters.filters.ano.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Anos ({viewingNotebookFilters.filters.ano.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.ano.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cargos */}
                {viewingNotebookFilters.filters?.cargo && viewingNotebookFilters.filters.cargo.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Cargos ({viewingNotebookFilters.filters.cargo.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.cargo.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Escolaridade */}
                {viewingNotebookFilters.filters?.escolaridade && viewingNotebookFilters.filters.escolaridade.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Escolaridade ({viewingNotebookFilters.filters.escolaridade.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.escolaridade.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modalidade */}
                {viewingNotebookFilters.filters?.modalidade && viewingNotebookFilters.filters.modalidade.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Modalidade ({viewingNotebookFilters.filters.modalidade.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.modalidade.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dificuldade */}
                {viewingNotebookFilters.filters?.dificuldade && viewingNotebookFilters.filters.dificuldade.length > 0 && (
                  <div>
                    <h4 className="text-xs lg:text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Dificuldade ({viewingNotebookFilters.filters.dificuldade.length})</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {viewingNotebookFilters.filters.dificuldade.map((item, idx) => (
                        <span key={idx} className="bg-[#252525] border border-[#3A3A3A] px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-xs lg:text-sm text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => handleEditNotebookFilters(viewingNotebookFilters)}
                  className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold text-sm lg:text-lg"
                  leftIcon={<Edit size={16} className="lg:w-[18px] lg:h-[18px]" />}
                >
                  Editar
                </Button>
                <button
                  onClick={(e) => {
                    handleDeleteNotebook(viewingNotebookFilters.id, e);
                    setViewingNotebookFilters(null);
                  }}
                  className="flex items-center justify-center w-12 h-12 bg-[#252525] border border-[#3A3A3A] rounded-lg text-[#E74C3C] hover:bg-[#E74C3C]/10 hover:border-[#E74C3C]/50 transition-colors flex-shrink-0"
                  title="Excluir caderno"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
    </div>
  );
}