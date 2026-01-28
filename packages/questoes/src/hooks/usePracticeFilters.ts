import { useState, useCallback, useMemo } from 'react';
import {
  FilterOptions,
  ToggleFilters,
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_TOGGLE_FILTERS,
  normalizeFilters,
  countActiveFilters,
  hasActiveFilters as checkHasActiveFilters,
} from '../utils/filterUtils';

export interface UsePracticeFiltersOptions {
  initialFilters?: Partial<FilterOptions>;
  initialToggleFilters?: Partial<ToggleFilters>;
}

export interface UsePracticeFiltersReturn {
  // State
  filters: FilterOptions;
  toggleFilters: ToggleFilters;

  // Actions
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  setToggleFilters: React.Dispatch<React.SetStateAction<ToggleFilters>>;
  toggleFilter: (category: keyof FilterOptions, value: string) => void;
  toggleToggleFilter: (key: keyof ToggleFilters) => void;
  clearFilters: () => void;
  loadFilters: (
    newFilters?: Partial<FilterOptions>,
    newToggleFilters?: Partial<ToggleFilters>
  ) => void;

  // Derived
  totalFilters: number;
  hasActiveFilters: boolean;
}

/**
 * Hook to manage practice filters state and actions
 */
export function usePracticeFilters(
  options: UsePracticeFiltersOptions = {}
): UsePracticeFiltersReturn {
  const { initialFilters, initialToggleFilters } = options;

  const [filters, setFilters] = useState<FilterOptions>(
    normalizeFilters(initialFilters) || DEFAULT_FILTER_OPTIONS
  );

  const [toggleFilters, setToggleFilters] = useState<ToggleFilters>({
    ...DEFAULT_TOGGLE_FILTERS,
    ...initialToggleFilters,
  });

  const toggleFilter = useCallback(
    (category: keyof FilterOptions, value: string) => {
      setFilters((prev) => {
        const current = prev[category];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [category]: updated };
      });
    },
    []
  );

  const toggleToggleFilter = useCallback((key: keyof ToggleFilters) => {
    setToggleFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_OPTIONS);
    setToggleFilters(DEFAULT_TOGGLE_FILTERS);
  }, []);

  const loadFilters = useCallback(
    (
      newFilters?: Partial<FilterOptions>,
      newToggleFilters?: Partial<ToggleFilters>
    ) => {
      if (newFilters) {
        setFilters(normalizeFilters(newFilters));
      }
      if (newToggleFilters) {
        setToggleFilters((prev) => ({
          ...prev,
          ...newToggleFilters,
        }));
      }
    },
    []
  );

  const totalFilters = useMemo(
    () => countActiveFilters(filters, toggleFilters),
    [filters, toggleFilters]
  );

  const hasActiveFilters = useMemo(
    () => checkHasActiveFilters(filters, toggleFilters),
    [filters, toggleFilters]
  );

  return {
    // State
    filters,
    toggleFilters,

    // Actions
    setFilters,
    setToggleFilters,
    toggleFilter,
    toggleToggleFilter,
    clearFilters,
    loadFilters,

    // Derived
    totalFilters,
    hasActiveFilters,
  };
}

// Re-export types for convenience
export type { FilterOptions, ToggleFilters };
