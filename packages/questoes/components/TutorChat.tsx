
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Square, MicOff } from 'lucide-react';
import { chatWithTutor, TutorUserContext } from '../services/geminiService';
import { ParsedQuestion } from '../types';

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

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    const response = await chatWithTutor(messages, userText, question, userContext);

    setMessages(prev => [...prev, { role: 'model', text: response }]);
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
    <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none`}>
      {/* Backdrop - Fades in/out */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet Panel - Slides up/down */}
      <div 
        className={`w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl flex flex-col border-t border-x border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-300 ease-out pointer-events-auto ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '50vh' }}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#252525]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FFB800]/20 rounded-xl">
                <Sparkles size={18} className="text-[#FFB800]" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">Tutor IA</h3>
                <p className="text-[10px] text-gray-400">Tire suas dúvidas agora</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1A1A1A] no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[90%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#FFB800] text-black font-medium rounded-tr-none' 
                    : 'bg-[#2A2A2A] text-gray-100 rounded-tl-none border border-gray-700'
                }`}
              >
                  {/* Simple bold/markdown parsing replacement for demo */}
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-[#2A2A2A] p-3 rounded-2xl rounded-tl-none border border-gray-700">
                 <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#252525] border-t border-gray-800">
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleMicClick}
                    className={`p-3 rounded-full transition-all duration-300 border ${
                        isRecording 
                        ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse' 
                        : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FFB800] border-gray-700'
                    }`}
                    title={isRecording ? "Parar gravação" : "Falar (Ditado)"}
                >
                    {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                </button>

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Ouvindo você..." : "Digite sua dúvida..."}
                    disabled={isLoading}
                    className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] text-white placeholder-gray-600 disabled:opacity-50"
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || isRecording}
                    className={`p-3 rounded-full transition-colors ${!inputValue.trim() || isLoading || isRecording ? 'bg-gray-700 text-gray-500' : 'bg-[#FFB800] text-black hover:bg-[#FFC933] shadow-lg'}`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
