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
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Qual seu nível de conhecimento?</h2>
      <p className="text-[var(--color-text-sec)] mb-6">
        Isso nos ajuda a preparar uma trilha personalizada para você.
      </p>

      <div className="space-y-3">
        {NIVEL_OPTIONS.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.01, x: 5 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(option.id as UserLevel)}
            className={`
              w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all
              ${selected === option.id
                ? 'bg-[var(--color-brand)] text-black shadow-lg shadow-[var(--color-brand)]/20'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/50'
              }
            `}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight">{option.title}</h3>
              <p className={`text-sm ${selected === option.id ? 'text-black/70' : 'text-[var(--color-text-sec)]'}`}>
                {option.desc}
              </p>
            </div>
            <div className={`
              text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md
              ${selected === option.id ? 'bg-black/10 text-black' : 'bg-[var(--color-bg-elevated)] text-[var(--color-brand)]'}
            `}>
              {option.config}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
