import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore, useOnboardingStore } from '../stores';
import { Button, Logo } from '../components/ui';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthPageProps {
  mode?: AuthMode;
}

export default function AuthPage({ mode: initialMode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { login, register, forgotPassword, changePassword } = useAuthStore();
  const { goToStep, reset: resetOnboarding } = useOnboardingStore();

  const [mode, setMode] = useState<AuthMode>(
    initialMode || (searchParams.get('mode') as AuthMode) || 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      switch (mode) {
        case 'login':
          result = await login(email, password);
          if (!result.error) {
            navigate(from, { replace: true });
          }
          break;

        case 'register':
          result = await register(email, password, name);
          if (!result.error) {
            navigate('/onboarding', { replace: true });
          }
          break;

        case 'forgot':
          result = await forgotPassword(email);
          if (!result.error) {
            setSuccess('Email de recuperacao enviado! Verifique sua caixa de entrada.');
          }
          break;

        case 'reset':
          result = await changePassword(password);
          if (!result.error) {
            setSuccess('Senha alterada com sucesso!');
            setTimeout(() => setMode('login'), 2000);
          }
          break;
      }

      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegister = () => {
    resetOnboarding();
    goToStep('cadastro');
    navigate('/onboarding');
  };

  const titles: Record<AuthMode, string> = {
    login: 'Entrar',
    register: 'Criar Conta',
    forgot: 'Recuperar Senha',
    reset: 'Nova Senha',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Bem-vindo de volta! Entre para continuar seus estudos.',
    register: 'Crie sua conta e comece a estudar agora.',
    forgot: 'Digite seu email para receber o link de recuperacao.',
    reset: 'Digite sua nova senha.',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo className="h-10" variant="auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">{titles[mode]}</h1>
          <p className="text-[var(--color-text-sec)]">{subtitles[mode]}</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 shadow-xl border border-[var(--color-border)]">
          {/* Back Button */}
          {mode !== 'login' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] mb-4 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </button>
          )}

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#E74C3C]/20 border border-[#E74C3C] text-[#E74C3C] p-3 rounded-xl mb-4 text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#2ECC71]/20 border border-[#2ECC71] text-[#2ECC71] p-3 rounded-xl mb-4 text-sm"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-[var(--color-text-sec)] mb-1.5">Nome</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4
                      text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                      focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm text-[var(--color-text-sec)] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4
                      text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                      focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-[var(--color-text-sec)] mb-1.5">
                  {mode === 'reset' ? 'Nova Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-12
                      text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                      focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-[var(--color-brand)] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              {mode === 'login' && 'Entrar'}
              {mode === 'forgot' && 'Enviar Email'}
              {mode === 'reset' && 'Alterar Senha'}
            </Button>
          </form>

          {/* Link para criar conta (vai direto para cadastro) */}
          {mode === 'login' && (
            <p className="text-center text-[var(--color-text-sec)] mt-6 text-sm">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={handleGoToRegister}
                className="text-[var(--color-brand)] hover:underline font-medium"
              >
                Criar conta
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
