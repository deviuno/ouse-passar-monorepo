import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, LogIn, UserPlus } from 'lucide-react';
import { LOGO_URL } from '../../constants';

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
      <motion.img
        src={LOGO_URL}
        alt="Ouse Passar"
        className="h-16 mx-auto mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />

      <h1 className="text-3xl font-bold text-white mb-3">
        Bem-vindo ao Ouse Passar!
      </h1>
      <p className="text-[#A0A0A0] mb-10 text-lg">
        A plataforma que vai te ajudar a conquistar sua aprovacao.
      </p>

      {/* Opcoes */}
      <div className="space-y-4">
        {/* Criar Conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateAccount}
          className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 px-6 rounded-2xl
            flex items-center justify-center gap-3 transition-colors"
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

        {/* Ja tem conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full bg-[#252525] hover:bg-[#303030] text-white font-bold py-4 px-6 rounded-2xl
            border-2 border-[#3A3A3A] hover:border-[#FFB800]/50
            flex items-center justify-center gap-3 transition-all"
        >
          <LogIn size={24} className="text-[#FFB800]" />
          <div className="text-left">
            <span className="block text-lg">Ja tenho uma conta</span>
            <span className="block text-sm font-normal text-[#A0A0A0]">
              Fazer login
            </span>
          </div>
          <ChevronRight size={24} className="ml-auto text-[#6E6E6E]" />
        </motion.button>
      </div>

      {/* Footer */}
      <p className="text-[#6E6E6E] text-sm mt-10">
        Ao continuar, voce concorda com nossos{' '}
        <a href="#" className="text-[#FFB800] hover:underline">
          Termos de Uso
        </a>{' '}
        e{' '}
        <a href="#" className="text-[#FFB800] hover:underline">
          Politica de Privacidade
        </a>
      </p>
    </motion.div>
  );
}
