
import React, { useState } from 'react';
import { ArrowLeft, Trophy, ChevronUp, ChevronDown, Minus, Lock } from 'lucide-react';
import { LeagueTier, LeagueUser } from '../types';
import { MOCK_RANKING_DATA } from '../constants';

interface RankingViewProps {
  onBack: () => void;
}

const RankingView: React.FC<RankingViewProps> = ({ onBack }) => {
  const [activeTier, setActiveTier] = useState<LeagueTier>('ouro');

  const tiers: { id: LeagueTier; name: string; color: string }[] = [
    { id: 'ferro', name: 'Ferro', color: 'text-gray-400' },
    { id: 'bronze', name: 'Bronze', color: 'text-orange-700' },
    { id: 'prata', name: 'Prata', color: 'text-gray-200' },
    { id: 'ouro', name: 'Ouro', color: 'text-yellow-400' },
    { id: 'diamante', name: 'Diamante', color: 'text-cyan-400' },
  ];

  const currentList = MOCK_RANKING_DATA[activeTier] || [];

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A] flex flex-col">
       {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#1A1A1A] sticky top-0 z-10 flex items-center">
        <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white flex items-center">
            <Trophy className="mr-2 text-[#FFB800]" />
            Ranking das Ligas
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar p-4 space-x-2 border-b border-gray-800 bg-[#1A1A1A]">
         {tiers.map(tier => (
             <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                    activeTier === tier.id 
                    ? `bg-[#252525] border-gray-600 ${tier.color}` 
                    : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'
                }`}
             >
                 {tier.name}
             </button>
         ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
         <div className="mb-4 text-center">
             <h2 className={`text-2xl font-bold uppercase tracking-wider mb-1 ${tiers.find(t => t.id === activeTier)?.color}`}>
                 Liga {tiers.find(t => t.id === activeTier)?.name}
             </h2>
             <p className="text-xs text-gray-500">Top 3 sobem para a próxima liga</p>
         </div>

         <div className="bg-[#252525] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
            {currentList.length > 0 ? (
                currentList.map((user, index) => (
                    <div 
                        key={index} 
                        className={`flex items-center justify-between p-4 border-b border-gray-800 last:border-0 ${user.isCurrentUser ? 'bg-[#FFB800]/10 border-l-4 border-l-[#FFB800]' : ''}`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className={`font-bold w-6 text-center ${user.rank <= 3 ? tiers.find(t => t.id === activeTier)?.color : 'text-gray-500'}`}>
                                {user.rank}
                            </span>
                            <div className="relative">
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
                                {user.rank === 1 && <div className="absolute -top-1 -right-1 text-xs">👑</div>}
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${user.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
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
                ))
            ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Lock size={32} className="mb-2 opacity-50" />
                    <p>Liga bloqueada ou sem dados.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default RankingView;
