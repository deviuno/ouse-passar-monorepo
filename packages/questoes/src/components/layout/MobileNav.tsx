import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Target, FileText, BarChart2, ShoppingBag } from 'lucide-react';

const navItems = [
  { path: '/', icon: Map, label: 'Trilha', tourId: 'nav-trilha' },
  { path: '/praticar', icon: Target, label: 'Praticar', tourId: 'nav-praticar' },
  { path: '/simulados', icon: FileText, label: 'Simulados', tourId: 'nav-simulados' },
  { path: '/estatisticas', icon: BarChart2, label: 'Raio-X', tourId: 'nav-raiox' },
  { path: '/loja', icon: ShoppingBag, label: 'Loja', tourId: 'nav-loja' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#252525] border-t border-[#3A3A3A] z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/trilha');
          const Icon = item.icon;

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
                  className="absolute -top-1 w-12 h-1 bg-[#FFB800] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-[#FFB800]' : 'text-[#6E6E6E]'
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
  );
}

export default MobileNav;
