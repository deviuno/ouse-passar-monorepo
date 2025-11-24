import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, BookOpen, User } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

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
                        className="h-10 mb-4"
                    />
                    <div className="flex items-center bg-brand-dark/50 border border-white/5 p-3 rounded-sm">
                        <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-brand-yellow" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin')}`}
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>

                    <Link
                        to="/admin/articles"
                        className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/articles')}`}
                    >
                        <FileText className="w-5 h-5 mr-3" />
                        Artigos
                    </Link>

                    <Link
                        to="/admin/categories"
                        className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/categories')}`}
                    >
                        <BookOpen className="w-5 h-5 mr-3" />
                        Categorias
                    </Link>

                    <Link
                        to="/admin/authors"
                        className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/authors')}`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Autores
                    </Link>

                    <Link
                        to="/admin/settings"
                        className={`flex items-center px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/admin/settings')}`}
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Configurações
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <Link
                        to="/"
                        className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold uppercase tracking-wide rounded-sm"
                    >
                        <BookOpen className="w-5 h-5 mr-3" />
                        Voltar ao Site
                    </Link>
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
