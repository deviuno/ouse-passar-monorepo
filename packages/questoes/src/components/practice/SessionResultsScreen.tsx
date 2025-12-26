import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, Target, Zap, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '../ui';
import { PracticeMode } from '../../types';

interface SessionResultsScreenProps {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  studyMode: PracticeMode;
  timeSpent?: number; // em segundos
  xpEarned: number;
  onNewSession: () => void;
  onBackToMenu: () => void;
}

export function SessionResultsScreen({
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  studyMode,
  timeSpent,
  xpEarned,
  onNewSession,
  onBackToMenu,
}: SessionResultsScreenProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const isPerfect = accuracy === 100;
  const isGood = accuracy >= 70;
  const isOk = accuracy >= 50;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    if (isPerfect) return { text: 'Perfeito! 🎉', color: 'text-[#FFD700]' };
    if (isGood) return { text: 'Excelente! 🌟', color: 'text-[#2ECC71]' };
    if (isOk) return { text: 'Bom trabalho! 💪', color: 'text-[#3498DB]' };
    return { text: 'Continue praticando! 📚', color: 'text-[#E74C3C]' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="w-full max-w-2xl"
      >
        {/* Header com performance */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="mb-4"
          >
            <Trophy size={80} className={performance.color + ' mx-auto'} />
          </motion.div>
          <h1 className={`text-4xl font-extrabold ${performance.color} mb-2`}>
            {performance.text}
          </h1>
          <p className="text-[#A0A0A0] text-lg">Sessão concluída</p>
        </div>

        {/* Card principal de resultados */}
        <div className="bg-[#1E1E1E] border border-[#3A3A3A] rounded-2xl p-6 lg:p-8 mb-6">
          {/* Percentual de acerto */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <svg className="w-40 h-40 lg:w-48 lg:h-48" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#3A3A3A"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={isPerfect ? '#FFD700' : isGood ? '#2ECC71' : isOk ? '#3498DB' : '#E74C3C'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  strokeDashoffset={`${2 * Math.PI * 85 * (1 - accuracy / 100)}`}
                  transform="rotate(-90 100 100)"
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - accuracy / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl lg:text-6xl font-extrabold text-white">{accuracy}%</div>
                  <div className="text-sm text-[#A0A0A0] mt-1">acertos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#3A3A3A]">
              <Target size={24} className="text-[#FFB800] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{totalQuestions}</div>
              <div className="text-xs text-[#A0A0A0] mt-1">Questões</div>
            </div>

            <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#3A3A3A]">
              <CheckCircle size={24} className="text-[#2ECC71] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#2ECC71]">{correctAnswers}</div>
              <div className="text-xs text-[#A0A0A0] mt-1">Acertos</div>
            </div>

            <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#3A3A3A]">
              <XCircle size={24} className="text-[#E74C3C] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#E74C3C]">{wrongAnswers}</div>
              <div className="text-xs text-[#A0A0A0] mt-1">Erros</div>
            </div>

            <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#3A3A3A]">
              <Zap size={24} className="text-[#FFB800] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#FFB800]">+{xpEarned}</div>
              <div className="text-xs text-[#A0A0A0] mt-1">XP ganho</div>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {timeSpent && (
              <div className="flex items-center gap-2 bg-[#252525] px-4 py-2 rounded-lg border border-[#3A3A3A]">
                <Clock size={16} className="text-[#A0A0A0]" />
                <span className="text-white font-medium">{formatTime(timeSpent)}</span>
                <span className="text-[#6E6E6E]">tempo total</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-[#252525] px-4 py-2 rounded-lg border border-[#3A3A3A]">
              <TrendingUp size={16} className="text-[#A0A0A0]" />
              <span className="text-white font-medium">Modo {studyMode === 'zen' ? 'Zen' : 'Simulado'}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Button
            fullWidth
            size="lg"
            onClick={onNewSession}
            className="bg-gradient-to-r from-[#FFB800] to-[#E5A600] text-black font-extrabold hover:shadow-lg hover:shadow-[#FFB800]/20"
            leftIcon={<RotateCcw size={20} />}
          >
            Nova Sessão
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={onBackToMenu}
          >
            Voltar ao Menu
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
