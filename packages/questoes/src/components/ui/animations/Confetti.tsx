import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

const colors = ['#FFB800', '#2ECC71', '#3498DB', '#E74C3C', '#9B59B6', '#1ABC9C'];

export function Confetti({
  isActive,
  duration = 3000,
  particleCount = 50,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration, particleCount]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                y: '110vh',
                rotate: piece.rotation + 720,
                scale: [1, 0.8, 1, 0.6],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: piece.delay,
                ease: 'linear',
              }}
              style={{ backgroundColor: piece.color }}
              className="absolute w-3 h-3 rounded-sm"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Success celebration animation
export function SuccessCelebration({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          <Confetti isActive={isActive} particleCount={100} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[150]"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
              className="text-8xl"
            >
              🎉
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Confetti;
