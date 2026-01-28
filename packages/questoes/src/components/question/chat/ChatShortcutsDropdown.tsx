import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Headphones, Radio, FileText, Video } from 'lucide-react';

export interface ShortcutOption {
    id: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    action: (e?: React.MouseEvent) => void;
    disabled?: boolean;
}

interface ChatShortcutsDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    isGenerating: boolean;
    isCollapsed: boolean;
    onGenerateAudio: (e?: React.MouseEvent) => void;
    onGeneratePodcast: (e?: React.MouseEvent) => void;
    onGenerateSummary: (e?: React.MouseEvent) => void;
    shortcutsRef: React.RefObject<HTMLDivElement>;
}

export function ChatShortcutsDropdown({
    isOpen,
    onToggle,
    isGenerating,
    isCollapsed,
    onGenerateAudio,
    onGeneratePodcast,
    onGenerateSummary,
    shortcutsRef,
}: ChatShortcutsDropdownProps) {
    const shortcutOptions: ShortcutOption[] = [
        {
            id: 'audio',
            icon: <Headphones size={18} />,
            label: 'Explicar em Audio',
            description: 'Gera uma explicacao falada do conteudo',
            action: onGenerateAudio,
        },
        {
            id: 'podcast',
            icon: <Radio size={18} />,
            label: 'Gerar Podcast',
            description: 'Cria um podcast com dois apresentadores',
            action: onGeneratePodcast,
        },
        {
            id: 'summary',
            icon: <FileText size={18} />,
            label: 'Resumo Rapido',
            description: 'Gera um resumo objetivo do conteudo',
            action: onGenerateSummary,
        },
        {
            id: 'video',
            icon: <Video size={18} />,
            label: 'Gerar Video',
            description: 'Em breve: cria um video explicativo',
            action: () => { },
            disabled: true,
        },
    ];

    return (
        <div ref={shortcutsRef}>
            {/* Shortcuts Dropdown */}
            <AnimatePresence>
                {isOpen && !isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-2">
                            <p className="text-[#6E6E6E] text-xs font-medium px-2 py-1.5">Atalhos de IA</p>
                            {shortcutOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={(e) => option.action(e)}
                                    disabled={option.disabled || isGenerating}
                                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${option.disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-[var(--color-bg-elevated)]'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-lg ${option.disabled ? 'bg-[var(--color-bg-elevated)]' : 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'}`}>
                                        {option.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[var(--color-text-main)] text-sm font-medium">{option.label}</p>
                                        <p className="text-[var(--color-text-muted)] text-xs truncate">{option.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shortcuts Toggle Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isCollapsed) onToggle();
                }}
                disabled={isGenerating || isCollapsed}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isOpen
                        ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
                        : 'text-[var(--color-text-sec)] hover:text-[var(--color-brand)] hover:bg-[var(--color-bg-elevated)]'
                    } ${(isGenerating || isCollapsed) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Atalhos de IA"
            >
                {isGenerating ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Sparkles size={18} />
                )}
            </button>
        </div>
    );
}
