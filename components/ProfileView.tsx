
import React from 'react';
import { UserStats } from '../types';
import { MOCK_ACHIEVEMENTS, MOCK_LEAGUE, USER_AVATAR_URL, STORE_ITEMS } from '../constants';
import { Flame, Trophy, Target, Clock, Settings, Edit2, Share2, Award, ChevronUp, ChevronDown, Minus, BookX, Layers, ArrowLeft } from 'lucide-react';

interface ProfileViewProps {
  stats: UserStats;
  onOpenCadernoErros: () => void;
  onOpenFlashcards: () => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ stats, onOpenCadernoErros, onOpenFlashcards, onBack }) => {
  // Calculate level progress (mock calculation)
  const nextLevelXp = 2000;
  const progressPercent = Math.min((stats.xp / nextLevelXp) * 100, 100);
  const accuracy = Math.round((stats.correctAnswers / stats.totalAnswered) * 100) || 0;

  // Determine avatar URL based on inventory logic/mock
  let avatarUrl = USER_AVATAR_URL;
  if (stats.avatarId && stats.avatarId !== 'default') {
      const item = STORE_ITEMS.find(i => i.id === stats.avatarId);
      if (item && item.value) avatarUrl = item.value;
  }

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar">
      
      {/* Top Header */}
      <div className="relative mb-8">
        <div className="h-32 bg-gradient-to-b from-[#FFB800]/20 to-[#1A1A1A] w-full absolute top-0 left-0 z-0"></div>
        
        {/* Back Button */}
        <button 
            onClick={onBack} 
            className="absolute top-6 left-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
        >
            <ArrowLeft size={20} />
        </button>

        <div className="px-4 pt-16 relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FFB800] to-yellow-600 mb-3 shadow-lg">
                <img 
                    src={avatarUrl} 
                    alt="User Profile" 
                    className="w-full h-full rounded-full border-4 border-[#1A1A1A] object-cover" 
                />
            </div>
            <h1 className="text-2xl font-bold text-white">Concurseiro Focado</h1>
            <div className="flex items-center mt-1 space-x-2">
                <span className="text-[#FFB800] text-sm font-bold bg-[#FFB800]/10 px-3 py-1 rounded-full border border-[#FFB800]/20">
                    Guardião da Lei
                </span>
                <span className="text-gray-500 text-sm">Entrou em 2024</span>
            </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="px-4 mb-8">
        <div className="bg-[#252525] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">Nível {stats.level}</span>
                <span className="text-xs text-gray-400">{stats.xp} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div 
                    className="h-full bg-gradient-to-r from-[#FFB800] to-yellow-500 rounded-full shadow-[0_0_10px_#FFB800]" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <p className="text-xs text-center text-gray-500">
                Faltam <span className="text-white font-bold">{nextLevelXp - stats.xp} XP</span> para o próximo nível
            </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center">
            <Target className="mr-2 text-[#FFB800]" size={20} />
            Estatísticas
        </h2>
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Flame size={24} className="mb-2 text-orange-500 fill-orange-500" />
                <span className="text-2xl font-bold text-white">{stats.streak}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Dias Seguidos</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Trophy size={24} className="mb-2 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-white">#3</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Liga Ouro</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Target size={24} className="mb-2 text-[#2ECC71]" />
                <span className="text-2xl font-bold text-white">{accuracy}%</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Precisão</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Clock size={24} className="mb-2 text-blue-400" />
                <span className="text-2xl font-bold text-white">12h</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Estudo Total</span>
            </div>
        </div>
      </div>

      {/* Ranking / League */}
      <div className="px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
                <Trophy className="mr-2 text-[#FFB800]" size={20} />
                Ranking Semanal
            </h2>
            <button className="text-xs text-[#FFB800] font-bold">Ver Liga Completa</button>
        </div>
        <div className="bg-[#252525] rounded-2xl border border-gray-800 overflow-hidden">
            {MOCK_LEAGUE.map((user) => (
                <div 
                    key={user.rank} 
                    className={`flex items-center justify-between p-4 border-b border-gray-800 last:border-0 ${user.isCurrentUser ? 'bg-[#FFB800]/10' : ''}`}
                >
                    <div className="flex items-center space-x-3">
                        <span className={`font-bold w-6 text-center ${user.rank <= 3 ? 'text-[#FFB800]' : 'text-gray-500'}`}>
                            {user.rank}
                        </span>
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-gray-700" />
                        <div>
                            <p className={`text-sm font-bold ${user.isCurrentUser ? 'text-[#FFB800]' : 'text-white'}`}>
                                {user.name} {user.isCurrentUser && '(Você)'}
                            </p>
                            <p className="text-xs text-gray-500">{user.xp}</p>
                        </div>
                    </div>
                    <div>
                        {user.trend === 'up' && <ChevronUp size={16} className="text-green-500" />}
                        {user.trend === 'down' && <ChevronDown size={16} className="text-red-500" />}
                        {user.trend === 'same' && <Minus size={16} className="text-gray-600" />}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center">
            <Award className="mr-2 text-[#FFB800]" size={20} />
            Conquistas
        </h2>
        <div className="grid grid-cols-4 gap-2">
            {MOCK_ACHIEVEMENTS.map(ach => (
                <div key={ach.id} className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-1 border-2 ${ach.unlocked ? 'bg-[#252525] border-[#FFB800] text-white shadow-[0_0_10px_rgba(255,184,0,0.3)]' : 'bg-gray-800 border-gray-700 grayscale opacity-50'}`}>
                        {ach.icon}
                    </div>
                    <span className={`text-[10px] text-center font-bold leading-tight ${ach.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                        {ach.name}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 space-y-3">
        
        {/* Meu Caderno de Erros (First) */}
        <button 
            onClick={onOpenCadernoErros}
            className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors border border-red-900/20 hover:border-red-500/50"
        >
            <div className="flex items-center">
                <BookX size={18} className="mr-3 text-red-500" />
                <span className="font-medium text-sm">Meu Caderno de Erros</span>
            </div>
        </button>

        {/* Meus Flashcards (Second) */}
        <button 
            onClick={onOpenFlashcards}
            className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between text-purple-300 hover:text-white hover:bg-[#2A2A2A] transition-colors border border-purple-900/30 hover:border-purple-500/50"
        >
            <div className="flex items-center">
                <Layers size={18} className="mr-3 text-purple-400" />
                <span className="font-medium text-sm">Meus Flashcards</span>
            </div>
        </button>

        <button className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors">
            <div className="flex items-center">
                <Edit2 size={18} className="mr-3 text-gray-500" />
                <span className="font-medium text-sm">Editar Perfil</span>
            </div>
        </button>
        <button className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors">
            <div className="flex items-center">
                <Share2 size={18} className="mr-3 text-gray-500" />
                <span className="font-medium text-sm">Convidar Amigos</span>
            </div>
        </button>
        <button className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors">
            <div className="flex items-center">
                <Settings size={18} className="mr-3 text-gray-500" />
                <span className="font-medium text-sm">Configurações</span>
            </div>
        </button>
      </div>

      <div className="mt-8 text-center">
          <button className="text-xs text-red-500 font-bold hover:text-red-400 p-2">
              Sair da Conta
          </button>
          <p className="text-[10px] text-gray-700 mt-2">Versão 1.0.6 Beta</p>
      </div>
    </div>
  );
};

export default ProfileView;
