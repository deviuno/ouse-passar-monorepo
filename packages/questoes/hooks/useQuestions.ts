import { useState, useEffect, useCallback } from 'react';
import { fetchQuestions, getQuestionsCount } from '../services/questionsService';
import { ParsedQuestion } from '../types';
import { MOCK_QUESTIONS } from '../constants';

interface UseQuestionsOptions {
  limit?: number;
  offset?: number;
  materia?: string;
  banca?: string;
  ano?: number;
  isPegadinha?: boolean;
  questionIds?: number[];
  useMockFallback?: boolean;
}

interface UseQuestionsReturn {
  questions: ParsedQuestion[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

// Helper to parse mock questions (same as in App.tsx)
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

export const useQuestions = (options: UseQuestionsOptions = {}): UseQuestionsReturn => {
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { useMockFallback = true, ...fetchOptions } = options;

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from Supabase
      const [questionsData, count] = await Promise.all([
        fetchQuestions(fetchOptions),
        getQuestionsCount({
          materia: fetchOptions.materia,
          banca: fetchOptions.banca,
          ano: fetchOptions.ano,
          isPegadinha: fetchOptions.isPegadinha,
        }),
      ]);

      if (questionsData.length > 0) {
        setQuestions(questionsData);
        setTotalCount(count);
      } else if (useMockFallback) {
        // Fallback to mock data if no questions in DB
        console.log('No questions in DB, using mock data');
        const mockQuestions = parseMockQuestions();

        // Apply filters to mock data
        let filtered = mockQuestions;

        if (fetchOptions.materia) {
          filtered = filtered.filter(q => q.materia === fetchOptions.materia);
        }
        if (fetchOptions.banca) {
          filtered = filtered.filter(q => q.banca === fetchOptions.banca);
        }
        if (fetchOptions.ano) {
          filtered = filtered.filter(q => q.ano === fetchOptions.ano);
        }
        if (fetchOptions.isPegadinha !== undefined) {
          filtered = filtered.filter(q => q.isPegadinha === fetchOptions.isPegadinha);
        }
        if (fetchOptions.questionIds) {
          const ids = new Set(fetchOptions.questionIds);
          filtered = filtered.filter(q => ids.has(q.id));
        }

        // Apply pagination
        const start = fetchOptions.offset || 0;
        const end = fetchOptions.limit ? start + fetchOptions.limit : undefined;
        filtered = filtered.slice(start, end);

        setQuestions(filtered);
        setTotalCount(mockQuestions.length);
      } else {
        setQuestions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err instanceof Error ? err.message : 'Error loading questions');

      // Fallback to mock data on error
      if (useMockFallback) {
        const mockQuestions = parseMockQuestions();
        setQuestions(mockQuestions);
        setTotalCount(mockQuestions.length);
      }
    } finally {
      setLoading(false);
    }
  }, [
    fetchOptions.limit,
    fetchOptions.offset,
    fetchOptions.materia,
    fetchOptions.banca,
    fetchOptions.ano,
    fetchOptions.isPegadinha,
    fetchOptions.questionIds?.join(','),
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

// Hook specifically for pegadinha questions
export const usePegadinhaQuestions = (limit?: number) => {
  return useQuestions({ isPegadinha: true, limit });
};

// Hook specifically for review questions
export const useReviewQuestions = (questionIds: number[]) => {
  return useQuestions({ questionIds, useMockFallback: true });
};
