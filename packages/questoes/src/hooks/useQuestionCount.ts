import { useState, useEffect } from 'react';
import { FilterOptions, ToggleFilters, hasActiveFilters } from '../utils/filterUtils';
import { getQuestionsCount } from '../services/questionsService';
import { MOCK_QUESTIONS } from '../constants';

export interface UseQuestionCountOptions {
  filters: FilterOptions;
  toggleFilters: ToggleFilters;
  totalQuestions: number;
  usingMockData: boolean;
  debounceMs?: number;
}

export interface UseQuestionCountReturn {
  filteredCount: number;
  isLoadingCount: boolean;
  setFilteredCount: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Hook to manage filtered question count with debounced updates
 */
export function useQuestionCount(
  options: UseQuestionCountOptions
): UseQuestionCountReturn {
  const {
    filters,
    toggleFilters,
    totalQuestions,
    usingMockData,
    debounceMs = 300,
  } = options;

  const [filteredCount, setFilteredCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  useEffect(() => {
    const updateCount = async () => {
      if (usingMockData) {
        let filtered = [...MOCK_QUESTIONS];
        if (filters.materia.length > 0) {
          filtered = filtered.filter((q) =>
            filters.materia.includes(q.materia)
          );
        }
        if (filters.banca.length > 0) {
          filtered = filtered.filter((q) => filters.banca.includes(q.banca));
        }
        if (filters.ano.length > 0) {
          filtered = filtered.filter((q) =>
            filters.ano.includes(String(q.ano))
          );
        }
        setFilteredCount(filtered.length);
        return;
      }

      const hasFilters = hasActiveFilters(filters, toggleFilters);

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

    const debounce = setTimeout(updateCount, debounceMs);
    return () => clearTimeout(debounce);
  }, [filters, toggleFilters, totalQuestions, usingMockData, debounceMs]);

  return {
    filteredCount,
    isLoadingCount,
    setFilteredCount,
  };
}
