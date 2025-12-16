
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Square } from 'lucide-react';
import { chatWithTutor, TutorUserContext } from '../../services/geminiService';
import { ParsedQuestion } from '../../types';

interface TutorChatProps {
  isOpen: boolean;
  onClose: () => void;
  question: ParsedQuestion;
  userContext?: TutorUserContext;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
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

        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-1 text-sm">{renderInline(trimmed.slice(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={lineKey} className="font-bold text-[#FFB800] mt-3 mb-2 text-lg">{renderInline(trimmed.slice(2))}</h2>);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (listType !== 'ul') flushList();
            listType = 'ul';
            currentList.push(trimmed.slice(2));
        } else if (/^\d+\.\s/.test(trimmed)) {
            if (listType !== 'ol') flushList();
            listType = 'ol';
            currentList.push(trimmed.replace(/^\d+\.\s/, ''));
        } else if (trimmed === '---' || trimmed === '***') {
            flushList();
            elements.push(<hr key={lineKey} className="border-[#3A3A3A] my-3" />);
        } else if (trimmed === '') {
            flushList();
            elements.push(<div key={lineKey} className="h-2" />);
        } else {
            flushList();
            elements.push(<p key={lineKey} className="my-1">{renderInline(trimmed)}</p>);
        }
    });

    flushList();
    return <div className="space-y-1">{elements}</div>;
}

const TutorChat: React.FC<TutorChatProps> = ({ isOpen, onClose, question, userContext }) => {
  const greeting = userContext?.name
    ? `Olá, **${userContext.name}**! 👋 Sou seu Tutor IA. Vi que você está na questão de **${question.assunto}**. Como posso te ajudar?`
    : `Olá! Sou seu Tutor IA. Vi que você está na questão de **${question.assunto}**. Como posso te ajudar a entender melhor?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: greeting }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Audio / Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
        setRecognitionSupported(true);
        // @ts-ignore - webkitSpeechRecognition is not standard in all TS definitions
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // If we have final text, append to input or replace?
            // For simplicity in a chat input, we replace or append.
            // Here we'll set it directly to help user compose.
            const text = finalTranscript || interimTranscript;
            if (text) {
                setInputValue(prev => {
                   // Avoid duplicating if we are in interim
                   return text;
                });
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
    }
  }, []);

  // Handle animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small timeout to allow DOM render before starting transition
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    const response = await chatWithTutor(messages, userText, question, userContext);

    setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    setIsLoading(false);
  };

  const handleMicClick = () => {
    if (!recognitionSupported) {
        alert("Seu navegador não suporta reconhecimento de voz.");
        return;
    }

    if (isRecording) {
        recognitionRef.current?.stop();
    } else {
        // Clear input to start fresh dictation? Or append?
        // Let's clear for 'Dictation Mode' feel, or user can manually clear.
        recognitionRef.current?.start();
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 xl:right-[400px] z-50 flex justify-center px-4 pb-4 pointer-events-none`}>
      {/* Backdrop - Fades in/out */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet Panel - Slides up/down */}
      <div
        className={`relative w-full max-w-[810px] h-[500px] bg-[#1A1A1A] rounded-t-2xl flex flex-col border border-[#3A3A3A] shadow-2xl overflow-hidden transition-transform duration-300 ease-out pointer-events-auto ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#3A3A3A] bg-[#1A1A1A] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFB800] p-1.5 rounded-lg">
                <Sparkles size={20} className="text-black" />
            </div>
            <span className="font-bold text-white">Tutor IA</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#252525] rounded-full text-[#A0A0A0] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#FFB800] text-black font-medium rounded-tr-none'
                    : 'bg-[#252525] text-[#E0E0E0] rounded-tl-none border border-[#3A3A3A]'
                }`}
              >
                  {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
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

        {/* Input Area */}
        <div className="p-4 border-t border-[#3A3A3A] bg-[#1A1A1A]">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Ouvindo voce..." : "Digite sua duvida..."}
                    disabled={isLoading}
                    className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl pl-4 pr-24 py-3 text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#FFB800] transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        onClick={handleMicClick}
                        className={`p-2 rounded-lg transition-colors ${
                            isRecording
                            ? 'text-[#FF4444] bg-[#FF4444]/10 animate-pulse'
                            : 'text-[#A0A0A0] hover:text-[#FFB800] hover:bg-[#3A3A3A]'
                        }`}
                        title={isRecording ? "Parar gravacao" : "Gravar audio"}
                    >
                        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading || isRecording}
                        className="p-2 bg-[#FFB800] hover:bg-[#FFC933] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
