import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User } from 'lucide-react';
import { signUpWithEmail } from '../../services/authService';

interface RegisterViewProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  logoUrl?: string;
}

const RegisterView: React.FC<RegisterViewProps> = ({
  onSuccess,
  onNavigateToLogin,
  logoUrl
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasLetter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!name.trim()) {
      setError('Digite seu nome');
      return;
    }

    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    const { user, error: authError } = await signUpWithEmail(email, password, { name });
    setIsLoading(false);

    if (authError) {
      // Translate common errors
      if (authError.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else if (authError.includes('invalid email')) {
        setError('Email inválido');
      } else {
        setError(authError);
      }
      return;
    }

    if (user) {
      // Redireciona direto para o painel após cadastro
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Ouse Passar" className="h-16 mx-auto mb-4" />
          ) : (
            <div className="text-3xl font-bold text-[#FFB800] mb-2">Ouse Passar</div>
          )}
          <p className="text-gray-400 text-sm">Crie sua conta gratuita</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nome
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-[#252525] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#252525] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#252525] border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.minLength ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.minLength ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>Mínimo 6 caracteres</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasLetter ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLetter ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>Pelo menos uma letra</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasNumber ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasNumber ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>Pelo menos um número</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-[#252525] border rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-700 focus:border-[#FFB800] focus:ring-[#FFB800]'
                }`}
                disabled={isLoading}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFB800] text-black font-bold py-3 rounded-xl hover:bg-[#E5A600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Criando conta...</span>
              </>
            ) : (
              <span>Criar conta</span>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-gray-400">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#FFB800] font-medium hover:underline"
          >
            Faça login
          </button>
        </p>

        {/* Terms and Privacy */}
        <p className="mt-4 text-center text-gray-500 text-xs">
          Ao criar uma conta, você concorda com nossos{' '}
          <a
            href="/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#FFB800] underline"
          >
            Termos de Uso
          </a>
          {' '}e{' '}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#FFB800] underline"
          >
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;
