
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, Mic, Square, MessageSquare, GripHorizontal, Sparkles, Headphones, Radio, FileText, Video, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithTutor, TutorUserContext, generateAudioExplanation, generatePodcast, GeneratedAudio } from '../../services/geminiService';
import { ParsedQuestion } from '../../types';

// Shortcut options for AI-generated content
interface ShortcutOption {
    id: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    action: () => void;
    disabled?: boolean;
}

interface MentorChatProps {
    contentContext: {
        title?: string;
        text?: string;
        question?: ParsedQuestion;
    };
    userContext?: TutorUserContext;
    isVisible?: boolean;
    onClose?: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    audio?: GeneratedAudio | null;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
    // Split by lines to handle headings and lists
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
        if (currentList.length > 0 && listType) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            const listKey = `list-${elements.length}-${Date.now()}`;
            elements.push(
                <ListTag key={listKey} className={listType === 'ol' ? 'list-decimal ml-4 my-2' : 'list-disc ml-4 my-2'}>
                    {currentList.map((item, i) => <li key={`li-${i}`} className="my-1">{renderInline(item)}</li>)}
                </ListTag>
            );
            currentList = [];
            listType = null;
        }
    };

    const renderInline = (line: string): React.ReactNode => {
        // Handle bold (**text**) and inline code (`code`)
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-[#FFB800]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[#3A3A3A] px-1 rounded text-[#E0E0E0]">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const lineKey = `line-${idx}`;

        // Headings
        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-1 text-sm">{renderInline(trimmed.slice(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-2 text-lg">{renderInline(trimmed.slice(2))}</h2>);
        }
        // Unordered list
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (listType !== 'ul') flushList();
            listType = 'ul';
            currentList.push(trimmed.slice(2));
        }
        // Ordered list
        else if (/^\d+\.\s/.test(trimmed)) {
            if (listType !== 'ol') flushList();
            listType = 'ol';
            currentList.push(trimmed.replace(/^\d+\.\s/, ''));
        }
        // Horizontal rule
        else if (trimmed === '---' || trimmed === '***') {
            flushList();
            elements.push(<hr key={lineKey} className="border-[#3A3A3A] my-3" />);
        }
        // Empty line (paragraph break)
        else if (trimmed === '') {
            flushList();
            elements.push(<div key={lineKey} className="h-2" />);
        }
        // Regular paragraph
        else {
            flushList();
            elements.push(<p key={lineKey} className="my-1">{renderInline(trimmed)}</p>);
        }
    });

    flushList();
    return <div className="space-y-1">{elements}</div>;
}

const MIN_HEIGHT = 300;
const MAX_HEIGHT = 700;
const DEFAULT_HEIGHT = 462; // 420px + 10%
const COLLAPSED_HEIGHT = 72; // Just input field

export function MentorChat({ contentContext, userContext, isVisible = true, onClose }: MentorChatProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed = only input visible
    const [threadId, setThreadId] = useState<string | undefined>(undefined);
    const [chatHeight, setChatHeight] = useState(DEFAULT_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartY = useRef(0);
    const resizeStartHeight = useRef(0);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // When controlled externally, always show expanded
    const isControlled = onClose !== undefined;

    // Dynamic greeting based on context
    const getGreeting = () => {
        // Extrair a essência do título - pegar apenas o tema principal
        const extractEssence = (title: string | undefined): string => {
            if (!title) return 'o conteúdo';

            // Limpar o texto
            const cleaned = title
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // Estratégias para extrair a essência:
            // 1. Se tem "Introdução ao/à", pegar o que vem depois
            const introMatch = cleaned.match(/Introdução a[o|à]\s+(.+?)(?:\s*[-–—.]|$)/i);
            if (introMatch) {
                return introMatch[1].trim();
            }

            // 2. Pegar a primeira parte antes de separadores (-, –, ., :)
            const parts = cleaned.split(/\s*[-–—.:]\s*/);
            if (parts.length > 0 && parts[0].length >= 3) {
                // Se a primeira parte é muito curta, juntar com a segunda
                if (parts[0].length < 15 && parts.length > 1) {
                    return `${parts[0]} - ${parts[1]}`.trim();
                }
                return parts[0].trim();
            }

            // 3. Fallback: pegar as primeiras palavras significativas
            const words = cleaned.split(' ').slice(0, 4);
            return words.join(' ');
        };

        if (contentContext.question) {
            const assunto = extractEssence(contentContext.question.assunto || contentContext.question.materia);
            return `Olá! 👋 Sou seu **Tutor IA**. Vi que você está estudando **${assunto}**.\n\nComo posso te ajudar?`;
        }
        const title = extractEssence(contentContext.title);
        return `Olá! 👋 Estou aqui para te ajudar com **${title}**.\n\nPode perguntar sobre conceitos, pedir explicações ou tirar dúvidas!`;
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: getGreeting()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset messages when question changes
    useEffect(() => {
        setMessages([{ role: 'model', text: getGreeting() }]);
        setThreadId(undefined);
    }, [contentContext.question?.id, contentContext.title]);

    // Shortcuts dropdown state
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const shortcutsRef = useRef<HTMLDivElement>(null);

    // Close shortcuts dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
                setShowShortcuts(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
        resizeStartHeight.current = chatHeight;
    }, [chatHeight]);

    const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isResizing) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = resizeStartY.current - clientY;
        const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeStartHeight.current + deltaY));
        setChatHeight(newHeight);
    }, [isResizing]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add/remove resize event listeners
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            document.addEventListener('touchmove', handleResizeMove);
            document.addEventListener('touchend', handleResizeEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.removeEventListener('touchmove', handleResizeMove);
            document.removeEventListener('touchend', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // Audio / Speech Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isExpanded || (isControlled && isVisible)) {
            scrollToBottom();
        }
    }, [messages, isExpanded, isControlled, isVisible]);

    // Focus input when chat opens
    useEffect(() => {
        if ((isExpanded || (isControlled && isVisible)) && inputRef.current) {
            // Small delay to ensure the animation has started and element is visible
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isExpanded, isControlled, isVisible]);

    // Handle click outside to collapse (not close) the chat
    useEffect(() => {
        if (!isControlled || !isVisible || isCollapsed) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Don't collapse if clicking inside the chat container
            if (chatContainerRef.current?.contains(target)) return;
            // Don't collapse if clicking on the floating button (it has its own handler)
            if (target.closest('[data-floating-chat-button]')) return;

            setIsCollapsed(true);
        };

        // Small delay to avoid triggering on the same click that opened the chat
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isControlled, isVisible, isCollapsed]);

    // Reset collapsed state when chat opens
    useEffect(() => {
        if (isVisible) {
            setIsCollapsed(false);
        }
    }, [isVisible]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            // @ts-ignore
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';

            recognition.onstart = () => setIsRecording(true);
            recognition.onend = () => setIsRecording(false);
            recognition.onerror = () => setIsRecording(false);

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript;
                }
                if (transcript) {
                    setInputValue(transcript);
                }
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const handleMicClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!recognitionRef.current) {
            alert("Navegador sem suporte a voz.");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    // Shortcut handlers for AI-generated content
    const handleGenerateAudio = async () => {
        setShowShortcuts(false);
        setIsGeneratingAudio(true);
        setMessages(prev => [...prev, {
            role: 'user',
            text: '🎧 Gerar explicação em áudio'
        }]);
        setMessages(prev => [...prev, {
            role: 'model',
            text: '🎙️ Gerando áudio explicativo... Aguarde um momento.'
        }]);

        try {
            const audio = await generateAudioExplanation(contentContext.title || 'o conteúdo', contentContext.text || '');
            if (audio) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: `🎧 **Áudio gerado com sucesso!**\n\nOuça a explicação sobre **${contentContext.title || 'o conteúdo'}**:`,
                        audio: audio
                    };
                    return newMessages;
                });
            } else {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: '❌ Não foi possível gerar o áudio. Tente novamente mais tarde.'
                    };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error generating audio:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'model',
                    text: '❌ Erro ao gerar áudio. Verifique sua conexão.'
                };
                return newMessages;
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleGeneratePodcast = async () => {
        setShowShortcuts(false);
        setIsGeneratingAudio(true);
        setMessages(prev => [...prev, {
            role: 'user',
            text: '🎙️ Gerar podcast sobre o tema'
        }]);
        setMessages(prev => [...prev, {
            role: 'model',
            text: '🎙️ Gerando podcast com dois apresentadores... Isso pode levar alguns segundos.'
        }]);

        try {
            const audio = await generatePodcast(contentContext.title || 'o conteúdo', contentContext.text || '');
            if (audio) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: `🎙️ **Podcast gerado!**\n\nOuça a discussão entre os apresentadores sobre **${contentContext.title || 'o conteúdo'}**:`,
                        audio: audio
                    };
                    return newMessages;
                });
            } else {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: '❌ Não foi possível gerar o podcast. Tente novamente mais tarde.'
                    };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error generating podcast:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'model',
                    text: '❌ Erro ao gerar podcast. Verifique sua conexão.'
                };
                return newMessages;
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleGenerateSummary = () => {
        setShowShortcuts(false);
        setInputValue('Faça um resumo rápido e objetivo dos pontos principais deste conteúdo.');
        // Auto-send after setting the input
        setTimeout(() => {
            const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
            sendButton?.click();
        }, 100);
    };

    const shortcutOptions: ShortcutOption[] = [
        {
            id: 'audio',
            icon: <Headphones size={18} />,
            label: 'Explicar em Áudio',
            description: 'Gera uma explicação falada do conteúdo',
            action: handleGenerateAudio,
        },
        {
            id: 'podcast',
            icon: <Radio size={18} />,
            label: 'Gerar Podcast',
            description: 'Cria um podcast com dois apresentadores',
            action: handleGeneratePodcast,
        },
        {
            id: 'summary',
            icon: <FileText size={18} />,
            label: 'Resumo Rápido',
            description: 'Gera um resumo objetivo do conteúdo',
            action: handleGenerateSummary,
        },
        {
            id: 'video',
            icon: <Video size={18} />,
            label: 'Gerar Vídeo',
            description: 'Em breve: cria um vídeo explicativo',
            action: () => {},
            disabled: true,
        },
    ];

    const handleSend = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);

        // Use actual question if provided, otherwise create a content-based context
        const questionContext: ParsedQuestion = contentContext.question || {
            id: 0,
            materia: 'Conteúdo Teórico',
            assunto: contentContext.title || 'Geral',
            enunciado: contentContext.text || '',
            parsedAlternativas: [],
            alternativas: '[]',
            gabarito: '',
            comentario: '',
            orgao: '',
            banca: '',
            ano: new Date().getFullYear(),
            concurso: 'MentorChat',
        };

        const response = await chatWithTutor(messages, userText, questionContext, userContext, threadId);

        // Store the threadId for continuous conversation
        if (response.threadId) {
            setThreadId(response.threadId);
        }

        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        setIsLoading(false);
    };

    // Handle close action
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setIsExpanded(false);
        }
    };

    // If controlled and not visible, don't render
    if (isControlled && !isVisible) {
        return null;
    }

    // Determine if we should show expanded view
    const showExpanded = isControlled ? isVisible : isExpanded;

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-0 pointer-events-none"
            initial={false}
            animate={{}}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
            <AnimatePresence mode="wait">
                {!isControlled && !isExpanded ? (
                    <motion.div
                        key="collapsed"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className="w-full max-w-[850px] bg-[#1A1A1A] border border-[#3A3A3A] rounded-t-xl rounded-b-xl shadow-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-colors pointer-events-auto"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-[#FFB800] p-1.5 rounded-lg">
                                <Zap size={20} className="text-black fill-black" />
                            </div>
                            <span className="font-bold text-white">Seu Mentor IA</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#A0A0A0] text-sm">
                            <span>Tirar duvidas</span>
                            <MessageSquare size={18} />
                        </div>
                    </motion.div>
                ) : showExpanded && (
                    <motion.div
                        ref={chatContainerRef}
                        key="expanded"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        style={{ height: isCollapsed ? COLLAPSED_HEIGHT : chatHeight }}
                        className="w-full max-w-[900px] bg-[#1A1A1A] border border-[#3A3A3A] rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto transition-all duration-200"
                    >
                        {/* Resize Handle - only show when expanded */}
                        {!isCollapsed && (
                            <div
                                onMouseDown={handleResizeStart}
                                onTouchStart={handleResizeStart}
                                className={`
                                    flex items-center justify-center h-6 cursor-ns-resize
                                    bg-[#1A1A1A] rounded-t-2xl
                                    hover:bg-[#252525] transition-colors group
                                    ${isResizing ? 'bg-[#252525]' : ''}
                                `}
                            >
                                <GripHorizontal
                                    size={20}
                                    className={`text-[#4A4A4A] group-hover:text-[#6E6E6E] transition-colors ${isResizing ? 'text-[#FFB800]' : ''}`}
                                />
                            </div>
                        )}

                        {/* Messages - only show when not collapsed */}
                        {!isCollapsed && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#121212]">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-[#FFB800] text-black font-medium rounded-tr-none'
                                                : 'bg-[#252525] text-[#E0E0E0] rounded-tl-none border border-[#3A3A3A]'
                                                }`}
                                        >
                                            {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}

                                            {/* Audio Player inline - shows when message has audio */}
                                            {msg.audio && (
                                                <div className="mt-3 pt-3 border-t border-[#3A3A3A]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="bg-[#FFB800] p-1.5 rounded-lg">
                                                            {msg.audio.type === 'podcast' ? <Radio size={16} className="text-black" /> : <Headphones size={16} className="text-black" />}
                                                        </div>
                                                        <span className="text-white text-xs font-medium">
                                                            {msg.audio.type === 'podcast' ? 'Podcast' : 'Áudio Explicativo'}
                                                        </span>
                                                    </div>
                                                    <audio
                                                        controls
                                                        className="w-full h-10"
                                                        src={msg.audio.audioUrl}
                                                    >
                                                        Seu navegador não suporta áudio.
                                                    </audio>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#252525] p-3 rounded-2xl rounded-tl-none border border-[#3A3A3A]">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-[#A0A0A0] rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-[#A0A0A0] rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-[#A0A0A0] rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {/* Footer Input */}
                        <div
                            className={`p-4 bg-[#1A1A1A] ${isCollapsed ? 'rounded-t-2xl' : 'border-t border-[#3A3A3A]'}`}
                            onClick={() => isCollapsed && setIsCollapsed(false)}
                        >
                            <div className="relative" ref={shortcutsRef}>
                                {/* Shortcuts Dropdown - only show when expanded */}
                                <AnimatePresence>
                                    {showShortcuts && !isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 mb-2 w-72 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl shadow-2xl overflow-hidden z-50"
                                        >
                                            <div className="p-2">
                                                <p className="text-[#6E6E6E] text-xs font-medium px-2 py-1.5">Atalhos de IA</p>
                                                {shortcutOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={option.action}
                                                        disabled={option.disabled || isGeneratingAudio}
                                                        className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${
                                                            option.disabled
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : 'hover:bg-[#252525]'
                                                        }`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${option.disabled ? 'bg-[#3A3A3A]' : 'bg-[#FFB800]/10 text-[#FFB800]'}`}>
                                                            {option.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium">{option.label}</p>
                                                            <p className="text-[#6E6E6E] text-xs truncate">{option.description}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Shortcuts Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isCollapsed) setShowShortcuts(!showShortcuts);
                                    }}
                                    disabled={isGeneratingAudio || isCollapsed}
                                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                                        showShortcuts
                                            ? 'bg-[#FFB800] text-black'
                                            : 'text-[#A0A0A0] hover:text-[#FFB800] hover:bg-[#3A3A3A]'
                                    } ${(isGeneratingAudio || isCollapsed) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Atalhos de IA"
                                >
                                    {isGeneratingAudio ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={18} />
                                    )}
                                </button>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
                                    onFocus={() => isCollapsed && setIsCollapsed(false)}
                                    placeholder={isCollapsed ? "Clique para expandir o chat..." : "Digite sua duvida..."}
                                    className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl pl-12 pr-24 py-3 text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#FFB800] transition-colors"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMicClick(e);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${isRecording
                                            ? 'text-[#FF4444] bg-[#FF4444]/10 animate-pulse'
                                            : 'text-[#A0A0A0] hover:text-[#FFB800] hover:bg-[#3A3A3A]'
                                            }`}
                                        title="Gravar audio"
                                    >
                                        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                                    </button>
                                    <button
                                        data-send-button
                                        onClick={(e) => handleSend(e)}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="p-2 bg-[#FFB800] hover:bg-[#FFC933] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
