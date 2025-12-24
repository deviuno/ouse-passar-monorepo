import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Button, Card, Progress } from '../components/ui';
import { QuestionCard } from '../components/question';
import { MentorChat } from '../components/question/MentorChat';
import { FloatingChatButton } from '../components/ui';
import { ParsedQuestion, RawQuestion, StudyMode, Alternative } from '../types';
import { MOCK_QUESTIONS } from '../constants';
import { useUserStore, useUIStore } from '../stores';
import { useAuthStore } from '../stores/useAuthStore';
import {
  fetchQuestions,
  fetchFilterOptions,
  fetchAssuntosByMaterias,
  getQuestionsCount,
  parseRawQuestion,
  OPTIONS_ESCOLARIDADE,
  OPTIONS_MODALIDADE,
  OPTIONS_DIFICULDADE,
} from '../services/questionsService';
import {
  createNotebook,
  getUserNotebooks,
  deleteNotebook,
} from '../services/notebooksService';
import { Caderno } from '../types';
import {
  saveUserAnswer,
  saveDifficultyRating,
  DifficultyRating,
} from '../services/questionFeedbackService';

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
            <div className="max-h-[200px] overflow-y-auto">
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
                        w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'text-white hover:bg-[#252525]'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-[#FFB800] border-[#FFB800]' : 'border-[#4A4A4A]'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="truncate">{item}</span>
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
  const { user, profile } = useAuthStore();
  const { incrementStats } = useUserStore();
  const { addToast } = useUIStore();

  // Estado do dashboard
  const [activeTab, setActiveTab] = useState<'new' | 'notebooks'>('new');

  // Estado do modo (agora apenas 'selection' ou 'practicing')
  const [mode, setMode] = useState<'selection' | 'practicing'>('selection');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Dados do banco
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [availableMaterias, setAvailableMaterias] = useState<string[]>(DEFAULT_MATERIAS);
  const [availableAssuntos, setAvailableAssuntos] = useState<string[]>([]);
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

  // Modo de estudo
  const [studyMode, setStudyMode] = useState<StudyMode>('zen');

  // Estado da sessao de pratica
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { letter: string; correct: boolean }>>(new Map());
  const [showMentorChat, setShowMentorChat] = useState(false);

  // Estatisticas da sessao
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  // Notebooks (Cadernos)
  const [notebooks, setNotebooks] = useState<Caderno[]>([]);
  const [showSaveNotebookModal, setShowSaveNotebookModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [isSavingNotebook, setIsSavingNotebook] = useState(false);

  // Carregar cadernos
  useEffect(() => {
    if (user?.id) {
      loadNotebooks();
    }
  }, [user?.id]);

  const loadNotebooks = async () => {
    if (!user?.id) return;
    const data = await getUserNotebooks(user.id);
    setNotebooks(data);
  };

  const handleSaveNotebook = async () => {
    if (!user?.id || !newNotebookName.trim()) return;

    setIsSavingNotebook(true);
    try {
      const settings = {
        questionCount,
        studyMode,
        toggleFilters
      };

      const newNotebook = await createNotebook(user.id, newNotebookName, filters, settings);

      if (newNotebook) {
        setNotebooks(prev => [newNotebook, ...prev]);
        setShowSaveNotebookModal(false);
        setNewNotebookName('');
        addToast('success', 'Caderno salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar caderno:', error);
      addToast('error', 'Erro ao salvar caderno.');
    } finally {
      setIsSavingNotebook(false);
    }
  };

  const handleLoadNotebook = (notebook: Caderno) => {
    if (notebook.filters) setFilters(notebook.filters);
    if (notebook.settings) {
      if (notebook.settings.questionCount) setQuestionCount(notebook.settings.questionCount);
      if (notebook.settings.studyMode) setStudyMode(notebook.settings.studyMode);
      if (notebook.settings.toggleFilters) setToggleFilters(notebook.settings.toggleFilters);
    }

    // Switch to practice mode setup or just selection stats
    setMode('selection');
    addToast('success', `Caderno "${notebook.name}" carregado!`);
  };

  const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir este caderno?')) return;

    const success = await deleteNotebook(id);
    if (success) {
      setNotebooks(prev => prev.filter(n => n.id !== id));
      addToast('success', 'Caderno excluido.');
    }
  };

  // Carregar opcoes de filtro ao montar
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingFilters(true);
      try {
        const [filterOptions, count] = await Promise.all([fetchFilterOptions(), getQuestionsCount()]);

        if (count > 0) {
          setTotalQuestions(count);
          setFilteredCount(count);
          setAvailableMaterias(filterOptions.materias.length > 0 ? filterOptions.materias : DEFAULT_MATERIAS);
          setAvailableBancas(filterOptions.bancas.length > 0 ? filterOptions.bancas : DEFAULT_BANCAS);
          setAvailableOrgaos(filterOptions.orgaos.length > 0 ? filterOptions.orgaos : DEFAULT_ORGAOS);
          setAvailableCargos(filterOptions.cargos || []);
          setAvailableAnos(filterOptions.anos.length > 0 ? filterOptions.anos.map(String) : DEFAULT_ANOS);
          setUsingMockData(false);
        } else {
          setTotalQuestions(MOCK_QUESTIONS.length);
          setFilteredCount(MOCK_QUESTIONS.length);
          setUsingMockData(true);
        }
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        setTotalQuestions(MOCK_QUESTIONS.length);
        setFilteredCount(MOCK_QUESTIONS.length);
        setUsingMockData(true);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Carregar assuntos quando materias sao selecionadas
  useEffect(() => {
    const loadAssuntos = async () => {
      if (filters.materia.length === 0) {
        setAvailableAssuntos([]);
        if (filters.assunto.length > 0) {
          setFilters((prev) => ({ ...prev, assunto: [] }));
        }
        return;
      }

      setIsLoadingAssuntos(true);
      try {
        const assuntos = await fetchAssuntosByMaterias(filters.materia);
        setAvailableAssuntos(assuntos);
        setFilters((prev) => ({
          ...prev,
          assunto: prev.assunto.filter((a) => assuntos.includes(a)),
        }));
      } catch (error) {
        console.error('Erro ao carregar assuntos:', error);
        setAvailableAssuntos([]);
      } finally {
        setIsLoadingAssuntos(false);
      }
    };

    loadAssuntos();
  }, [filters.materia]);

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
    setIsLoading(true);

    try {
      let questionsToUse: ParsedQuestion[] = [];

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
        if (filtered.length === 0) {
          filtered = [...MOCK_QUESTIONS];
        }
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        questionsToUse = shuffled.slice(0, Math.min(questionCount, shuffled.length)).map(parseRawQuestion);
      } else {
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

        if (dbQuestions.length > 0) {
          questionsToUse = dbQuestions;
        } else {
          addToast('info', 'Nenhuma questao encontrada. Usando questoes de exemplo.');
          const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
          questionsToUse = shuffled.slice(0, questionCount).map(parseRawQuestion);
        }
      }

      setQuestions(questionsToUse);
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setMode('practicing');
    } catch (error) {
      console.error('Erro ao carregar questoes:', error);
      addToast('error', 'Erro ao carregar questoes.');
      const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, questionCount).map(parseRawQuestion));
      setCurrentIndex(0);
      setAnswers(new Map());
      setSessionStats({ correct: 0, total: 0 });
      setMode('practicing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (letter: string) => {
    const question = questions[currentIndex];
    const isCorrect = letter === question.gabarito;
    setAnswers(new Map(answers.set(question.id, { letter, correct: isCorrect })));
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    incrementStats({
      correctAnswers: isCorrect ? 1 : 0,
      totalAnswered: 1,
      xp: isCorrect ? 10 : 2,
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
      addToast('success', `Sessao finalizada! ${sessionStats.correct}/${sessionStats.total} (${accuracy}%)`);
      setMode('selection');
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
        if (confirm('Sair? Seu progresso sera perdido.')) {
          setMode('selection');
        }
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
        />

        {/* Floating Chat Button */}
        <FloatingChatButton
          isOpen={showMentorChat}
          onClick={() => setShowMentorChat(!showMentorChat)}
          sidebarWidth={0}
        />
      </div>
    );
  }

  // Tela de filtros


  // ==========================================
  // RENDER: DASHBOARD "COCKPIT"
  // ==========================================
  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8 lg:p-12 font-sans text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-[#A0A0A0] bg-clip-text text-transparent">
            Painel de Prática
          </h1>
          <p className="text-[#A0A0A0] font-medium">
            Configure seu treino personalizado ou retome seus cadernos.
          </p>
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

          {/* Tabs Navigation */}
          <div className="flex items-center gap-6 border-b border-[#3A3A3A] mb-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'new'
                ? 'text-[#FFB800] border-[#FFB800]'
                : 'text-[#6E6E6E] border-transparent hover:text-white'
                }`}
            >
              Nova Prática
            </button>
            <button
              onClick={() => setActiveTab('notebooks')}
              className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'notebooks'
                ? 'text-[#FFB800] border-[#FFB800]'
                : 'text-[#6E6E6E] border-transparent hover:text-white'
                }`}
            >
              Meus Cadernos ({notebooks.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'new' ? (
              <motion.div
                key="tab-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 1. Study Mode Selection */}
                <section>
                  <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Coffee size={14} /> Modo de Estudo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setStudyMode('zen')}
                      className={`relative overflow-hidden group p-5 rounded-2xl border-2 transition-all text-left ${studyMode === 'zen'
                        ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                        : 'border-[#333] bg-[#1E1E1E] hover:border-[#4A4A4A]'
                        }`}
                    >
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <div className={`p-2 rounded-lg inline-flex mb-3 ${studyMode === 'zen' ? 'bg-[#2ECC71]/20' : 'bg-[#252525]'}`}>
                            <Coffee size={20} className={studyMode === 'zen' ? 'text-[#2ECC71]' : 'text-[#A0A0A0]'} />
                          </div>
                          <h4 className={`font-bold text-lg ${studyMode === 'zen' ? 'text-white' : 'text-[#E0E0E0]'}`}>Modo Zen</h4>
                          <p className="text-sm text-[#A0A0A0] mt-1">Sem pressão de tempo. Resposta imediata e comentários.</p>
                        </div>
                        {studyMode === 'zen' && <div className="bg-[#2ECC71] rounded-full p-1"><Check size={12} className="text-black" /></div>}
                      </div>
                    </button>

                    <button
                      onClick={() => setStudyMode('hard')}
                      className={`relative overflow-hidden group p-5 rounded-2xl border-2 transition-all text-left ${studyMode === 'hard'
                        ? 'border-[#E74C3C] bg-[#E74C3C]/10'
                        : 'border-[#333] bg-[#1E1E1E] hover:border-[#4A4A4A]'
                        }`}
                    >
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <div className={`p-2 rounded-lg inline-flex mb-3 ${studyMode === 'hard' ? 'bg-[#E74C3C]/20' : 'bg-[#252525]'}`}>
                            <Timer size={20} className={studyMode === 'hard' ? 'text-[#E74C3C]' : 'text-[#A0A0A0]'} />
                          </div>
                          <h4 className={`font-bold text-lg ${studyMode === 'hard' ? 'text-white' : 'text-[#E0E0E0]'}`}>Modo Simulado</h4>
                          <p className="text-sm text-[#A0A0A0] mt-1">Com cronômetro (3m/questão). Gabarito apenas ao final.</p>
                        </div>
                        {studyMode === 'hard' && <div className="bg-[#E74C3C] rounded-full p-1"><Check size={12} className="text-black" /></div>}
                      </div>
                    </button>
                  </div>
                </section>

                {/* 2. Filters */}
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
                      <MultiSelectDropdown
                        label="Assuntos"
                        icon={<FileText size={16} />}
                        items={availableAssuntos}
                        selected={filters.assunto}
                        onToggle={(item) => toggleFilter('assunto', item)}
                        onClear={() => setFilters(prev => ({ ...prev, assunto: [] }))}
                        placeholder={filters.materia.length === 0 ? 'Selecione matérias primeiro' : 'Selecione assuntos...'}
                        isLoading={isLoadingAssuntos}
                        disabled={filters.materia.length === 0}
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
                        items={OPTIONS_ESCOLARIDADE}
                        selected={filters.escolaridade}
                        onToggle={(item) => toggleFilter('escolaridade', item)}
                        onClear={() => setFilters(prev => ({ ...prev, escolaridade: [] }))}
                        placeholder="Selecione escolaridade..."
                      />
                      <MultiSelectDropdown
                        label="Modalidade"
                        icon={<CheckCircle size={16} />}
                        items={OPTIONS_MODALIDADE}
                        selected={filters.modalidade}
                        onToggle={(item) => toggleFilter('modalidade', item)}
                        onClear={() => setFilters(prev => ({ ...prev, modalidade: [] }))}
                        placeholder="Selecione modalidade..."
                      />
                      <MultiSelectDropdown
                        label="Dificuldade"
                        icon={<Zap size={16} />}
                        items={OPTIONS_DIFICULDADE}
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

              </motion.div>
            ) : (
              <motion.div
                key="tab-notebooks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Notebooks Grid */}
                {notebooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#3A3A3A] rounded-2xl bg-[#1E1E1E]/50">
                    <BookOpen size={48} className="text-[#3A3A3A] mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Sem cadernos ainda</h3>
                    <p className="text-[#A0A0A0] text-center max-w-xs mb-6">
                      Configure filtros na aba "Nova Prática" e salve para acessar rapidamente aqui.
                    </p>
                    <button
                      onClick={() => setActiveTab('new')}
                      className="text-[#FFB800] hover:underline font-bold"
                    >
                      Criar meu primeiro caderno
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notebooks.map((notebook) => (
                      <div
                        key={notebook.id}
                        className="group relative bg-[#1E1E1E] border border-[#3A3A3A] hover:border-[#FFB800] rounded-2xl p-5 transition-all hover:bg-[#252525] cursor-pointer"
                        onClick={() => handleLoadNotebook(notebook)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-[#FFB800]/10 rounded-lg text-[#FFB800]">
                            <BookOpen size={20} />
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                            className="p-2 text-[#6E6E6E] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h4 className="font-bold text-lg text-white mb-1 group-hover:text-[#FFB800] transition-colors">{notebook.name}</h4>
                        <div className="flex flex-wrap gap-2 text-xs text-[#A0A0A0] mt-3">
                          <span className="bg-[#121212] px-2 py-1 rounded border border-[#333]">
                            {notebook.filters?.materia?.length || 0} matérias
                          </span>
                          <span className="bg-[#121212] px-2 py-1 rounded border border-[#333]">
                            {notebook.settings?.questionCount || 10} questões
                          </span>
                          <span className="bg-[#121212] px-2 py-1 rounded border border-[#333]">
                            {notebook.settings?.studyMode === 'zen' ? 'Zen' : 'Simulado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Stats & Action (Sticky) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-8 space-y-6">

            {/* Action Card */}
            <Card className="border border-[#FFB800]/20 bg-[#1E1E1E] shadow-2xl shadow-black/50 p-6 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <h3 className="text-lg font-bold text-white mb-4">Resumo do Treino</h3>

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
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0A0A0]">Modo</span>
                  <span className="font-bold uppercase text-[#FFB800]">{studyMode === 'zen' ? 'Zen' : 'Simulado'}</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={startPractice}
                disabled={isLoading || isLoadingFilters || filteredCount === 0}
                className="mb-3 bg-gradient-to-r from-[#FFB800] to-[#E5A600] text-black font-extrabold hover:shadow-lg hover:shadow-[#FFB800]/20 transition-all transform hover:scale-[1.02]"
                rightIcon={isLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
              >
                {isLoading ? ' Preparando...' : 'INICIAR PRÁTICA'}
              </Button>

              {activeTab === 'new' && (
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => setShowSaveNotebookModal(true)}
                  className="text-xs border-[#3A3A3A] hover:bg-[#252525] text-[#A0A0A0]"
                  leftIcon={<Save size={14} />}
                >
                  Salvar como Caderno
                </Button>
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
              initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
              className="fixed left-1/2 top-1/2 w-full max-w-md bg-[#252525] rounded-3xl p-8 shadow-2xl z-50 border border-[#3A3A3A]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#FFB800]/10 rounded-xl">
                  <Save size={24} className="text-[#FFB800]" />
                </div>
                <h3 className="text-2xl font-bold text-white">Salvar Caderno</h3>
              </div>

              <div className="mb-6">
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

              <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 space-y-2 border border-[#3A3A3A]">
                <div className="flex justify-between text-xs text-[#A0A0A0]">
                  <span>Filtros ativos:</span>
                  <span className="text-white">{totalFilters}</span>
                </div>
                <div className="flex justify-between text-xs text-[#A0A0A0]">
                  <span>Questões selecionadas:</span>
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
                  disabled={!newNotebookName.trim() || isSavingNotebook}
                  className="rounded-xl py-3 bg-[#FFB800] text-black font-bold hover:bg-[#E5A600]"
                >
                  {isSavingNotebook ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Caderno'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}