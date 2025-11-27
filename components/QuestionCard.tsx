
import React, { useState, useEffect } from 'react';
import { ParsedQuestion, Comment, CommunityStats, StudyMode } from '../types';
import { COLORS, MOCK_COMMENTS, MOCK_STATS } from '../constants';
import { MessageCircle, AlertTriangle, BarChart2, ThumbsUp, ThumbsDown, MessageSquare, X, Timer, Coffee, Zap, BrainCircuit } from 'lucide-react';
import { generateExplanation } from '../services/geminiService';

interface QuestionCardProps {
  question: ParsedQuestion;
  isLastQuestion: boolean;
  onNext: () => void;
  onOpenTutor: () => void;
  onAnswer: (letter: string) => void;
  onRateDifficulty?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onTimeout?: () => void;
  studyMode?: StudyMode;
  initialTime?: number; // Duration in minutes for Simulado mode
}

// --- Sub-components for Comments ---
const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply = false }) => {
  const [likes, setLikes] = useState(comment.likes);
  const [dislikes, setDislikes] = useState(comment.dislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  const handleLike = () => {
    if (userVote === 'like') {
      setUserVote(null);
      setLikes(l => l - 1);
    } else {
      if (userVote === 'dislike') setDislikes(d => d - 1);
      setUserVote('like');
      setLikes(l => l + 1);
    }
  };

  const handleDislike = () => {
    if (userVote === 'dislike') {
      setUserVote(null);
      setDislikes(d => d - 1);
    } else {
      if (userVote === 'like') setLikes(l => l - 1);
      setUserVote('dislike');
      setDislikes(d => d + 1);
    }
  };

  return (
    <div className={`flex flex-col mb-4 ${isReply ? 'ml-8 pl-4 border-l-2 border-gray-700' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-gray-300">{comment.author}</span>
        <span className="text-xs text-gray-600">{comment.timeAgo}</span>
      </div>
      <p className="text-sm text-gray-400 mb-2 leading-relaxed">{comment.text}</p>
      
      <div className="flex items-center space-x-4">
        <button onClick={handleLike} className={`flex items-center space-x-1 text-xs transition-colors ${userVote === 'like' ? 'text-[#FFB800]' : 'text-gray-600 hover:text-gray-400'}`}>
          <ThumbsUp size={14} className={userVote === 'like' ? 'fill-[#FFB800]' : ''} />
          <span>{likes}</span>
        </button>
        <button onClick={handleDislike} className={`flex items-center space-x-1 text-xs transition-colors ${userVote === 'dislike' ? 'text-[#E74C3C]' : 'text-gray-600 hover:text-gray-400'}`}>
          <ThumbsDown size={14} className={userVote === 'dislike' ? 'fill-[#E74C3C]' : ''} />
          <span>{dislikes}</span>
        </button>
        {!isReply && (
            <button className="text-xs text-gray-600 hover:text-white font-medium">Responder</button>
        )}
      </div>

      {/* Recursive Render for Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
};


const QuestionCard: React.FC<QuestionCardProps> = ({ question, isLastQuestion, onNext, onOpenTutor, onAnswer, onRateDifficulty, onTimeout, studyMode = 'zen', initialTime = 120 }) => {
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  
  // New States
  const [difficultyRating, setDifficultyRating] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPegadinhaModal, setShowPegadinhaModal] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(initialTime * 60); // in seconds

  // Reset state when question changes
  useEffect(() => {
    setSelectedAlt(null);
    setIsSubmitted(false);
    setExplanation(null);
    setDifficultyRating(null);
    setShowStatsModal(false);
    setShowPegadinhaModal(false);
  }, [question.id]);

  // Timer Effect
  useEffect(() => {
    if (studyMode === 'hard') {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1 && onTimeout) {
                    clearInterval(timer);
                    onTimeout();
                    return 0;
                }
                return prev > 0 ? prev - 1 : 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [studyMode, onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelect = (letter: string) => {
    if (isSubmitted) return;
    setSelectedAlt(letter);
  };

  const handleSubmit = async () => {
    if (!selectedAlt) return;
    
    // Notify parent about the answer
    onAnswer(selectedAlt);

    // If Mode is Simulado (Hard), we do NOT show feedback. We move to next.
    if (studyMode === 'hard') {
        // Just move to next (or finish if last)
        onNext();
        return;
    }

    // For Zen/Reta Final, show feedback
    setIsSubmitted(true);

    // Load explanation logic
    if (question.comentario) {
      setExplanation(question.comentario);
    } else {
      // Fetch AI explanation if human comment is missing
      setLoadingExplanation(true);
      const aiExpl = await generateExplanation(question);
      setExplanation(`🤖 **Explicação IA:**\n\n${aiExpl}`);
      setLoadingExplanation(false);
    }
  };

  const handleRate = (diff: 'easy' | 'medium' | 'hard') => {
      setDifficultyRating(diff);
      if (onRateDifficulty) {
          onRateDifficulty(diff);
      }
  };

  const getOptionStyle = (letter: string) => {
    // Basic Selection Style
    if (!isSubmitted) {
      return selectedAlt === letter
        ? `border-[#FFB800] bg-[#FFB800] bg-opacity-20 text-white`
        : `border-[#6E6E6E] hover:bg-[#2A2A2A]`;
    }

    // Feedback Style (Only for Zen/Reta Final)
    if (letter === question.gabarito) {
      return `border-[#2ECC71] bg-[#2ECC71] bg-opacity-20 text-[#2ECC71]`;
    }

    if (selectedAlt === letter && letter !== question.gabarito) {
      return `border-[#E74C3C] bg-[#E74C3C] bg-opacity-20 text-[#E74C3C]`;
    }

    return `border-[#333] opacity-50`;
  };

  // Mock Stats Data based on question ID or generic
  const currentStats = MOCK_STATS['default'];

  // Função para formatar texto com quebras de linha e negrito
  const formatText = (text: string) => {
    if (!text) return null;

    // Divide por quebras de linha e processa cada parte
    return text.split('\n').map((paragraph, idx) => {
      // Processa negrito **texto** ou __texto__
      const parts = paragraph.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return <strong key={partIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-24 px-4 pt-6">
      {/* Header Info */}
      <div className="mb-5">
        <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col flex-1">
                <div className="flex items-center mb-1 flex-wrap gap-2">
                     <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider">
                        {question.materia}
                    </span>
                    
                    {studyMode === 'zen' && (
                        <div className="flex items-center text-teal-400 text-[10px] bg-teal-900/20 px-2 py-0.5 rounded-full border border-teal-900/50">
                            <Coffee size={10} className="mr-1"/> ZEN
                        </div>
                    )}
                    {studyMode === 'hard' && (
                        <div className="flex items-center text-red-500 text-[10px] bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50">
                             <Timer size={10} className="mr-1"/> SIMULADO
                        </div>
                    )}
                    {studyMode === 'reta_final' && (
                        <div className="flex items-center text-purple-500 text-[10px] bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-900/50">
                             <Zap size={10} className="mr-1"/> RETA FINAL
                        </div>
                    )}
                    {studyMode === 'review' && (
                        <div className="flex items-center text-blue-400 text-[10px] bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-900/50">
                             <BrainCircuit size={10} className="mr-1"/> REVISÃO
                        </div>
                    )}
                </div>
                <h2 className="text-sm text-gray-400">{question.banca} • {question.ano} • {question.orgao}</h2>
            </div>

             {/* Countdown Timer (Only for Simulado Mode) */}
             {studyMode === 'hard' && (
                 <div className="flex items-center bg-[#1A1A1A] border border-red-900/50 rounded-lg px-2 py-1 ml-2 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                    <Timer size={14} className="text-red-500 mr-1 animate-pulse" />
                    <span className="font-mono font-bold text-red-500 text-sm">
                        {formatTime(timeLeft)}
                    </span>
                 </div>
            )}
        </div>
      </div>

      {/* Enunciado */}
      <div className="text-base leading-relaxed mb-6 font-medium text-gray-100">
        {formatText(question.enunciado)}
      </div>

      {/* Alternatives */}
      <div className="space-y-3 mb-6">
        {question.parsedAlternativas.map((alt) => (
          <button
            key={alt.letter}
            onClick={() => handleSelect(alt.letter)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start group ${getOptionStyle(alt.letter)}`}
            disabled={isSubmitted}
          >
            <span className={`font-bold mr-3 w-6 shrink-0 ${isSubmitted && alt.letter === question.gabarito ? 'text-[#2ECC71]' : ''}`}>
                {alt.letter}
            </span>
            <span className="text-sm">{alt.text}</span>
          </button>
        ))}
      </div>

      {/* Actions / Feedback Area */}
      <div className="mt-auto">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAlt}
            className={`w-full py-4 rounded-full font-bold text-black uppercase tracking-wide transition-all ${
              selectedAlt ? 'bg-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]' : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {studyMode === 'hard' 
                ? (isLastQuestion ? 'Finalizar Simulado' : 'Confirmar Resposta') 
                : 'Responder'
            }
          </button>
        ) : (
          <div className="animate-fade-in-up">
            
            {/* Feedback Box */}
            <div className={`p-4 rounded-lg mb-4 border ${selectedAlt === question.gabarito ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10'}`}>
               <div className="flex justify-between items-center mb-4">
                   <h3 className={`font-bold ${selectedAlt === question.gabarito ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                       {selectedAlt === question.gabarito ? 'Excelente! 🎯' : 'Não foi dessa vez... ❌'}
                   </h3>
                   <span className="text-xs text-gray-400">78% da comunidade acertou</span>
               </div>
               
               {/* Pegadinha Badge Here - Inside Feedback Box */}
               {question.isPegadinha && (
                   <button 
                     onClick={() => setShowPegadinhaModal(true)}
                     className="w-full mb-4 flex items-center justify-start bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all group text-left"
                   >
                       <div className="bg-orange-500/20 p-2 rounded-md mr-3 group-hover:scale-110 transition-transform">
                          <AlertTriangle size={18} />
                       </div>
                       <div>
                          <span className="block text-xs font-bold uppercase tracking-wide mb-0.5">Alerta de Pegadinha</span>
                          <span className="text-xs text-gray-400 group-hover:text-gray-300">Toque para ver a armadilha desta questão.</span>
                       </div>
                   </button>
               )}
               
               <div className="text-sm text-gray-300 leading-relaxed">
                   {loadingExplanation ? (
                       <div className="space-y-2">
                           <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                           <div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div>
                           <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
                       </div>
                   ) : (
                       studyMode === 'reta_final'
                       ? <><span className="text-purple-400 font-bold text-xs mb-1 block">RESUMO RETA FINAL:</span>{formatText(explanation || '')}</>
                       : formatText(explanation || '')
                   )}
               </div>
            </div>

            {/* Post-Answer Action Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                <button 
                    onClick={() => handleRate('easy')}
                    className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'easy' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                >
                    Fácil
                </button>
                <button 
                    onClick={() => handleRate('medium')}
                    className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                >
                    Médio
                </button>
                <button 
                    onClick={() => handleRate('hard')}
                    className={`p-2 rounded-lg text-xs font-bold border ${difficultyRating === 'hard' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                >
                    Difícil
                </button>
                <button 
                    onClick={() => setShowStatsModal(true)}
                    className="p-2 rounded-lg text-xs font-bold border border-gray-700 text-[#FFB800] hover:bg-gray-800 flex flex-col items-center justify-center"
                >
                    <BarChart2 size={16} />
                </button>
            </div>

            {/* Main Nav Buttons */}
            <div className="flex space-x-3 pb-4 border-b border-gray-800 mb-6">
                <button 
                    onClick={onOpenTutor}
                    className="flex-1 flex items-center justify-center py-3 bg-[#2A2A2A] text-white border border-[#FFB800] rounded-full font-semibold hover:bg-[#333]"
                >
                    <MessageCircle size={18} className="mr-2 text-[#FFB800]" />
                    Tirar Dúvida
                </button>
                <button 
                    onClick={onNext}
                    className="flex-1 py-3 bg-[#FFB800] text-black rounded-full font-bold shadow-lg"
                >
                    {isLastQuestion ? 'Finalizar' : 'Próxima'}
                </button>
            </div>

            {/* Community Comments Section */}
            <div>
                <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center">
                    <MessageSquare size={16} className="mr-2" /> Comentários da Comunidade
                </h4>
                {MOCK_COMMENTS.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                ))}
            </div>

          </div>
        )}
      </div>

      {/* Stats Modal Popup */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1A1A1A] w-full max-w-xs rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center">
                        <BarChart2 size={20} className="mr-2 text-[#FFB800]" />
                        Desempenho
                    </h3>
                    <button onClick={() => setShowStatsModal(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                
                <div className="space-y-4">
                    {currentStats.map((stat) => {
                        const isCorrect = stat.alternative === question.gabarito;
                        const isSelected = stat.alternative === selectedAlt;
                        let barColor = 'bg-gray-600';
                        if (isCorrect) barColor = 'bg-[#2ECC71]';
                        else if (isSelected) barColor = 'bg-[#E74C3C]';

                        return (
                            <div key={stat.alternative} className="relative">
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className={`${isCorrect ? 'text-[#2ECC71]' : isSelected ? 'text-[#E74C3C]' : 'text-gray-400'}`}>
                                        Alternativa {stat.alternative}
                                        {isSelected && " (Você)"}
                                    </span>
                                    <span>{stat.percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${stat.percentage}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Pegadinha Explanation Modal */}
      {showPegadinhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl border border-orange-500 p-0 shadow-2xl overflow-hidden">
                <div className="bg-orange-500/10 p-4 border-b border-orange-500/30 flex justify-between items-center">
                    <h3 className="font-bold text-orange-400 flex items-center">
                        <AlertTriangle size={20} className="mr-2" />
                        Cuidado! É uma Pegadinha
                    </h3>
                    <button onClick={() => setShowPegadinhaModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-300 leading-relaxed text-sm">
                        {question.explicacaoPegadinha || "Esta questão contém elementos projetados para induzir o candidato ao erro comum. Fique atento aos detalhes do enunciado!"}
                    </p>
                    
                    <button 
                        onClick={() => setShowPegadinhaModal(false)}
                        className="mt-6 w-full py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
