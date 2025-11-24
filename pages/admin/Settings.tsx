import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save } from 'lucide-react';

export const Settings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingsId, setSettingsId] = useState<string | null>(null);

    // Temporary cast to any to resolve build errors with Supabase types
    const supabaseClient = supabase as any;

    const [formData, setFormData] = useState({
        blog_name: '',
        blog_description: '',
        posts_per_page: 10,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        facebook_url: '',
        instagram_url: '',
        linkedin_url: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from('admin_settings')
            .select('*')
            .single();

        if (error) {
            console.error('Error loading settings:', error);
            // If no settings exist, we'll just leave the defaults
        } else if (data) {
            setSettingsId(data.id);
            setFormData({
                blog_name: data.blog_name || '',
                blog_description: data.blog_description || '',
                posts_per_page: data.posts_per_page || 10,
                meta_title: data.meta_title || '',
                meta_description: data.meta_description || '',
                meta_keywords: data.meta_keywords || '',
                facebook_url: data.facebook_url || '',
                instagram_url: data.instagram_url || '',
                linkedin_url: data.linkedin_url || ''
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const settingsData = {
            blog_name: formData.blog_name,
            blog_description: formData.blog_description,
            posts_per_page: formData.posts_per_page,
            meta_title: formData.meta_title,
            meta_description: formData.meta_description,
            meta_keywords: formData.meta_keywords,
            facebook_url: formData.facebook_url,
            instagram_url: formData.instagram_url,
            linkedin_url: formData.linkedin_url,
            updated_at: new Date().toISOString()
        };

        if (settingsId) {
            const { error } = await supabaseClient
                .from('admin_settings')
                .update(settingsData)
                .eq('id', settingsId);

            if (error) {
                console.error('Error updating settings:', error);
                alert('Erro ao salvar configurações');
            } else {
                alert('Configurações salvas com sucesso!');
            }
        } else {
            const { error } = await supabaseClient
                .from('admin_settings')
                .insert({
                    ...settingsData,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error creating settings:', error);
                alert('Erro ao salvar configurações');
            } else {
                alert('Configurações salvas com sucesso!');
                loadSettings();
            }
        }
        setSaving(false);
    };

    if (loading) return <div className="text-white">Carregando...</div>;

    return (
        <div className="max-w-4xl">
            <h2 className="text-3xl font-black text-white font-display uppercase mb-8">Configurações</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Settings */}
                <section className="bg-brand-card border border-white/5 p-6 rounded-sm">
                    <h3 className="text-xl font-bold text-white uppercase mb-6 border-b border-white/5 pb-2">Geral</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome do Blog</label>
                            <input
                                type="text"
                                value={formData.blog_name}
                                onChange={(e) => setFormData({ ...formData, blog_name: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Posts por Página</label>
                            <input
                                type="number"
                                value={formData.posts_per_page}
                                onChange={(e) => setFormData({ ...formData, posts_per_page: parseInt(e.target.value) })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descrição do Blog</label>
                            <textarea
                                value={formData.blog_description}
                                onChange={(e) => setFormData({ ...formData, blog_description: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24"
                            />
                        </div>
                    </div>
                </section>

                {/* SEO Settings */}
                <section className="bg-brand-card border border-white/5 p-6 rounded-sm">
                    <h3 className="text-xl font-bold text-white uppercase mb-6 border-b border-white/5 pb-2">SEO Padrão</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Title</label>
                            <input
                                type="text"
                                value={formData.meta_title}
                                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Description</label>
                            <textarea
                                value={formData.meta_description}
                                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Keywords</label>
                            <input
                                type="text"
                                value={formData.meta_keywords}
                                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                placeholder="Separadas por vírgula"
                            />
                        </div>
                    </div>
                </section>

                {/* Social Media */}
                <section className="bg-brand-card border border-white/5 p-6 rounded-sm">
                    <h3 className="text-xl font-bold text-white uppercase mb-6 border-b border-white/5 pb-2">Redes Sociais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Facebook URL</label>
                            <input
                                type="text"
                                value={formData.facebook_url}
                                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                            />
                        </div>

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
                </section>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-yellow text-brand-darker px-8 py-4 font-bold uppercase tracking-widest hover:bg-brand-yellow/90 transition-colors flex items-center disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 mr-3" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};
