import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  sidebarWidth: number;
}

export function FloatingChatButton({ isOpen, onClick, sidebarWidth = 0 }: FloatingChatButtonProps) {
  return (
    <motion.button
      data-floating-chat-button
      onClick={onClick}
      className="fixed bottom-8 z-50"
      initial={{ y: 100, opacity: 0, right: sidebarWidth + 32 }}
      animate={{ y: 0, opacity: 1, right: sidebarWidth + 32 }}
      exit={{ y: 100, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >

      {/* Main button */}
      <div className={`
        relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg
        transition-all duration-300
        ${isOpen
          ? 'bg-[#3A3A3A] border-2 border-[#FFB800]'
          : 'bg-gradient-to-br from-[#FFB800] to-[#FF9500] border-2 border-[#FFD700]'
        }
      `}>
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} className="text-[#FFB800]" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles size={24} className="text-black" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default FloatingChatButton;
