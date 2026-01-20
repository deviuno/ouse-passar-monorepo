import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map,
  Target,
  FileText,
  BarChart2,
  User,
  LogOut,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Lock,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { useAuthStore, useUserStore, useUIStore, useNotificationStore, useTrailStore, useBatteryStore } from '../../stores';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_FOR_LIGHT_THEME, LOGO_FOR_DARK_THEME } from '../../constants';
import { CircularProgress } from '../ui/Progress';
import { calculateXPProgress } from '../../constants/levelConfig';
import { NotificationPopover } from './NotificationPopover';
import { BatteryIndicator } from '../battery/BatteryIndicator';
import { BatteryEmptyModal } from '../battery/BatteryEmptyModal';
import { BatteryInfoModal } from '../battery/BatteryInfoModal';
import { ModuleBlockedModal } from '../ui/ModuleBlockedModal';
import { useModuleAccess, getModuleFromPath } from '../../hooks/useModuleAccess';
import { ModuleName } from '../../stores/useModuleSettingsStore';

const mainNavItems = [
  { path: '/', icon: Map, label: 'Minhas Trilhas', tourId: 'sidebar-trilha' },
  { path: '/questoes', icon: Target, label: 'Ouse Questões', tourId: 'sidebar-praticar' },
  { path: '/simulados', icon: FileText, label: 'Meus Simulados', tourId: 'sidebar-simulados' },
  { path: '/cursos', icon: BookOpen, label: 'Meus Cursos', tourId: 'sidebar-cursos' },
  { path: '/music', icon: Headphones, label: 'Ouse Music', tourId: 'sidebar-music' },
  { path: '/estatisticas', icon: BarChart2, label: 'Estatísticas', tourId: 'sidebar-raiox' },
];

const bottomNavItems = [
  { path: '/perfil', icon: User, label: 'Perfil' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
];

interface SidebarProps {
  isCollapsed?: boolean;
}

// Module name labels for the blocked modal
const MODULE_LABELS: Record<ModuleName, string> = {
  trilha: 'Minhas Trilhas',
  praticar: 'Ouse Questões',
  simulados: 'Meus Simulados',
  estatisticas: 'Estatísticas',
  loja: 'Loja',
  music: 'Ouse Music',
};

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const { stats } = useUserStore();
  const { notifications } = useNotificationStore();
  const { toggleSidebar } = useUIStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { selectedPreparatorioId, getSelectedPreparatorio } = useTrailStore();
  const selectedPrep = getSelectedPreparatorio();
  const {
    batteryStatus,
    isEmptyModalOpen,
    fetchBatteryStatus,
    closeEmptyModal,
  } = useBatteryStore();
  const moduleAccess = useModuleAccess();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isBatteryInfoOpen, setIsBatteryInfoOpen] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedModuleName, setBlockedModuleName] = useState<string>('');
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
      <div className="h-14 px-3 flex items-center justify-between border-b border-[var(--color-border)] theme-transition">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-full flex justify-center p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
            title="Expandir menu"
          >
            <ChevronRight size={18} className="text-[var(--color-text-sec)]" />
          </button>
        ) : (
          <>
            <img src={isDarkMode ? LOGO_FOR_DARK_THEME : LOGO_FOR_LIGHT_THEME} alt="Ouse Passar" className="h-7 object-contain" />
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
              title="Retrair menu"
            >
              <ChevronLeft size={18} className="text-[var(--color-text-sec)]" />
            </button>
          </>
        )}
      </div>

      {/* User Info */}
      <div className={`border-b border-[var(--color-border)] theme-transition ${isCollapsed ? 'p-3' : 'p-3.5'}`}>
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
                  <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
                    <User size={isCollapsed ? 14 : 16} className="text-[var(--color-text-sec)]" />
                  </div>
                )}
              </div>
            </CircularProgress>
            <div className="absolute inset-0 rounded-full bg-[var(--color-brand)]/0 group-hover:bg-[var(--color-brand)]/10 transition-colors" />
          </button>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[var(--color-text-main)] font-medium truncate text-sm">
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
                    className={`relative transition-colors p-1 rounded-lg ${isNotificationsOpen ? 'text-[var(--color-brand)] bg-[var(--color-brand)]/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-bg-elevated)]'}`}
                    title="Notificações"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-[var(--color-bg-main)]">
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
              <p className="text-[var(--color-text-sec)] text-[11px] -mt-0.5">
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
              onClick={() => setIsBatteryInfoOpen(true)}
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
              onClick={() => setIsBatteryInfoOpen(true)}
            />
          </div>
        )}

        {/* Stats Row - Only show when expanded */}
        {!isCollapsed && (
          <div className="flex items-center justify-between mt-3 text-sm max-w-[170px]">
            <div className="flex items-center gap-1">
              <span className="text-xl">🔥</span>
              <span className="text-[var(--color-text-main)] font-medium">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl">💰</span>
              <span className="text-[var(--color-brand)] font-medium">{stats.coins}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl">⭐</span>
              <span className="text-[var(--color-text-main)] font-medium">{stats.correctAnswers}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname === '/trilha') ||
              (item.path === '/questoes' && ['/questoes', '/praticar', '/cadernos'].includes(location.pathname));
            const Icon = item.icon;

            // Get module access config for this nav item
            const moduleName = getModuleFromPath(item.path);
            const moduleConfig = moduleName ? moduleAccess[moduleName] : null;
            const isBlocked = moduleConfig && !moduleConfig.enabled && !moduleAccess.hasFullAccess;
            const blockBehavior = moduleConfig?.blockBehavior || 'disabled';

            // If hidden and blocked, don't render
            if (isBlocked && blockBehavior === 'hidden') {
              return null;
            }

            // Handle blocked item click
            const handleBlockedClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (blockBehavior === 'modal' && moduleName) {
                setBlockedModuleName(MODULE_LABELS[moduleName]);
                setBlockedModalOpen(true);
              }
              // For 'disabled', do nothing (item is not clickable)
            };

            // Render disabled item
            if (isBlocked && blockBehavior === 'disabled') {
              return (
                <li key={item.path}>
                  <div
                    title={isCollapsed ? `${item.label} (Indisponível)` : 'Módulo indisponível'}
                    data-tour={item.tourId}
                    className={`
                      relative flex items-center rounded-xl
                      cursor-not-allowed opacity-50
                      ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
                      text-[var(--color-text-muted)]
                    `}
                  >
                    <div className="relative">
                      <Icon size={20} />
                      <Lock size={10} className="absolute -bottom-1 -right-1 text-[var(--color-text-muted)]" />
                    </div>
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </li>
              );
            }

            // Render item with modal behavior when blocked
            if (isBlocked && blockBehavior === 'modal') {
              return (
                <li key={item.path}>
                  <button
                    onClick={handleBlockedClick}
                    title={isCollapsed ? item.label : undefined}
                    data-tour={item.tourId}
                    className={`
                      relative flex items-center rounded-xl w-full
                      transition-colors duration-200
                      ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
                      text-[var(--color-text-sec)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-main)]
                    `}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            }

            // Normal nav item (not blocked)
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
                      ? 'bg-[var(--color-bg-elevated)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-sec)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-main)]'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ffac00] rounded-r-full"
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
      <div className="p-3 border-t border-[var(--color-border)] space-y-1 theme-transition">
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
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-main)]'
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
            text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors
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
        checkoutUrl={selectedPrep?.preparatorio?.checkout_ouse_questoes}
        price={selectedPrep?.preparatorio?.price_questoes}
        preparatorioNome={selectedPrep?.preparatorio?.nome}
      />

      {/* Battery Info Modal - Opens when clicking on battery indicator */}
      <BatteryInfoModal
        isOpen={isBatteryInfoOpen}
        onClose={() => setIsBatteryInfoOpen(false)}
        currentBattery={batteryStatus?.battery_current || 0}
        maxBattery={batteryStatus?.battery_max || 100}
        isPremium={isPremium}
        checkoutUrl={selectedPrep?.preparatorio?.checkout_ouse_questoes}
        price={selectedPrep?.preparatorio?.price_questoes}
        preparatorioNome={selectedPrep?.preparatorio?.nome}
      />

      {/* Module Blocked Modal - Opens when clicking on a blocked module with modal behavior */}
      <ModuleBlockedModal
        isOpen={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        moduleName={blockedModuleName}
      />
    </div>
  );
}

export default Sidebar;
