import React, { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Check } from 'lucide-react';
import { musicAdminService, type MusicSettings as MusicSettingsType } from '../../../services/musicAdminService';
import { useMusicPreparatorio } from '../../../hooks/useMusicPreparatorio';

export const MusicSettings: React.FC = () => {
  const { selectedId: preparatorioId, loading: loadingPrep } = useMusicPreparatorio();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<MusicSettingsType>({
    id: '',
    preparatorio_id: '',
    is_enabled: true,
    billing_type: 'free',
    price_cents: null,
    allow_user_playlists: true,
    show_lesson_podcasts: true,
  });

  useEffect(() => {
    if (preparatorioId) {
      loadSettings();
    }
  }, [preparatorioId]);

  const loadSettings = async () => {
    if (!preparatorioId) return;

    setLoading(true);
    try {
      const data = await musicAdminService.getSettings(preparatorioId);
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preparatorioId) return;

    setSaving(true);
    setSaved(false);
    try {
      await musicAdminService.updateSettings(preparatorioId, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configuracoes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingPrep) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Configuracoes
        </h1>
        <p className="text-gray-400 mt-1">
          Configure o modulo Music do seu preparatorio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module Status */}
        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Status do Modulo</h3>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-white font-medium">Modulo Ativado</p>
              <p className="text-gray-400 text-sm">
                Quando desativado, o modulo nao aparece para os alunos
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.is_enabled ? 'bg-brand-yellow' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    settings.is_enabled ? 'translate-x-7' : 'translate-x-1'
                  } mt-1`}
                />
              </div>
            </div>
          </label>
        </div>

        {/* Billing */}
        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cobranca</h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="billing_type"
                value="free"
                checked={settings.billing_type === 'free'}
                onChange={() => setSettings({ ...settings, billing_type: 'free', price_cents: null })}
                className="mt-1 text-brand-yellow focus:ring-brand-yellow"
              />
              <div>
                <p className="text-white font-medium">Gratuito</p>
                <p className="text-gray-400 text-sm">
                  Todos os alunos tem acesso gratuito ao modulo
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="billing_type"
                value="subscription"
                checked={settings.billing_type === 'subscription'}
                onChange={() => setSettings({ ...settings, billing_type: 'subscription', price_cents: null })}
                className="mt-1 text-brand-yellow focus:ring-brand-yellow"
              />
              <div>
                <p className="text-white font-medium">Incluso no Plano</p>
                <p className="text-gray-400 text-sm">
                  Apenas alunos com plano ativo tem acesso
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="billing_type"
                value="paid"
                checked={settings.billing_type === 'paid'}
                onChange={() => setSettings({ ...settings, billing_type: 'paid' })}
                className="mt-1 text-brand-yellow focus:ring-brand-yellow"
              />
              <div>
                <p className="text-white font-medium">Pago Avulso</p>
                <p className="text-gray-400 text-sm">
                  Alunos precisam comprar acesso ao modulo separadamente
                </p>
              </div>
            </label>

            {settings.billing_type === 'paid' && (
              <div className="ml-6">
                <label className="block text-gray-400 text-sm mb-2">Preco (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.price_cents ? settings.price_cents / 100 : ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null,
                    })
                  }
                  className="w-32 px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Funcionalidades</h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Playlists do Usuario</p>
                <p className="text-gray-400 text-sm">
                  Permitir que alunos criem suas proprias playlists
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.allow_user_playlists}
                  onChange={(e) => setSettings({ ...settings, allow_user_playlists: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-14 h-8 rounded-full transition-colors ${
                    settings.allow_user_playlists ? 'bg-brand-yellow' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      settings.allow_user_playlists ? 'translate-x-7' : 'translate-x-1'
                    } mt-1`}
                  />
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Podcasts das Aulas</p>
                <p className="text-gray-400 text-sm">
                  Exibir podcasts gerados automaticamente das aulas
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.show_lesson_podcasts}
                  onChange={(e) => setSettings({ ...settings, show_lesson_podcasts: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-14 h-8 rounded-full transition-colors ${
                    settings.show_lesson_podcasts ? 'bg-brand-yellow' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      settings.show_lesson_podcasts ? 'translate-x-7' : 'translate-x-1'
                    } mt-1`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Configuracoes'}
        </button>
      </form>
    </div>
  );
};

export default MusicSettings;
