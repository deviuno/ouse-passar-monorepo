
import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { USER_AVATAR_URL, STORE_ITEMS } from '../constants';
import { Flame, Trophy, Target, Clock, Settings, Edit2, Share2, Award, ChevronUp, ChevronDown, Minus, BookX, Layers, ArrowLeft, LogOut, Loader2, Mail, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getLeagueRanking,
  getAchievementsWithStatus,
  LeagueRankingUser,
  Achievement,
  LeagueTier,
  LEAGUE_INFO
} from '../services/rankingService';

interface ProfileViewProps {
  stats: UserStats;
  onOpenCadernoErros: () => void;
  onOpenFlashcards: () => void;
  onOpenGuide: () => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ stats, onOpenCadernoErros, onOpenFlashcards, onOpenGuide, onBack }) => {
  const { user, profile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ranking, setRanking] = useState<LeagueRankingUser[]>([]);
  const [achievements, setAchievements] = useState<(Achievement & { unlocked: boolean })[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [userRankPosition, setUserRankPosition] = useState<number | null>(null);

  // Get league tier from profile or default to 'ferro'
  const leagueTier: LeagueTier = (profile?.league_tier as LeagueTier) || 'ferro';
  const leagueInfo = LEAGUE_INFO[leagueTier];

  // Load ranking data
  useEffect(() => {
    const loadRanking = async () => {
      if (!user?.id) return;

      setIsLoadingRanking(true);
      const rankingData = await getLeagueRanking(leagueTier, user.id, 10);
      setRanking(rankingData);

      // Find user's position
      const userPos = rankingData.find(r => r.isCurrentUser);
      setUserRankPosition(userPos?.rank ?? null);

      setIsLoadingRanking(false);
    };

    loadRanking();
  }, [user?.id, leagueTier]);

  // Load achievements
  useEffect(() => {
    const loadAchievements = async () => {
      if (!user?.id) return;

      setIsLoadingAchievements(true);
      const achievementsData = await getAchievementsWithStatus(user.id);
      setAchievements(achievementsData);
      setIsLoadingAchievements(false);
    };

    loadAchievements();
  }, [user?.id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  // Get user display name from profile or auth metadata
  const displayName = profile?.name || user?.user_metadata?.name || 'Concurseiro Focado';
  const userEmail = user?.email || '';
  const createdAt = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  // Use real stats from profile
  const userXp = profile?.xp ?? 0;
  const userLevel = profile?.level ?? 1;
  const userStreak = profile?.streak ?? 0;
  const correctAnswers = profile?.correct_answers ?? 0;
  const totalAnswered = profile?.total_answered ?? 0;

  // Calculate level progress
  const xpPerLevel = 500;
  const xpForCurrentLevel = (userLevel - 1) * xpPerLevel;
  const xpForNextLevel = userLevel * xpPerLevel;
  const xpInCurrentLevel = userXp - xpForCurrentLevel;
  const progressPercent = Math.min((xpInCurrentLevel / xpPerLevel) * 100, 100);

  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  // Determine avatar URL based on inventory logic/mock
  let avatarUrl = profile?.avatar_url || USER_AVATAR_URL;
  if (stats.avatarId && stats.avatarId !== 'default') {
      const item = STORE_ITEMS.find(i => i.id === stats.avatarId);
      if (item && item.value) avatarUrl = item.value;
  }

  // Get title based on level
  const getTitleByLevel = (level: number): string => {
    if (level >= 50) return 'Lenda dos Concursos';
    if (level >= 30) return 'Mestre da Lei';
    if (level >= 20) return 'Guardião da Lei';
    if (level >= 10) return 'Estudante Dedicado';
    if (level >= 5) return 'Aprendiz Focado';
    return 'Novato';
  };

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
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {userEmail && (
              <p className="text-gray-400 text-sm flex items-center mt-1">
                <Mail size={12} className="mr-1" />
                {userEmail}
              </p>
            )}
            <div className="flex items-center mt-2 space-x-2">
                <span className="text-[#FFB800] text-sm font-bold bg-[#FFB800]/10 px-3 py-1 rounded-full border border-[#FFB800]/20">
                    {getTitleByLevel(userLevel)}
                </span>
                <span className="text-gray-500 text-sm">Entrou em {createdAt}</span>
            </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="px-4 mb-8">
        <div className="bg-[#252525] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">Nível {userLevel}</span>
                <span className="text-xs text-gray-400">{userXp} / {xpForNextLevel} XP</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-gradient-to-r from-[#FFB800] to-yellow-500 rounded-full shadow-[0_0_10px_#FFB800]"
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <p className="text-xs text-center text-gray-500">
                Faltam <span className="text-white font-bold">{xpForNextLevel - userXp} XP</span> para o próximo nível
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
                <span className="text-2xl font-bold text-white">{userStreak}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Dias Seguidos</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Trophy size={24} className="mb-2 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {userRankPosition ? `#${userRankPosition}` : '-'}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">{leagueInfo.name}</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Target size={24} className="mb-2 text-[#2ECC71]" />
                <span className="text-2xl font-bold text-white">{accuracy}%</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Precisão</span>
            </div>
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                <Clock size={24} className="mb-2 text-blue-400" />
                <span className="text-2xl font-bold text-white">{totalAnswered}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Questões</span>
            </div>
        </div>
      </div>

      {/* Ranking / League */}
      <div className="px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
                <Trophy className="mr-2 text-[#FFB800]" size={20} />
                Ranking Semanal - {leagueInfo.icon} {leagueInfo.name}
            </h2>
        </div>
        <div className="bg-[#252525] rounded-2xl border border-gray-800 overflow-hidden">
            {isLoadingRanking ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
                <p className="text-gray-500 text-sm mt-2">Carregando ranking...</p>
              </div>
            ) : ranking.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-500 text-sm">Nenhum competidor na liga ainda.</p>
                <p className="text-gray-600 text-xs mt-1">Seja o primeiro a ganhar XP esta semana!</p>
              </div>
            ) : (
              ranking.map((rankUser) => (
                <div
                    key={rankUser.user_id}
                    className={`flex items-center justify-between p-4 border-b border-gray-800 last:border-0 ${rankUser.isCurrentUser ? 'bg-[#FFB800]/10' : ''}`}
                >
                    <div className="flex items-center space-x-3">
                        <span className={`font-bold w-6 text-center ${rankUser.rank <= 3 ? 'text-[#FFB800]' : 'text-gray-500'}`}>
                            {rankUser.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                          {rankUser.avatar_url ? (
                            <img src={rankUser.avatar_url} alt={rankUser.name} className="w-full h-full object-cover" />
                          ) : (
                            rankUser.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${rankUser.isCurrentUser ? 'text-[#FFB800]' : 'text-white'}`}>
                                {rankUser.name} {rankUser.isCurrentUser && '(Você)'}
                            </p>
                            <p className="text-xs text-gray-500">{rankUser.xp_earned} XP esta semana</p>
                        </div>
                    </div>
                    <div>
                        {rankUser.rank <= 3 && <ChevronUp size={16} className="text-green-500" />}
                        {rankUser.rank > 3 && rankUser.rank <= 7 && <Minus size={16} className="text-gray-600" />}
                        {rankUser.rank > 7 && <ChevronDown size={16} className="text-red-500" />}
                    </div>
                </div>
              ))
            )}
        </div>
        {ranking.length > 0 && (
          <p className="text-xs text-gray-600 text-center mt-2">
            Top 3 sobem de liga no fim da semana
          </p>
        )}
      </div>

      {/* Achievements */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center">
            <Award className="mr-2 text-[#FFB800]" size={20} />
            Conquistas
        </h2>
        {isLoadingAchievements ? (
          <div className="text-center py-4">
            <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
          </div>
        ) : achievements.length === 0 ? (
          <div className="bg-[#252525] rounded-xl p-6 text-center border border-gray-800">
            <Award className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="text-gray-500 text-sm">Nenhuma conquista disponível ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
              {achievements.slice(0, 8).map(ach => (
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
        )}
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

        {/* Guia do Concurseiro */}
        <button
            onClick={onOpenGuide}
            className="w-full bg-gradient-to-r from-[#FFB800]/10 to-[#FFB800]/5 p-4 rounded-xl flex items-center justify-between text-[#FFB800] hover:from-[#FFB800]/20 hover:to-[#FFB800]/10 transition-colors border border-[#FFB800]/30"
        >
            <div className="flex items-center">
                <HelpCircle size={18} className="mr-3 text-[#FFB800]" />
                <span className="font-medium text-sm">Guia do Concurseiro</span>
            </div>
            <span className="text-[10px] bg-[#FFB800] text-black px-2 py-0.5 rounded-full font-bold">NOVO</span>
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

      <div className="mt-8 text-center pb-8">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-sm text-red-500 font-bold hover:text-red-400 p-3 flex items-center justify-center mx-auto space-x-2 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-700 mt-2">Versão 1.0.8 Beta</p>
      </div>
    </div>
  );
};

export default ProfileView;
