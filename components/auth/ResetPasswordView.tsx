import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { updatePassword } from '../../services/authService';

interface ResetPasswordViewProps {
  onSuccess: () => void;
  logoUrl?: string;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onSuccess,
  logoUrl
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await updatePassword(password);
    setIsLoading(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Senha atualizada!</h2>
          <p className="text-gray-400 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado em instantes...
          </p>
          <Loader2 className="animate-spin text-[#FFB800] mx-auto" size={24} />
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-white mb-2">Criar nova senha</h2>
          <p className="text-gray-400 text-sm">
            Digite sua nova senha abaixo.
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

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Nova senha
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
                autoFocus
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
              Confirmar nova senha
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
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar nova senha</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordView;
