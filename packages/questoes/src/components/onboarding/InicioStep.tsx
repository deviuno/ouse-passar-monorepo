import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, LogIn, UserPlus } from 'lucide-react';
import { Logo } from '../ui';

interface InicioStepProps {
  onLogin: () => void;
  onCreateAccount: () => void;
}

export function InicioStep({ onLogin, onCreateAccount }: InicioStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      {/* Logo */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Logo className="h-10" variant="auto" />
      </motion.div>

      <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-3">
        Bem-vindo ao Ouse Passar!
      </h1>
      <p className="text-[var(--color-text-sec)] mb-10 text-lg">
        A plataforma que vai te ajudar a conquistar sua aprovação.
      </p>

      {/* Opções */}
      <div className="space-y-4">
        {/* Criar Conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateAccount}
          className="w-full bg-[var(--color-brand)] hover:brightness-110 text-black font-bold py-4 px-6 rounded-2xl
            flex items-center justify-center gap-3 transition-all shadow-lg shadow-[var(--color-brand)]/20"
        >
          <UserPlus size={24} />
          <div className="text-left">
            <span className="block text-lg">Criar minha conta</span>
            <span className="block text-sm font-normal opacity-80">
              Comece sua jornada de estudos
            </span>
          </div>
          <ChevronRight size={24} className="ml-auto" />
        </motion.button>

        {/* Já tem conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] font-bold py-4 px-6 rounded-2xl
            border-2 border-[var(--color-border)] hover:border-[var(--color-brand)]/50
            flex items-center justify-center gap-3 transition-all shadow-sm"
        >
          <LogIn size={24} className="text-[var(--color-brand)]" />
          <div className="text-left">
            <span className="block text-lg">Já tenho uma conta</span>
            <span className="block text-sm font-normal text-[var(--color-text-sec)]">
              Fazer login
            </span>
          </div>
          <ChevronRight size={24} className="ml-auto text-[var(--color-text-muted)]" />
        </motion.button>
      </div>

      {/* Footer */}
      <p className="text-[var(--color-text-muted)] text-sm mt-10">
        Ao continuar, você concorda com nossos{' '}
        <a href="#" className="text-[var(--color-brand)] hover:underline">
          Termos de Uso
        </a>{' '}
        e{' '}
        <a href="#" className="text-[var(--color-brand)] hover:underline">
          Política de Privacidade
        </a>
      </p>
    </motion.div>
  );
}
