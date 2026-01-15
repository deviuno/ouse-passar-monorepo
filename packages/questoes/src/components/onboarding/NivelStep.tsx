import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { NIVEL_OPTIONS } from '../../constants';
import { UserLevel } from '../../types';

interface NivelStepProps {
  selected?: UserLevel;
  onSelect: (nivel: UserLevel) => void;
}

export function NivelStep({ selected, onSelect }: NivelStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Qual o seu nivel de preparacao?</h2>
      <p className="text-[#A0A0A0] mb-6">
        Isso ajusta a dificuldade e volume de questoes.
      </p>

      <div className="space-y-3">
        {NIVEL_OPTIONS.map((nivel) => (
          <motion.button
            key={nivel.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(nivel.id as UserLevel)}
            className={`
              w-full p-4 rounded-xl text-left transition-all
              flex items-start gap-4
              ${selected === nivel.id
                ? 'bg-[#FFB800]/20 border-2 border-[#FFB800]'
                : 'bg-[#252525] border-2 border-transparent hover:border-[#3A3A3A]'
              }
            `}
          >
            <span className="text-3xl">{nivel.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-medium">{nivel.title}</p>
              <p className="text-[#A0A0A0] text-sm">{nivel.desc}</p>
              <p className="text-[#FFB800] text-xs mt-1">{nivel.config}</p>
            </div>
            {selected === nivel.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-[#FFB800] flex items-center justify-center flex-shrink-0"
              >
                <Check size={14} className="text-black" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
