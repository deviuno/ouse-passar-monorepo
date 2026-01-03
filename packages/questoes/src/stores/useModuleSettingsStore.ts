import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export type BlockBehavior = 'hidden' | 'disabled' | 'modal';

export type ModuleName = 'trilha' | 'praticar' | 'simulados' | 'estatisticas' | 'loja';

export interface ModuleConfig {
  enabled: boolean;
  blockBehavior: BlockBehavior;
}

interface ModuleSettingsState {
  settings: Record<ModuleName, ModuleConfig>;
  isLoading: boolean;
  isLoaded: boolean;
  fetchSettings: () => Promise<void>;
  getModuleConfig: (module: ModuleName) => ModuleConfig;
}

const DEFAULT_CONFIG: ModuleConfig = {
  enabled: true,
  blockBehavior: 'disabled',
};

const DEFAULT_SETTINGS: Record<ModuleName, ModuleConfig> = {
  trilha: { ...DEFAULT_CONFIG },
  praticar: { ...DEFAULT_CONFIG },
  simulados: { ...DEFAULT_CONFIG },
  estatisticas: { ...DEFAULT_CONFIG },
  loja: { ...DEFAULT_CONFIG },
};

export const useModuleSettingsStore = create<ModuleSettingsState>()((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoading: false,
  isLoaded: false,

  fetchSettings: async () => {
    // Don't refetch if already loaded
    if (get().isLoaded) return;

    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('category', 'modules');

      if (error) {
        console.error('Error fetching module settings:', error);
        set({ isLoading: false, isLoaded: true });
        return;
      }

      if (data && data.length > 0) {
        const newSettings = { ...DEFAULT_SETTINGS };

        data.forEach((setting) => {
          const keyParts = setting.key.split('_');
          const moduleName = keyParts[0] as ModuleName;
          const settingType = keyParts.slice(1).join('_');

          if (moduleName && newSettings[moduleName]) {
            if (settingType === 'enabled') {
              // Parse boolean from string or JSONB
              const value = typeof setting.value === 'string'
                ? setting.value === 'true'
                : Boolean(setting.value);
              newSettings[moduleName].enabled = value;
            } else if (settingType === 'block_behavior') {
              // Parse string value (might be wrapped in quotes from JSONB)
              let value = setting.value;
              if (typeof value === 'string') {
                value = value.replace(/^"|"$/g, ''); // Remove surrounding quotes
              }
              if (['hidden', 'disabled', 'modal'].includes(value)) {
                newSettings[moduleName].blockBehavior = value as BlockBehavior;
              }
            }
          }
        });

        set({ settings: newSettings, isLoading: false, isLoaded: true });
      } else {
        set({ isLoading: false, isLoaded: true });
      }
    } catch (err) {
      console.error('Error fetching module settings:', err);
      set({ isLoading: false, isLoaded: true });
    }
  },

  getModuleConfig: (module: ModuleName) => {
    return get().settings[module] || DEFAULT_CONFIG;
  },
}));
