import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map,
  Target,
  FileText,
  BarChart2,
  ShoppingBag,
  User,
  LogOut,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore, useUserStore, useUIStore } from '../../stores';
import { LOGO_URL } from '../../constants';
import { CircularProgress } from '../ui/Progress';
import { calculateXPProgress } from '../../constants/levelConfig';

const mainNavItems = [
  { path: '/', icon: Map, label: 'Minhas Trilhas' },
  { path: '/praticar', icon: Target, label: 'Praticar Questoes' },
  { path: '/simulados', icon: FileText, label: 'Meus Simulados' },
  { path: '/estatisticas', icon: BarChart2, label: 'Estatisticas' },
  { path: '/loja', icon: ShoppingBag, label: 'Loja' },
];

const secondaryNavItems = [
  { path: '/perfil', icon: User, label: 'Perfil' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const { stats } = useUserStore();
  const { toggleSidebar } = useUIStore();
  const xpProgress = calculateXPProgress(stats.xp);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Logo + Collapse */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#3A3A3A]">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-full flex justify-center p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors"
            title="Expandir menu"
          >
            <ChevronRight size={18} className="text-[#A0A0A0]" />
          </button>
        ) : (
          <>
            <img src={LOGO_URL} alt="Ouse Passar" className="h-7 object-contain" />
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-[#3A3A3A] transition-colors"
              title="Retrair menu"
            >
              <ChevronLeft size={18} className="text-[#A0A0A0]" />
            </button>
          </>
        )}
      </div>

      {/* User Info */}
      <div className={`border-b border-[#3A3A3A] ${isCollapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {/* Profile Photo with Progress Ring */}
          <button
            onClick={() => navigate('/perfil')}
            className="relative group flex-shrink-0"
            title={isCollapsed ? `${profile?.name || 'Estudante'} - ${stats.xp} XP` : undefined}
          >
            <CircularProgress
              value={xpProgress.percentage}
              size={isCollapsed ? 44 : 50}
              strokeWidth={4}
              color="brand"
              showLabel={false}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className={`rounded-full object-cover ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}
                />
              ) : (
                <div className={`rounded-full bg-[#3A3A3A] flex items-center justify-center ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
                  <User size={isCollapsed ? 16 : 18} className="text-[#A0A0A0]" />
                </div>
              )}
            </CircularProgress>
            <div className="absolute inset-0 rounded-full bg-[#FFB800]/0 group-hover:bg-[#FFB800]/10 transition-colors" />
          </button>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {profile?.name || 'Estudante'}
                </p>
                <p className="text-[#A0A0A0] text-sm">
                  {stats.xp} XP
                </p>
              </div>
            </>
          )}
        </div>

        {/* Stats Row - Only show when expanded */}
        {!isCollapsed && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-xl">🔥</span>
              <span className="text-white font-medium">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl">💰</span>
              <span className="text-[#FFB800] font-medium">{stats.coins}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl">⭐</span>
              <span className="text-white font-medium">{stats.correctAnswers}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname === '/trilha');
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    relative flex items-center rounded-xl
                    transition-colors duration-200
                    ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-[#FFB800]/10 text-[#FFB800]'
                      : 'text-[#A0A0A0] hover:bg-[#3A3A3A] hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarItem"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFB800] rounded-r-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={20} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="h-px bg-[#3A3A3A] my-4" />

        {/* Secondary Navigation */}
        <ul className="space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    flex items-center rounded-xl
                    transition-colors duration-200
                    ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-[#3A3A3A] text-white'
                      : 'text-[#6E6E6E] hover:bg-[#3A3A3A] hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-[#3A3A3A]">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sair' : undefined}
          className={`
            flex items-center w-full rounded-xl
            text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-colors
            ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
          `}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
