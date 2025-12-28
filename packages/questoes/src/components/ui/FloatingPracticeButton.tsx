import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen } from 'lucide-react';

interface FloatingPracticeButtonProps {
  isVisible: boolean;
  onClick: () => void;
  hasProgress?: boolean;
}

export function FloatingPracticeButton({
  isVisible,
  onClick,
  hasProgress = false,
}: FloatingPracticeButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={onClick}
          className="fixed z-40 flex items-center gap-2 px-5 py-3
                     bg-[#FFB800] text-black font-semibold rounded-full
                     shadow-lg hover:shadow-xl hover:bg-[#E5A600]
                     transition-all duration-200
                     bottom-20 lg:bottom-8 right-4"
        >
          {hasProgress ? (
            <>
              <Play size={20} fill="currentColor" />
              <span>Continuar</span>
            </>
          ) : (
            <>
              <BookOpen size={20} />
              <span>Praticar</span>
            </>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
