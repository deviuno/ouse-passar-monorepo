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

  // Get the progress circle color based on performance
  const getProgressColor = () => {
    if (isPerfect) return 'var(--color-warning)';
    if (isGood) return 'var(--color-success)';
    if (isOk) return 'var(--color-info)';
    return 'var(--color-error)';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    if (isPerfect) return { text: 'Perfeito! 🎉', color: 'text-[var(--color-warning)]' };
    if (isGood) return { text: 'Excelente! 🌟', color: 'text-[var(--color-success)]' };
    if (isOk) return { text: 'Bom trabalho! 💪', color: 'text-[var(--color-info)]' };
    return { text: 'Continue praticando! 📚', color: 'text-[var(--color-error)]' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center p-4">
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
          <p className="text-[var(--color-text-sec)] text-lg">Sessão concluída</p>
        </div>

        {/* Card principal de resultados */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 lg:p-8 mb-6 shadow-[var(--shadow-card)]">
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
                  className="stroke-[var(--color-border)]"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={getProgressColor()}
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
                  <div className="text-5xl lg:text-6xl font-extrabold text-[var(--color-text-main)]">{accuracy}%</div>
                  <div className="text-sm text-[var(--color-text-sec)] mt-1">acertos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <Target size={24} className="text-[var(--color-brand)] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[var(--color-text-main)]">{totalQuestions}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Questões</div>
            </div>

            <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <CheckCircle size={24} className="text-[var(--color-success)] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[var(--color-success)]">{correctAnswers}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Acertos</div>
            </div>

            <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <XCircle size={24} className="text-[var(--color-error)] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[var(--color-error)]">{wrongAnswers}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Erros</div>
            </div>

            <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <Zap size={24} className="text-[var(--color-brand)] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[var(--color-brand)]">+{xpEarned}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">XP ganho</div>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {timeSpent && (
              <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] px-4 py-2 rounded-lg border border-[var(--color-border)]">
                <Clock size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text-main)] font-medium">{formatTime(timeSpent)}</span>
                <span className="text-[var(--color-text-muted)]">tempo total</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] px-4 py-2 rounded-lg border border-[var(--color-border)]">
              <TrendingUp size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-main)] font-medium">Modo {studyMode === 'zen' ? 'Zen' : 'Simulado'}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Button
            fullWidth
            size="lg"
            onClick={onNewSession}
            className="bg-[#ffac00] hover:bg-[#ffbc33] text-black font-extrabold hover:shadow-lg hover:shadow-[#ffac00]/20"
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
