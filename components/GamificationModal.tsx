
import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Coins, Target, ChevronRight, Star, BarChart2 } from 'lucide-react';
import { GamificationModalType, UserStats } from '../types';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: GamificationModalType;
  stats: UserStats;
  onNavigateToProfile: () => void;
}

const GamificationModal: React.FC<GamificationModalProps> = ({ isOpen, onClose, type, stats, onNavigateToProfile }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !type) return null;

  const renderContent = () => {
    switch (type) {
      case 'coins':
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-[#FFB800]/10 rounded-full flex items-center justify-center mb-4 border border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.2)]">
                <Coins size={40} className="text-[#FFB800]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{stats.coins} Moedas</h2>
              <p className="text-gray-400 text-sm">Seu saldo atual</p>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Histórico Recente</h3>
              <div className="bg-[#252525] rounded-xl p-4 border border-gray-800">
                <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                   <span className="text-sm text-gray-300">Simulado PRF</span>
                   <span className="text-sm font-bold text-[#FFB800]">+50</span>
                </div>
                 <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                   <span className="text-sm text-gray-300">Batalha PvP</span>
                   <span className="text-sm font-bold text-[#FFB800]">+20</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-gray-300">Avatar Leão</span>
                   <span className="text-sm font-bold text-red-500">-500</span>
                </div>
              </div>

              <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Como Ganhar Mais</h3>
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
                    <Target size={20} className="mx-auto mb-2 text-green-500" />
                    <p className="text-xs font-bold text-white">Acertar Questões</p>
                 </div>
                 <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
                    <Flame size={20} className="mx-auto mb-2 text-orange-500" />
                    <p className="text-xs font-bold text-white">Manter Ofensiva</p>
                 </div>
              </div>
            </div>
          </>
        );
      
      case 'level':
        const nextLevelXp = 2000;
        const remaining = nextLevelXp - stats.xp;
        const progress = (stats.xp / nextLevelXp) * 100;

        return (
          <>
             <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#FFB800] to-yellow-600 rounded-full flex items-center justify-center mb-4 border-4 border-[#1A1A1A] shadow-xl">
                <span className="text-3xl font-bold text-black">{stats.level}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Nível {stats.level}</h2>
              <p className="text-[#FFB800] text-sm font-bold bg-[#FFB800]/10 px-3 py-1 rounded-full border border-[#FFB800]/20 mt-2">
                Guardião da Lei
              </p>
            </div>

            <div className="mb-8">
               <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">XP Atual</span>
                  <span className="text-white font-bold">{stats.xp} / {nextLevelXp}</span>
               </div>
               <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-[#FFB800]" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="text-center text-xs text-gray-500">
                  Faltam apenas <strong className="text-white">{remaining} XP</strong> para o nível {stats.level + 1}.
               </p>
            </div>

            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 mb-6">
                <h3 className="font-bold text-sm text-gray-300 mb-3">Próximas Recompensas</h3>
                <div className="flex items-center space-x-3 opacity-50">
                    <div className="bg-gray-800 p-2 rounded-lg"><Star size={16} className="text-gray-400"/></div>
                    <span className="text-sm text-gray-400">Novo título: "Juiz em Treinamento"</span>
                </div>
            </div>
          </>
        );

      case 'streak':
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)] animate-pulse-fast">
                <Flame size={40} className="text-orange-500 fill-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{stats.streak} Dias</h2>
              <p className="text-gray-400 text-sm">Sequência Imbatível!</p>
            </div>

            <div className="bg-[#252525] p-5 rounded-xl border border-gray-800 mb-8">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-gray-300">Essa Semana</h3>
               </div>
               <div className="flex justify-between">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                      <div key={i} className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-500 mb-1">{day}</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 5 ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-600'}`}>
                             {i < 5 ? <Flame size={12} fill="black" /> : null}
                          </div>
                      </div>
                  ))}
               </div>
               <p className="text-center text-xs text-orange-400 mt-4">
                   Continue assim para ganhar um bônus de XP no 7º dia!
               </p>
            </div>
          </>
        );
      
      case 'daily_goal':
        const DAILY_GOAL = 50;
        const dailyProgress = Math.min((stats.correctAnswers / DAILY_GOAL) * 100, 100);
        const accuracy = stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0;
        
        return (
          <>
             <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Target size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{stats.correctAnswers} Acertos</h2>
              <p className="text-gray-400 text-sm">Meta Diária: {DAILY_GOAL} Questões</p>
            </div>

            <div className="mb-8">
               <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Progresso</span>
                  <span className="text-white font-bold">{Math.round(dailyProgress)}%</span>
               </div>
               <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${dailyProgress}%` }}></div>
               </div>
               <p className="text-center text-xs text-gray-500">
                  Responda mais <strong className="text-white">{Math.max(0, DAILY_GOAL - stats.correctAnswers)} questões</strong> para bater a meta.
               </p>
            </div>

             <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 mb-6 flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-sm text-gray-300">Precisão Hoje</h3>
                   <p className="text-xs text-gray-500">Taxa de acerto global</p>
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-[#FFB800]">{accuracy}%</span>
                </div>
            </div>
          </>
        );

      case 'league': // Shows specific League info
      case 'ranking': // Fallback for ranking click
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                <Trophy size={40} className="text-yellow-500 fill-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Liga Ouro</h2>
              <p className="text-gray-400 text-sm">Competição Semanal</p>
            </div>

            <div className="space-y-3 mb-8">
               <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                   <span className="text-sm text-gray-300">Sua Posição</span>
                   <span className="font-bold text-white text-lg">#3</span>
               </div>
               <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                   <span className="text-sm text-gray-300">Zona de Promoção</span>
                   <span className="font-bold text-green-500 text-sm">Top 5 sobem</span>
               </div>
               <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                   <span className="text-sm text-gray-300">Zona de Rebaixamento</span>
                   <span className="font-bold text-red-500 text-sm">Últimos 3 caem</span>
               </div>
            </div>
            
            <p className="text-center text-xs text-gray-500 mb-4">
                A liga reinicia todo domingo às 23:59.
            </p>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div 
        className={`w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl flex flex-col border-t border-x border-gray-800 shadow-[0_-10px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-transform duration-300 ease-out pointer-events-auto transform ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-end p-4">
             <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                <X size={24} />
             </button>
        </div>

        <div className="px-6 pb-8 overflow-y-auto no-scrollbar max-h-[70vh]">
            {renderContent()}

            <button 
                onClick={() => { onClose(); onNavigateToProfile(); }}
                className="w-full py-4 bg-[#252525] hover:bg-[#333] border border-gray-700 text-white font-bold rounded-xl flex items-center justify-center transition-all group"
            >
                Ver Detalhes no Perfil
                <ChevronRight size={18} className="ml-2 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default GamificationModal;
