import { useState, useEffect, useCallback } from 'react';
import {
  fetchFilterOptions,
  fetchAssuntosByMaterias,
  fetchAllTaxonomia,
  TaxonomyNode,
  getQuestionsCount,
} from '../services/questionsService';
import {
  DEFAULT_MATERIAS,
  DEFAULT_BANCAS,
  DEFAULT_ORGAOS,
  DEFAULT_ANOS,
  FilterOptions,
} from '../utils/filterUtils';
import { MOCK_QUESTIONS } from '../constants';
import { useUIStore } from '../stores';

export interface UseFilterOptionsReturn {
  // Available filter options
  availableMaterias: string[];
  availableAssuntos: string[];
  availableBancas: string[];
  availableOrgaos: string[];
  availableCargos: string[];
  availableAnos: string[];

  // Taxonomy
  globalTaxonomy: Map<string, TaxonomyNode[]>;
  taxonomyByMateria: Map<string, TaxonomyNode[]>;

  // Loading states
  isLoadingFilters: boolean;
  isLoadingTaxonomy: boolean;
  isLoadingAssuntos: boolean;

  // Data
  totalQuestions: number;
  usingMockData: boolean;

  // Actions
  refreshOptions: () => Promise<void>;
  updateAssuntosByMaterias: (materias: string[]) => Promise<void>;
  updateTaxonomyByMaterias: (
    materias: string[],
    globalTaxonomy: Map<string, TaxonomyNode[]>
  ) => void;
  setTaxonomyByMateria: React.Dispatch<
    React.SetStateAction<Map<string, TaxonomyNode[]>>
  >;

  // Setters for external filtering
  setAvailableAssuntos: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Hook to manage filter options (available materias, bancas, etc.)
 */
export function useFilterOptions(): UseFilterOptionsReturn {
  const { addToast } = useUIStore();

  // Available options
  const [availableMaterias, setAvailableMaterias] =
    useState<string[]>(DEFAULT_MATERIAS);
  const [availableAssuntos, setAvailableAssuntos] = useState<string[]>([]);
  const [availableBancas, setAvailableBancas] =
    useState<string[]>(DEFAULT_BANCAS);
  const [availableOrgaos, setAvailableOrgaos] =
    useState<string[]>(DEFAULT_ORGAOS);
  const [availableCargos, setAvailableCargos] = useState<string[]>([]);
  const [availableAnos, setAvailableAnos] = useState<string[]>(DEFAULT_ANOS);

  // Taxonomy
  const [globalTaxonomy, setGlobalTaxonomy] = useState<
    Map<string, TaxonomyNode[]>
  >(new Map());
  const [taxonomyByMateria, setTaxonomyByMateria] = useState<
    Map<string, TaxonomyNode[]>
  >(new Map());

  // Loading states
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  const [isLoadingAssuntos, setIsLoadingAssuntos] = useState(false);

  // Data
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [usingMockData, setUsingMockData] = useState(false);

  const loadFilterOptions = useCallback(async () => {
    setIsLoadingFilters(true);
    try {
      const [filterOptions, count] = await Promise.all([
        fetchFilterOptions(),
        getQuestionsCount(),
      ]);

      setTotalQuestions(count);
      setAvailableMaterias(
        filterOptions.materias.length > 0
          ? filterOptions.materias
          : DEFAULT_MATERIAS
      );
      setAvailableBancas(
        filterOptions.bancas.length > 0
          ? filterOptions.bancas
          : DEFAULT_BANCAS
      );
      setAvailableOrgaos(
        filterOptions.orgaos.length > 0
          ? filterOptions.orgaos
          : DEFAULT_ORGAOS
      );
      setAvailableCargos(filterOptions.cargos || []);
      setAvailableAnos(
        filterOptions.anos.length > 0
          ? filterOptions.anos.map(String)
          : DEFAULT_ANOS
      );
      setUsingMockData(false);

      if (count === 0) {
        console.warn(
          '[useFilterOptions] Nenhuma questão encontrada no banco de dados'
        );
        addToast(
          'info',
          'Conectado ao banco, mas nenhuma questão encontrada.'
        );
      }
    } catch (error) {
      console.error(
        '[useFilterOptions] Erro ao carregar filtros após retries:',
        error
      );
      addToast(
        'error',
        'Erro ao conectar ao banco de questões. Usando dados de exemplo.'
      );
      setTotalQuestions(MOCK_QUESTIONS.length);
      setUsingMockData(true);
    } finally {
      setIsLoadingFilters(false);
    }
  }, [addToast]);

  const loadGlobalTaxonomy = useCallback(async () => {
    setIsLoadingTaxonomy(true);
    try {
      const taxonomy = await fetchAllTaxonomia();
      setGlobalTaxonomy(taxonomy);
      setTaxonomyByMateria(taxonomy);
    } catch (error) {
      console.error(
        '[useFilterOptions] Erro ao carregar taxonomia global:',
        error
      );
    } finally {
      setIsLoadingTaxonomy(false);
    }
  }, []);

  const updateAssuntosByMaterias = useCallback(
    async (materias: string[]) => {
      setIsLoadingAssuntos(true);
      try {
        const materiasParaBuscar =
          materias.length > 0 ? materias : availableMaterias;
        const assuntos = await fetchAssuntosByMaterias(materiasParaBuscar);
        setAvailableAssuntos(assuntos);
      } catch (error) {
        console.error('Erro ao carregar assuntos:', error);
        setAvailableAssuntos([]);
      } finally {
        setIsLoadingAssuntos(false);
      }
    },
    [availableMaterias]
  );

  const updateTaxonomyByMaterias = useCallback(
    (materias: string[], globalTax: Map<string, TaxonomyNode[]>) => {
      if (globalTax.size === 0) {
        return;
      }

      let taxonomy: Map<string, TaxonomyNode[]>;
      if (materias.length > 0) {
        taxonomy = new Map();
        for (const materia of materias) {
          const nodes = globalTax.get(materia);
          if (nodes && nodes.length > 0) {
            taxonomy.set(materia, nodes);
          }
        }
      } else {
        taxonomy = globalTax;
      }

      setTaxonomyByMateria(taxonomy);
    },
    []
  );

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadGlobalTaxonomy();
  }, [loadFilterOptions, loadGlobalTaxonomy]);

  return {
    // Available options
    availableMaterias,
    availableAssuntos,
    availableBancas,
    availableOrgaos,
    availableCargos,
    availableAnos,

    // Taxonomy
    globalTaxonomy,
    taxonomyByMateria,

    // Loading states
    isLoadingFilters,
    isLoadingTaxonomy,
    isLoadingAssuntos,

    // Data
    totalQuestions,
    usingMockData,

    // Actions
    refreshOptions: loadFilterOptions,
    updateAssuntosByMaterias,
    updateTaxonomyByMaterias,
    setTaxonomyByMateria,
    setAvailableAssuntos,
  };
}
