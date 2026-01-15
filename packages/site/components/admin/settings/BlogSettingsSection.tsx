import React from 'react';
import {
  Save,
  Loader2,
} from 'lucide-react';

interface BlogSettings {
  id?: string;
  blog_name: string;
  blog_description: string;
  posts_per_page: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
}

interface BlogSettingsSectionProps {
  blogSettings: BlogSettings;
  setBlogSettings: (settings: BlogSettings) => void;
  onSave: () => void;
  saving: boolean;
}

export function BlogSettingsSection({
  blogSettings,
  setBlogSettings,
  onSave,
  saving,
}: BlogSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* General */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          Configurações Gerais do Blog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome do Blog</label>
            <input
              type="text"
              value={blogSettings.blog_name}
              onChange={(e) => setBlogSettings({ ...blogSettings, blog_name: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Posts por Pagina</label>
            <input
              type="number"
              value={blogSettings.posts_per_page}
              onChange={(e) => setBlogSettings({ ...blogSettings, posts_per_page: parseInt(e.target.value) || 10 })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descricao do Blog</label>
            <textarea
              value={blogSettings.blog_description}
              onChange={(e) => setBlogSettings({ ...blogSettings, blog_description: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24 rounded-sm"
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          SEO Padrao
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Title</label>
            <input
              type="text"
              value={blogSettings.meta_title}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_title: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Description</label>
            <textarea
              value={blogSettings.meta_description}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_description: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24 rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Keywords</label>
            <input
              type="text"
              value={blogSettings.meta_keywords}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_keywords: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
              placeholder="Separadas por virgula"
            />
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          Redes Sociais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Facebook URL</label>
            <input
              type="text"
              value={blogSettings.facebook_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, facebook_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Instagram URL</label>
            <input
              type="text"
              value={blogSettings.instagram_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, instagram_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">LinkedIn URL</label>
            <input
              type="text"
              value={blogSettings.linkedin_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, linkedin_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase tracking-wide hover:bg-brand-yellow/90 transition-colors flex items-center disabled:opacity-50 rounded-sm"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-3" />
          )}
          {saving ? 'Salvando...' : 'Salvar Blog'}
        </button>
      </div>
    </div>
  );
}
