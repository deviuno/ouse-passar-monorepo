import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores';
import { Button } from '../components/ui';
import { LOGO_URL } from '../constants';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthPageProps {
  mode?: AuthMode;
}

export default function AuthPage({ mode: initialMode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { login, register, loginWithGoogle, forgotPassword, changePassword } = useAuthStore();

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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const result = await loginWithGoogle();
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Ouse Passar" className="h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">{titles[mode]}</h1>
          <p className="text-[#A0A0A0]">{subtitles[mode]}</p>
        </div>

        {/* Card */}
        <div className="bg-[#252525] rounded-2xl p-6 shadow-xl">
          {/* Back Button */}
          {mode !== 'login' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-[#A0A0A0] hover:text-white mb-4 transition-colors"
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
                <label className="block text-sm text-[#A0A0A0] mb-1.5">Nome</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl py-3 pl-10 pr-4
                      text-white placeholder-[#6E6E6E]
                      focus:outline-none focus:border-[#FFB800] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm text-[#A0A0A0] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl py-3 pl-10 pr-4
                      text-white placeholder-[#6E6E6E]
                      focus:outline-none focus:border-[#FFB800] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-[#A0A0A0] mb-1.5">
                  {mode === 'reset' ? 'Nova Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl py-3 pl-10 pr-12
                      text-white placeholder-[#6E6E6E]
                      focus:outline-none focus:border-[#FFB800] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E6E] hover:text-white"
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
                  className="text-sm text-[#FFB800] hover:underline"
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

          {/* Divider - apenas no login */}
          {mode === 'login' && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#3A3A3A]" />
                <span className="text-[#6E6E6E] text-sm">ou</span>
                <div className="flex-1 h-px bg-[#3A3A3A]" />
              </div>

              {/* Google Login */}
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleGoogleLogin}
                isLoading={isLoading}
                leftIcon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              >
                Continuar com Google
              </Button>
            </>
          )}

          {/* Link para criar conta (vai para onboarding) */}
          {mode === 'login' && (
            <p className="text-center text-[#A0A0A0] mt-6 text-sm">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="text-[#FFB800] hover:underline font-medium"
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
