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
} from '../services/questionsService';
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
  const { user } = useAuthStore();
  const { incrementStats } = useUserStore();
  const { addToast } = useUIStore();

  // Estado do modo
  const [mode, setMode] = useState<'selection' | 'filters' | 'practicing'>('selection');

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
    setFilters({ materia: [], assunto: [], banca: [], orgao: [], cargo: [], ano: [] });
    setToggleFilters({ apenasRevisadas: false, apenasComComentario: false });
  };

  const totalFilters =
    filters.materia.length +
    filters.assunto.length +
    filters.banca.length +
    filters.orgao.length +
    filters.cargo.length +
    filters.ano.length +
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

  const handleBack = () => {
    if (mode === 'practicing') {
      if (answers.size > 0) {
        if (confirm('Sair? Seu progresso sera perdido.')) {
          setMode('selection');
        }
      } else {
        setMode('selection');
      }
    } else if (mode === 'filters') {
      setMode('selection');
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
            onOpenTutor={() => setShowMentorChat(true)}
            onAnswer={handleAnswer}
            onRateDifficulty={handleRateDifficulty}
            onTimeout={studyMode === 'hard' ? handleTimeout : undefined}
            studyMode={studyMode}
            initialTime={studyMode === 'hard' ? 3 : undefined}
            userId={user?.id}
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
        />
      </div>
    );
  }

  // Tela de filtros
  if (mode === 'filters') {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#121212] border-b border-[#3A3A3A]">
          <div className="flex items-center justify-between p-4">
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-[#252525] transition-colors">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-white font-bold text-lg">Filtrar Questoes</h1>
            <button onClick={clearFilters} className="text-[#E74C3C] text-sm font-medium">
              Limpar
            </button>
          </div>

          {/* Contador de questoes */}
          <div className="px-4 pb-4">
            <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoadingCount ? (
                  <Loader2 size={20} className="animate-spin text-[#FFB800]" />
                ) : (
                  <span className="text-xl font-bold text-white">{filteredCount.toLocaleString()}</span>
                )}
                <span className="text-[#6E6E6E] text-sm">
                  {totalFilters > 0 ? `de ${totalQuestions.toLocaleString()} questoes` : 'questoes disponiveis'}
                </span>
              </div>
              {totalFilters > 0 && (
                <span className="px-2 py-1 bg-[#FFB800] text-black text-xs font-bold rounded">
                  {totalFilters} filtros
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filtros em Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {/* Grid de dropdowns - 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MultiSelectDropdown
              label="Materias"
              icon={<BookOpen size={16} />}
              items={availableMaterias}
              selected={filters.materia}
              onToggle={(item) => toggleFilter('materia', item)}
              onClear={() => setFilters(prev => ({ ...prev, materia: [] }))}
              placeholder="Todas as materias"
            />

            <MultiSelectDropdown
              label="Assuntos"
              icon={<FileText size={16} />}
              items={availableAssuntos}
              selected={filters.assunto}
              onToggle={(item) => toggleFilter('assunto', item)}
              onClear={() => setFilters(prev => ({ ...prev, assunto: [] }))}
              placeholder={filters.materia.length === 0 ? 'Selecione materias primeiro' : 'Todos os assuntos'}
              isLoading={isLoadingAssuntos}
              disabled={filters.materia.length === 0}
            />

            <MultiSelectDropdown
              label="Orgaos"
              icon={<Building2 size={16} />}
              items={availableOrgaos}
              selected={filters.orgao}
              onToggle={(item) => toggleFilter('orgao', item)}
              onClear={() => setFilters(prev => ({ ...prev, orgao: [] }))}
              placeholder="Todos os orgaos"
            />

            <MultiSelectDropdown
              label="Cargos"
              icon={<Briefcase size={16} />}
              items={availableCargos}
              selected={filters.cargo}
              onToggle={(item) => toggleFilter('cargo', item)}
              onClear={() => setFilters(prev => ({ ...prev, cargo: [] }))}
              placeholder="Todos os cargos"
            />

            <MultiSelectDropdown
              label="Bancas"
              icon={<GraduationCap size={16} />}
              items={availableBancas}
              selected={filters.banca}
              onToggle={(item) => toggleFilter('banca', item)}
              onClear={() => setFilters(prev => ({ ...prev, banca: [] }))}
              placeholder="Todas as bancas"
            />

            <MultiSelectDropdown
              label="Anos"
              icon={<Calendar size={16} />}
              items={availableAnos}
              selected={filters.ano}
              onToggle={(item) => toggleFilter('ano', item)}
              onClear={() => setFilters(prev => ({ ...prev, ano: [] }))}
              placeholder="Todos os anos"
            />
          </div>

          {/* Filtros de Qualidade - Toggle switches em linha */}
          <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#FFB800]" />
              Filtros de Qualidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Apenas Revisadas */}
              <button
                onClick={() => setToggleFilters(prev => ({ ...prev, apenasRevisadas: !prev.apenasRevisadas }))}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  toggleFilters.apenasRevisadas
                    ? 'bg-[#2ECC71]/10 border border-[#2ECC71]'
                    : 'bg-[#252525] border border-[#3A3A3A] hover:border-[#4A4A4A]'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  toggleFilters.apenasRevisadas ? 'bg-[#2ECC71] border-[#2ECC71]' : 'border-[#4A4A4A]'
                }`}>
                  {toggleFilters.apenasRevisadas && <Check size={12} className="text-black" />}
                </div>
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${toggleFilters.apenasRevisadas ? 'text-[#2ECC71]' : 'text-white'}`}>
                    Apenas Revisadas
                  </p>
                  <p className="text-[#6E6E6E] text-xs">18.086 questoes</p>
                </div>
                <CheckCircle size={16} className={toggleFilters.apenasRevisadas ? 'text-[#2ECC71]' : 'text-[#4A4A4A]'} />
              </button>

              {/* Com Comentário */}
              <button
                onClick={() => setToggleFilters(prev => ({ ...prev, apenasComComentario: !prev.apenasComComentario }))}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  toggleFilters.apenasComComentario
                    ? 'bg-[#3498DB]/10 border border-[#3498DB]'
                    : 'bg-[#252525] border border-[#3A3A3A] hover:border-[#4A4A4A]'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  toggleFilters.apenasComComentario ? 'bg-[#3498DB] border-[#3498DB]' : 'border-[#4A4A4A]'
                }`}>
                  {toggleFilters.apenasComComentario && <Check size={12} className="text-black" />}
                </div>
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${toggleFilters.apenasComComentario ? 'text-[#3498DB]' : 'text-white'}`}>
                    Com Comentario
                  </p>
                  <p className="text-[#6E6E6E] text-xs">75.125 questoes</p>
                </div>
                <MessageSquare size={16} className={toggleFilters.apenasComComentario ? 'text-[#3498DB]' : 'text-[#4A4A4A]'} />
              </button>
            </div>
          </div>

          {/* Selecionados resumo */}
          {totalFilters > 0 && (
            <div className="mt-4 p-3 bg-[#1E1E1E] border border-[#3A3A3A] rounded-xl">
              <p className="text-[#6E6E6E] text-xs mb-2">Filtros selecionados:</p>
              <div className="flex flex-wrap gap-1.5">
                {toggleFilters.apenasRevisadas && (
                  <span className="px-2 py-1 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded flex items-center gap-1">
                    <CheckCircle size={10} /> Revisadas
                  </span>
                )}
                {toggleFilters.apenasComComentario && (
                  <span className="px-2 py-1 bg-[#3498DB]/20 text-[#3498DB] text-xs rounded flex items-center gap-1">
                    <MessageSquare size={10} /> Com Comentario
                  </span>
                )}
                {filters.materia.slice(0, 2).map(m => (
                  <span key={m} className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded truncate max-w-[100px]">{m}</span>
                ))}
                {filters.materia.length > 2 && (
                  <span className="px-2 py-1 bg-[#3A3A3A] text-[#A0A0A0] text-xs rounded">+{filters.materia.length - 2} materias</span>
                )}
                {filters.orgao.length > 0 && (
                  <span className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded">{filters.orgao.length} orgao(s)</span>
                )}
                {filters.cargo.length > 0 && (
                  <span className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded">{filters.cargo.length} cargo(s)</span>
                )}
                {filters.banca.length > 0 && (
                  <span className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded">{filters.banca.length} banca(s)</span>
                )}
                {filters.ano.length > 0 && (
                  <span className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded">{filters.ano.length} ano(s)</span>
                )}
                {filters.assunto.length > 0 && (
                  <span className="px-2 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded">{filters.assunto.length} assunto(s)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-10">
          <Button fullWidth size="lg" onClick={() => setMode('selection')} disabled={filteredCount === 0}>
            {filteredCount === 0 ? 'Nenhuma questao encontrada' : `Aplicar filtros (${filteredCount.toLocaleString()} questoes)`}
          </Button>
        </div>
      </div>
    );
  }

  // Tela de selecao
  return (
    <div className="min-h-screen bg-[#121212] p-4 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Praticar Questoes</h1>
        <p className="text-[#A0A0A0]">Modo livre - pratique sem afetar sua trilha</p>
      </div>

      {/* Indicador de dados mock */}
      {usingMockData && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-500 text-sm text-center">Usando questoes de exemplo</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          {isLoadingFilters ? (
            <Loader2 size={24} className="animate-spin text-white mx-auto" />
          ) : (
            <p className="text-2xl font-bold text-white">{filteredCount.toLocaleString()}</p>
          )}
          <p className="text-[#6E6E6E] text-xs">Questoes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#2ECC71]">{sessionStats.total}</p>
          <p className="text-[#6E6E6E] text-xs">Respondidas</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#FFB800]">
            {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
          </p>
          <p className="text-[#6E6E6E] text-xs">Acertos</p>
        </Card>
      </div>

      {/* Botao de filtros */}
      <button
        onClick={() => setMode('filters')}
        className="w-full mb-4 p-4 bg-[#1E1E1E] border border-[#3A3A3A] rounded-xl flex items-center justify-between hover:bg-[#252525] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
            <SlidersHorizontal size={20} className="text-[#FFB800]" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium">Configurar filtros</p>
            <p className="text-[#6E6E6E] text-sm">
              {totalFilters > 0 ? `${totalFilters} filtros ativos` : 'Todas as questoes'}
            </p>
          </div>
        </div>
        <ChevronDown size={20} className="text-[#6E6E6E]" />
      </button>

      {/* Filtros ativos (chips) */}
      {totalFilters > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {/* Toggle filters chips */}
            {toggleFilters.apenasRevisadas && (
              <motion.button
                key="revisadas"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setToggleFilters(prev => ({ ...prev, apenasRevisadas: false }))}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#2ECC71]/20 text-[#2ECC71] rounded-full text-sm"
              >
                <CheckCircle size={14} />
                <span>Revisadas</span>
                <X size={14} />
              </motion.button>
            )}
            {toggleFilters.apenasComComentario && (
              <motion.button
                key="comentario"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setToggleFilters(prev => ({ ...prev, apenasComComentario: false }))}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#3498DB]/20 text-[#3498DB] rounded-full text-sm"
              >
                <MessageSquare size={14} />
                <span>Com Comentario</span>
                <X size={14} />
              </motion.button>
            )}
            {/* Regular filter chips */}
            {Object.entries(filters).map(([category, values]) =>
              (values as string[]).slice(0, 2).map((value: string) => (
                <motion.button
                  key={`${category}-${value}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => toggleFilter(category as keyof FilterOptions, value)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#FFB800]/20 text-[#FFB800] rounded-full text-sm"
                >
                  <span className="truncate max-w-[120px]">{value}</span>
                  <X size={14} />
                </motion.button>
              ))
            )}
            {totalFilters > 6 && (
              <span className="px-3 py-1.5 bg-[#3A3A3A] text-[#A0A0A0] rounded-full text-sm">
                +{totalFilters - 6} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Modo de estudo */}
      <Card className="mb-4">
        <p className="text-white font-medium mb-3">Modo de Estudo</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setStudyMode('zen')}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
              studyMode === 'zen' ? 'border-teal-500 bg-teal-500/10' : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
            }`}
          >
            <Coffee size={20} className={studyMode === 'zen' ? 'text-teal-400' : 'text-[#6E6E6E]'} />
            <span className={`text-xs font-medium ${studyMode === 'zen' ? 'text-teal-400' : 'text-white'}`}>Zen</span>
            <span className="text-[10px] text-[#6E6E6E]">Sem tempo</span>
          </button>
          <button
            onClick={() => setStudyMode('reta_final')}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
              studyMode === 'reta_final' ? 'border-purple-500 bg-purple-500/10' : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
            }`}
          >
            <Zap size={20} className={studyMode === 'reta_final' ? 'text-purple-400' : 'text-[#6E6E6E]'} />
            <span className={`text-xs font-medium ${studyMode === 'reta_final' ? 'text-purple-400' : 'text-white'}`}>
              Reta Final
            </span>
            <span className="text-[10px] text-[#6E6E6E]">Resumido</span>
          </button>
          <button
            onClick={() => setStudyMode('hard')}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
              studyMode === 'hard' ? 'border-red-500 bg-red-500/10' : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
            }`}
          >
            <Timer size={20} className={studyMode === 'hard' ? 'text-red-400' : 'text-[#6E6E6E]'} />
            <span className={`text-xs font-medium ${studyMode === 'hard' ? 'text-red-400' : 'text-white'}`}>Simulado</span>
            <span className="text-[10px] text-[#6E6E6E]">Com tempo</span>
          </button>
        </div>
      </Card>

      {/* Quantidade de questoes */}
      <Card className="mb-6">
        <p className="text-white font-medium mb-3">Quantidade de questoes</p>
        <div className="flex gap-2">
          {[5, 10, 20, 30, 50].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                questionCount === count ? 'bg-[#FFB800] text-black' : 'bg-[#3A3A3A] text-white hover:bg-[#4A4A4A]'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </Card>

      {/* Botao de iniciar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent">
        <Button
          fullWidth
          size="lg"
          leftIcon={isLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
          onClick={startPractice}
          disabled={isLoading || isLoadingFilters || filteredCount === 0}
        >
          {isLoading ? 'Carregando...' : filteredCount === 0 ? 'Nenhuma questao disponivel' : 'Comecar Pratica'}
        </Button>
      </div>
    </div>
  );
}
