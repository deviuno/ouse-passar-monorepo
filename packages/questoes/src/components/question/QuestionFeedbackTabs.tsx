import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  MessageSquare,
  BarChart2,
  FolderPlus,
  StickyNote,
  Flag,
  Loader2,
  Plus,
  Check,
  AlertTriangle,
  Send,
  Mic,
  Square,
  Sparkles,
  Headphones,
  Radio,
  FileText,
  Minus,
} from 'lucide-react';
import { ParsedQuestion } from '../../types';
import { QuestionStatistics } from '../../services/questionFeedbackService';
import {
  getUserNotebooks,
  createNotebook,
  Notebook,
  getNotebooksContainingQuestion,
  toggleQuestionInNotebook,
} from '../../services/notebooksService';
import { FilterOptions } from '../../utils/filterUtils';
import { getOptimizedImageUrl } from '../../utils/image';
import CommentsSection from './CommentsSection';
import { ReportQuestionModal } from './ReportQuestionModal';
import { PegadinhaModal } from './PegadinhaModal';
import { REPORT_MOTIVOS, ReportMotivo } from '../../services/questionReportsService';
import { chatWithTutor, TutorUserContext, GeneratedAudio } from '../../services/geminiService';
import { generateAudioWithCache, generatePodcastWithCache } from '../../services/audioCacheService';
import { AudioPlayer } from '../ui/AudioPlayer';
import { renderMarkdown } from './chat';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { getTimeUntilRecharge } from '../../types/battery';

type TabId = 'explicacao' | 'comentarios' | 'estatisticas' | 'cadernos' | 'anotacoes' | 'duvidas' | 'erro';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'explicacao', label: 'Explicação', icon: <BookOpen size={16} /> },
  { id: 'comentarios', label: 'Comentários', icon: <MessageSquare size={16} /> },
  { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart2 size={16} /> },
  { id: 'cadernos', label: 'Cadernos', icon: <FolderPlus size={16} /> },
  { id: 'anotacoes', label: 'Anotações', icon: <StickyNote size={16} /> },
  { id: 'duvidas', label: 'Tirar Dúvidas', icon: <Sparkles size={16} /> },
  { id: 'erro', label: 'Notificar', icon: <Flag size={16} /> },
];

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  audio?: GeneratedAudio | null;
}

interface QuestionFeedbackTabsProps {
  question: ParsedQuestion;
  explanation: string | null;
  loadingExplanation: boolean;
  questionStats: QuestionStatistics | null;
  userId: string | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  selectedAlt: string | null;
  isCorrect: boolean;
  preparatorioId?: string;
  checkoutUrl?: string;
}

// Função para converter URLs de imagem em markdown
const preprocessImageUrls = (text: string): string => {
  if (!text) return '';
  let processed = text.replace(
    /Disponível em:\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))[^\n]*/gi,
    '\n\n![Imagem da questão]($1)\n\n'
  );
  processed = processed.replace(
    /(?<!\]\()(?<!\!)\b(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))\b(?!\))/gi,
    '\n\n![Imagem]($1)\n\n'
  );
  processed = processed.replace(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    '\n\n![Imagem]($1)\n\n'
  );
  return processed;
};

export function QuestionFeedbackTabs({
  question,
  explanation,
  loadingExplanation,
  questionStats,
  userId,
  onShowToast,
  selectedAlt,
  isCorrect,
  preparatorioId,
  checkoutUrl,
}: QuestionFeedbackTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('explicacao');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPegadinhaModal, setShowPegadinhaModal] = useState(false);
  const [selectedReportMotivo, setSelectedReportMotivo] = useState<ReportMotivo | undefined>(undefined);

  // Cadernos state
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(false);
  const [savedToNotebooks, setSavedToNotebooks] = useState<Set<string>>(new Set());
  const [savingToNotebook, setSavingToNotebook] = useState<string | null>(null);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookDescription, setNewNotebookDescription] = useState('');
  const [creatingNotebook, setCreatingNotebook] = useState(false);

  // Anotações state
  const [annotation, setAnnotation] = useState('');
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [savedAnnotation, setSavedAnnotation] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showChatShortcuts, setShowChatShortcuts] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = React.useRef<HTMLInputElement>(null);
  const shortcutsRef = React.useRef<HTMLDivElement>(null);

  // Battery store
  const { consumeBattery } = useBatteryStore();

  // Chat greeting message
  const getChatGreeting = () => {
    const assunto = question.assunto || question.materia || 'esta questão';
    return `Olá! 👋 Sou seu **Professor Virtual**. Vi que você está estudando **${assunto}**.\n\nComo posso te ajudar?`;
  };

  // Initialize chat messages
  useEffect(() => {
    if (activeTab === 'duvidas' && chatMessages.length === 0) {
      setChatMessages([{ role: 'model', text: getChatGreeting() }]);
    }
  }, [activeTab]);

  // Reset chat when question changes
  useEffect(() => {
    setChatMessages([]);
    setChatThreadId(undefined);
  }, [question.id]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'duvidas') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

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
        if (transcript) setChatInput(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Close shortcuts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
        setShowChatShortcuts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Battery check helper
  const getBatteryEmptyMessage = (): string => {
    const { hours, minutes } = getTimeUntilRecharge();
    let timeMsg = hours > 0 ? `${hours}h${minutes > 0 ? ` e ${minutes}min` : ''}` : `${minutes} minutos`;
    let message = `⚡ **Ops! Sua energia acabou.**\n\nVocê não tem energia suficiente para usar o chat agora.\n\n`;
    message += `🔋 Sua bateria será recarregada em **${timeMsg}**.\n\n`;
    if (checkoutUrl) {
      message += `💡 **Dica:** Adquira o acesso ilimitado e nunca mais se preocupe com energia!`;
    }
    return message;
  };

  const checkAndConsumeBattery = async (actionType: 'chat_message' | 'chat_audio' | 'chat_podcast' | 'chat_summary'): Promise<boolean> => {
    if (!userId || !preparatorioId) return true;
    const result = await consumeBattery(userId, preparatorioId, actionType, {});
    if (!result.success && result.error === 'insufficient_battery') {
      setChatMessages(prev => [...prev, { role: 'model', text: getBatteryEmptyMessage() }]);
      return false;
    }
    return result.success || result.is_premium === true;
  };

  // Chat handlers
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);

    const canProceed = await checkAndConsumeBattery('chat_message');
    if (!canProceed) return;

    setChatLoading(true);
    const response = await chatWithTutor(chatMessages, userText, question, undefined, chatThreadId);
    if (response.threadId) setChatThreadId(response.threadId);
    setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    setChatLoading(false);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Navegador sem suporte a voz.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleGenerateAudio = async () => {
    setShowChatShortcuts(false);
    const canProceed = await checkAndConsumeBattery('chat_audio');
    if (!canProceed) return;

    setIsGeneratingAudio(true);
    setChatMessages(prev => [...prev, { role: 'user', text: '🎧 Gerar explicação em áudio' }]);
    setChatMessages(prev => [...prev, { role: 'model', text: '🎙️ Gerando áudio explicativo... Aguarde um momento.' }]);

    try {
      const audio = await generateAudioWithCache(question.assunto || 'a questão', question.enunciado);
      if (audio) {
        if (audio.fromCache) await new Promise(resolve => setTimeout(resolve, 1500));
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'model',
            text: `🎧 **Áudio gerado!**\n\nOuça a explicação:`,
            audio: { audioUrl: audio.audioUrl, type: 'explanation' }
          };
          return newMessages;
        });
      } else {
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: '❌ Não foi possível gerar o áudio.' };
          return newMessages;
        });
      }
    } catch (error) {
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'model', text: '❌ Erro ao gerar áudio.' };
        return newMessages;
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGeneratePodcast = async () => {
    setShowChatShortcuts(false);
    const canProceed = await checkAndConsumeBattery('chat_podcast');
    if (!canProceed) return;

    setIsGeneratingAudio(true);
    setChatMessages(prev => [...prev, { role: 'user', text: '🎙️ Gerar podcast sobre o tema' }]);
    setChatMessages(prev => [...prev, { role: 'model', text: '🎙️ Gerando podcast... Isso pode levar alguns segundos.' }]);

    try {
      const audio = await generatePodcastWithCache(question.assunto || 'a questão', question.enunciado);
      if (audio) {
        if (audio.fromCache) await new Promise(resolve => setTimeout(resolve, 1500));
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'model',
            text: `🎙️ **Podcast gerado!**\n\nOuça a discussão:`,
            audio: { audioUrl: audio.audioUrl, type: 'podcast' }
          };
          return newMessages;
        });
      } else {
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: '❌ Não foi possível gerar o podcast.' };
          return newMessages;
        });
      }
    } catch (error) {
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'model', text: '❌ Erro ao gerar podcast.' };
        return newMessages;
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateSummary = async () => {
    setShowChatShortcuts(false);
    const canProceed = await checkAndConsumeBattery('chat_summary');
    if (!canProceed) return;

    const summaryPrompt = 'Faça um resumo rápido e objetivo dos pontos principais desta questão.';
    setChatMessages(prev => [...prev, { role: 'user', text: summaryPrompt }]);
    setChatLoading(true);
    const response = await chatWithTutor(chatMessages, summaryPrompt, question, undefined, chatThreadId);
    if (response.threadId) setChatThreadId(response.threadId);
    setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    setChatLoading(false);
  };

  // Reset saved notebooks when question changes
  useEffect(() => {
    setSavedToNotebooks(new Set());
  }, [question.id]);

  // Load notebooks when tab is selected
  useEffect(() => {
    if (activeTab === 'cadernos' && userId) {
      loadNotebooks();
    }
  }, [activeTab, userId, question.id]);

  const loadNotebooks = async () => {
    if (!userId) return;
    setLoadingNotebooks(true);
    try {
      // Fetch notebooks and saved status in parallel
      const [notebooksData, savedNotebookIds] = await Promise.all([
        getUserNotebooks(userId),
        getNotebooksContainingQuestion(userId, question.id),
      ]);
      setNotebooks(notebooksData);
      setSavedToNotebooks(new Set(savedNotebookIds));
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    } finally {
      setLoadingNotebooks(false);
    }
  };

  const handleSaveToNotebook = async (notebookId: string) => {
    const isSaved = savedToNotebooks.has(notebookId);
    setSavingToNotebook(notebookId);

    try {
      const nowSaved = await toggleQuestionInNotebook(notebookId, question.id, isSaved);

      setSavedToNotebooks(prev => {
        const newSet = new Set(prev);
        if (nowSaved) {
          newSet.add(notebookId);
        } else {
          newSet.delete(notebookId);
        }
        return newSet;
      });

      // Update notebook saved_questions_count locally
      setNotebooks(prev => prev.map(nb => {
        if (nb.id === notebookId) {
          const currentCount = nb.saved_questions_count || 0;
          return {
            ...nb,
            saved_questions_count: nowSaved ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        }
        return nb;
      }));

      onShowToast?.(
        nowSaved ? 'Questão salva no caderno!' : 'Questão removida do caderno!',
        'success'
      );
    } catch (error) {
      console.error('Erro ao salvar/remover questão:', error);
      onShowToast?.('Erro ao atualizar caderno', 'error');
    } finally {
      setSavingToNotebook(null);
    }
  };

  const handleCreateNotebook = async () => {
    if (!userId || !newNotebookTitle.trim()) return;

    setCreatingNotebook(true);
    try {
      const newNotebook = await createNotebook(
        userId,
        newNotebookTitle.trim(),
        {} as FilterOptions, // Empty filters for manual notebook
        {}, // Empty settings
        newNotebookDescription.trim() || undefined,
        0
      );

      setNotebooks(prev => [newNotebook, ...prev]);
      setShowNewNotebookModal(false);
      setNewNotebookTitle('');
      setNewNotebookDescription('');
      onShowToast?.('Caderno criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar caderno:', error);
      onShowToast?.('Erro ao criar caderno', 'error');
    } finally {
      setCreatingNotebook(false);
    }
  };

  const handleSaveAnnotation = async () => {
    if (!annotation.trim()) return;
    setSavingAnnotation(true);
    try {
      // TODO: Implementar salvamento real no banco
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
      setSavedAnnotation(annotation);
      onShowToast?.('Anotação salva com sucesso!', 'success');
    } catch (error) {
      onShowToast?.('Erro ao salvar anotação', 'error');
    } finally {
      setSavingAnnotation(false);
    }
  };

  // Build stats data
  const buildStatsData = () => {
    const alternatives = question.parsedAlternativas.map(a => a.letter);
    if (questionStats && questionStats.totalAnswers > 0) {
      return alternatives.map(alt => ({
        alternative: alt,
        percentage: questionStats.alternativeDistribution[alt] || 0,
      }));
    }
    return alternatives.map(alt => ({ alternative: alt, percentage: 0 }));
  };

  const stats = buildStatsData();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'explicacao':
        return (
          <div className="animate-fade-in">
            {/* Pegadinha Badge */}
            {question.isPegadinha && (
              <button
                onClick={() => setShowPegadinhaModal(true)}
                className="w-full mb-4 flex items-center justify-start bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all group text-left"
              >
                <div className="bg-orange-500/20 p-2 rounded-md mr-3 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide mb-0.5">
                    Alerta de Pegadinha
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300">
                    Toque para ver a armadilha desta questão.
                  </span>
                </div>
              </button>
            )}

            {loadingExplanation ? (
              <div className="space-y-2">
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-full"></div>
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-main)] leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-[var(--color-brand)] mt-4 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-[var(--color-text-main)] mt-3 mb-1">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-[var(--color-text-main)]">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-[var(--color-text-main)]">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--color-text-main)]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--color-text-main)]">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--color-brand)] pl-4 my-3 italic text-[var(--color-text-muted)]">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded text-[var(--color-brand)] text-sm">{children}</code>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={getOptimizedImageUrl(src, 800, 85)}
                        alt={alt || 'Imagem'}
                        className="max-w-full h-auto rounded-lg my-3 border border-[var(--color-border)]"
                        loading="lazy"
                      />
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-light)]">{children}</a>
                    ),
                  }}
                >
                  {preprocessImageUrls(explanation || 'Nenhuma explicação disponível para esta questão.')}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );

      case 'comentarios':
        return (
          <div className="animate-fade-in">
            <CommentsSection
              questionId={question.id}
              userId={userId}
              onShowToast={onShowToast}
            />
          </div>
        );

      case 'estatisticas':
        return (
          <div className="animate-fade-in space-y-6">
            {/* Gráfico de distribuição de alternativas */}
            <div>
              <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
                <BarChart2 size={16} className="mr-2 text-[var(--color-brand)]" />
                Distribuição das Respostas
              </h4>

              {questionStats && questionStats.totalAnswers > 0 ? (
                <>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">
                    {questionStats.accuracyRate}% acertaram • {questionStats.totalAnswers} respostas
                  </p>
                  <div className="space-y-3">
                    {stats.map((stat) => {
                      const isCorrectAlt = stat.alternative === question.gabarito;
                      const isSelected = stat.alternative === selectedAlt;
                      let barColor = 'bg-gray-600';
                      if (isCorrectAlt) barColor = 'bg-[#2ECC71]';
                      else if (isSelected) barColor = 'bg-[#E74C3C]';

                      return (
                        <div key={stat.alternative}>
                          <div className="flex justify-between text-xs mb-1 font-bold">
                            <span className={`${isCorrectAlt ? 'text-[#2ECC71]' : isSelected ? 'text-[#E74C3C]' : 'text-[var(--color-text-sec)]'}`}>
                              Alternativa {stat.alternative}
                              {isSelected && ' (Você)'}
                              {isCorrectAlt && ' ✓'}
                            </span>
                            <span className="text-[var(--color-text-main)]">{stat.percentage}%</span>
                          </div>
                          <div className="w-full h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                  Ainda não há dados estatísticos suficientes para esta questão.
                </p>
              )}
            </div>

            {/* Gráfico de dificuldade percebida */}
            {questionStats && (questionStats.difficultyDistribution.easy > 0 || questionStats.difficultyDistribution.medium > 0 || questionStats.difficultyDistribution.hard > 0) && (
              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4">
                  Dificuldade Percebida pela Comunidade
                </h4>
                <div className="flex gap-2">
                  <div className="flex-1 text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{questionStats.difficultyDistribution.easy}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Fácil</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{questionStats.difficultyDistribution.medium}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Médio</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{questionStats.difficultyDistribution.hard}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Difícil</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'cadernos':
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[var(--color-text-sec)] flex items-center">
                <FolderPlus size={16} className="mr-2 text-[var(--color-brand)]" />
                Salvar em Caderno
              </h4>
              {userId && (
                <button
                  onClick={() => setShowNewNotebookModal(true)}
                  className="px-3 py-1.5 bg-[#ffac00] text-black rounded-lg font-medium text-xs hover:bg-[#ffbc33] transition-colors flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  Novo Caderno
                </button>
              )}
            </div>

            {!userId ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Faça login para salvar questões em cadernos.
              </p>
            ) : loadingNotebooks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
              </div>
            ) : notebooks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Você ainda não tem cadernos criados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notebooks.map((notebook) => {
                  const isSaved = savedToNotebooks.has(notebook.id);
                  const isSaving = savingToNotebook === notebook.id;
                  const savedCount = notebook.saved_questions_count || 0;
                  return (
                    <button
                      key={notebook.id}
                      onClick={() => handleSaveToNotebook(notebook.id)}
                      disabled={isSaving}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                        isSaved
                          ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)]'
                      } ${isSaving ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-[var(--color-text-main)] text-sm truncate">{notebook.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {savedCount > 0 ? `${savedCount} questões salvas` : 'Nenhuma questão salva'}
                          {notebook.description && ` • ${notebook.description}`}
                        </p>
                      </div>
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin text-[var(--color-brand)] flex-shrink-0" />
                      ) : isSaved ? (
                        <div className="flex items-center gap-1 text-green-500">
                          <Check size={16} />
                          <Minus size={14} className="opacity-60" />
                        </div>
                      ) : (
                        <Plus size={18} className="text-[var(--color-text-muted)] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'anotacoes':
        return (
          <div className="animate-fade-in">
            <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
              <StickyNote size={16} className="mr-2 text-[var(--color-brand)]" />
              Criar Anotação
            </h4>

            {!userId ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Faça login para criar anotações.
              </p>
            ) : savedAnnotation ? (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-500 font-bold flex items-center">
                    <Check size={14} className="mr-1" /> Anotação salva
                  </span>
                  <button
                    onClick={() => {
                      setSavedAnnotation(null);
                      setAnnotation(savedAnnotation);
                    }}
                    className="text-xs text-[var(--color-brand)] hover:underline"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-main)] whitespace-pre-wrap">{savedAnnotation}</p>
              </div>
            ) : (
              <>
                <textarea
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  placeholder="Escreva sua anotação sobre esta questão..."
                  rows={4}
                  className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                />
                <button
                  onClick={handleSaveAnnotation}
                  disabled={!annotation.trim() || savingAnnotation}
                  className="mt-3 w-full py-2.5 bg-[#ffac00] text-black rounded-lg font-medium text-sm hover:bg-[#ffbc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {savingAnnotation ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <StickyNote size={16} className="mr-2" />
                      Salvar Anotação
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        );

      case 'duvidas':
        return (
          <div className="animate-fade-in flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#ffac00] text-black rounded-br-md'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] rounded-bl-md border border-[var(--color-border)]'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <div className="text-[var(--color-text-main)] leading-relaxed">
                        {renderMarkdown(msg.text)}
                      </div>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                    {msg.audio && (
                      <div className="mt-3">
                        <AudioPlayer src={msg.audio.audioUrl} type={msg.audio.type as 'explanation' | 'podcast'} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center gap-2">
                {/* Shortcuts Button */}
                <div className="relative" ref={shortcutsRef}>
                  <button
                    onClick={() => setShowChatShortcuts(!showChatShortcuts)}
                    disabled={chatLoading || isGeneratingAudio}
                    className="p-2.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors disabled:opacity-50"
                    title="Atalhos"
                  >
                    <Sparkles size={18} />
                  </button>

                  {showChatShortcuts && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-10">
                      <button
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] flex items-center gap-2 disabled:opacity-50"
                      >
                        <Headphones size={16} className="text-[var(--color-brand)]" />
                        Gerar Áudio
                      </button>
                      <button
                        onClick={handleGeneratePodcast}
                        disabled={isGeneratingAudio}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] flex items-center gap-2 disabled:opacity-50"
                      >
                        <Radio size={16} className="text-purple-400" />
                        Gerar Podcast
                      </button>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={chatLoading}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileText size={16} className="text-green-400" />
                        Resumo Rápido
                      </button>
                    </div>
                  )}
                </div>

                {/* Input Field */}
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                  placeholder="Digite sua dúvida..."
                  disabled={chatLoading}
                  className="flex-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors disabled:opacity-50"
                />

                {/* Mic Button */}
                <button
                  onClick={handleMicClick}
                  disabled={chatLoading}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isRecording
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]'
                  } disabled:opacity-50`}
                  title={isRecording ? 'Parar' : 'Falar'}
                >
                  {isRecording ? <Square size={18} /> : <Mic size={18} />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2.5 rounded-lg bg-[#ffac00] text-black hover:bg-[#ffbc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Enviar"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'erro':
        const handleSelectMotivo = (motivo: ReportMotivo) => {
          setSelectedReportMotivo(motivo);
          setShowReportModal(true);
        };

        return (
          <div className="animate-fade-in">
            <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
              <Flag size={16} className="mr-2 text-[var(--color-brand)]" />
              Notificar Problema
            </h4>

            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Encontrou algum problema nesta questão? Selecione o motivo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REPORT_MOTIVOS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleSelectMotivo(item.value)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-6">
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 mb-4 gap-1 scrollbar-hide -mx-3 px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-sec)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        {renderTabContent()}
      </div>

      {/* Modals */}
      <PegadinhaModal
        isOpen={showPegadinhaModal}
        onClose={() => setShowPegadinhaModal(false)}
        explicacao={question.explicacaoPegadinha ?? undefined}
      />

      <ReportQuestionModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedReportMotivo(undefined);
        }}
        questionId={question.id}
        questionInfo={{
          materia: question.materia,
          assunto: question.assunto,
          banca: question.banca,
          ano: question.ano,
        }}
        onSuccess={() => {
          onShowToast?.('Report enviado com sucesso!', 'success');
          setShowReportModal(false);
          setSelectedReportMotivo(undefined);
        }}
        initialMotivo={selectedReportMotivo}
      />

      {/* Modal Novo Caderno */}
      {showNewNotebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-4 flex items-center">
              <FolderPlus size={20} className="mr-2 text-[var(--color-brand)]" />
              Novo Caderno
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1.5">
                  Nome do Caderno *
                </label>
                <input
                  type="text"
                  value={newNotebookTitle}
                  onChange={(e) => setNewNotebookTitle(e.target.value)}
                  placeholder="Ex: Questões de Direito Constitucional"
                  className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-sec)] mb-1.5">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newNotebookDescription}
                  onChange={(e) => setNewNotebookDescription(e.target.value)}
                  placeholder="Adicione uma descrição para o caderno..."
                  rows={3}
                  className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewNotebookModal(false);
                  setNewNotebookTitle('');
                  setNewNotebookDescription('');
                }}
                className="flex-1 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-lg font-medium text-sm hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNotebook}
                disabled={!newNotebookTitle.trim() || creatingNotebook}
                className="flex-1 py-2.5 bg-[#ffac00] text-black rounded-lg font-medium text-sm hover:bg-[#ffbc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creatingNotebook ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Plus size={16} className="mr-1.5" />
                    Criar Caderno
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionFeedbackTabs;
