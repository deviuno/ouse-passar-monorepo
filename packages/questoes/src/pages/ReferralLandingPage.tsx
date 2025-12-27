import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Loader2, AlertCircle, Gift, Target, Zap } from 'lucide-react';
import { Button } from '../components/ui';
import {
  getUserByUsername,
  saveReferrerToStorage,
  trackReferralVisit,
} from '../services/referralService';
import { LOGO_URL } from '../constants';

interface ReferrerInfo {
  id: string;
  name?: string;
  avatar_url?: string;
}

export default function ReferralLandingPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    loadReferrer(username);
  }, [username]);

  const loadReferrer = async (username: string) => {
    setLoading(true);
    try {
      const user = await getUserByUsername(username);

      if (!user) {
        setNotFound(true);
        return;
      }

      setReferrer(user);

      // Salvar referrer no localStorage
      saveReferrerToStorage(username);

      // Registrar visita para analytics
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      trackReferralVisit(username, sessionId);
    } catch (e) {
      console.error('Erro ao carregar indicador:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
        <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#E74C3C]/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-[#E74C3C]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-[#A0A0A0] mb-6">
            Este link de indicação não é válido ou expirou.
          </p>
          <Button fullWidth onClick={() => navigate('/onboarding')}>
            Criar Conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-center">
        <img src={LOGO_URL} alt="Ouse Passar" className="h-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          className="bg-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Referrer Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#3A3A3A] flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-[#FFB800]/30">
              {referrer?.avatar_url ? (
                <img
                  src={referrer.avatar_url}
                  alt={referrer.name || 'Indicador'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-[#6E6E6E]" />
              )}
            </div>
            <p className="text-[#A0A0A0] text-sm">Você foi convidado por</p>
            <h1 className="text-2xl font-bold text-white mt-1">
              {referrer?.name || 'Um amigo'}
            </h1>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-[#FFB800]/10 to-[#2ECC71]/10 rounded-xl p-4 mb-6">
            <h2 className="text-white font-semibold mb-3 text-center">
              Benefícios exclusivos para você
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3498DB]/20 flex items-center justify-center">
                  <Target size={20} className="text-[#3498DB]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Acesso a questões</p>
                  <p className="text-[#6E6E6E] text-xs">Milhares de questões de concursos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/20 flex items-center justify-center">
                  <Zap size={20} className="text-[#2ECC71]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Trilha personalizada</p>
                  <p className="text-[#6E6E6E] text-xs">Estudos adaptados ao seu nível</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9B59B6]/20 flex items-center justify-center">
                  <Gift size={20} className="text-[#9B59B6]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Recompensas</p>
                  <p className="text-[#6E6E6E] text-xs">Ganhe XP, moedas e conquistas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button fullWidth size="lg" onClick={handleContinue}>
              Criar Minha Conta
            </Button>
            <Button fullWidth variant="ghost" onClick={handleLogin}>
              Já tenho uma conta
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-[#6E6E6E] text-xs text-center mt-6">
          Ao criar sua conta, você concorda com nossos{' '}
          <a href="/termos-de-uso" className="text-[#FFB800] hover:underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/politica-de-privacidade" className="text-[#FFB800] hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
