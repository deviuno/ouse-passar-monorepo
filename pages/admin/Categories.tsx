
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { generateSlug } from '../../lib/utils';

type Category = Database['public']['Tables']['categories']['Row'];

export const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Temporary cast to any to resolve build errors with Supabase types
    const supabaseClient = supabase as any;

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: ''
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading categories:', error);
        } else {
            setCategories(data || []);
        }
        setLoading(false);
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name)
        });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;

        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            alert('Erro ao excluir categoria');
        } else {
            loadCategories();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const categoryData = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            updated_at: new Date().toISOString()
        };

        if (editingCategory) {
            const { error } = await supabaseClient
                .from('categories')
                .update(categoryData)
                .eq('id', editingCategory.id);

            if (error) {
                console.error('Error updating category:', error);
                alert('Erro ao atualizar categoria');
            } else {
                setIsModalOpen(false);
                loadCategories();
            }
        } else {
            const { error } = await supabaseClient
                .from('categories')
                .insert(categoryData);

            if (error) {
                console.error('Error creating category:', error);
                alert('Erro ao criar categoria');
            } else {
                setIsModalOpen(false);
                loadCategories();
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Categorias</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm flex items-center hover:bg-brand-yellow/90 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                </button>
            </div>

            {loading ? (
                <div className="text-white">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-brand-card border border-white/5 p-6 rounded-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-white font-bold text-lg">{category.name}</h3>
                                <span className="text-gray-600 text-xs font-mono">{category.slug}</span>
                            </div>

                            <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1">
                                {category.description || 'Sem descrição'}
                            </p>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => handleOpenModal(category)}
                                    className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-32"
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-gray-400 font-bold uppercase text-xs hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
