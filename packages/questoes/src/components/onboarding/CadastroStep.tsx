import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

interface CadastroStepProps {
  data: { name?: string; email?: string; phone?: string; password?: string };
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit?: () => void;
}

export function CadastroStep({
  data,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
}: CadastroStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onPhoneChange(formatted);
  };

  // Handler para tecla Enter - submete o formulário
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Crie sua conta</h2>
      <p className="text-[var(--color-text-sec)] mb-6">
        Preencha seus dados para começar sua jornada de estudos.
      </p>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm text-[var(--color-text-sec)] mb-2">Nome completo</label>
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Seu nome completo"
              className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4
                text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-[var(--color-text-sec)] mb-2">E-mail</label>
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="seu@email.com"
              className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4
                text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
        </div>

        {/* Celular */}
        <div>
          <label className="block text-sm text-[var(--color-text-sec)] mb-2">Celular (WhatsApp)</label>
          <div className="relative">
            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="tel"
              value={data.phone || ''}
              onChange={handlePhoneChange}
              onKeyDown={handleKeyDown}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4
                text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm text-[var(--color-text-sec)] mb-2">Senha</label>
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password || ''}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-12
                text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {data.password && data.password.length < 6 && (
            <p className="text-[var(--color-error)] text-xs mt-1">A senha deve ter no mínimo 6 caracteres</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
