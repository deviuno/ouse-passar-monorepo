import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Users, Eye, BookOpen, GraduationCap, FileCheck, Clock, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        articles: 0,
        views: 0,
        authors: 0,
        categories: 0
    });

    const [preparatorioStats, setPreparatorioStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        editaisProcessing: 0
    });

    useEffect(() => {
        loadStats();
        loadPreparatorioStats();
    }, []);

    const loadStats = async () => {
        // Get articles count
        const { count: articlesCount } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true });

        // Get authors count
        const { count: authorsCount } = await supabase
            .from('writers_profiles')
            .select('*', { count: 'exact', head: true });

        // Get categories count
        const { count: categoriesCount } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });

        // Get total views (sum of views from posts table - using mock for now as analytics table is separate)
        // For now we'll just show 0 or implement a real view counter later

        setStats({
            articles: articlesCount || 0,
            views: 0, // Placeholder
            authors: authorsCount || 0,
            categories: categoriesCount || 0
        });
    };

    const loadPreparatorioStats = async () => {
        try {
            // Get total courses
            const { count: totalCount } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true });

            // Get active courses
            const { count: activeCount } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Get courses with pending editais (waiting for review)
            const { count: pendingCount } = await supabase
                .from('editais')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'analyzed');

            // Get editais currently processing
            const { count: processingCount } = await supabase
                .from('editais')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'processing');

            setPreparatorioStats({
                total: totalCount || 0,
                active: activeCount || 0,
                pending: pendingCount || 0,
                editaisProcessing: processingCount || 0
            });
        } catch (error) {
            console.error('Error loading preparatorio stats:', error);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-black text-white font-display uppercase">Dashboard</h2>

            {/* Blog Stats */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Blog</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total de Artigos"
                        value={stats.articles}
                        icon={<FileText className="w-8 h-8 text-brand-yellow" />}
                    />
                    <StatCard
                        title="Visualizações"
                        value={stats.views}
                        icon={<Eye className="w-8 h-8 text-brand-yellow" />}
                    />
                    <StatCard
                        title="Autores IA"
                        value={stats.authors}
                        icon={<Users className="w-8 h-8 text-brand-yellow" />}
                    />
                    <StatCard
                        title="Categorias"
                        value={stats.categories}
                        icon={<BookOpen className="w-8 h-8 text-brand-yellow" />}
                    />
                </div>
            </div>

            {/* Preparatórios Stats */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Preparatórios & Simulados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total de Cursos"
                        value={preparatorioStats.total}
                        icon={<GraduationCap className="w-8 h-8 text-brand-yellow" />}
                    />
                    <StatCard
                        title="Cursos Ativos"
                        value={preparatorioStats.active}
                        icon={<FileCheck className="w-8 h-8 text-green-500" />}
                    />
                    <StatCard
                        title="Aguardando Revisão"
                        value={preparatorioStats.pending}
                        icon={<AlertTriangle className="w-8 h-8 text-yellow-500" />}
                        highlight={preparatorioStats.pending > 0 ? 'warning' : undefined}
                    />
                    <StatCard
                        title="Em Processamento"
                        value={preparatorioStats.editaisProcessing}
                        icon={<Clock className="w-8 h-8 text-blue-500" />}
                        highlight={preparatorioStats.editaisProcessing > 0 ? 'info' : undefined}
                    />
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    highlight?: 'warning' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, highlight }) => {
    const borderColor = highlight === 'warning'
        ? 'border-yellow-500/30'
        : highlight === 'info'
            ? 'border-blue-500/30'
            : 'border-white/5';

    const bgColor = highlight === 'warning'
        ? 'bg-yellow-500/5'
        : highlight === 'info'
            ? 'bg-blue-500/5'
            : 'bg-brand-card';

    return (
        <div className={`${bgColor} border ${borderColor} p-6 rounded-sm`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">{title}</h3>
                {icon}
            </div>
            <p className="text-4xl font-black text-white font-display">{value}</p>
        </div>
    );
};
