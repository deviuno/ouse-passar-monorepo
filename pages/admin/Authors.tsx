import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';

type Author = Database['public']['Tables']['writers_profiles']['Row'];

export const Authors: React.FC = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

    // Temporary cast to any to resolve build errors with Supabase types
    const supabaseClient = supabase as any;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        avatar_url: '',
        instagram_url: '',
        linkedin_url: ''
    });

    useEffect(() => {
        loadAuthors();
    }, []);

    const loadAuthors = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from('writers_profiles')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading authors:', error);
        } else {
            setAuthors(data || []);
        }
        setLoading(false);
    };

    const handleOpenModal = (author?: Author) => {
        if (author) {
            setEditingAuthor(author);
            setFormData({
                name: author.name,
                role: author.role || '',
                bio: author.bio || '',
                avatar_url: author.avatar_url || '',
                instagram_url: author.instagram_url || '',
                linkedin_url: author.linkedin_url || ''
            });
        } else {
            setEditingAuthor(null);
            setFormData({
                name: '',
                role: '',
                bio: '',
                avatar_url: '',
                instagram_url: '',
                linkedin_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este autor?')) return;

        const { error } = await supabaseClient
            .from('writers_profiles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting author:', error);
            alert('Erro ao excluir autor');
        } else {
            loadAuthors();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const authorData = {
            name: formData.name,
            role: formData.role || null,
            bio: formData.bio || null,
            avatar_url: formData.avatar_url || null,
            instagram_url: formData.instagram_url || null,
            linkedin_url: formData.linkedin_url || null,
            updated_at: new Date().toISOString()
        };

        if (editingAuthor) {
            const { error } = await supabaseClient
                .from('writers_profiles')
                .update(authorData)
                .eq('id', editingAuthor.id);

            if (error) {
                console.error('Error updating author:', error);
                alert('Erro ao atualizar autor');
            } else {
                setIsModalOpen(false);
                loadAuthors();
            }
        } else {
            const { error } = await supabaseClient
                .from('writers_profiles')
                .insert({
                    ...authorData,
                    is_active: true
                });

            if (error) {
                console.error('Error creating author:', error);
                alert('Erro ao criar autor');
            } else {
                setIsModalOpen(false);
                loadAuthors();
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Autores IA</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm flex items-center hover:bg-brand-yellow/90 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Autor
                </button>
            </div>

            {loading ? (
                <div className="text-white">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {authors.map((author) => (
                        <div key={author.id} className="bg-brand-card border border-white/5 p-6 rounded-sm flex flex-col">
                            <div className="flex items-center mb-4">
                                <img
                                    src={getAvatarUrl(author.name)}
                                    alt={author.name}
                                    className="w-12 h-12 rounded-full border border-brand-yellow p-0.5 object-cover"
                                />
                                <div className="ml-4">
                                    <h3 className="text-white font-bold">{author.name}</h3>
                                    <p className="text-gray-500 text-xs uppercase">{author.role}</p>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1">{author.bio}</p>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => handleOpenModal(author)}
                                    className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(author.id)}
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
                    <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase">
                                {editingAuthor ? 'Editar Autor' : 'Novo Autor'}
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
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Cargo / Especialidade</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-32"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">URL do Avatar</label>
                                <input
                                    type="text"
                                    value={formData.avatar_url}
                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Instagram URL</label>
                                    <input
                                        type="text"
                                        value={formData.instagram_url}
                                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">LinkedIn URL</label>
                                    <input
                                        type="text"
                                        value={formData.linkedin_url}
                                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    />
                                </div>
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
