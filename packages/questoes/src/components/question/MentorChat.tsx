
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, Mic, Square, MessageSquare, GripHorizontal, Sparkles, Headphones, Radio, FileText, Video, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithTutor, TutorUserContext, GeneratedAudio } from '../../services/geminiService';
import { generateAudioWithCache, generatePodcastWithCache } from '../../services/audioCacheService';
import { musicService } from '../../services/musicService';
import { AudioPlayer } from '../ui/AudioPlayer';
import { ParsedQuestion } from '../../types';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { getTimeUntilRecharge } from '../../types/battery';

// Delay simulado para áudios em cache (para dar impressão de geração)
const CACHE_SIMULATION_DELAY = 1500; // 1.5 segundos

// Helper para obter a duração de um áudio a partir da URL
const getAudioDuration = (audioUrl: string): Promise<number> => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
        });
        audio.addEventListener('error', () => {
            resolve(0); // Se falhar, retorna 0
        });
        audio.src = audioUrl;
    });
};

// Shortcut options for AI-generated content
interface ShortcutOption {
    id: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    action: (e?: React.MouseEvent) => void;
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
    userId?: string;
    preparatorioId?: string;
    checkoutUrl?: string;
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
                return <strong key={i} className="font-semibold text-[var(--color-brand)]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[var(--color-bg-elevated)] px-1 rounded text-[var(--color-text-main)] border border-[var(--color-border)]">{part.slice(1, -1)}</code>;
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
            elements.push(<h4 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-1 text-sm">{renderInline(trimmed.slice(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-2 text-lg">{renderInline(trimmed.slice(2))}</h2>);
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
            elements.push(<hr key={lineKey} className="border-[var(--color-border)] my-3" />);
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

export function MentorChat({ contentContext, userContext, isVisible = true, onClose, userId, preparatorioId, checkoutUrl }: MentorChatProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed = only input visible
    const [threadId, setThreadId] = useState<string | undefined>(undefined);
    const [chatHeight, setChatHeight] = useState(DEFAULT_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartY = useRef(0);
    const resizeStartHeight = useRef(0);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Battery store
    const { consumeBattery, batteryStatus } = useBatteryStore();

    // Helper para gerar mensagem de bateria insuficiente
    const getBatteryEmptyMessage = (): string => {
        const { hours, minutes } = getTimeUntilRecharge();
        let timeMsg = '';
        if (hours > 0) {
            timeMsg = `${hours}h${minutes > 0 ? ` e ${minutes}min` : ''}`;
        } else {
            timeMsg = `${minutes} minutos`;
        }

        let message = `⚡ **Ops! Sua energia acabou.**\n\nVocê não tem energia suficiente para usar o chat agora.\n\n`;
        message += `🔋 Sua bateria será recarregada em **${timeMsg}**.\n\n`;
        if (checkoutUrl) {
            message += `💡 **Dica:** Adquira o acesso ilimitado e nunca mais se preocupe com energia!`;
        }
        return message;
    };

    // Função para consumir bateria e verificar se pode prosseguir
    const checkAndConsumeBattery = async (
        actionType: 'chat_message' | 'chat_audio' | 'chat_podcast' | 'chat_summary',
        clickX?: number,
        clickY?: number
    ): Promise<boolean> => {
        if (!userId || !preparatorioId) {
            // Se não tiver userId ou preparatorioId, permite sem consumir (modo demo)
            return true;
        }

        const result = await consumeBattery(userId, preparatorioId, actionType, { clickX, clickY });

        if (!result.success && result.error === 'insufficient_battery') {
            // Adicionar mensagem de bateria insuficiente
            setMessages(prev => [...prev, {
                role: 'model',
                text: getBatteryEmptyMessage()
            }]);
            return false;
        }

        return result.success || result.is_premium === true;
    };

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

        // Extrair tema do conteúdo da aula se disponível
        const extractThemeFromContent = (text: string | undefined): string | null => {
            if (!text || text.length < 50) return null;

            // Procurar por padrões comuns em textos de aula
            // 1. Primeiro título markdown (# ou ##) - mais comum em conteúdo gerado
            const markdownTitle = text.match(/^#{1,3}\s*(.+?)(?:\n|$)/m);
            if (markdownTitle && markdownTitle[1].length > 5) {
                // Limpar emojis e caracteres especiais do início
                return markdownTitle[1].replace(/^[🎯📚⚖️🏛️💡✨🔍📝]+\s*/, '').trim();
            }

            // 2. Título em negrito no início (**Título**)
            const boldTitle = text.match(/^\*\*(.+?)\*\*/m);
            if (boldTitle && boldTitle[1].length > 5 && boldTitle[1].length < 100) {
                return boldTitle[1].trim();
            }

            // 3. Procurar por padrões como "Introdução ao/à X", "Conceitos de X", etc.
            const topicPatterns = [
                /(?:introdução|conceitos?|fundamentos?|noções?|princípios?)\s+(?:ao?|à|de|do|da)\s+(.{5,60}?)(?:\.|,|\n|:)/i,
                /(?:o que é|entendendo|conhecendo)\s+(.{5,60}?)(?:\.|,|\n|:)/i,
            ];
            for (const pattern of topicPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }

            // 4. Primeira frase significativa (antes de ponto ou quebra de linha)
            const firstSentence = text.match(/^(.{20,100}?)(?:\.|!|\?|\n)/);
            if (firstSentence) {
                // Limpar prefixos comuns
                const cleaned = firstSentence[1]
                    .replace(/^(Nesta aula|Vamos estudar|Hoje vamos|Neste módulo|Este conteúdo|Bem-vindo)/i, '')
                    .replace(/^[🎯📚⚖️🏛️💡✨🔍📝]+\s*/, '')
                    .trim();
                if (cleaned.length > 10) {
                    return cleaned;
                }
            }

            return null;
        };

        if (contentContext.question) {
            const assunto = extractEssence(contentContext.question.assunto || contentContext.question.materia);
            return `Olá! 👋 Sou seu **Professor Virtual**. Vi que você está estudando **${assunto}**.\n\nComo posso te ajudar?`;
        }

        // Para aulas/conteúdo
        let theme = contentContext.title;

        // Lista de títulos genéricos que devemos substituir
        const genericTitles = ['Aula', 'o tema', 'Estudo', 'Conteudo Teorico', 'Conteúdo Teórico', 'Revisão'];
        const isGenericTitle = !theme || theme.length < 5 || genericTitles.some(g => theme?.toLowerCase() === g.toLowerCase());

        // Se o título é genérico, tentar extrair do conteúdo
        if (isGenericTitle && contentContext.text) {
            const contentTheme = extractThemeFromContent(contentContext.text);
            if (contentTheme) {
                theme = contentTheme;
            }
        }

        const cleanTheme = extractEssence(theme);

        // Capitalizar corretamente: primeira letra maiúscula, resto minúsculo
        const capitalize = (str: string) => {
            if (!str) return str;
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        };
        const formattedTheme = capitalize(cleanTheme);

        // Se ainda é genérico, usar mensagem mais geral
        if (genericTitles.some(g => cleanTheme.toLowerCase() === g.toLowerCase()) || cleanTheme === 'o conteúdo') {
            return `Olá! 👋 Sou seu **Professor Virtual**.\n\nEstou aqui para te ajudar com esta aula. Pergunte sobre conceitos, peça exemplos ou tire suas dúvidas!`;
        }

        return `Olá! 👋 Sou seu **Professor Virtual** para esta aula sobre **${formattedTheme}**.\n\nPergunte sobre conceitos, peça exemplos ou tire suas dúvidas!`;
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: getGreeting()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset messages when question or content changes
    // We use a hash of the text to detect when content loads
    const contentHash = contentContext.text?.slice(0, 100) || '';
    useEffect(() => {
        setMessages([{ role: 'model', text: getGreeting() }]);
        setThreadId(undefined);
    }, [contentContext.question?.id, contentContext.title, contentHash]);

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
    const handleGenerateAudio = async (e?: React.MouseEvent) => {
        setShowShortcuts(false);

        // Verificar bateria ANTES de iniciar (sempre consome, mesmo do cache)
        const canProceed = await checkAndConsumeBattery('chat_audio', e?.clientX, e?.clientY);
        if (!canProceed) {
            return;
        }

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
            // Usar serviço com cache (verifica cache antes de gerar)
            const audio = await generateAudioWithCache(contentContext.title || 'o conteúdo', contentContext.text || '');

            if (audio) {
                // Se veio do cache, simular delay para parecer que está gerando
                if (audio.fromCache) {
                    await new Promise(resolve => setTimeout(resolve, CACHE_SIMULATION_DELAY));
                }

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: `🎧 **Áudio gerado!**\n\nOuça a explicação sobre **${contentContext.title || 'o conteúdo'}**:`,
                        audio: { audioUrl: audio.audioUrl, type: 'explanation' }
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

    const handleGeneratePodcast = async (e?: React.MouseEvent) => {
        setShowShortcuts(false);

        // Verificar bateria ANTES de iniciar (sempre consome, mesmo do cache)
        const canProceed = await checkAndConsumeBattery('chat_podcast', e?.clientX, e?.clientY);
        if (!canProceed) {
            return;
        }

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
            // Usar serviço com cache (verifica cache antes de gerar)
            const audio = await generatePodcastWithCache(contentContext.title || 'o conteúdo', contentContext.text || '');

            if (audio) {
                // Se veio do cache, simular delay para parecer que está gerando
                if (audio.fromCache) {
                    await new Promise(resolve => setTimeout(resolve, CACHE_SIMULATION_DELAY));
                }

                // Salvar podcast na tabela music_tracks para aparecer no módulo Music
                if (preparatorioId && !audio.audioUrl.startsWith('blob:')) {
                    const materia = contentContext.question?.materia;
                    const assunto = contentContext.question?.assunto;
                    const title = contentContext.title || contentContext.question?.assunto || 'Podcast';

                    // Obter duração do áudio antes de salvar
                    getAudioDuration(audio.audioUrl).then(durationSeconds => {
                        musicService.saveUserGeneratedPodcast({
                            title: `Podcast: ${title}`,
                            audioUrl: audio.audioUrl,
                            preparatorioId,
                            materia,
                            assunto,
                            durationSeconds,
                        }).catch(err => {
                            console.error('[MentorChat] Erro ao salvar podcast no Music:', err);
                        });
                    });
                }

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'model',
                        text: `🎙️ **Podcast gerado!**\n\nOuça a discussão sobre **${contentContext.title || 'o conteúdo'}**:`,
                        audio: { audioUrl: audio.audioUrl, type: 'podcast' }
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

    const handleGenerateSummary = async (e?: React.MouseEvent) => {
        setShowShortcuts(false);

        // Verificar e consumir bateria antes de gerar resumo
        const canProceed = await checkAndConsumeBattery('chat_summary', e?.clientX, e?.clientY);
        if (!canProceed) {
            return;
        }

        const summaryPrompt = 'Faça um resumo rápido e objetivo dos pontos principais deste conteúdo.';
        setMessages(prev => [...prev, { role: 'user', text: summaryPrompt }]);
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

        const response = await chatWithTutor(messages, summaryPrompt, questionContext, userContext, threadId);

        if (response.threadId) {
            setThreadId(response.threadId);
        }

        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        setIsLoading(false);
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
            action: () => { },
            disabled: true,
        },
    ];

    const handleSend = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (!inputValue.trim() || isLoading) return;

        // Extract click coordinates for battery toast (only from mouse events)
        const clickX = e && 'clientX' in e ? e.clientX : undefined;
        const clickY = e && 'clientY' in e ? e.clientY : undefined;

        const userText = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);

        // Verificar e consumir bateria antes de enviar mensagem
        const canProceed = await checkAndConsumeBattery('chat_message', clickX, clickY);
        if (!canProceed) {
            return;
        }

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
            className="sticky bottom-0 z-50 flex justify-center px-4 pb-16 lg:pb-0 pointer-events-none"
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
                        className="w-full max-w-[850px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-t-xl rounded-b-xl shadow-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors pointer-events-auto"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--color-brand)] p-1.5 rounded-lg">
                                <Zap size={20} className="text-black fill-black" />
                            </div>
                            <span className="font-bold text-[var(--color-text-main)]">Seu Mentor IA</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-sec)] text-sm">
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
                        className="w-full max-w-[900px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto transition-all duration-200"
                    >
                        {/* Header with Close Button (Mobile) / Resize Handle (Desktop) */}
                        {!isCollapsed && (
                            <div
                                onMouseDown={handleResizeStart}
                                onTouchStart={handleResizeStart}
                                className={`
                                    flex items-center justify-center h-6 cursor-ns-resize
                                    bg-[var(--color-bg-card)] rounded-t-2xl
                                    hover:bg-[var(--color-bg-elevated)] transition-colors group relative
                                    ${isResizing ? 'bg-[var(--color-bg-elevated)]' : ''}
                                `}
                            >
                                <GripHorizontal
                                    size={20}
                                    className={`text-[var(--color-text-muted)] group-hover:text-[var(--color-text-sec)] transition-colors ${isResizing ? 'text-[var(--color-brand)]' : ''}`}
                                />
                                {/* Close button - Mobile only */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClose();
                                    }}
                                    className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#C92A2A] hover:bg-[#A61E1E] text-white transition-colors z-10"
                                    title="Fechar chat"
                                >
                                    <ChevronDown size={18} />
                                </button>
                            </div>
                        )}

                        {/* Messages - only show when not collapsed */}
                        {!isCollapsed && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[var(--color-bg-main)]">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-[var(--color-brand)] text-black font-medium rounded-tr-none'
                                                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] rounded-tl-none border border-[var(--color-border)]'
                                                }`}
                                        >
                                            {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}

                                            {/* Audio Player inline - shows when message has audio */}
                                            {msg.audio && (
                                                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                                    <AudioPlayer
                                                        src={msg.audio.audioUrl}
                                                        type={msg.audio.type}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[var(--color-bg-elevated)] p-3 rounded-2xl rounded-tl-none border border-[var(--color-border)]">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {/* Footer Input */}
                        <div
                            className={`p-4 bg-[var(--color-bg-card)] ${isCollapsed ? 'rounded-t-2xl' : 'border-t border-[var(--color-border)]'}`}
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
                                            className="absolute bottom-full left-0 mb-2 w-72 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
                                        >
                                            <div className="p-2">
                                                <p className="text-[#6E6E6E] text-xs font-medium px-2 py-1.5">Atalhos de IA</p>
                                                {shortcutOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={(e) => option.action(e)}
                                                        disabled={option.disabled || isGeneratingAudio}
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

                                {/* Shortcuts Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isCollapsed) setShowShortcuts(!showShortcuts);
                                    }}
                                    disabled={isGeneratingAudio || isCollapsed}
                                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${showShortcuts
                                            ? 'bg-[var(--color-brand)] text-black'
                                            : 'text-[var(--color-text-sec)] hover:text-[var(--color-brand)] hover:bg-[var(--color-bg-elevated)]'
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
                                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl pl-12 pr-24 py-3 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMicClick(e);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${isRecording
                                            ? 'text-[#FF4444] bg-[#FF4444]/10 animate-pulse'
                                            : 'text-[var(--color-text-sec)] hover:text-[var(--color-brand)] hover:bg-[var(--color-bg-elevated)]'
                                            }`}
                                        title="Gravar audio"
                                    >
                                        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                                    </button>
                                    <button
                                        data-send-button
                                        onClick={(e) => handleSend(e)}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="p-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-light)] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
