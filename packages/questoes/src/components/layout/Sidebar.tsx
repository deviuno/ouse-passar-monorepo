import React, { useEffect } from 'react';
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
  Bell,
} from 'lucide-react';
import { useAuthStore, useUserStore, useUIStore, useNotificationStore, useTrailStore, useBatteryStore } from '../../stores';
import { LOGO_URL } from '../../constants';
import { CircularProgress } from '../ui/Progress';
import { calculateXPProgress } from '../../constants/levelConfig';
import { NotificationPopover } from './NotificationPopover';
import { BatteryIndicator } from '../battery/BatteryIndicator';
import { BatteryEmptyModal } from '../battery/BatteryEmptyModal';

const mainNavItems = [
  { path: '/', icon: Map, label: 'Minhas Trilhas', tourId: 'sidebar-trilha' },
  { path: '/praticar', icon: Target, label: 'Praticar Questões', tourId: 'sidebar-praticar' },
  { path: '/simulados', icon: FileText, label: 'Meus Simulados', tourId: 'sidebar-simulados' },
  { path: '/estatisticas', icon: BarChart2, label: 'Estatísticas', tourId: 'sidebar-raiox' },
  { path: '/loja', icon: ShoppingBag, label: 'Loja', tourId: 'sidebar-loja' },
];

const bottomNavItems = [
  { path: '/perfil', icon: User, label: 'Perfil' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const { stats } = useUserStore();
  const { notifications } = useNotificationStore();
  const { toggleSidebar } = useUIStore();
  const { selectedPreparatorioId, getSelectedPreparatorio } = useTrailStore();
  const selectedPrep = getSelectedPreparatorio();
  const {
    batteryStatus,
    isEmptyModalOpen,
    fetchBatteryStatus,
    closeEmptyModal,
  } = useBatteryStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  const notificationButtonRef = React.useRef<HTMLButtonElement>(null);
  const xpProgress = calculateXPProgress(stats.xp);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch battery status when preparatório changes
  // Use the actual preparatorio_id, not the user_trail id (selectedPreparatorioId)
  useEffect(() => {
    if (user?.id && selectedPrep?.preparatorio_id) {
      fetchBatteryStatus(user.id, selectedPrep.preparatorio_id);
    }
  }, [user?.id, selectedPrep?.preparatorio_id, fetchBatteryStatus]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Battery props
  const showBattery = !!selectedPreparatorioId && batteryStatus;
  const isPremium = batteryStatus?.is_premium || batteryStatus?.has_unlimited_battery;

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
      <div className={`border-b border-[#3A3A3A] ${isCollapsed ? 'p-3' : 'p-3.5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          {/* Profile Photo with Progress Ring */}
          <button
            onClick={() => navigate('/perfil')}
            className="relative group flex-shrink-0"
            title={isCollapsed ? `${profile?.name || 'Estudante'} - ${stats.xp} XP` : undefined}
          >
            <CircularProgress
              value={xpProgress.percentage}
              size={isCollapsed ? 38 : 44}
              strokeWidth={2}
              color="brand"
              showLabel={false}
            >
              <div className={`rounded-full overflow-hidden ${isCollapsed ? 'w-7 h-7' : 'w-8 h-8'}`}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#3A3A3A] flex items-center justify-center">
                    <User size={isCollapsed ? 14 : 16} className="text-[#A0A0A0]" />
                  </div>
                )}
              </div>
            </CircularProgress>
            <div className="absolute inset-0 rounded-full bg-[#FFB800]/0 group-hover:bg-[#FFB800]/10 transition-colors" />
          </button>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-white font-medium truncate text-sm">
                  {profile?.name || 'Estudante'}
                </p>
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={() => {
                      if (notificationButtonRef.current) {
                        setTriggerRect(notificationButtonRef.current.getBoundingClientRect());
                      }
                      setIsNotificationsOpen(!isNotificationsOpen);
                    }}
                    className={`relative transition-colors p-1 rounded-lg ${isNotificationsOpen ? 'text-[#FFB800] bg-[#FFB800]/10' : 'text-[#6E6E6E] hover:text-[#FFB800] hover:bg-[#3A3A3A]'}`}
                    title="Notificações"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-[#1A1A1A]">
                        {Math.min(unreadCount, 9)}
                      </span>
                    )}
                  </button>

                  <NotificationPopover
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    triggerRect={triggerRect}
                  />
                </div>
              </div>
              <p className="text-[#A0A0A0] text-[11px] -mt-0.5">
                {stats.xp} XP
              </p>
            </div>
          )}
        </div>

        {/* Battery Indicator - Only show when preparatório is selected */}
        {showBattery && !isCollapsed && (
          <div className="mt-3">
            <BatteryIndicator
              current={batteryStatus.battery_current}
              max={batteryStatus.battery_max}
              isPremium={isPremium}
              compact={false}
            />
          </div>
        )}
        {showBattery && isCollapsed && (
          <div className="mt-2 flex justify-center">
            <BatteryIndicator
              current={batteryStatus.battery_current}
              max={batteryStatus.battery_max}
              isPremium={isPremium}
              compact={true}
            />
          </div>
        )}

        {/* Stats Row - Only show when expanded */}
        {!isCollapsed && (
          <div className="flex items-center justify-between mt-3 text-sm max-w-[170px]">
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
                  data-tour={item.tourId}
                  className={`
                    relative flex items-center rounded-xl
                    transition-colors duration-200
                    ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-black/50 text-[#FFB800]'
                      : 'text-[#A0A0A0] hover:bg-[#3A3A3A] hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFB800] rounded-r-full"
                      initial={{ opacity: 0, scale: 0.8, y: '-50%' }}
                      animate={{ opacity: 1, scale: 1, y: '-50%' }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon size={20} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation - Perfil, Ajuda, Sair */}
      <div className="p-3 border-t border-[#3A3A3A] space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
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
          );
        })}

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

      {/* Battery Empty Modal */}
      <BatteryEmptyModal
        isOpen={isEmptyModalOpen}
        onClose={closeEmptyModal}
        checkoutUrl={selectedPrep?.preparatorio?.checkout_8_questoes}
        price={selectedPrep?.preparatorio?.price_questoes}
        preparatorioNome={selectedPrep?.preparatorio?.nome}
      />
    </div>
  );
}

export default Sidebar;
