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
  Camera,
  Award,
  Flame,
  Target,
  Copy,
  Check,
  Users,
  Gift,
  DollarSign,
  Sun,
  Moon,
} from 'lucide-react';
import { Card, Button, Modal, Progress, CircularProgress } from '../components/ui';
import { useAuthStore, useUserStore } from '../stores';
import { calculateXPProgress, calculateLevel } from '../constants/levelConfig';
import { getOptimizedImageUrl } from '../utils/image';
import {
  getReferralLink,
  getUserReferralStats,
  generateUsername,
} from '../services/referralService';
import type { ReferralStats, ReferralLinkInfo } from '../types/referral';
import { RewardsModal } from '../components/referral/RewardsModal';
import { ReferralsListModal } from '../components/referral/ReferralsListModal';
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
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [referralLink, setReferralLink] = useState<ReferralLinkInfo | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [referralLoaded, setReferralLoaded] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const xpProgress = calculateXPProgress(stats.xp);
  const level = calculateLevel(stats.xp);

  // Carregar dados de indicação
  useEffect(() => {
    if (profile?.id) {
      Promise.all([
        getReferralLink(profile.id),
        getUserReferralStats(profile.id),
      ]).then(([link, stats]) => {
        setReferralLink(link);
        setReferralStats(stats);
        setReferralLoaded(true);
      });
    }
  }, [profile?.id]);

  // Gerar username para usuário existente
  const handleGenerateUsername = async () => {
    if (!profile?.id || !profile?.name) return;

    setIsGeneratingUsername(true);
    try {
      const username = await generateUsername(profile.name, profile.id);
      if (username) {
        const link = await getReferralLink(profile.id);
        setReferralLink(link);
      }
    } catch (error) {
      console.error('Erro ao gerar username:', error);
    } finally {
      setIsGeneratingUsername(false);
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink?.referral_url) return;
    try {
      await navigator.clipboard.writeText(referralLink.referral_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Erro ao copiar:', e);
    }
  };

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
              className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Camera size={14} className="text-black" />
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

      {/* Referral Section */}
      {referralLoaded && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/20 flex items-center justify-center">
              <Users size={20} className="text-[var(--color-success)]" />
            </div>
            <div>
              <h3 className="text-[var(--color-text-main)] font-semibold">Indique e Ganhe</h3>
              <p className="text-[var(--color-text-muted)] text-xs">Convide amigos e ganhe recompensas</p>
            </div>
          </div>

          {referralLink ? (
            <>
              {/* Link de Indicação */}
              <div className="bg-[var(--color-bg-main)] rounded-xl p-3 mb-4">
                <p className="text-[var(--color-text-muted)] text-xs mb-1">Seu link de indicação:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--color-bg-elevated)] rounded-lg px-3 py-2 overflow-hidden">
                    <p className="text-[var(--color-text-main)] text-sm truncate">{referralLink.referral_url}</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-all ${copied
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-brand)] text-black hover:bg-[var(--color-brand-dark)]'
                      }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Stats de Indicação */}
              {referralStats && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[var(--color-bg-main)] rounded-xl p-3 text-center">
                    <Users size={16} className="mx-auto mb-1 text-[var(--color-info)]" />
                    <p className="text-[var(--color-text-main)] font-bold">{referralStats.total_referrals}</p>
                    <p className="text-[var(--color-text-muted)] text-[10px]">Indicados</p>
                  </div>
                  <div className="bg-[var(--color-bg-main)] rounded-xl p-3 text-center">
                    <Gift size={16} className="mx-auto mb-1 text-[#9B59B6]" />
                    <p className="text-[var(--color-text-main)] font-bold">{referralStats.available_points}</p>
                    <p className="text-[var(--color-text-muted)] text-[10px]">Pontos</p>
                  </div>
                  <div className="bg-[var(--color-bg-main)] rounded-xl p-3 text-center">
                    <DollarSign size={16} className="mx-auto mb-1 text-[var(--color-success)]" />
                    <p className="text-[var(--color-text-main)] font-bold">
                      R$ {(referralStats.total_commissions || 0).toFixed(0)}
                    </p>
                    <p className="text-[var(--color-text-muted)] text-[10px]">Comissões</p>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowRewardsModal(true)}
                >
                  <Gift size={16} className="mr-2" />
                  Recompensas
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowReferralsModal(true)}
                >
                  <Users size={16} className="mr-2" />
                  Indicados
                </Button>
              </div>
            </>
          ) : (
            /* Usuário sem username - mostrar botão para ativar */
            <div className="text-center">
              <p className="text-[var(--color-text-sec)] text-sm mb-4">
                Ative seu link de indicação para convidar amigos e ganhar recompensas!
              </p>
              <Button
                fullWidth
                onClick={handleGenerateUsername}
                disabled={isGeneratingUsername}
              >
                {isGeneratingUsername ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Gift size={16} className="mr-2" />
                    Ativar Link de Indicação
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

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

      {/* Rewards Modal */}
      {profile?.id && (
        <RewardsModal
          isOpen={showRewardsModal}
          onClose={() => setShowRewardsModal(false)}
          userId={profile.id}
        />
      )}

      {/* Referrals List Modal */}
      {profile?.id && (
        <ReferralsListModal
          isOpen={showReferralsModal}
          onClose={() => setShowReferralsModal(false)}
          userId={profile.id}
          onRequestWithdrawal={() => {
            // TODO: Implementar solicitação de saque
            alert('Funcionalidade de saque em breve!');
          }}
        />
      )}
    </div>
  );
}

