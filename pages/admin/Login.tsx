import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        navigate('/admin');
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-brand-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
            alt="Ouse Passar"
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-3xl font-black text-white font-display uppercase tracking-tight mb-2">
            Painel <span className="text-brand-yellow">Administrativo</span>
          </h1>
          <p className="text-gray-400 text-sm">Acesso restrito a administradores</p>
        </div>

        {/* Login Card */}
        <div className="bg-brand-card border border-white/10 p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-full"></div>

          <div className="relative z-10">
            {/* Shield Icon */}
            <div className="w-16 h-16 bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center mb-6 mx-auto">
              <Shield className="w-8 h-8 text-brand-yellow" />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ousepassar.com"
                    required
                    disabled={isLoading}
                    className="w-full bg-brand-dark border border-white/10 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-brand-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full bg-brand-dark border border-white/10 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-brand-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-yellow text-brand-darker py-4 font-black uppercase tracking-widest hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no Painel'
                )}
              </button>
            </form>

            {/* Back to Site Link */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-gray-400 hover:text-brand-yellow transition-colors inline-flex items-center"
              >
                ← Voltar para o site
              </a>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            🔒 Conexão Segura
          </p>
        </div>
      </div>
    </div>
  );
};
