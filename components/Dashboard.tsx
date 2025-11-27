

import React, { useState } from 'react';
import { UserStats, Course, GamificationModalType } from '../types';
import { MOCK_LEAGUE } from '../constants';
import { Flame, Trophy, Target, ChevronRight, Lock, ShoppingBag, ChevronUp, ChevronDown, Minus, Coins, Swords, PenTool, BrainCircuit, Loader2 } from 'lucide-react';
import GamificationModal from './GamificationModal';

interface DashboardProps {
  stats: UserStats;
  courses: Course[];
  ownedCourseIds: string[];
  pendingReviewCount?: number;
  onSelectCourse: (course: Course) => void;
  onBuyCourse: (course: Course) => void;
  onStartPvP?: () => void;
  onStartRedacao?: () => void;
  onStartReview?: () => void;
  onNavigateToProfile: () => void; // Used by modal
  onViewRanking: () => void;
  isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, courses, ownedCourseIds, pendingReviewCount = 0, onSelectCourse, onBuyCourse, onStartPvP, onStartRedacao, onStartReview, onNavigateToProfile, onViewRanking, isLoading = false }) => {
  // Filter courses based on the owned IDs passed from App (source of truth)
  const myCourses = courses.filter(c => ownedCourseIds.includes(c.id) || c.isOwned);
  const storeCourses = courses.filter(c => !ownedCourseIds.includes(c.id) && !c.isOwned);

  // Modal State
  const [modalType, setModalType] = useState<GamificationModalType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (type: GamificationModalType) => {
      setModalType(type);
      setIsModalOpen(true);
  };

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar">
      {/* 1. Header Stats Section */}
      <div className="px-4 pt-12 mb-6">
        <div className="flex justify-between items-center mb-8">
             <h1 className="text-2xl font-bold">Fala, Dhyêgo! 👋</h1>
             <button 
                onClick={() => handleOpenModal('coins')}
                className="flex items-center bg-[#252525] px-3 py-1.5 rounded-full border border-yellow-900/30 hover:bg-[#333] transition-colors"
             >
                <Coins size={16} className="text-[#FFB800] mr-2" />
                <span className="font-bold text-[#FFB800] text-sm">{stats.coins}</span>
             </button>
        </div>
        
        {/* Gamification Grid - Clickable Cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
            {/* Streak */}
            <button 
                onClick={() => handleOpenModal('streak')}
                className="bg-[#252525] p-3 rounded-xl border border-gray-800 flex flex-col items-center justify-center hover:bg-[#2A2A2A] transition-all"
            >
                <Flame size={20} className="mb-1 text-orange-500 fill-orange-500" />
                <span className="font-bold text-lg">{stats.streak}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Dias Seguidos</span>
            </button>

            {/* Ranking */}
            <button 
                onClick={() => handleOpenModal('league')}
                className="bg-[#252525] p-3 rounded-xl border border-yellow-900/30 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-[#2A2A2A] transition-all"
            >
                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                <Trophy size={20} className="mb-1 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-lg text-white">#3</span>
                <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-tight">Liga Ouro</span>
            </button>

            {/* Daily Goal - Clickable */}
            <button 
                onClick={() => handleOpenModal('daily_goal')}
                className="bg-[#252525] p-3 rounded-xl border border-gray-800 flex flex-col items-center justify-center hover:bg-[#2A2A2A] transition-all"
            >
                <Target size={20} className="mb-1 text-[#2ECC71]" />
                <span className="font-bold text-lg">{stats.correctAnswers}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Hoje</span>
            </button>
        </div>

        {/* XP Progress - Clickable */}
        <button 
            onClick={() => handleOpenModal('level')}
            className="w-full text-left bg-gradient-to-r from-[#FFB800]/10 to-[#FFB800]/5 p-4 rounded-xl border border-[#FFB800]/20 relative overflow-hidden group hover:border-[#FFB800]/40 transition-all"
        >
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
            <Trophy className="absolute right-0 bottom-0 text-[#FFB800]/10 w-24 h-24 -mr-4 -mb-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Smart Review Card (Conditional) */}
      {pendingReviewCount > 0 && onStartReview && (
          <div className="px-4 mb-6">
              <button 
                onClick={onStartReview}
                className="w-full bg-gradient-to-r from-blue-900/40 to-blue-900/20 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group shadow-lg shadow-blue-900/20"
              >
                  <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="flex items-center relative z-10">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4 border border-blue-500/50 animate-pulse-fast">
                          <BrainCircuit size={24} className="text-blue-400" />
                      </div>
                      <div className="text-left">
                          <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors">Revisão Inteligente</h3>
                          <p className="text-xs text-blue-200">
                              <span className="font-bold">{pendingReviewCount} questões</span> para fixar hoje.
                          </p>
                      </div>
                  </div>
                  <ChevronRight className="text-blue-400 group-hover:translate-x-1 transition-transform relative z-10" size={20} />
              </button>
          </div>
      )}

      {/* 2. Meus Preparatórios (Horizontal Scroll - Vertical Cards) */}
      <div className="mb-6">
        <div className="px-4 mb-3">
            <h2 className="text-lg font-bold">Meus Preparatórios</h2>
        </div>

        {isLoading ? (
            <div className="px-4">
                <div className="p-8 rounded-xl border border-dashed border-gray-800 text-center flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-[#FFB800] mb-2" size={24} />
                    <p className="text-sm text-gray-500">Carregando cursos...</p>
                </div>
            </div>
        ) : myCourses.length > 0 ? (
            <div className="flex overflow-x-auto px-4 pb-4 space-x-3 no-scrollbar snap-x">
                {myCourses.map(course => (
                    <button
                        key={course.id}
                        onClick={() => onSelectCourse(course)}
                        className="flex-none w-[40vw] sm:w-40 aspect-[3/4] rounded-xl overflow-hidden relative group snap-center shadow-lg border border-gray-800 hover:border-[#FFB800] transition-all"
                    >
                         {/* Background Image */}
                         {course.image ? (
                             <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                         ) : (
                             <div className="absolute inset-0 bg-[#252525] flex items-center justify-center">
                                 <div className="text-4xl opacity-20">{course.icon}</div>
                             </div>
                         )}

                         {/* Gradient Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                         {/* Content Overlay */}
                         <div className="absolute bottom-0 left-0 w-full p-3 text-left">
                              <div className="flex items-center space-x-1 mb-1">
                                   <div className="bg-[#FFB800] rounded-sm p-0.5">
                                       <span className="text-[8px] font-bold text-black uppercase block leading-none">PRO</span>
                                   </div>
                              </div>
                              <h3 className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-2">{course.title}</h3>
                              <p className="text-[10px] text-gray-300 truncate">{course.subtitle}</p>
                         </div>
                    </button>
                ))}
            </div>
        ) : (
            <div className="px-4">
                <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center">
                    <p className="text-sm text-gray-500">Você ainda não possui preparatórios.</p>
                </div>
            </div>
        )}
      </div>

      {/* 3. Action Cards (PvP & Redação) - Stacked Horizontal Cards */}
      <div className="px-4 mb-6">
        <div className="flex flex-col space-y-3">
            {onStartPvP && (
                <button 
                    onClick={onStartPvP}
                    className="w-full bg-gradient-to-r from-[#252525] to-[#1A1A1A] border border-purple-500/30 rounded-xl p-4 flex items-center relative overflow-hidden group hover:border-purple-500/60 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-purple-600 p-3 rounded-full mr-4 shadow-[0_0_15px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform">
                        <Swords size={20} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-bold text-white text-sm">Modo Batalha</h3>
                        <p className="text-[10px] text-purple-300">Desafie amigos em tempo real</p>
                    </div>
                    <ChevronRight className="text-gray-500 group-hover:text-purple-400" size={20} />
                </button>
            )}

            {onStartRedacao && (
                <button 
                    onClick={onStartRedacao}
                    className="w-full bg-gradient-to-r from-[#252525] to-[#1A1A1A] border border-blue-500/30 rounded-xl p-4 flex items-center relative overflow-hidden group hover:border-blue-500/60 transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-blue-600 p-3 rounded-full mr-4 shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                        <PenTool size={20} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-bold text-white text-sm">Simulador de Redação</h3>
                        <p className="text-[10px] text-blue-300">Correção automática com IA</p>
                    </div>
                    <ChevronRight className="text-gray-500 group-hover:text-blue-400" size={20} />
                </button>
            )}
        </div>
      </div>

      {/* 4. Disponíveis para Compra (Horizontal Scroll - Vertical Cards) */}
      <div className="mb-6">
        <div className="px-4 mb-3 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center">
              <ShoppingBag size={18} className="mr-2 text-[#FFB800]"/> 
              Disponíveis para Compra
            </h2>
        </div>

        <div className="flex overflow-x-auto px-4 pb-4 space-x-3 no-scrollbar snap-x">
            {storeCourses.map(course => (
                <button 
                    key={course.id}
                    onClick={() => onBuyCourse(course)}
                    className="flex-none w-[40vw] sm:w-40 aspect-[3/4] rounded-xl overflow-hidden relative group snap-center shadow-lg border border-gray-700 hover:border-[#FFB800] transition-all opacity-90 hover:opacity-100"
                >
                    {/* Background Image */}
                     {course.image ? (
                         <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 filter grayscale-[0.3] group-hover:grayscale-0" />
                     ) : (
                         <div className="absolute inset-0 bg-[#252525] flex items-center justify-center">
                              <div className="text-4xl opacity-20">{course.icon}</div>
                         </div>
                     )}

                     {/* Gradient Overlay */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                     {/* Lock Icon */}
                     <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                         <Lock size={12} className="text-[#FFB800]" />
                     </div>
                     
                     {/* Price - Top Left */}
                     <div className="absolute top-2 left-2 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-yellow-900/30">
                        <span className="text-xs font-bold text-[#FFB800]">{course.price}</span>
                     </div>

                     {/* Content Overlay */}
                     <div className="absolute bottom-0 left-0 w-full p-3 text-left">
                          <h3 className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-2">{course.title}</h3>
                          <div className="flex justify-between items-end mt-1">
                               <p className="text-[10px] text-gray-300 truncate w-full">{course.subtitle}</p>
                          </div>
                     </div>
                </button>
            ))}
            {storeCourses.length === 0 && (
                <div className="px-4 w-full">
                    <div className="p-6 text-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl">
                        Você já possui todos os cursos disponíveis! 🚀
                    </div>
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
             <button 
                onClick={onViewRanking}
                className="text-xs text-[#FFB800] font-bold hover:underline"
            >
                 Ver Liga Completa
             </button>
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
      
      <GamificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType}
        stats={stats}
        onNavigateToProfile={onNavigateToProfile}
      />
    </div>
  );
};

export default Dashboard;
