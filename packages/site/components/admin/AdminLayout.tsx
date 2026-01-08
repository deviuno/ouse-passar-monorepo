import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, BookOpen, User, ChevronDown, GraduationCap, ClipboardList, UserCheck, Plus, ShoppingCart, Package, Tag, LifeBuoy, Ticket, Flag, Sparkles, PlayCircle, FolderOpen, Layers } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isVendedor } = useAuth();
    const [blogOpen, setBlogOpen] = useState(false);
    const [lojaOpen, setLojaOpen] = useState(false);
    const [planejamentosOpen, setPlanejamentosOpen] = useState(false);
    const [suporteOpen, setSuporteOpen] = useState(false);
    const [academyOpen, setAcademyOpen] = useState(false);
    const [pendingReportsCount, setPendingReportsCount] = useState(0);
    const [pendingTicketsCount, setPendingTicketsCount] = useState(0);

    // Buscar contagem de reports e tickets pendentes
    const fetchPendingCounts = async () => {
        // Reports pendentes
        const { count: reportsCount } = await supabase
            .from('question_reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente');

        if (reportsCount !== null) {
            setPendingReportsCount(reportsCount);
        }

        // Tickets abertos
        const { count: ticketsCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('status', ['aberto', 'em_andamento']);

        if (ticketsCount !== null) {
            setPendingTicketsCount(ticketsCount);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;

        fetchPendingCounts();

        // Atualizar a cada 60 segundos
        const interval = setInterval(fetchPendingCounts, 60000);

        // Escutar eventos customizados para atualizar contadores
        const handleUpdate = () => {
            fetchPendingCounts();
        };
        window.addEventListener('reports-updated', handleUpdate);
        window.addEventListener('tickets-updated', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reports-updated', handleUpdate);
            window.removeEventListener('tickets-updated', handleUpdate);
        };
    }, [isAdmin]);

    // Abrir automaticamente os menus se estiver em uma subpágina
    useEffect(() => {
        if (location.pathname.includes('/admin/suporte')) {
            setSuporteOpen(true);
        }
        if (location.pathname.includes('/admin/academy')) {
            setAcademyOpen(true);
        }
    }, [location.pathname]);

    const isActive = (path: string, exactMatch: boolean = true) => {
        const isMatch = exactMatch
            ? location.pathname === path
            : location.pathname.startsWith(path);
        return isMatch ? 'bg-brand-yellow text-brand-darker' : 'text-gray-400 hover:text-white hover:bg-white/5';
    };

    return (
        <div className="min-h-screen bg-brand-dark flex">
            {/* Sidebar */}
            <aside className="w-64 bg-brand-card border-r border-white/5 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-white/5">
                    <img
                        src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
                        alt="Ouse Passar"
                        className="h-10"
                    />
                    {/* Card de perfil apenas para vendedores */}
                    {isVendedor && !isAdmin && (
                        <Link
                            to="/admin/profile"
                            className="block bg-brand-dark/50 border border-white/5 p-4 rounded-sm hover:border-brand-yellow/30 transition-colors cursor-pointer mt-4"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-brand-yellow/30">
                                    {user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-brand-yellow/20 flex items-center justify-center">
                                            <User className="w-8 h-8 text-brand-yellow" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-sm font-bold text-center truncate w-full">{user?.name}</p>
                                <span className="mt-2 text-[10px] bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded-full uppercase font-bold tracking-wide">
                                    Vendedor
                                </span>
                            </div>
                        </Link>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Dashboard - Admin only */}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin')}`}
                        >
                            <LayoutDashboard className="w-5 h-5 mr-3" />
                            Dashboard
                        </Link>
                    )}

                    {/* Planejamentos Accordion - Admin and Vendedor */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setPlanejamentosOpen(!planejamentosOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname.includes('/admin/planejamentos') || location.pathname.includes('/admin/leads') ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center">
                                <ClipboardList className="w-5 h-5 mr-3" />
                                Planejamentos
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${planejamentosOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {planejamentosOpen && (
                            <div className="pl-4 space-y-1 bg-black/20 py-2 rounded-sm">
                                {/* Gerar Novo - Admin e Vendedor */}
                                <Link
                                    to="/admin/planejamentos"
                                    className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/planejamentos')}`}
                                >
                                    <Plus className="w-4 h-4 mr-3" />
                                    Gerar Novo
                                </Link>

                                {/* Alunos - Admin e Vendedor */}
                                <Link
                                    to="/admin/leads"
                                    className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/leads')}`}
                                >
                                    <UserCheck className="w-4 h-4 mr-3" />
                                    Alunos
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Admin-only sections */}
                    {isAdmin && (
                        <>
                            {/* Usuários */}
                            <Link
                                to="/admin/users"
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/users', false)}`}
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Usuários
                            </Link>

                            {/* Blog Accordion */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setBlogOpen(!blogOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname.includes('/admin/articles') || location.pathname.includes('/admin/categories') || location.pathname.includes('/admin/authors') ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center">
                                        <BookOpen className="w-5 h-5 mr-3" />
                                        Blog
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${blogOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {blogOpen && (
                                    <div className="pl-4 space-y-1 bg-black/20 py-2 rounded-sm">
                                        <Link
                                            to="/admin/articles"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/articles')}`}
                                        >
                                            <FileText className="w-4 h-4 mr-3" />
                                            Artigos
                                        </Link>

                                        <Link
                                            to="/admin/categories"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/categories')}`}
                                        >
                                            <BookOpen className="w-4 h-4 mr-3" />
                                            Categorias
                                        </Link>

                                        <Link
                                            to="/admin/authors"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/authors')}`}
                                        >
                                            <Users className="w-4 h-4 mr-3" />
                                            Autores
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Preparatórios */}
                            <Link
                                to="/admin/preparatorios"
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/preparatorios')}`}
                            >
                                <GraduationCap className="w-5 h-5 mr-3" />
                                Preparatórios
                            </Link>

                            {/* Gerar Questões */}
                            <Link
                                to="/admin/gerar-questoes"
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/gerar-questoes')}`}
                            >
                                <Sparkles className="w-5 h-5 mr-3" />
                                Gerar Questões
                            </Link>

                            {/* Academy Accordion */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setAcademyOpen(!academyOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname.includes('/admin/academy') ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center">
                                        <PlayCircle className="w-5 h-5 mr-3" />
                                        Academy
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${academyOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {academyOpen && (
                                    <div className="pl-4 space-y-1 bg-black/20 py-2 rounded-sm">
                                        <Link
                                            to="/admin/academy"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/academy')}`}
                                        >
                                            <LayoutDashboard className="w-4 h-4 mr-3" />
                                            Dashboard
                                        </Link>

                                        <Link
                                            to="/admin/academy/categorias"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/academy/categorias')}`}
                                        >
                                            <FolderOpen className="w-4 h-4 mr-3" />
                                            Categorias
                                        </Link>

                                        <Link
                                            to="/admin/academy/cursos"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/academy/cursos')}`}
                                        >
                                            <Layers className="w-4 h-4 mr-3" />
                                            Cursos
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Loja Accordion */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setLojaOpen(!lojaOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname.includes('/admin/loja') ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center">
                                        <ShoppingCart className="w-5 h-5 mr-3" />
                                        Loja
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${lojaOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {lojaOpen && (
                                    <div className="pl-4 space-y-1 bg-black/20 py-2 rounded-sm">
                                        <Link
                                            to="/admin/loja"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/loja')}`}
                                        >
                                            <LayoutDashboard className="w-4 h-4 mr-3" />
                                            Dashboard
                                        </Link>

                                        <Link
                                            to="/admin/loja/categorias"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/loja/categorias')}`}
                                        >
                                            <Tag className="w-4 h-4 mr-3" />
                                            Categorias
                                        </Link>

                                        <Link
                                            to="/admin/loja/produtos"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/loja/produtos')}`}
                                        >
                                            <Package className="w-4 h-4 mr-3" />
                                            Produtos
                                        </Link>

                                        <Link
                                            to="/admin/loja/pedidos"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/loja/pedidos')}`}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-3" />
                                            Pedidos
                                        </Link>

                                        <Link
                                            to="/admin/loja/documentacao"
                                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/loja/documentacao')}`}
                                        >
                                            <BookOpen className="w-4 h-4 mr-3" />
                                            Documentação
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Suporte Accordion */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSuporteOpen(!suporteOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname.includes('/admin/suporte') ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center">
                                        <LifeBuoy className="w-5 h-5 mr-3" />
                                        Suporte
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(pendingTicketsCount + pendingReportsCount) > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                {(pendingTicketsCount + pendingReportsCount) > 99 ? '99+' : pendingTicketsCount + pendingReportsCount}
                                            </span>
                                        )}
                                        <ChevronDown className={`w-4 h-4 transition-transform ${suporteOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {suporteOpen && (
                                    <div className="pl-4 space-y-1 bg-black/20 py-2 rounded-sm">
                                        <Link
                                            to="/admin/suporte/tickets"
                                            className={`flex items-center justify-between px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/suporte/tickets')}`}
                                        >
                                            <div className="flex items-center">
                                                <Ticket className="w-4 h-4 mr-3" />
                                                Tickets
                                            </div>
                                            {pendingTicketsCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {pendingTicketsCount > 99 ? '99+' : pendingTicketsCount}
                                                </span>
                                            )}
                                        </Link>

                                        <Link
                                            to="/admin/suporte/reportes"
                                            className={`flex items-center justify-between px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${isActive('/admin/suporte/reportes')}`}
                                        >
                                            <div className="flex items-center">
                                                <Flag className="w-4 h-4 mr-3" />
                                                Reportes
                                            </div>
                                            {pendingReportsCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {pendingReportsCount > 99 ? '99+' : pendingReportsCount}
                                                </span>
                                            )}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    {isAdmin && (
                        <Link
                            to="/admin/settings"
                            className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/settings')}`}
                        >
                            <Settings className="w-5 h-5 mr-3" />
                            Configurações
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            logout();
                            navigate('/admin/login');
                        }}
                        className="w-full flex items-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors text-sm font-bold uppercase tracking-wide rounded-sm"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};
