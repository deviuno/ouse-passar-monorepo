
import React, { useState } from 'react';
import { ArrowLeft, PenTool, CheckCircle, AlertTriangle, Sparkles, Edit3 } from 'lucide-react';
import { analyzeEssay } from '../services/geminiService';
import { EssayFeedback, ToastType } from '../types';

interface RedacaoViewProps {
  onBack: () => void;
  onShowToast: (message: string, type: ToastType) => void;
}

const CUSTOM_TOPIC_OPTION = "Tema Personalizado";

const TOPICS = [
    "A importância da tecnologia na segurança pública",
    "Desafios do sistema prisional brasileiro",
    "O papel da PRF no combate ao tráfico de drogas",
    "Sustentabilidade e desenvolvimento econômico",
    CUSTOM_TOPIC_OPTION
];

const RedacaoView: React.FC<RedacaoViewProps> = ({ onBack, onShowToast }) => {
  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [essayText, setEssayText] = useState('');
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);

  const handleAnalyze = async () => {
      // Determine the actual topic to send to AI
      const topicToAnalyze = selectedTopic === CUSTOM_TOPIC_OPTION ? customTopic : selectedTopic;

      if (!topicToAnalyze.trim()) {
          onShowToast("Por favor, digite o tema da redação.", "error");
          return;
      }

      if (!essayText.trim()) {
          onShowToast("Por favor, escreva sua redação.", "error");
          return;
      }

      setStep('analyzing');
      
      const result = await analyzeEssay(topicToAnalyze, essayText);
      
      if (result) {
          setFeedback(result);
          setStep('result');
          onShowToast("Redação corrigida com sucesso!", "success");
      } else {
          onShowToast("Erro ao corrigir redação. Tente novamente.", "error");
          setStep('input');
      }
  };

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-[#2ECC71]';
      if (score >= 60) return 'text-[#FFB800]';
      return 'text-[#E74C3C]';
  };

  if (step === 'analyzing') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#1A1A1A] text-center">
              <div className="w-16 h-16 bg-[#FFB800]/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <PenTool size={32} className="text-[#FFB800]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Corrigindo sua Redação...</h2>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Nossa IA está analisando gramática, coesão e argumentação com base nos critérios da banca Cebraspe.
              </p>
          </div>
      );
  }

  if (step === 'result' && feedback) {
      return (
          <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A]">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1A1A1A] sticky top-0 z-10">
                  <button onClick={() => setStep('input')} className="text-gray-400 hover:text-white">
                      <ArrowLeft size={24} />
                  </button>
                  <h1 className="font-bold text-white">Resultado da Correção</h1>
                  <div className="w-6"></div>
              </div>

              <div className="p-6">
                  {/* Overall Score */}
                  <div className="flex flex-col items-center mb-8">
                      <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-3 ${getScoreColor(feedback.score)} border-current`}>
                          <span className="text-3xl font-bold text-white">{feedback.score}</span>
                      </div>
                      <h2 className={`font-bold text-lg ${getScoreColor(feedback.score)}`}>
                          {feedback.score >= 70 ? 'Aprovado' : 'Precisa Melhorar'}
                      </h2>
                      <p className="text-gray-400 text-sm text-center mt-2">"{feedback.generalComment}"</p>
                  </div>

                  {/* Competencies */}
                  <div className="space-y-4 mb-8">
                      <div className="bg-[#252525] p-4 rounded-xl border border-gray-800">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-300">Gramática</span>
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{feedback.competencies.grammar.score}/30</span>
                          </div>
                          <p className="text-xs text-gray-500">{feedback.competencies.grammar.feedback}</p>
                      </div>

                      <div className="bg-[#252525] p-4 rounded-xl border border-gray-800">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-300">Estrutura</span>
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{feedback.competencies.structure.score}/30</span>
                          </div>
                          <p className="text-xs text-gray-500">{feedback.competencies.structure.feedback}</p>
                      </div>

                      <div className="bg-[#252525] p-4 rounded-xl border border-gray-800">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-300">Conteúdo</span>
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{feedback.competencies.content.score}/40</span>
                          </div>
                          <p className="text-xs text-gray-500">{feedback.competencies.content.feedback}</p>
                      </div>
                  </div>

                  {/* AI Improvement */}
                  {feedback.improvedParagraph && (
                      <div className="bg-purple-900/20 border border-purple-500/30 p-5 rounded-xl">
                          <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center">
                              <Sparkles size={16} className="mr-2" />
                              Sugestão de Reescrita
                          </h3>
                          <p className="text-sm text-gray-300 italic leading-relaxed">
                              "{feedback.improvedParagraph}"
                          </p>
                      </div>
                  )}
                  
                  <button 
                    onClick={() => setStep('input')}
                    className="w-full mt-6 py-3 bg-[#FFB800] text-black font-bold rounded-xl shadow-lg"
                  >
                      Nova Redação
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A]">
      <div className="p-4 border-b border-gray-800 flex items-center bg-[#1A1A1A] sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center text-white">
            <PenTool className="mr-2 text-[#FFB800]" />
            Simulador de Redação
        </h1>
      </div>

      <div className="p-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Escolha o Tema</label>
          <div className="bg-[#252525] rounded-xl border border-gray-800 mb-4 overflow-hidden">
              {TOPICS.map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTopic(t)}
                    className={`w-full text-left p-3 text-sm border-b border-gray-800 last:border-0 transition-colors flex items-center ${selectedTopic === t ? 'bg-[#FFB800]/10 text-[#FFB800] font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
                  >
                      {selectedTopic === t ? <CheckCircle size={14} className="mr-2 shrink-0" /> : (t === CUSTOM_TOPIC_OPTION ? <Edit3 size={14} className="mr-2 shrink-0 opacity-50"/> : null)}
                      {t}
                  </button>
              ))}
          </div>

          {/* Custom Topic Input */}
          {selectedTopic === CUSTOM_TOPIC_OPTION && (
              <div className="mb-6 animate-fade-in-up">
                  <label className="block text-xs font-bold text-[#FFB800] uppercase mb-2">Digite o seu Tema</label>
                  <input 
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ex: A crise hídrica no Brasil..."
                    className="w-full bg-[#1A1A1A] border border-[#FFB800] rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
                  />
              </div>
          )}

          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 mt-6">Sua Redação</label>
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Digite seu texto aqui..."
            className="w-full h-64 bg-[#252525] border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#FFB800] resize-none leading-relaxed"
          ></textarea>
          <div className="flex justify-between mt-2 mb-6">
              <span className="text-xs text-gray-500">{essayText.length} caracteres</span>
              <span className="text-xs text-gray-500">Mínimo recomendado: 1000</span>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex items-start">
              <AlertTriangle size={18} className="text-orange-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">
                  A IA avaliará seu texto seguindo critérios rigorosos de concursos. Evite gírias e mantenha a impessoalidade.
              </p>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={essayText.length < 50}
            className={`w-full py-4 rounded-xl font-bold text-black shadow-lg transition-all ${essayText.length < 50 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#FFB800] hover:bg-[#FFC933]'}`}
          >
              Corrigir Redação
          </button>
      </div>
    </div>
  );
};

export default RedacaoView;
