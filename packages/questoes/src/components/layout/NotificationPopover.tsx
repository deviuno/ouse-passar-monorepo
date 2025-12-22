import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ExternalLink, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../../stores';
import { useNavigate } from 'react-router-dom';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRect: DOMRect | null;
}

export function NotificationPopover({ isOpen, onClose, triggerRect }: NotificationPopoverProps) {
    const { notifications, removeNotification, markAsRead, clearAll } = useNotificationStore();
    const navigate = useNavigate();

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            navigate(link);
            onClose();
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Calculate position
    const popoverStyle: React.CSSProperties = triggerRect ? {
        position: 'fixed',
        top: triggerRect.top,
        left: triggerRect.right + 12, // 12px gap
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
                        style={popoverStyle}
                        className="w-80 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#3A3A3A] flex items-center justify-between bg-[#242424]">
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-[#FFB800]" />
                                <h3 className="text-white font-semibold text-sm">Notificações</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] text-[#A0A0A0] hover:text-white transition-colors"
                                    >
                                        Limpar tudo
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-lg hover:bg-[#3A3A3A] text-[#A0A0A0] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <ul className="divide-y divide-[#3A3A3A]">
                                    {notifications.map((n) => (
                                        <li
                                            key={n.id}
                                            className={`group relative p-4 transition-colors hover:bg-[#242424] ${!n.read ? 'bg-[#FFB800]/5' : ''}`}
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => handleNotificationClick(n.id, n.link)}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-medium leading-tight ${!n.read ? 'text-white' : 'text-[#A0A0A0]'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px] text-[#6E6E6E] whitespace-nowrap">{n.time}</span>
                                                </div>
                                                <p className="text-xs text-[#808080] leading-relaxed line-clamp-2">
                                                    {n.description}
                                                </p>
                                                {n.link && (
                                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#FFB800] opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink size={10} />
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
                                                className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#3A3A3A]/0 group-hover:bg-[#3A3A3A] text-[#E74C3C] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                title="Remover"
                                            >
                                                <Trash2 size={12} />
                                            </button>

                                            {/* Unread indicator */}
                                            {!n.read && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FFB800] rounded-full" />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center mb-3">
                                        <Bell size={24} className="text-[#3A3A3A]" />
                                    </div>
                                    <p className="text-[#A0A0A0] text-sm">Nenhuma notificação por aqui.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2 border-t border-[#3A3A3A] bg-[#242424]">
                                <p className="text-[10px] text-[#6E6E6E] text-center">
                                    Você tem {unreadCount} notificações não lidas
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
