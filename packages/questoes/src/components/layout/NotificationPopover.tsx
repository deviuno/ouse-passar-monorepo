import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { useNotificationStore, useAuthStore } from '../../stores';
import { useNavigate } from 'react-router-dom';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRect: DOMRect | null;
}

export function NotificationPopover({ isOpen, onClose, triggerRect }: NotificationPopoverProps) {
    const { notifications, removeNotification, markAsRead, clearAll, fetchNotifications, isLoading } = useNotificationStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Buscar notificações quando o popover abrir
    useEffect(() => {
        if (isOpen && user?.id) {
            fetchNotifications(user.id);
        }
    }, [isOpen, user?.id, fetchNotifications]);

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            navigate(link);
            onClose();
        }
    };

    const handleClearAll = () => {
        if (user?.id) {
            clearAll(user.id);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Calculate position
    const popoverStyle: React.CSSProperties = triggerRect ? {
        position: 'fixed',
        top: triggerRect.top,
        left: triggerRect.right + 12,
        zIndex: 1000,
    } : {};

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for click outside */}
                    <div
                        className="fixed inset-0 z-[999] bg-transparent"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -10 }}
                        transition={{ duration: 0.15 }}
                        style={popoverStyle}
                        className="w-80 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-elevated)] overflow-hidden theme-transition"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-[var(--color-brand)]" />
                                <h3 className="text-[var(--color-text-main)] font-semibold text-sm">Notificações</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] transition-colors"
                                    >
                                        Limpar tudo
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-md hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-sec)] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[320px] overflow-y-auto">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center">
                                    <Loader2 size={24} className="text-[var(--color-brand)] animate-spin" />
                                    <p className="text-[var(--color-text-muted)] text-xs mt-2">Carregando...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                <ul className="divide-y divide-[var(--color-border)]">
                                    {notifications.map((n) => (
                                        <li
                                            key={n.id}
                                            className={`group relative px-4 py-3 transition-colors hover:bg-[var(--color-bg-elevated)] ${!n.read ? 'bg-[var(--color-brand)]/5' : ''}`}
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => handleNotificationClick(n.id, n.link)}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-1">
                                                    <h4 className={`text-sm font-medium leading-tight ${!n.read ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sec)]'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{n.time}</span>
                                                </div>
                                                <p className="text-xs text-[var(--color-text-sec)] leading-relaxed line-clamp-2 pr-6">
                                                    {n.description}
                                                </p>
                                                {n.link && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink size={12} />
                                                        Ver detalhes
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delete Action */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(n.id);
                                                }}
                                                className="absolute top-3 right-3 p-1.5 rounded-md bg-transparent group-hover:bg-[var(--color-bg-main)] text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remover"
                                            >
                                                <Trash2 size={12} />
                                            </button>

                                            {/* Unread indicator */}
                                            {!n.read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--color-brand)] rounded-full" />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-12 px-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-3">
                                        <Bell size={20} className="text-[var(--color-text-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-text-sec)] text-sm">Nenhuma notificação</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {unreadCount > 0 && (
                            <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                                <p className="text-xs text-[var(--color-text-muted)] text-center">
                                    {unreadCount} {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
