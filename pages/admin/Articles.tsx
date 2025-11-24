import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Edit2, Trash2, Search, Eye } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';

type Article = Database['public']['Tables']['artigos']['Row'];

export const Articles: React.FC = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Temporary cast to any to resolve build errors with Supabase types
    const supabaseClient = supabase as any;

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from('artigos')
            .select('*')
            .order('data_criacao', { ascending: false });

        if (error) {
            console.error('Error loading articles:', error);
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este artigo?')) return;

        const { error } = await supabaseClient
            .from('artigos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting article:', error);
            alert('Erro ao excluir artigo');
        } else {
            loadArticles();
        }
    };

    const filteredArticles = articles.filter(article =>
        article.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-black text-white font-display uppercase">Artigos</h2>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar artigos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-brand-card border border-white/10 pl-10 pr-4 py-2 text-white text-sm rounded-sm focus:border-brand-yellow outline-none"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/admin/articles/new')}
                        className="bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm flex items-center hover:bg-brand-yellow/90 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Artigo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-white">Carregando...</div>
            ) : (
                <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Título</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Data</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredArticles.map((article) => (
                                <tr key={article.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <p className="text-white font-bold truncate max-w-md">{article.titulo}</p>
                                        <p className="text-gray-500 text-xs font-mono mt-1">{article.slug}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10">
                                            {article.categoria || 'Sem categoria'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${article.status_publicacao === 'publicado'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                            }`}>
                                            {article.status_publicacao}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {formatDate(article.data_criacao)}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                                            className="text-gray-400 hover:text-blue-400 transition-colors inline-block"
                                            title="Ver artigo"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/articles/edit/${article.slug}`)}
                                            className="text-gray-400 hover:text-brand-yellow transition-colors inline-block"
                                            title="Editar artigo"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors inline-block"
                                            title="Excluir artigo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
