import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/authService';

interface ForgotPasswordViewProps {
  onNavigateToLogin: () => void;
  logoUrl?: string;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigateToLogin,
  logoUrl
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Digite um email válido');
      return;
    }

    setIsLoading(true);
    const { error: resetError } = await resetPassword(email);
    setIsLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Email enviado!</h2>
          <p className="text-gray-400 mb-6">
            Se existe uma conta com o email <span className="text-white font-medium">{email}</span>,
            você receberá um link para redefinir sua senha.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Não se esqueça de verificar a pasta de spam.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="text-[#FFB800] font-medium hover:underline flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft size={18} />
            <span>Voltar para o login</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onNavigateToLogin}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Ouse Passar" className="h-16 mx-auto mb-4" />
          ) : (
            <div className="text-3xl font-bold text-[#FFB800] mb-2">Ouse Passar</div>
          )}
          <h2 className="text-xl font-bold text-white mb-2">Esqueceu a senha?</h2>
          <p className="text-gray-400 text-sm">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
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
                autoFocus
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFB800] text-black font-bold py-3 rounded-xl hover:bg-[#E5A600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Enviando...</span>
              </>
            ) : (
              <span>Enviar link</span>
            )}
          </button>
        </form>

        {/* Help Text */}
        <p className="mt-8 text-center text-gray-500 text-sm">
          Lembrou a senha?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#FFB800] font-medium hover:underline"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
