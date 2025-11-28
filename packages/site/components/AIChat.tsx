import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Headphones, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToMentor } from '../services/geminiService';

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: 'Olá! Bem-vindo ao atendimento do Ouse Passar. 🦅\n\nEstou aqui para tirar suas dúvidas sobre nossos cursos, metodologia e como garantir sua vaga. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const responseText = await sendMessageToMentor(history, userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-brand-card w-[90vw] sm:w-[400px] h-[600px] rounded-t-xl rounded-bl-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white/10 mb-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-brand-darker p-4 flex justify-between items-center border-b border-brand-yellow/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent opacity-50"></div>
            <div className="flex items-center relative z-10">
              <div className="w-10 h-10 rounded-sm bg-brand-yellow flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(255,184,0,0.4)]">
                <Headphones className="w-6 h-6 text-brand-darker" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-wide">Atendimento</h3>
                <span className="text-[10px] text-brand-yellow flex items-center font-mono uppercase">
                  <span className="w-1.5 h-1.5 bg-brand-yellow rounded-full mr-1 animate-pulse"></span>
                  Online Agora
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#151515] space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-brand-card border border-white/10 text-white rounded-t-lg rounded-bl-lg' 
                      : 'bg-brand-darker border border-brand-yellow/20 text-gray-300 rounded-t-lg rounded-br-lg'
                  }`}
                >
                  {msg.role === 'model' && (
                     <p className="text-[10px] text-brand-yellow font-bold uppercase mb-1 font-mono">:: Suporte Ouse Passar</p>
                  )}
                   <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-brand-darker border border-brand-yellow/20 rounded-t-lg rounded-br-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-brand-yellow animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-brand-yellow animate-pulse delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-brand-yellow animate-pulse delay-150"></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-brand-darker border-t border-white/10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua dúvida..."
                className="w-full bg-[#0a0a0a] text-white placeholder-gray-600 border border-white/10 rounded-sm pl-4 pr-12 py-4 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow text-sm font-mono transition-all"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 p-2 bg-brand-yellow text-brand-darker rounded-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-brand-yellow text-brand-darker rounded-full shadow-[0_0_20px_rgba(255,184,0,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,184,0,0.6)] transition-all duration-300"
        >
          <MessageSquare className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-brand-darker"></span>
          </span>
        </button>
      )}
    </div>
  );
};