/**
 * Utility functions for filter operations in the practice page
 */

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

export interface ToggleFilters {
  apenasRevisadas: boolean;
  apenasComComentario: boolean;
  // User history filters
  resolvi: boolean;
  naoResolvi: boolean;
  errei: boolean;
  acertei: boolean;
  // Difficulty filters
  facil: boolean;
  medio: boolean;
  dificil: boolean;
}

export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  materia: [],
  assunto: [],
  banca: [],
  orgao: [],
  cargo: [],
  ano: [],
  escolaridade: [],
  modalidade: [],
  dificuldade: [],
};

export const DEFAULT_TOGGLE_FILTERS: ToggleFilters = {
  apenasRevisadas: false,
  apenasComComentario: false,
  resolvi: false,
  naoResolvi: false,
  errei: false,
  acertei: false,
  facil: false,
  medio: false,
  dificil: false,
};

/**
 * Normalizes filter options from database to ensure all arrays exist
 */
export const normalizeFilters = (
  filters: Partial<FilterOptions> | null | undefined
): FilterOptions => ({
  materia: filters?.materia || [],
  assunto: filters?.assunto || [],
  banca: filters?.banca || [],
  orgao: filters?.orgao || [],
  cargo: filters?.cargo || [],
  ano: filters?.ano || [],
  escolaridade: filters?.escolaridade || [],
  modalidade: filters?.modalidade || [],
  dificuldade: filters?.dificuldade || [],
});

/**
 * Counts the total number of active filters
 */
export const countActiveFilters = (
  filters: FilterOptions,
  toggleFilters: ToggleFilters
): number => {
  return (
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
    (toggleFilters.apenasComComentario ? 1 : 0)
  );
};

/**
 * Checks if there are any active filters
 */
export const hasActiveFilters = (
  filters: FilterOptions,
  toggleFilters: ToggleFilters
): boolean => {
  return (
    filters.materia.length > 0 ||
    filters.assunto.length > 0 ||
    filters.banca.length > 0 ||
    filters.orgao.length > 0 ||
    filters.cargo.length > 0 ||
    filters.ano.length > 0 ||
    filters.escolaridade.length > 0 ||
    filters.modalidade.length > 0 ||
    filters.dificuldade.length > 0 ||
    toggleFilters.apenasRevisadas ||
    toggleFilters.apenasComComentario
  );
};

/**
 * Default values for fallback
 */
export const DEFAULT_MATERIAS = [
  "Lingua Portuguesa",
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Penal",
  "Informatica",
  "Raciocinio Logico",
  "Atualidades",
];

export const DEFAULT_BANCAS = [
  "CEBRASPE",
  "FGV",
  "FCC",
  "VUNESP",
  "IDECAN",
  "CESGRANRIO",
];

export const DEFAULT_ORGAOS = [
  "PF - Policia Federal",
  "PRF - Policia Rodoviaria Federal",
];

export const DEFAULT_ANOS = ["2024", "2023", "2022", "2021", "2020"];
