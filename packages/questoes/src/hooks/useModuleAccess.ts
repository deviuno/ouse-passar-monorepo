import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import {
  useModuleSettingsStore,
  ModuleName,
  ModuleConfig,
  BlockBehavior,
} from '../stores/useModuleSettingsStore';

export interface ModuleAccess {
  trilha: ModuleConfig;
  praticar: ModuleConfig;
  simulados: ModuleConfig;
  estatisticas: ModuleConfig;
  loja: ModuleConfig;
  hasFullAccess: boolean;
  isLoading: boolean;
}

const FULL_ACCESS_CONFIG: ModuleConfig = {
  enabled: true,
  blockBehavior: 'disabled',
};

// Map routes to module names
export const routeToModule: Record<string, ModuleName> = {
  '/': 'trilha',
  '/trilha': 'trilha',
  '/questoes': 'praticar',
  '/praticar': 'praticar',
  '/cadernos': 'praticar',
  '/trilhas': 'praticar',
  '/simulados': 'simulados',
  '/estatisticas': 'estatisticas',
  '/loja': 'loja',
};

export function getModuleFromPath(path: string): ModuleName | null {
  // Direct match
  if (routeToModule[path]) {
    return routeToModule[path];
  }

  // Check for sub-routes (e.g., /simulados/123 -> simulados)
  for (const [route, module] of Object.entries(routeToModule)) {
    if (route !== '/' && path.startsWith(route)) {
      return module;
    }
  }

  // Check for loja sub-routes
  if (path.startsWith('/loja')) {
    return 'loja';
  }

  return null;
}

export function useModuleAccess(): ModuleAccess {
  const { profile } = useAuthStore();
  const { settings, isLoading, isLoaded, fetchSettings } = useModuleSettingsStore();

  // Fetch settings on mount if not loaded
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchSettings();
    }
  }, [isLoaded, isLoading, fetchSettings]);

  // Check if user has full access (admin or show_answers enabled)
  const hasFullAccess = useMemo(() => {
    if (!profile) return false;
    return profile.role === 'admin' || profile.show_answers === true;
  }, [profile]);

  // Build module access object
  const moduleAccess = useMemo<ModuleAccess>(() => {
    // If user has full access, all modules are enabled
    if (hasFullAccess) {
      return {
        trilha: FULL_ACCESS_CONFIG,
        praticar: FULL_ACCESS_CONFIG,
        simulados: FULL_ACCESS_CONFIG,
        estatisticas: FULL_ACCESS_CONFIG,
        loja: FULL_ACCESS_CONFIG,
        hasFullAccess: true,
        isLoading,
      };
    }

    // Return actual settings
    return {
      trilha: settings.trilha,
      praticar: settings.praticar,
      simulados: settings.simulados,
      estatisticas: settings.estatisticas,
      loja: settings.loja,
      hasFullAccess: false,
      isLoading,
    };
  }, [hasFullAccess, settings, isLoading]);

  return moduleAccess;
}

// Helper hook to check a specific module
export function useModuleEnabled(module: ModuleName): {
  enabled: boolean;
  blockBehavior: BlockBehavior;
  hasFullAccess: boolean;
  isLoading: boolean;
} {
  const access = useModuleAccess();
  const config = access[module];

  return {
    enabled: config.enabled,
    blockBehavior: config.blockBehavior,
    hasFullAccess: access.hasFullAccess,
    isLoading: access.isLoading,
  };
}
