
import React from 'react';
import { UserStats, Course } from '../types';
import { COURSES, MOCK_LEAGUE } from '../constants';
import { Flame, Trophy, Target, ChevronRight, Lock, ShoppingBag, ChevronUp, ChevronDown, Minus, Coins, Swords, PenTool } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  ownedCourseIds: string[];
  onSelectCourse: (course: Course) => void;
  onBuyCourse: (course: Course) => void;
  onStartPvP?: () => void;
  onStartRedacao?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, ownedCourseIds, onSelectCourse, onBuyCourse, onStartPvP, onStartRedacao }) => {
  // Filter courses based on the owned IDs passed from App (source of truth)
  const myCourses = COURSES.filter(c => ownedCourseIds.includes(c.id));
  const storeCourses = COURSES.filter(c => !ownedCourseIds.includes(c.id));

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar">
      {/* 1. Header Stats Section */}
      {/* Increased top padding significantly (pt-12) for more breathing room */}
      <div className="px-4 pt-12 mb-8">
        <div className="flex justify-between items-center mb-8">
             <h1 className="text-2xl font-bold">Fala, Dhyêgo! 👋</h1>
             <div className="flex items-center bg-[#252525] px-3 py-1.5 rounded-full border border-yellow-900/30">
                <Coins size={16} className="text-[#FFB800] mr-2" />
                <span className="font-bold text-[#FFB800] text-sm">{stats.coins}</span>
             </div>
        </div>
        
        {/* Gamification Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
            {/* Streak */}
            <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Flame size={20} className="mb-1 text-orange-500 fill-orange-500" />
                <span className="font-bold text-lg">{stats.streak}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Dias Seguidos</span>
            </div>

            {/* Ranking */}
            <div className="bg-[#252525] p-3 rounded-xl border border-yellow-900/30 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                <Trophy size={20} className="mb-1 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-lg text-white">#3</span>
                <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-tight">Liga Ouro</span>
            </div>

            {/* Daily Goal */}
            <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Target size={20} className="mb-1 text-[#2ECC71]" />
                <span className="font-bold text-lg">{stats.correctAnswers}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Hoje</span>
            </div>
        </div>

        {/* XP Progress */}
        <div className="bg-gradient-to-r from-[#FFB800]/10 to-[#FFB800]/5 p-4 rounded-xl border border-[#FFB800]/20 relative overflow-hidden">
            <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                    <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider">Nível {stats.level}</span>
                    <h3 className="font-bold text-white">Guardião da Lei</h3>
                </div>
                <span className="text-sm font-bold text-white">{stats.xp} <span className="text-gray-400 text-xs">/ 2000 XP</span></span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-[#FFB800] w-[62%] rounded-full shadow-[0_0_10px_rgba(255,184,0,0.5)]"></div>
            </div>
            <Trophy className="absolute right-0 bottom-0 text-[#FFB800]/10 w-24 h-24 -mr-4 -mb-4" />
        </div>
      </div>

      {/* 2. Meus Preparatórios (Moved UP) */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Meus Preparatórios</h2>
        </div>

        {myCourses.length > 0 ? (
            <div className="space-y-3">
                {myCourses.map(course => (
                    <button 
                        key={course.id}
                        onClick={() => onSelectCourse(course)}
                        className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-gray-800 p-4 rounded-2xl flex items-center justify-between transition-all group"
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-2xl mr-4 border border-gray-800 group-hover:border-[#FFB800]/50 transition-colors">
                                {course.icon}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white group-hover:text-[#FFB800] transition-colors">{course.title}</h3>
                                <p className="text-xs text-gray-500">{course.subtitle}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-600 group-hover:text-[#FFB800]" size={20} />
                    </button>
                ))}
            </div>
        ) : (
            <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center">
                <p className="text-sm text-gray-500">Você ainda não possui preparatórios.</p>
            </div>
        )}
      </div>

      {/* 3. Action Cards (PvP & Redação) - Side by Side Squares */}
      {/* Standardized spacing: using same px-4 and mb-6 as other sections */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
            {onStartPvP && (
                <button 
                    onClick={onStartPvP}
                    className="aspect-square bg-gradient-to-b from-[#252525] to-[#1A1A1A] border border-purple-500/30 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-purple-500/60 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-purple-600 p-3 rounded-full mb-3 shadow-[0_0_15px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform">
                        <Swords size={24} className="text-white" />
                    </div>
                    {/* Renamed to Modo Batalha */}
                    <h3 className="font-bold text-white text-sm">Modo Batalha</h3>
                    <p className="text-[10px] text-purple-300 mt-1">Tempo Real</p>
                </button>
            )}

            {onStartRedacao && (
                <button 
                    onClick={onStartRedacao}
                    className="aspect-square bg-gradient-to-b from-[#252525] to-[#1A1A1A] border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-blue-500/60 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-blue-600 p-3 rounded-full mb-3 shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                        <PenTool size={24} className="text-white" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Simulador Redação</h3>
                    <p className="text-[10px] text-blue-300 mt-1">Correção IA</p>
                </button>
            )}
        </div>
      </div>

      {/* 4. Disponíveis para Compra */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <ShoppingBag size={18} className="mr-2 text-[#FFB800]"/> 
              Disponíveis para Compra
            </h2>
        </div>

        <div className="space-y-3">
            {storeCourses.map(course => (
                <button 
                    key={course.id}
                    onClick={() => onBuyCourse(course)}
                    className="w-full bg-[#1A1A1A] border border-dashed border-gray-700 p-4 rounded-2xl flex items-center justify-between opacity-80 hover:opacity-100 hover:border-[#FFB800]/50 hover:bg-[#252525] transition-all group"
                >
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-[#252525] rounded-xl flex items-center justify-center text-2xl mr-4 text-gray-500 group-hover:text-white transition-colors">
                            {course.icon}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-300 group-hover:text-white">{course.title}</h3>
                            <p className="text-xs text-[#FFB800] font-bold">{course.price}</p>
                        </div>
                    </div>
                    <Lock className="text-gray-600 group-hover:text-[#FFB800]" size={18} />
                </button>
            ))}
            {storeCourses.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                    Você já possui todos os cursos disponíveis! 🚀
                </div>
            )}
        </div>
      </div>

      {/* 5. Ranking List Section */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
                <Trophy className="mr-2 text-[#FFB800]" size={20} />
                Ranking Semanal
            </h2>
             <button className="text-xs text-[#FFB800] font-bold">Ver Liga Completa</button>
        </div>
        <div className="bg-[#252525] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
            {MOCK_LEAGUE.map((user) => (
                <div 
                    key={user.rank} 
                    className={`flex items-center justify-between p-4 border-b border-gray-800 last:border-0 ${user.isCurrentUser ? 'bg-[#FFB800]/10' : ''}`}
                >
                    <div className="flex items-center space-x-3">
                        <span className={`font-bold w-6 text-center ${user.rank <= 3 ? 'text-[#FFB800]' : 'text-gray-500'}`}>
                            {user.rank}
                        </span>
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-gray-700 object-cover" />
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
    </div>
  );
};

export default Dashboard;
