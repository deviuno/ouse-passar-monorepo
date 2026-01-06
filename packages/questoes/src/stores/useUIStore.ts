import { create } from 'zustand';
import { ToastMessage, ToastType, GamificationModalType } from '../types';

interface UIState {
  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modals
  activeModal: GamificationModalType;
  setActiveModal: (modal: GamificationModalType) => void;
  closeModal: () => void;

  // Mission Preview Modal
  showMissionPreview: boolean;
  setShowMissionPreview: (show: boolean) => void;

  // Tutor Chat
  isTutorOpen: boolean;
  setTutorOpen: (open: boolean) => void;
  toggleTutor: () => void;

  // Sidebar (desktop)
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Right Sidebar (trail)
  isRightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  toggleRightSidebar: () => void;

  // Loading states
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Product Tour
  isTourActive: boolean;
  isTourCompleted: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  checkTourStatus: () => void;

  // Practice Mode (for Header integration)
  practiceMode: {
    isActive: boolean;
    correctCount: number;
    wrongCount: number;
    showFilters: boolean;
    onBack: (() => void) | null;
    onToggleFilters: (() => void) | null;
  };
  setPracticeMode: (mode: Partial<UIState['practiceMode']>) => void;
  clearPracticeMode: () => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState>()((set, get) => ({
  // Toasts
  toasts: [],

  addToast: (type, message) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastMessage = { id, type, message };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modals
  activeModal: null,
  setActiveModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),

  // Mission Preview
  showMissionPreview: false,
  setShowMissionPreview: (showMissionPreview) => set({ showMissionPreview }),

  // Tutor
  isTutorOpen: false,
  setTutorOpen: (isTutorOpen) => set({ isTutorOpen }),
  toggleTutor: () => set((state) => ({ isTutorOpen: !state.isTutorOpen })),

  // Sidebar
  isSidebarOpen: true,
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Right Sidebar (trail)
  isRightSidebarOpen: true,
  setRightSidebarOpen: (isRightSidebarOpen) => set({ isRightSidebarOpen }),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

  // Loading
  isPageLoading: false,
  setPageLoading: (isPageLoading) => set({ isPageLoading }),

  // Theme
  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Product Tour
  isTourActive: false,
  isTourCompleted: localStorage.getItem('ousepassar_tour_completed') === 'true',

  startTour: () => {
    set({ isTourActive: true });
  },

  completeTour: () => {
    localStorage.setItem('ousepassar_tour_completed', 'true');
    set({ isTourActive: false, isTourCompleted: true });
  },

  skipTour: () => {
    localStorage.setItem('ousepassar_tour_completed', 'true');
    set({ isTourActive: false, isTourCompleted: true });
  },

  checkTourStatus: () => {
    const completed = localStorage.getItem('ousepassar_tour_completed') === 'true';
    set({ isTourCompleted: completed });
  },

  // Practice Mode
  practiceMode: {
    isActive: false,
    correctCount: 0,
    wrongCount: 0,
    showFilters: false,
    onBack: null,
    onToggleFilters: null,
  },
  setPracticeMode: (mode) =>
    set((state) => ({
      practiceMode: { ...state.practiceMode, ...mode },
    })),
  clearPracticeMode: () =>
    set({
      practiceMode: {
        isActive: false,
        correctCount: 0,
        wrongCount: 0,
        showFilters: false,
        onBack: null,
        onToggleFilters: null,
      },
    }),
}));

// Helper hooks for common toast patterns
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    info: (message: string) => addToast('info', message),
  };
};
