import { create } from 'zustand';
import {
  BatteryStatus,
  BatterySettings,
  BatteryActionType,
  BatteryConsumeResult,
} from '../types/battery';
import * as batteryService from '../services/batteryService';

interface BatteryState {
  // Status per preparatório
  batteryStatus: BatteryStatus | null;
  currentPreparatorioId: string | null;

  // Settings (global, cached)
  settings: BatterySettings | null;

  // Loading states
  isLoading: boolean;
  isConsuming: boolean;

  // Modal states
  isEmptyModalOpen: boolean;
  isPrepLimitModalOpen: boolean;

  // Actions
  fetchBatteryStatus: (userId: string, preparatorioId: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  consumeBattery: (
    userId: string,
    preparatorioId: string,
    actionType: BatteryActionType,
    context?: Record<string, any>
  ) => Promise<BatteryConsumeResult>;
  checkCanPerformAction: (
    userId: string,
    preparatorioId: string,
    actionType: BatteryActionType
  ) => Promise<{ canPerform: boolean; cost: number; isPremium: boolean }>;
  checkCanAddPreparatorio: (userId: string) => Promise<{
    canAdd: boolean;
    isPremium: boolean;
    currentCount?: number;
    maxAllowed?: number;
    checkoutUrl?: string | null;
  }>;

  // Modal controls
  openEmptyModal: () => void;
  closeEmptyModal: () => void;
  openPrepLimitModal: () => void;
  closePrepLimitModal: () => void;

  // Reset
  reset: () => void;
}

export const useBatteryStore = create<BatteryState>((set, get) => ({
  // Initial state
  batteryStatus: null,
  currentPreparatorioId: null,
  settings: null,
  isLoading: false,
  isConsuming: false,
  isEmptyModalOpen: false,
  isPrepLimitModalOpen: false,

  fetchBatteryStatus: async (userId: string, preparatorioId: string) => {
    set({ isLoading: true });
    try {
      const status = await batteryService.getBatteryStatus(userId, preparatorioId);
      set({
        batteryStatus: status,
        currentPreparatorioId: preparatorioId,
        settings: status?.settings || get().settings,
      });
    } catch (error) {
      console.error('[BatteryStore] Error fetching status:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await batteryService.getBatterySettings();
      if (settings) {
        set({ settings });
      }
    } catch (error) {
      console.error('[BatteryStore] Error fetching settings:', error);
    }
  },

  consumeBattery: async (
    userId: string,
    preparatorioId: string,
    actionType: BatteryActionType,
    context?: Record<string, any>
  ) => {
    set({ isConsuming: true });
    try {
      const result = await batteryService.consumeBattery(
        userId,
        preparatorioId,
        actionType,
        context || {}
      );

      // Update local battery status if successful
      if (result.success && result.battery_current !== undefined) {
        set((state) => ({
          batteryStatus: state.batteryStatus
            ? {
                ...state.batteryStatus,
                battery_current: result.battery_current!,
              }
            : null,
        }));
      }

      // Open empty modal if insufficient battery
      if (!result.success && result.error === 'insufficient_battery') {
        set({ isEmptyModalOpen: true });
      }

      return result;
    } catch (error) {
      console.error('[BatteryStore] Error consuming battery:', error);
      return { success: false, error: 'user_trail_not_found' as const };
    } finally {
      set({ isConsuming: false });
    }
  },

  checkCanPerformAction: async (
    userId: string,
    preparatorioId: string,
    actionType: BatteryActionType
  ) => {
    try {
      const result = await batteryService.canPerformAction(
        userId,
        preparatorioId,
        actionType
      );
      return result;
    } catch (error) {
      console.error('[BatteryStore] Error checking action:', error);
      return { canPerform: false, cost: 0, isPremium: false };
    }
  },

  checkCanAddPreparatorio: async (userId: string) => {
    try {
      const result = await batteryService.checkCanAddPreparatorio(userId);
      return {
        canAdd: result.can_add,
        isPremium: result.is_premium,
        currentCount: result.current_count,
        maxAllowed: result.max_allowed,
        checkoutUrl: result.checkout_url,
      };
    } catch (error) {
      console.error('[BatteryStore] Error checking prep limit:', error);
      return { canAdd: false, isPremium: false };
    }
  },

  openEmptyModal: () => set({ isEmptyModalOpen: true }),
  closeEmptyModal: () => set({ isEmptyModalOpen: false }),
  openPrepLimitModal: () => set({ isPrepLimitModalOpen: true }),
  closePrepLimitModal: () => set({ isPrepLimitModalOpen: false }),

  reset: () => set({
    batteryStatus: null,
    currentPreparatorioId: null,
    settings: null,
    isLoading: false,
    isConsuming: false,
    isEmptyModalOpen: false,
    isPrepLimitModalOpen: false,
  }),
}));
