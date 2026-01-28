import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  CheckCircle,
  Gift,
  Trophy,
  Users,
  Zap,
  Flame,
  Clock,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuthStore, useUIStore } from '../stores';
import { supabase } from '../services/supabase';

interface Notification {
  id: string;
  type: 'achievement' | 'referral' | 'reward' | 'streak' | 'level' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  achievement: Trophy,
  referral: Users,
  reward: Gift,
  streak: Flame,
  level: Zap,
  system: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  achievement: '#FFB800',
  referral: '#2ECC71',
  reward: '#9B59B6',
  streak: '#E74C3C',
  level: '#3498DB',
  system: '#A0A0A0',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const color = NOTIFICATION_COLORS[notification.type] || '#A0A0A0';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        bg-[#1A1A1A] border rounded-xl p-4
        ${notification.read ? 'border-[#2A2A2A]' : 'border-[#3A3A3A]'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${notification.read ? 'opacity-50' : ''}
          `}
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={20} style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`font-medium ${notification.read ? 'text-[#A0A0A0]' : 'text-white'}`}>
                {notification.title}
              </h4>
              <p className="text-[#6E6E6E] text-sm mt-0.5">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-[#3498DB] flex-shrink-0 mt-2" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-[#6E6E6E] text-xs">
              <Clock size={12} />
              <span>{formatRelativeTime(notification.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors"
                  title="Marcar como lida"
                >
                  <CheckCircle size={16} className="text-[#2ECC71]" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors"
                title="Remover"
              >
                <Trash2 size={16} className="text-[#E74C3C]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { setHeaderOverride, clearHeaderOverride } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [profile?.id]);

  const loadNotifications = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // TODO: Implementar tabela de notificações no Supabase
      // Por enquanto, usando dados mock
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'streak',
          title: 'Ofensiva de 7 dias!',
          message: 'Parabéns! Você manteve sua sequência de estudos por 7 dias seguidos.',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          type: 'level',
          title: 'Novo nível alcançado!',
          message: 'Você subiu para o nível 5. Continue assim!',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          type: 'referral',
          title: 'Nova indicação confirmada',
          message: 'Seu amigo João completou o cadastro. Você ganhou 100 pontos!',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          type: 'achievement',
          title: 'Conquista desbloqueada!',
          message: 'Você completou 100 questões. Medalha "Centurião" liberada!',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  // Set up header
  useEffect(() => {
    setHeaderOverride({
      title: 'Notificações',
      showBackButton: true,
      backPath: '/',
      hideIcon: true,
    });

    return () => {
      clearHeaderOverride();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] pb-24 md:pb-8 theme-transition">
      {/* Actions Bar */}
      <div className="px-4 py-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#3498DB] text-white'
                    : 'bg-[#2A2A2A] text-[#A0A0A0] hover:bg-[#3A3A3A]'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-[#3498DB] text-white'
                    : 'bg-[#2A2A2A] text-[#A0A0A0] hover:bg-[#3A3A3A]'
                }`}
              >
                Não lidas
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-[#3498DB] text-sm hover:underline"
              >
                <CheckCheck size={16} />
                Marcar todas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center mx-auto mb-4">
              <BellOff size={32} className="text-[#6E6E6E]" />
            </div>
            <h3 className="text-white font-semibold mb-2">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </h3>
            <p className="text-[#6E6E6E] text-sm">
              {filter === 'unread'
                ? 'Você está em dia com suas notificações!'
                : 'Suas notificações aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
