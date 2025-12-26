import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, BookOpen, User, ChevronDown, GraduationCap, ClipboardList, UserCheck, Plus, ShoppingCart, Package, Tag, Scale } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isVendedor } = useAuth();
    const [blogOpen, setBlogOpen] = useState(false);
    const [lojaOpen, setLojaOpen] = useState(false);
    const [planejamentosOpen, setPlanejamentosOpen] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-brand-yellow text-brand-darker' : 'text-gray-400 hover:text-white hover:bg-white/5';
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
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/users')}`}
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
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    {isAdmin && (
                        <>
                            <Link
                                to="/admin/settings"
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/settings')}`}
                            >
                                <Settings className="w-5 h-5 mr-3" />
                                Configurações
                            </Link>

                            <Link
                                to="/admin/legal-texts"
                                className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/legal-texts')}`}
                            >
                                <Scale className="w-5 h-5 mr-3" />
                                Textos Legais
                            </Link>
                        </>
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
