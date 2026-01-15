import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '../ui';

interface LoadingStepProps {
  onComplete: () => void;
}

export function LoadingStep({ onComplete }: LoadingStepProps) {
  const [progress, setProgress] = useState(0);
  const messages = [
    'Analisando seu perfil...',
    'Configurando carga de questoes...',
    'Montando sua trilha personalizada...',
    'Quase la...',
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 25) setMessageIndex(0);
    else if (progress < 50) setMessageIndex(1);
    else if (progress < 75) setMessageIndex(2);
    else setMessageIndex(3);
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-[#3A3A3A] border-t-[#FFB800]"
      />

      <h2 className="text-2xl font-bold text-white mb-4">
        Carregando seu plano de estudos personalizado...
      </h2>

      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#A0A0A0] mb-8"
      >
        {messages[messageIndex]}
      </motion.p>

      <div className="max-w-xs mx-auto">
        <Progress value={progress} size="lg" showLabel />
      </div>
    </motion.div>
  );
}
