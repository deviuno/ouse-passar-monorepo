import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Target, FileText, BarChart2, Headphones, User, Lock } from 'lucide-react';
import { ModuleBlockedModal } from '../ui/ModuleBlockedModal';
import { useModuleAccess, getModuleFromPath } from '../../hooks/useModuleAccess';
import { ModuleName } from '../../stores/useModuleSettingsStore';

const navItems = [
  { path: '/', icon: Map, label: 'Trilha', tourId: 'nav-trilha' },
  { path: '/questoes', icon: Target, label: 'Questões', tourId: 'nav-praticar' },
  { path: '/simulados', icon: FileText, label: 'Simulados', tourId: 'nav-simulados' },
  { path: '/estatisticas', icon: BarChart2, label: 'Raio-X', tourId: 'nav-raiox' },
  { path: '/perfil', icon: User, label: 'Perfil', tourId: 'nav-perfil' },
];

// Module name labels for the blocked modal
const MODULE_LABELS: Record<ModuleName, string> = {
  trilha: 'Minhas Trilhas',
  praticar: 'Ouse Questões',
  simulados: 'Meus Simulados',
  estatisticas: 'Estatísticas',
  loja: 'Loja',
  music: 'Ouse Music',
};

export function MobileNav() {
  const location = useLocation();
  const moduleAccess = useModuleAccess();
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedModuleName, setBlockedModuleName] = useState<string>('');

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] z-50 theme-transition">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
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
                <div
                  key={item.path}
                  data-tour={item.tourId}
                  className="relative flex flex-col items-center justify-center w-16 h-full cursor-not-allowed opacity-50"
                >
                  <div className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]">
                    <div className="relative">
                      <Icon size={22} />
                      <Lock size={8} className="absolute -bottom-0.5 -right-0.5 text-[var(--color-text-muted)]" />
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                </div>
              );
            }

            // Render item with modal behavior when blocked
            if (isBlocked && blockBehavior === 'modal') {
              return (
                <button
                  key={item.path}
                  onClick={handleBlockedClick}
                  data-tour={item.tourId}
                  className="relative flex flex-col items-center justify-center w-16 h-full"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]"
                  >
                    <Icon size={22} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </motion.div>
                </button>
              );
            }

            // Normal nav item (not blocked)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-tour={item.tourId}
                className="relative flex flex-col items-center justify-center w-16 h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 w-12 h-1 bg-[#ffac00] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Module Blocked Modal */}
      <ModuleBlockedModal
        isOpen={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        moduleName={blockedModuleName}
      />
    </>
  );
}

export default MobileNav;
