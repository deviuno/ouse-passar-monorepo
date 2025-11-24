import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Users, Eye, BookOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        articles: 0,
        views: 0,
        authors: 0,
        categories: 0
    });

    useEffect(() => {
        loadStats();
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

    return (
        <div>
            <h2 className="text-3xl font-black text-white font-display uppercase mb-8">Dashboard</h2>

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
    );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-brand-card border border-white/5 p-6 rounded-sm">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">{title}</h3>
            {icon}
        </div>
        <p className="text-4xl font-black text-white font-display">{value}</p>
    </div>
);
