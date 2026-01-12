import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Loader2,
  ChevronLeft,
  Save,
  DollarSign,
  ListMusic,
  Mic2,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import * as musicAdminService from '../../services/musicAdminService';

export const MusicSettings: React.FC = () => {
  const toast = useToast();
  const { currentPreparatorio } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    is_enabled: true,
    billing_type: 'free' as 'free' | 'paid' | 'subscription',
    price_cents: 0,
    allow_user_playlists: true,
    show_lesson_podcasts: true,
  });

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadSettings();
    }
  }, [currentPreparatorio?.id]);

  const loadSettings = async () => {
    if (!currentPreparatorio?.id) return;

    setLoading(true);
    try {
      const data = await musicAdminService.getSettings(currentPreparatorio.id);
      if (data) {
        setSettings({
          is_enabled: data.is_enabled,
          billing_type: data.billing_type,
          price_cents: data.price_cents || 0,
          allow_user_playlists: data.allow_user_playlists,
          show_lesson_podcasts: data.show_lesson_podcasts,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPreparatorio?.id) return;

    setSaving(true);
    try {
      await musicAdminService.upsertSettings(currentPreparatorio.id, settings);
      toast.success('Configuracoes salvas!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <Link to="/admin/music" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configuracoes</h1>
          </div>
          <p className="text-gray-400 mt-1 ml-8">Configure o modulo de musica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module Status */}
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white uppercase">Status do Modulo</h2>
          </div>
          <div className="p-6">
            <label className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm cursor-pointer hover:border-white/10 transition-colors">
              <div>
                <p className="text-white font-bold">Modulo Habilitado</p>
                <p className="text-gray-400 text-sm">
                  Ative ou desative o modulo Music para os alunos
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, is_enabled: e.target.checked }))}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.is_enabled ? 'bg-brand-yellow' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                      settings.is_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-xl font-bold text-white uppercase">Cobranca</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-400 text-sm mb-4">
              Configure como os alunos terao acesso ao modulo Music
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                  settings.billing_type === 'free'
                    ? 'border-brand-yellow bg-brand-yellow/10'
                    : 'border-white/10 bg-brand-dark/50 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="billing_type"
                  value="free"
                  checked={settings.billing_type === 'free'}
                  onChange={() => setSettings((s) => ({ ...s, billing_type: 'free' }))}
                  className="sr-only"
                />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Gratuito</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Todos os alunos tem acesso livre
                  </p>
                </div>
              </label>

              <label
                className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                  settings.billing_type === 'subscription'
                    ? 'border-brand-yellow bg-brand-yellow/10'
                    : 'border-white/10 bg-brand-dark/50 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="billing_type"
                  value="subscription"
                  checked={settings.billing_type === 'subscription'}
                  onChange={() => setSettings((s) => ({ ...s, billing_type: 'subscription' }))}
                  className="sr-only"
                />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Assinatura</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Incluido no plano do aluno
                  </p>
                </div>
              </label>

              <label
                className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                  settings.billing_type === 'paid'
                    ? 'border-brand-yellow bg-brand-yellow/10'
                    : 'border-white/10 bg-brand-dark/50 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="billing_type"
                  value="paid"
                  checked={settings.billing_type === 'paid'}
                  onChange={() => setSettings((s) => ({ ...s, billing_type: 'paid' }))}
                  className="sr-only"
                />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Pago Avulso</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Compra unica para acesso
                  </p>
                </div>
              </label>
            </div>

            {settings.billing_type === 'paid' && (
              <div className="mt-4">
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Preco (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(settings.price_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        price_cents: Math.round(parseFloat(e.target.value) * 100) || 0,
                      }))
                    }
                    className="w-full pl-12 pr-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                    placeholder="29.90"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white uppercase">Recursos</h2>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm cursor-pointer hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <ListMusic className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-white font-bold">Playlists Pessoais</p>
                  <p className="text-gray-400 text-sm">
                    Permitir que alunos criem suas proprias playlists
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.allow_user_playlists}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, allow_user_playlists: e.target.checked }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.allow_user_playlists ? 'bg-brand-yellow' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                      settings.allow_user_playlists ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm cursor-pointer hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Mic2 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-white font-bold">Podcasts das Aulas</p>
                  <p className="text-gray-400 text-sm">
                    Exibir podcasts gerados automaticamente das aulas EAD
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.show_lesson_podcasts}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, show_lesson_podcasts: e.target.checked }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.show_lesson_podcasts ? 'bg-brand-yellow' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                      settings.show_lesson_podcasts ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase rounded-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Salvando...' : 'Salvar Configuracoes'}
          </button>
        </div>
      </form>
    </div>
  );
};
