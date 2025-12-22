import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification } from '../types';
import { STORAGE_KEYS } from '../constants';

interface NotificationState {
    notifications: AppNotification[];

    // Actions
    addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'time'>) => void;
    markAsRead: (id: string) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [
                {
                    id: '1',
                    title: 'Bem-vindo!',
                    description: 'Sua jornada de estudos começa agora. Explore suas trilhas!',
                    time: 'Agora',
                    read: false,
                    type: 'success',
                },
                {
                    id: '2',
                    title: 'Novo Simulado Disponível',
                    description: 'Um novo simulado da PRF foi adicionado à sua biblioteca.',
                    time: '2h atrás',
                    read: false,
                    type: 'info',
                    link: '/simulados',
                }
            ],

            addNotification: (notification) =>
                set((state) => ({
                    notifications: [
                        {
                            ...notification,
                            id: Math.random().toString(36).substring(7),
                            read: false,
                            time: 'Agora',
                        },
                        ...state.notifications,
                    ],
                })),

            markAsRead: (id) =>
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                })),

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),

            clearAll: () => set({ notifications: [] }),
        }),
        {
            name: 'ouse-passar-notifications',
        }
    )
);
