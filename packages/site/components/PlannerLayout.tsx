import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Target,
  FileText,
  Menu as MenuIcon,
  ChevronRight,
  Gauge,
  User,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Verificar se o usuário está autenticado
const isAuthenticated = (): boolean => {
  const studentUser = localStorage.getItem('ouse_student_user');
  const adminUser = localStorage.getItem('ouse_admin_user');
  return !!(studentUser || adminUser);
};

interface Planejamento {
  id: string;
  nome_aluno: string;
  hora_acordar: string | null;
  hora_dormir: string | null;
  preparatorio_id: string | null;
}

// Chave localStorage para rastrear se o calendário foi configurado
const getCalendarConfiguredKey = (planejamentoId: string) => `ouse_calendar_configured_${planejamentoId}`;

export const PlannerLayout: React.FC = () => {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Verificar autenticação ao montar e ao voltar do cache do navegador
  const checkAuth = useCallback(() => {
    if (!isAuthenticated()) {
      // Redirecionar para login do plano se estiver nas rotas /plano/*
      if (location.pathname.startsWith('/plano')) {
        window.location.href = '/plano/login';
      } else {
        window.location.href = '/login';
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    // Verificar na montagem
    checkAuth();

    // Verificar quando o usuário volta usando o botão voltar do navegador
    // O evento 'pageshow' é disparado mesmo quando a página vem do bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Página veio do bfcache (botão voltar)
        checkAuth();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkAuth]);

  // Verificar se estamos no contexto /plano/*
  const isPlanoContext = location.pathname.startsWith('/plano');

  // Determinar página ativa baseado na URL
  const getActiveRoute = () => {
    // Novas rotas /plano/*
    if (isPlanoContext) {
      if (location.pathname.endsWith('/performance')) return 'cockpit';
      if (location.pathname.endsWith('/calendario')) return 'calendario';
      if (location.pathname.endsWith('/edital')) return 'edital';
      if (location.pathname.endsWith('/perfil')) return 'perfil';
      // Rota base /plano/:slug/:id = missões
      const parts = location.pathname.split('/').filter(Boolean);
      if (parts.length === 3) return 'missoes';
      return '';
    }
    // Rotas legadas
    if (location.pathname.includes('/planner/')) return 'cockpit';
    if (location.pathname.includes('/planejador-semanal/')) return 'calendario';
    if (location.pathname.includes('/planejamento/') && !location.pathname.includes('/edital')) return 'missoes';
    if (location.pathname.includes('/edital-verticalizado/')) return 'edital';
    if (location.pathname.includes('/perfil/')) return 'perfil';
    return '';
  };

  const activeRoute = getActiveRoute();

  // Gerar paths baseado no contexto (novas ou legadas)
  const getNavPath = (route: string) => {
    if (isPlanoContext) {
      switch (route) {
        case 'cockpit': return `/plano/${slug}/${id}/performance`;
        case 'calendario': return `/plano/${slug}/${id}/calendario`;
        case 'missoes': return `/plano/${slug}/${id}`;
        case 'edital': return `/plano/${slug}/${id}/edital`;
        case 'perfil': return `/plano/${slug}/${id}/perfil`;
        default: return `/plano/${slug}/${id}`;
      }
    }
    // Rotas legadas
    switch (route) {
      case 'cockpit': return `/planner/${slug}/${id}`;
      case 'calendario': return `/planejador-semanal/${slug}/${id}`;
      case 'missoes': return `/planejamento/${slug}/${id}`;
      case 'edital': return `/edital-verticalizado/${slug}/${id}`;
      case 'perfil': return `/perfil/${slug}/${id}`;
      default: return `/planejamento/${slug}/${id}`;
    }
  };

  // Marcar calendário como visitado quando o usuário está na página do calendário
  useEffect(() => {
    if (id && activeRoute === 'calendario') {
      localStorage.setItem(getCalendarConfiguredKey(id), 'true');
    }
  }, [id, activeRoute]);

  // Verificar se deve redirecionar para o calendário no primeiro acesso
  useEffect(() => {
    if (!id || !slug || redirectChecked) return;

    const calendarConfigured = localStorage.getItem(getCalendarConfiguredKey(id));

    // Se está tentando acessar cockpit, missões ou edital mas calendário não foi configurado
    // Redirecionar para calendário
    if (!calendarConfigured && ['cockpit', 'missoes', 'edital'].includes(activeRoute)) {
      navigate(getNavPath('calendario'), { replace: true });
    }

    setRedirectChecked(true);
  }, [id, slug, activeRoute, navigate, redirectChecked, isPlanoContext]);

  const navLinks = [
    { id: 'cockpit', label: 'Cockpit', path: getNavPath('cockpit'), icon: Gauge },
    { id: 'calendario', label: 'Calendário', path: getNavPath('calendario'), icon: Calendar },
    { id: 'missoes', label: 'Missões', path: getNavPath('missoes'), icon: Target },
    { id: 'edital', label: 'Edital', path: getNavPath('edital'), icon: FileText },
  ];

  // Buscar dados do planejamento quando mudar de página ou id
  useEffect(() => {
    const fetchPlanejamento = async () => {
      if (!id) return;

      try {
        const { data } = await supabase
          .from('planejamentos')
          .select('id, nome_aluno, hora_acordar, hora_dormir, preparatorio_id')
          .eq('id', id)
          .single();

        if (data) {
          setPlanejamento(data);
        }
      } catch (error) {
        console.error('Erro ao carregar planejamento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanejamento();
  }, [id, location.pathname]); // Recarrega ao mudar de página para pegar atualizações

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Header Fixo Compartilhado */}
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Nome do Aluno */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-brand-yellow font-black text-lg uppercase tracking-tight">
                  {planejamento?.nome_aluno}
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = activeRoute === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                      isActive
                        ? 'text-brand-yellow bg-brand-yellow/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Botão Perfil (desktop) */}
            <button
              onClick={() => navigate(getNavPath('perfil'))}
              className={`hidden md:flex items-center justify-center w-9 h-9 border border-white/10 rounded-lg transition-all ${
                activeRoute === 'perfil'
                  ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Perfil"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-brand-yellow focus:outline-none p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-brand-card border-b border-white/10"
            >
              <div className="px-4 pt-2 pb-4 space-y-1">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const isActive = activeRoute === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => navigate(link.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all ${
                        isActive
                          ? 'border-brand-yellow text-brand-yellow bg-white/5'
                          : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {link.label}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
                {/* Perfil no mobile */}
                <button
                  onClick={() => navigate(getNavPath('perfil'))}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all ${
                    activeRoute === 'perfil'
                      ? 'border-brand-yellow text-brand-yellow bg-white/5'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Perfil
                  {activeRoute === 'perfil' && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Conteúdo da Página - Outlet renderiza a página filha */}
      <Outlet context={{ planejamento, slug, id }} />
    </div>
  );
};

// Hook para acessar o contexto do layout nas páginas filhas
export const usePlannerContext = () => {
  const context = React.useContext(React.createContext<{
    planejamento: Planejamento | null;
    slug: string;
    id: string;
  } | null>(null));
  return context;
};
