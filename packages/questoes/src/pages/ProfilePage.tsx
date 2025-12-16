import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
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
} from 'lucide-react';
import { Card, Button, Modal, Progress, CircularProgress } from '../components/ui';
import { useAuthStore, useUserStore } from '../stores';
import { calculateXPProgress, calculateLevel } from '../constants/levelConfig';

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
      <p className="text-white font-bold">{value}</p>
      <p className="text-[#6E6E6E] text-xs">{label}</p>
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
        ${danger ? 'hover:bg-[#E74C3C]/10' : 'hover:bg-[#3A3A3A]'}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={danger ? 'text-[#E74C3C]' : 'text-[#A0A0A0]'} />
        <span className={danger ? 'text-[#E74C3C]' : 'text-white'}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-[#6E6E6E]" />
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const { stats } = useUserStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const xpProgress = calculateXPProgress(stats.xp);
  const level = calculateLevel(stats.xp);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // League tier display
  const leagueTiers = {
    ferro: { label: 'Liga Ferro', color: '#6E6E6E', emoji: '🔩' },
    bronze: { label: 'Liga Bronze', color: '#CD7F32', emoji: '🥉' },
    prata: { label: 'Liga Prata', color: '#C0C0C0', emoji: '🥈' },
    ouro: { label: 'Liga Ouro', color: '#FFD700', emoji: '🥇' },
    diamante: { label: 'Liga Diamante', color: '#B9F2FF', emoji: '💎' },
  };

  const currentLeague = leagueTiers[profile?.league_tier || 'ferro'];

  return (
    <div className="p-4 pb-24">
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#3A3A3A] flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-[#6E6E6E]" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center shadow-lg">
              <Camera size={14} className="text-black" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {profile?.name || 'Estudante'}
              </h2>
              <button className="p-1 hover:bg-[#3A3A3A] rounded-full transition-colors">
                <Edit2 size={14} className="text-[#A0A0A0]" />
              </button>
            </div>
            <p className="text-[#6E6E6E] text-sm">{profile?.email}</p>

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
        <div className="mt-4 pt-4 border-t border-[#3A3A3A]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center">
                <span className="text-[#FFB800] font-bold text-sm">{level}</span>
              </div>
              <span className="text-white font-medium">Nivel {level}</span>
            </div>
            <span className="text-[#6E6E6E] text-sm">
              {xpProgress.current}/{xpProgress.needed} XP
            </span>
          </div>
          <Progress value={xpProgress.percentage} size="sm" color="brand" />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard icon={Target} label="Questoes" value={stats.totalAnswered} color="#3498DB" />
        <StatCard icon={Award} label="Acertos" value={stats.correctAnswers} color="#2ECC71" />
        <StatCard icon={Flame} label="Ofensiva" value={stats.streak} color="#E74C3C" />
        <StatCard
          icon={() => <span className="text-xl">💰</span>}
          label="Moedas"
          value={stats.coins}
          color="#FFB800"
        />
      </div>

      {/* Achievements Preview */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Conquistas</h3>
          <button className="text-[#FFB800] text-sm hover:underline">Ver todas</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['🎯', '🔥', '📚', '⭐', '🏆'].map((emoji, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                ${i < 3 ? 'bg-[#FFB800]/20' : 'bg-[#3A3A3A]'}
              `}
            >
              {i < 3 ? emoji : '🔒'}
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Menu Options */}
      <Card padding="none" className="mb-6">
        <MenuButton
          icon={Settings}
          label="Configuracoes"
          onClick={() => console.log('Settings')}
        />
        <MenuButton
          icon={Bell}
          label="Notificacoes"
          onClick={() => console.log('Notifications')}
        />
        <MenuButton
          icon={Shield}
          label="Privacidade"
          onClick={() => console.log('Privacy')}
        />
        <MenuButton
          icon={HelpCircle}
          label="Ajuda e Suporte"
          onClick={() => console.log('Help')}
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
          <div className="w-16 h-16 rounded-full bg-[#E74C3C]/20 flex items-center justify-center mx-auto mb-4">
            <LogOut size={28} className="text-[#E74C3C]" />
          </div>
          <p className="text-white mb-2">Tem certeza que deseja sair?</p>
          <p className="text-[#6E6E6E] text-sm mb-6">
            Voce pode voltar a qualquer momento.
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
