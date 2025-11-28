import { useState, useEffect, useCallback } from 'react';
import { ParsedQuestion } from '../types';
import { CourseQuestionFilters } from '../services/questionsDbClient';
import {
  fetchExternalQuestions,
  fetchExternalQuestionsByIds,
  fetchRandomQuestions,
  countExternalQuestions,
  getExternalQuestionsStats,
  listAvailableMaterias,
  listAvailableBancas,
  listAvailableAnos,
  listAvailableOrgaos,
  QuestionsStats,
} from '../services/externalQuestionsService';
import { MOCK_QUESTIONS } from '../constants';

interface UseExternalQuestionsOptions {
  filters?: CourseQuestionFilters;
  enabled?: boolean;
  useMockFallback?: boolean;
}

interface UseExternalQuestionsReturn {
  questions: ParsedQuestion[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

// Helper to parse mock questions
const parseMockQuestions = (): ParsedQuestion[] => {
  return MOCK_QUESTIONS.map(q => {
    let parsedAlts: { letter: string; text: string }[] = [];
    try {
      parsedAlts = JSON.parse(q.alternativas);
    } catch (e) {
      console.error(`Failed to parse alternatives for Q${q.id}`, e);
      parsedAlts = [];
    }
    return {
      ...q,
      parsedAlternativas: parsedAlts,
      isPegadinha: q.id % 2 === 0,
    };
  });
};

/**
 * Hook para buscar questões do banco externo (Projeto Scrapping)
 */
export const useExternalQuestions = (
  options: UseExternalQuestionsOptions = {}
): UseExternalQuestionsReturn => {
  const { filters = {}, enabled = true, useMockFallback = true } = options;

  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadQuestions = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [questionsData, count] = await Promise.all([
        fetchExternalQuestions(filters),
        countExternalQuestions(filters),
      ]);

      if (questionsData.length > 0) {
        setQuestions(questionsData);
        setTotalCount(count);
      } else if (useMockFallback) {
        console.log('No external questions found, using mock data');
        const mockQuestions = parseMockQuestions();
        setQuestions(mockQuestions);
        setTotalCount(mockQuestions.length);
      } else {
        setQuestions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error loading external questions:', err);
      setError(err instanceof Error ? err.message : 'Error loading questions');

      if (useMockFallback) {
        const mockQuestions = parseMockQuestions();
        setQuestions(mockQuestions);
        setTotalCount(mockQuestions.length);
      }
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    filters.materias?.join(','),
    filters.bancas?.join(','),
    filters.anos?.join(','),
    filters.orgaos?.join(','),
    filters.assuntos?.join(','),
    filters.limit,
    filters.excludeIds?.join(','),
    useMockFallback,
  ]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    totalCount,
    refetch: loadQuestions,
  };
};

/**
 * Hook para buscar questões aleatórias para simulados
 */
export const useRandomQuestions = (
  filters: CourseQuestionFilters = {},
  count: number = 10,
  enabled: boolean = true
) => {
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRandomQuestions(filters, count);
      setQuestions(data);
    } catch (err) {
      console.error('Error loading random questions:', err);
      setError(err instanceof Error ? err.message : 'Error loading questions');

      // Fallback to mock
      const mockQuestions = parseMockQuestions()
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
      setQuestions(mockQuestions);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    count,
    filters.materias?.join(','),
    filters.bancas?.join(','),
    filters.anos?.join(','),
    filters.orgaos?.join(','),
  ]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions,
  };
};

/**
 * Hook para buscar questões por IDs específicos
 */
export const useQuestionsByIds = (ids: number[], enabled: boolean = true) => {
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!enabled || ids.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExternalQuestionsByIds(ids);
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions by IDs:', err);
      setError(err instanceof Error ? err.message : 'Error loading questions');
    } finally {
      setLoading(false);
    }
  }, [enabled, ids.join(',')]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions,
  };
};

/**
 * Hook para obter estatísticas do banco de questões
 */
export const useQuestionsStats = () => {
  const [stats, setStats] = useState<QuestionsStats>({ total: 0, materias: 0, bancas: 0, anos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getExternalQuestionsStats();
        setStats(data);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError(err instanceof Error ? err.message : 'Error loading stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading, error };
};

/**
 * Hook para listar opções de filtros disponíveis
 */
export const useFilterOptions = () => {
  const [materias, setMaterias] = useState<{ materia: string; count: number }[]>([]);
  const [bancas, setBancas] = useState<{ banca: string; count: number }[]>([]);
  const [anos, setAnos] = useState<{ ano: number; count: number }[]>([]);
  const [orgaos, setOrgaos] = useState<{ orgao: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [materiasData, bancasData, anosData, orgaosData] = await Promise.all([
          listAvailableMaterias(),
          listAvailableBancas(),
          listAvailableAnos(),
          listAvailableOrgaos(),
        ]);

        setMaterias(materiasData);
        setBancas(bancasData);
        setAnos(anosData);
        setOrgaos(orgaosData);
      } catch (err) {
        console.error('Error loading filter options:', err);
        setError(err instanceof Error ? err.message : 'Error loading filter options');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  return {
    materias,
    bancas,
    anos,
    orgaos,
    loading,
    error,
  };
};
