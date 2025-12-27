import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  Trophy,
  Bell,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../stores';
import { supabase } from '../services/supabase';

interface PrivacySettings {
  show_profile_public: boolean;
  show_stats_public: boolean;
  show_in_ranking: boolean;
  allow_notifications: boolean;
}

function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-12 h-7 rounded-full transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled ? 'bg-[#2ECC71]' : 'bg-[#3A3A3A]'}
      `}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function SettingItem({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[#A0A0A0]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-[#6E6E6E] text-sm mt-0.5">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_profile_public: true,
    show_stats_public: true,
    show_in_ranking: true,
    allow_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [profile?.id]);

  const loadSettings = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Carregar configurações do perfil
      const { data } = await supabase
        .from('user_profiles')
        .select('show_profile_public, show_stats_public, show_in_ranking, allow_notifications')
        .eq('id', profile.id)
        .single();

      if (data) {
        setSettings({
          show_profile_public: data.show_profile_public ?? true,
          show_stats_public: data.show_stats_public ?? true,
          show_in_ranking: data.show_in_ranking ?? true,
          allow_notifications: data.allow_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof PrivacySettings, value: boolean) => {
    if (!profile?.id) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    try {
      await supabase
        .from('user_profiles')
        .update({ [key]: value })
        .eq('id', profile.id);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      // Reverter em caso de erro
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1A1A1A] to-[#121212] px-4 py-6 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[#3A3A3A] transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#9B59B6]/10 flex items-center justify-center">
                <Shield size={24} className="text-[#9B59B6]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Privacidade</h1>
                <p className="text-[#A0A0A0] text-sm">Controle suas informações</p>
              </div>
            </div>
            {saving && (
              <Loader2 size={20} className="text-[#FFB800] animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Visibility Settings */}
            <div className="mb-6">
              <h2 className="text-[#A0A0A0] text-sm font-medium mb-3 px-1">Visibilidade</h2>
              <Card padding="none">
                <SettingItem
                  icon={Eye}
                  title="Perfil público"
                  description="Permitir que outros usuários vejam seu perfil"
                  enabled={settings.show_profile_public}
                  onChange={(v) => handleSettingChange('show_profile_public', v)}
                />
                <SettingItem
                  icon={BarChart3}
                  title="Estatísticas públicas"
                  description="Mostrar suas estatísticas para outros usuários"
                  enabled={settings.show_stats_public}
                  onChange={(v) => handleSettingChange('show_stats_public', v)}
                />
                <SettingItem
                  icon={Trophy}
                  title="Aparecer no ranking"
                  description="Participar do ranking público da plataforma"
                  enabled={settings.show_in_ranking}
                  onChange={(v) => handleSettingChange('show_in_ranking', v)}
                />
              </Card>
            </div>

            {/* Notification Settings */}
            <div className="mb-6">
              <h2 className="text-[#A0A0A0] text-sm font-medium mb-3 px-1">Comunicações</h2>
              <Card padding="none">
                <SettingItem
                  icon={Bell}
                  title="Notificações"
                  description="Receber notificações sobre conquistas e novidades"
                  enabled={settings.allow_notifications}
                  onChange={(v) => handleSettingChange('allow_notifications', v)}
                />
              </Card>
            </div>

            {/* Legal Links */}
            <div className="mb-6">
              <h2 className="text-[#A0A0A0] text-sm font-medium mb-3 px-1">Documentos legais</h2>
              <Card padding="none">
                <a
                  href="/termos-de-uso"
                  target="_blank"
                  className="flex items-center justify-between p-4 border-b border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
                >
                  <span className="text-white">Termos de Uso</span>
                  <ExternalLink size={18} className="text-[#6E6E6E]" />
                </a>
                <a
                  href="/politica-de-privacidade"
                  target="_blank"
                  className="flex items-center justify-between p-4 hover:bg-[#2A2A2A] transition-colors"
                >
                  <span className="text-white">Política de Privacidade</span>
                  <ExternalLink size={18} className="text-[#6E6E6E]" />
                </a>
              </Card>
            </div>

            {/* Info */}
            <p className="text-[#6E6E6E] text-xs text-center px-4">
              Suas configurações de privacidade são salvas automaticamente.
              Para solicitar a exclusão de dados, entre em contato com nosso suporte.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
