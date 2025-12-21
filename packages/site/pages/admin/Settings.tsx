import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  FileText,
  Gamepad2,
  ShoppingBag,
  Globe,
  Map as MapIcon,
  RefreshCw,
  CheckCircle,
  Info,
  Newspaper,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

// ============================================================================
// TYPES
// ============================================================================

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

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

// ============================================================================
// HELPERS
// ============================================================================

function parseSettingValue(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      if (value === 'true') return true;
      if (value === 'false') return false;
      const num = Number(value);
      if (!isNaN(num)) return num;
      return value;
    }
  }
  return value;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface SettingInputProps {
  setting: SystemSetting;
  value: any;
  onChange: (value: any) => void;
}

function SettingInput({ setting, value, onChange }: SettingInputProps) {
  const parsedValue = parseSettingValue(value);
  const isBoolean = typeof parsedValue === 'boolean' || value === 'true' || value === 'false';
  const isNumber = typeof parsedValue === 'number' && !isBoolean;

  if (isBoolean) {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={parsedValue === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked.toString())}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
        <span className="ml-3 text-sm text-gray-400">
          {parsedValue ? 'Ativado' : 'Desativado'}
        </span>
      </label>
    );
  }

  if (isNumber) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-xs bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
    />
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  simulado: {
    label: 'Simulados',
    icon: FileText,
    description: 'Configuracoes dos simulados e provas',
  },
  gamification: {
    label: 'Gamificacao',
    icon: Gamepad2,
    description: 'XP, moedas, ofensivas e recompensas',
  },
  store: {
    label: 'Loja',
    icon: ShoppingBag,
    description: 'Precos e configuracoes da loja',
  },
  trail: {
    label: 'Trilha',
    icon: MapIcon,
    description: 'Configuracoes das missoes e rodadas',
  },
  general: {
    label: 'Geral',
    icon: Globe,
    description: 'Configuracoes gerais do sistema',
  },
  blog: {
    label: 'Blog',
    icon: Newspaper,
    description: 'Configuracoes do blog e SEO',
  },
};

const SETTING_LABELS: Record<string, string> = {
  // Simulado
  questions_per_simulado: 'Questoes por Simulado',
  max_attempts: 'Maximo de Tentativas',
  different_exams_per_user: 'Provas Diferentes por Usuario',
  allow_chat: 'Permitir Chat',
  time_limit_minutes: 'Tempo Limite (minutos)',
  show_answers_after: 'Mostrar Respostas Apos',
  allow_review: 'Permitir Revisao',
  randomize_questions: 'Randomizar Questoes',
  randomize_options: 'Randomizar Alternativas',

  // Gamification
  xp_per_correct_answer: 'XP por Resposta Correta',
  xp_per_mission_complete: 'XP por Missao Completa',
  coins_per_correct_answer: 'Moedas por Resposta Correta',
  streak_bonus_multiplier: 'Multiplicador de Ofensiva',
  daily_goal_xp: 'Meta Diaria de XP',

  // Store
  default_simulado_price_coins: 'Preco Simulado (Moedas)',
  default_simulado_price_real: 'Preco Simulado (R$)',
  auto_create_simulado_product: 'Criar Simulado Automaticamente',

  // Trail
  questions_per_mission: 'Questoes por Missao',
  missions_per_round: 'Missoes por Rodada',
  min_score_to_pass: 'Pontuacao Minima (%)',
  allow_retry: 'Permitir Refazer',
  show_explanation: 'Mostrar Explicacao',

  // General
  maintenance_mode: 'Modo Manutencao',
  allow_new_registrations: 'Permitir Novos Cadastros',
  require_email_verification: 'Verificacao de Email',
  max_preparatorios_per_user: 'Max Preparatorios por Usuario',
};

// ============================================================================
// BLOG SETTINGS SECTION
// ============================================================================

function BlogSettingsSection({
  blogSettings,
  setBlogSettings,
  onSave,
  saving,
}: {
  blogSettings: BlogSettings;
  setBlogSettings: (settings: BlogSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* General */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          Configuracoes Gerais do Blog
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Settings: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [modifiedSettings, setModifiedSettings] = useState<Map<string, any>>(new Map());
  const [activeCategory, setActiveCategory] = useState<string>('simulado');

  // Blog settings
  const [blogSettings, setBlogSettings] = useState<BlogSettings>({
    blog_name: '',
    blog_description: '',
    posts_per_page: 10,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
  });

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // Load system settings
      const { data: systemData, error: systemError } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (!systemError && systemData) {
        setSettings(systemData);
      }

      // Load blog settings
      const { data: blogData, error: blogError } = await (supabase as any)
        .from('admin_settings')
        .select('*')
        .maybeSingle();

      if (!blogError && blogData) {
        setBlogSettings({
          id: blogData.id,
          blog_name: blogData.blog_name || '',
          blog_description: blogData.blog_description || '',
          posts_per_page: blogData.posts_per_page || 10,
          meta_title: blogData.meta_title || '',
          meta_description: blogData.meta_description || '',
          meta_keywords: blogData.meta_keywords || '',
          facebook_url: blogData.facebook_url || '',
          instagram_url: blogData.instagram_url || '',
          linkedin_url: blogData.linkedin_url || '',
        });
      }

      setModifiedSettings(new Map());
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configuracoes');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (setting: SystemSetting, newValue: any) => {
    const key = `${setting.category}:${setting.key}`;
    setModifiedSettings((prev) => {
      const next = new Map(prev);
      next.set(key, newValue);
      return next;
    });
  };

  const getValue = (setting: SystemSetting) => {
    const key = `${setting.category}:${setting.key}`;
    if (modifiedSettings.has(key)) {
      return modifiedSettings.get(key);
    }
    return setting.value;
  };

  const handleSaveSystemSettings = async () => {
    if (modifiedSettings.size === 0) {
      toast.info('Nenhuma alteracao para salvar');
      return;
    }

    setSaving(true);
    try {
      for (const [key, value] of modifiedSettings.entries()) {
        const [category, settingKey] = key.split(':');
        const { error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('category', category)
          .eq('key', settingKey);

        if (error) throw error;
      }

      toast.success('Configuracoes salvas com sucesso!');
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlogSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        blog_name: blogSettings.blog_name,
        blog_description: blogSettings.blog_description,
        posts_per_page: blogSettings.posts_per_page,
        meta_title: blogSettings.meta_title,
        meta_description: blogSettings.meta_description,
        meta_keywords: blogSettings.meta_keywords,
        facebook_url: blogSettings.facebook_url,
        instagram_url: blogSettings.instagram_url,
        linkedin_url: blogSettings.linkedin_url,
        updated_at: new Date().toISOString(),
      };

      if (blogSettings.id) {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .update(settingsData)
          .eq('id', blogSettings.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success('Configuracoes do blog salvas!');
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving blog settings:', error);
      toast.error('Erro ao salvar configuracoes do blog');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['simulado', 'gamification', 'store', 'trail', 'general', 'blog'];
  const filteredSettings = settings.filter((s) => s.category === activeCategory);
  const hasChanges = modifiedSettings.size > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-brand-yellow" />
            Configuracoes
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie todas as configuracoes do sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllSettings}
            className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 rounded-sm text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          {activeCategory !== 'blog' && (
            <button
              onClick={handleSaveSystemSettings}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm font-bold transition-colors ${
                hasChanges
                  ? 'bg-brand-yellow text-black hover:bg-brand-yellow/90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Alteracoes
            </button>
          )}
        </div>
      </div>

      {hasChanges && activeCategory !== 'blog' && (
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-brand-yellow flex-shrink-0" />
          <p className="text-brand-yellow text-sm">
            Voce tem {modifiedSettings.size} alteracao(oes) nao salva(s). Clique em "Salvar Alteracoes" para aplicar.
          </p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category] || {
                label: category,
                icon: SettingsIcon,
                description: '',
              };
              const Icon = config.icon;
              const isActive = activeCategory === category;
              const categorySettings = settings.filter((s) => s.category === category);
              const hasModified = categorySettings.some((s) =>
                modifiedSettings.has(`${s.category}:${s.key}`)
              );

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-brand-yellow/10 text-brand-yellow border-l-2 border-brand-yellow'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{config.label}</span>
                  {hasModified && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand-yellow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeCategory === 'blog' ? (
            <BlogSettingsSection
              blogSettings={blogSettings}
              setBlogSettings={setBlogSettings}
              onSave={handleSaveBlogSettings}
              saving={saving}
            />
          ) : (
            <>
              <div className="bg-brand-card border border-white/10 rounded-sm">
                {/* Category Header */}
                <div className="p-6 border-b border-white/10">
                  {(() => {
                    const config = CATEGORY_CONFIG[activeCategory] || {
                      label: activeCategory,
                      icon: SettingsIcon,
                      description: '',
                    };
                    const Icon = config.icon;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-sm bg-brand-yellow/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-brand-yellow" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{config.label}</h2>
                          <p className="text-gray-400 text-sm">{config.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Settings List */}
                <div className="divide-y divide-white/5">
                  {filteredSettings.map((setting) => {
                    const label = SETTING_LABELS[setting.key] || setting.key;
                    const value = getValue(setting);
                    const isModified = modifiedSettings.has(`${setting.category}:${setting.key}`);

                    return (
                      <div
                        key={setting.id}
                        className={`p-4 flex items-center justify-between ${
                          isModified ? 'bg-brand-yellow/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{label}</span>
                            {isModified && (
                              <CheckCircle className="w-4 h-4 text-brand-yellow" />
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-gray-500 text-sm mt-0.5">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <SettingInput
                            setting={setting}
                            value={value}
                            onChange={(newValue) => handleValueChange(setting, newValue)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {filteredSettings.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma configuracao nesta categoria</p>
                      <p className="text-sm mt-2">
                        Execute a migration 020_create_system_settings.sql para criar as configuracoes
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Help Sections */}
              {activeCategory === 'simulado' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
                  <h3 className="text-blue-400 font-bold mb-2">Sobre Simulados</h3>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• <strong>Maximo de Tentativas:</strong> Use -1 para ilimitado</li>
                    <li>• <strong>Provas Diferentes:</strong> Quantidade de versoes diferentes da prova que o usuario pode fazer</li>
                    <li>• <strong>Permitir Chat:</strong> Se habilitado, o usuario pode usar o chat durante o simulado</li>
                    <li>• A estrutura de cada simulado (questoes por materia) vem da analise do edital</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'store' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-sm p-4">
                  <h3 className="text-green-400 font-bold mb-2">Sobre a Loja</h3>
                  <ul className="text-green-300 text-sm space-y-1">
                    <li>• <strong>Criar Simulado Automaticamente:</strong> Quando ativado, um produto simulado sera criado automaticamente ao criar um preparatorio</li>
                    <li>• O preco pode ser definido individualmente para cada simulado apos a criacao</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'gamification' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-sm p-4">
                  <h3 className="text-purple-400 font-bold mb-2">Sobre Gamificacao</h3>
                  <ul className="text-purple-300 text-sm space-y-1">
                    <li>• <strong>Multiplicador de Ofensiva:</strong> Multiplicador aplicado quando o usuario mantem uma ofensiva</li>
                    <li>• Os valores de XP e moedas afetam todo o sistema de recompensas</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
