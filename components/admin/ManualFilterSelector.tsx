import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Building2,
  Calendar,
  Hash,
  Loader2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  getFilterOptions,
  countQuestionsForFilters,
  isExternalDbAvailable,
  QuestionFilters,
} from '../../services/externalQuestionsService';
import { QuestionPreview } from './QuestionPreview';

interface ManualFilterSelectorProps {
  onFiltersChange: (filters: QuestionFilters, count: number) => void;
  disabled?: boolean;
}

interface FilterOption {
  value: string | number;
  selected: boolean;
}

export const ManualFilterSelector: React.FC<ManualFilterSelectorProps> = ({
  onFiltersChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbConfigured, setIsDbConfigured] = useState(true);

  // Available options from database
  const [availableMaterias, setAvailableMaterias] = useState<string[]>([]);
  const [availableBancas, setAvailableBancas] = useState<string[]>([]);
  const [availableAnos, setAvailableAnos] = useState<number[]>([]);
  const [availableOrgaos, setAvailableOrgaos] = useState<string[]>([]);

  // Selected filters
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [selectedAnos, setSelectedAnos] = useState<number[]>([]);
  const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>([]);
  const [questionLimit, setQuestionLimit] = useState<number | undefined>(undefined);

  // Search/filter state for dropdowns
  const [searchMaterias, setSearchMaterias] = useState('');
  const [searchBancas, setSearchBancas] = useState('');
  const [searchOrgaos, setSearchOrgaos] = useState('');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<string[]>(['materias']);

  // Question count
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);

  // Load available filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update count when filters change
  useEffect(() => {
    const filters = buildFilters();
    updateQuestionCount(filters);
  }, [selectedMaterias, selectedBancas, selectedAnos, selectedOrgaos]);

  // Notify parent of filter changes
  useEffect(() => {
    const filters = buildFilters();
    onFiltersChange(filters, questionCount);
  }, [selectedMaterias, selectedBancas, selectedAnos, selectedOrgaos, questionLimit, questionCount]);

  const loadFilterOptions = async () => {
    setLoading(true);
    setError(null);

    if (!isExternalDbAvailable()) {
      setIsDbConfigured(false);
      setLoading(false);
      return;
    }

    try {
      const { materias, bancas, anos, orgaos, error: fetchError } = await getFilterOptions();

      if (fetchError) {
        setError(fetchError);
      } else {
        setAvailableMaterias(materias);
        setAvailableBancas(bancas);
        setAvailableAnos(anos);
        setAvailableOrgaos(orgaos);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildFilters = (): QuestionFilters => {
    return {
      materias: selectedMaterias.length > 0 ? selectedMaterias : undefined,
      bancas: selectedBancas.length > 0 ? selectedBancas : undefined,
      anos: selectedAnos.length > 0 ? selectedAnos : undefined,
      orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
      limit: questionLimit,
    };
  };

  const updateQuestionCount = async (filters: QuestionFilters) => {
    // Only count if at least one filter is selected
    const hasFilters =
      (filters.materias && filters.materias.length > 0) ||
      (filters.bancas && filters.bancas.length > 0) ||
      (filters.anos && filters.anos.length > 0) ||
      (filters.orgaos && filters.orgaos.length > 0);

    if (!hasFilters) {
      setQuestionCount(0);
      return;
    }

    setCountLoading(true);
    try {
      const { count } = await countQuestionsForFilters(filters);
      setQuestionCount(count);
    } catch (err) {
      console.error('Error counting questions:', err);
    } finally {
      setCountLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const toggleItem = <T extends string | number>(
    item: T,
    selected: T[],
    setSelected: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const filterOptions = (options: string[], search: string) => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  };

  const renderFilterSection = (
    title: string,
    key: string,
    icon: React.ReactNode,
    options: (string | number)[],
    selected: (string | number)[],
    onToggle: (item: any) => void,
    searchValue?: string,
    onSearchChange?: (value: string) => void
  ) => {
    const isExpanded = expandedSections.includes(key);
    const filteredOptions = searchValue !== undefined
      ? filterOptions(options as string[], searchValue)
      : options;

    return (
      <div className="border border-white/10 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection(key)}
          disabled={disabled}
          className="w-full flex items-center justify-between p-4 bg-brand-dark/50 hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-brand-yellow">{icon}</span>
            <span className="font-bold text-white uppercase tracking-wide text-sm">{title}</span>
            {selected.length > 0 && (
              <span className="px-2 py-0.5 bg-brand-yellow/20 text-brand-yellow text-xs font-bold rounded">
                {selected.length} selecionado{selected.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">({options.length})</span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 space-y-3">
            {/* Search input for text-based filters */}
            {onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Buscar ${title.toLowerCase()}...`}
                  disabled={disabled}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600 disabled:opacity-50"
                />
              </div>
            )}

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredOptions.length === 0 ? (
                <p className="text-gray-500 text-sm italic py-2">
                  {searchValue ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={String(option)}
                    onClick={() => onToggle(option)}
                    disabled={disabled}
                    className={`
                      w-full text-left px-3 py-2 rounded-sm text-sm transition-colors flex items-center justify-between
                      ${selected.includes(option)
                        ? 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="truncate">{option}</span>
                    {selected.includes(option) && (
                      <CheckCircle className="w-4 h-4 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Selected items summary */}
            {selected.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  {selected.map((item) => (
                    <span
                      key={String(item)}
                      className="flex items-center gap-1 px-2 py-1 bg-brand-yellow/10 text-brand-yellow text-xs rounded"
                    >
                      {item}
                      <button
                        onClick={() => onToggle(item)}
                        disabled={disabled}
                        className="hover:text-white transition-colors disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isDbConfigured) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-yellow-500 font-medium">Banco de questões não configurado</p>
            <p className="text-yellow-400/70 text-sm mt-1">
              Configure as variáveis VITE_QUESTIONS_DB_URL e VITE_QUESTIONS_DB_ANON_KEY no arquivo .env.local
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
        <span className="ml-3 text-gray-400">Carregando opções de filtros...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-red-500 font-medium">Erro ao carregar filtros</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasFilters =
    selectedMaterias.length > 0 ||
    selectedBancas.length > 0 ||
    selectedAnos.length > 0 ||
    selectedOrgaos.length > 0;

  return (
    <div className="space-y-6">
      {/* Question Count Summary */}
      <div className={`
        p-6 rounded-sm border transition-all
        ${hasFilters
          ? 'bg-gradient-to-r from-brand-yellow/10 to-transparent border-brand-yellow/30'
          : 'bg-brand-dark/50 border-white/10'
        }
      `}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">
              Questões Disponíveis
            </p>
            <div className="flex items-center gap-3">
              {countLoading ? (
                <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              ) : (
                <p className="text-4xl font-black text-brand-yellow">
                  {questionCount.toLocaleString('pt-BR')}
                </p>
              )}
              {questionLimit && questionCount > 0 && (
                <span className="text-gray-500 text-sm">
                  (limitado a {questionLimit.toLocaleString('pt-BR')})
                </span>
              )}
            </div>
          </div>
          {hasFilters && questionCount > 0 && (
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-brand-yellow" />
            </div>
          )}
        </div>

        {!hasFilters && (
          <p className="text-gray-500 text-sm mt-2">
            Selecione pelo menos um filtro para ver a quantidade de questões disponíveis.
          </p>
        )}
      </div>

      {/* Limit Input */}
      <div className="flex items-center gap-4 p-4 bg-brand-dark/50 border border-white/10 rounded-sm">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
            Limite de Questões
          </label>
          <p className="text-xs text-gray-500">
            Máximo de questões que serão exibidas no simulado (deixe vazio para sem limite)
          </p>
        </div>
        <input
          type="number"
          value={questionLimit || ''}
          onChange={(e) => setQuestionLimit(e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Sem limite"
          disabled={disabled}
          className="w-32 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow text-right placeholder-gray-600 disabled:opacity-50"
        />
      </div>

      {/* Filter Sections */}
      <div className="space-y-3">
        {renderFilterSection(
          'Matérias',
          'materias',
          <BookOpen className="w-4 h-4" />,
          availableMaterias,
          selectedMaterias,
          (item) => toggleItem(item, selectedMaterias, setSelectedMaterias),
          searchMaterias,
          setSearchMaterias
        )}

        {renderFilterSection(
          'Bancas',
          'bancas',
          <Building2 className="w-4 h-4" />,
          availableBancas,
          selectedBancas,
          (item) => toggleItem(item, selectedBancas, setSelectedBancas),
          searchBancas,
          setSearchBancas
        )}

        {renderFilterSection(
          'Anos',
          'anos',
          <Calendar className="w-4 h-4" />,
          availableAnos,
          selectedAnos,
          (item) => toggleItem(item, selectedAnos, setSelectedAnos)
        )}

        {renderFilterSection(
          'Órgãos',
          'orgaos',
          <Hash className="w-4 h-4" />,
          availableOrgaos,
          selectedOrgaos,
          (item) => toggleItem(item, selectedOrgaos, setSelectedOrgaos),
          searchOrgaos,
          setSearchOrgaos
        )}
      </div>

      {/* Question Preview */}
      {hasFilters && (
        <QuestionPreview
          filters={buildFilters()}
          onCountUpdate={(count) => setQuestionCount(count)}
        />
      )}

      {/* Floating Question Count Card */}
      {hasFilters && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className={`
            bg-brand-card border shadow-2xl rounded-lg p-4 min-w-[200px]
            transition-all duration-300 transform
            ${countLoading ? 'border-brand-yellow/30' : questionCount > 0 ? 'border-green-500/30' : 'border-red-500/30'}
          `}
          style={{
            animation: 'slideInUp 0.3s ease-out',
          }}
          >
            <style>{`
              @keyframes slideInUp {
                from {
                  transform: translateY(100%);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>
            <div className="flex items-center gap-3">
              {countLoading ? (
                <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              ) : questionCount > 0 ? (
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Questões</p>
                <p className={`text-2xl font-black ${questionCount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {countLoading ? '...' : questionCount.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            {questionLimit && questionCount > 0 && (
              <p className="text-xs text-gray-500 mt-2 border-t border-white/5 pt-2">
                Limitado a {questionLimit.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
