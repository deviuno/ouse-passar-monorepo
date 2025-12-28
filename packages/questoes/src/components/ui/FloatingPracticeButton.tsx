import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface FloatingPracticeButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export function FloatingPracticeButton({
  isVisible,
  onClick,
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
          className="fixed z-40 flex items-center gap-2 px-6 py-3
                     bg-[#FFB800] text-black font-semibold rounded-full
                     shadow-lg hover:shadow-xl hover:bg-[#E5A600]
                     transition-all duration-200
                     bottom-20 lg:bottom-8
                     left-1/2 -translate-x-1/2"
        >
          <BookOpen size={20} />
          <span>Praticar Questões</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
