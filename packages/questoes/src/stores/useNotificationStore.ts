import { create } from 'zustand';
import { AppNotification } from '../types';
import {
  getUserNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification,
  clearAllNotifications,
  Notification,
} from '../services/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: (userId: string) => void;
}

// Helper para converter Notification do service para AppNotification
const mapToAppNotification = (n: Notification): AppNotification => ({
  id: n.id,
  title: n.title,
  description: n.description,
  time: n.time_ago || formatTimeAgo(n.created_at),
  read: n.read,
  type: mapIconToType(n.icon),
  link: n.link,
});

// Helper para mapear icon para type
const mapIconToType = (icon: string | undefined): AppNotification['type'] => {
  switch (icon) {
    case 'success':
    case 'trophy':
    case 'star':
      return 'success';
    case 'warning':
    case 'fire':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

// Helper para formatar tempo relativo
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string) => {
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const data = await getUserNotifications(userId, 50, true);
      const notifications = data.map(mapToAppNotification);
      set({ notifications, isLoading: false });
    } catch (error) {
      console.error('[NotificationStore] Error fetching notifications:', error);
      set({ error: 'Erro ao carregar notificações', isLoading: false });
    }
  },

  addNotification: (notification: AppNotification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  markAsRead: async (id: string) => {
    // Atualiza localmente primeiro (optimistic update)
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));

    // Sincroniza com o banco
    const success = await markAsReadService(id);
    if (!success) {
      console.error('[NotificationStore] Failed to mark as read in database');
    }
  },

  markAllAsRead: async () => {
    // Atualiza localmente primeiro
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));

    // Sincroniza com o banco
    const count = await markAllAsReadService();
    console.log('[NotificationStore] Marked all as read:', count);
  },

  removeNotification: async (id: string) => {
    // Atualiza localmente primeiro
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    // Sincroniza com o banco
    const success = await deleteNotification(id);
    if (!success) {
      console.error('[NotificationStore] Failed to delete notification');
    }
  },

  clearAll: async (userId: string) => {
    if (!userId) return;

    // Atualiza localmente primeiro
    set({ notifications: [] });

    // Sincroniza com o banco
    const success = await clearAllNotifications(userId);
    if (!success) {
      console.error('[NotificationStore] Failed to clear all notifications');
    }
  },
}));
