import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit2,
  Award,
  Flame,
  Target,
  Sun,
  Moon,
} from 'lucide-react';
import { Card, Button, Modal, Progress, CircularProgress } from '../components/ui';
import { useAuthStore, useUserStore } from '../stores';
import { calculateXPProgress, calculateLevel } from '../constants/levelConfig';
import { getOptimizedImageUrl } from '../utils/image';
import { useTheme } from '../contexts/ThemeContext';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="text-center" padding="sm">
      <Icon size={20} className={`mx-auto mb-1`} style={{ color }} />
      <p className="text-[var(--color-text-main)] font-bold">{value}</p>
      <p className="text-[var(--color-text-muted)] text-xs">{label}</p>
    </Card>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl
        transition-colors
        ${danger ? 'hover:bg-[var(--color-error)]/10' : 'hover:bg-[var(--color-border)]'}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={danger ? 'text-[var(--color-error)]' : 'text-[var(--color-text-sec)]'} />
        <span className={danger ? 'text-[var(--color-error)]' : 'text-[var(--color-text-main)]'}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, logout, updateProfile } = useAuthStore();
  const { stats } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const xpProgress = calculateXPProgress(stats.xp);
  const level = calculateLevel(stats.xp);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadAvatar } = await import('../services/avatarService');
      const { url, error } = await uploadAvatar(profile.id, file);

      if (error) throw error;

      if (url) {
        await updateProfile({ avatar_url: url });
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao carregar imagem: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
    }
  };

  const leagueTiers = {
    ferro: { label: 'Liga Ferro', color: '#6E6E6E', emoji: '🔩' },
    bronze: { label: 'Liga Bronze', color: '#CD7F32', emoji: '🥉' },
    prata: { label: 'Liga Prata', color: '#C0C0C0', emoji: '🥈' },
    ouro: { label: 'Liga Ouro', color: '#FFD700', emoji: '🥇' },
    diamante: { label: 'Liga Diamante', color: '#B9F2FF', emoji: '💎' },
  };

  const currentLeague = leagueTiers[profile?.league_tier || 'ferro'];

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center overflow-hidden border-2 border-[var(--color-border)] ${isUploading ? 'border-[var(--color-brand)] animate-pulse' : ''}`}>
              {isUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-5 h-5 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : profile?.avatar_url ? (
                <img
                  src={getOptimizedImageUrl(profile.avatar_url, 160, 80)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User size={32} className="text-[var(--color-text-muted)]" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`absolute -bottom-0.5 -right-0.5 z-10 w-9 h-9 rounded-full bg-[var(--color-brand)] flex items-center justify-center shadow-lg border-2 border-[var(--color-bg-card)] hover:scale-110 active:scale-95 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'/%3E%3Ccircle cx='12' cy='13' r='4'/%3E%3C/svg%3E"
                alt="Alterar foto"
                style={{ width: '16px', height: '16px', display: 'block', minWidth: '16px', minHeight: '16px' }}
              />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--color-text-main)]">
                {profile?.name || 'Estudante'}
              </h2>
              <button className="p-1 hover:bg-[var(--color-border)] rounded-full transition-colors">
                <Edit2 size={14} className="text-[var(--color-text-sec)]" />
              </button>
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">{profile?.email}</p>

            {/* League Badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">{currentLeague.emoji}</span>
              <span className="text-sm" style={{ color: currentLeague.color }}>
                {currentLeague.label}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center">
                <span className="text-[var(--color-brand)] font-bold text-sm">{level}</span>
              </div>
              <span className="text-[var(--color-text-main)] font-medium">Nível {level}</span>
            </div>
            <span className="text-[var(--color-text-muted)] text-sm">
              {xpProgress.current}/{xpProgress.needed} XP
            </span>
          </div>
          <Progress value={xpProgress.percentage} size="sm" color="brand" />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard icon={Target} label="Questões" value={stats.totalAnswered} color="#3498DB" />
        <StatCard icon={Award} label="Acertos" value={stats.correctAnswers} color="#2ECC71" />
        <StatCard icon={Flame} label="Ofensiva" value={stats.streak} color="#E74C3C" />
        <StatCard
          icon={() => <span className="text-xl">💰</span>}
          label="Moedas"
          value={stats.coins}
          color="#FFB800"
        />
      </div>

      {/* Configurações - Toggle de Tema */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={20} className="text-indigo-400" />
            ) : (
              <Sun size={20} className="text-yellow-500" />
            )}
            <div>
              <p className="text-[var(--color-text-main)] font-medium">Aparência</p>
              <p className="text-[var(--color-text-muted)] text-xs">
                {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-yellow-400'
              }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'left-1' : 'left-7'
                }`}
            >
              {theme === 'dark' ? (
                <Moon size={14} className="text-indigo-500" />
              ) : (
                <Sun size={14} className="text-yellow-500" />
              )}
            </div>
          </button>
        </div>
      </Card>

      {/* Menu Options */}
      <Card padding="none" className="mb-6">
        <MenuButton
          icon={Bell}
          label="Notificações"
          onClick={() => navigate('/notificacoes')}
        />
        <MenuButton
          icon={Shield}
          label="Privacidade"
          onClick={() => navigate('/privacidade')}
        />
        <MenuButton
          icon={HelpCircle}
          label="Ajuda e Suporte"
          onClick={() => navigate('/ajuda')}
        />
      </Card>

      {/* Logout */}
      <Card padding="none">
        <MenuButton
          icon={LogOut}
          label="Sair da Conta"
          onClick={() => setShowLogoutModal(true)}
          danger
        />
      </Card>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sair da Conta"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/20 flex items-center justify-center mx-auto mb-4">
            <LogOut size={28} className="text-[var(--color-error)]" />
          </div>
          <p className="text-[var(--color-text-main)] mb-2">Tem certeza que deseja sair?</p>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">
            Você pode voltar a qualquer momento.
          </p>

          <div className="flex gap-3">
            <Button
              fullWidth
              variant="ghost"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

