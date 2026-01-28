import React from 'react';
import { motion } from 'framer-motion';

export function QuestionsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-4 bg-gray-50 dark:bg-transparent"
    >
      {/* Progress bar skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
        <div className="flex-1 h-3 bg-gray-200 dark:bg-[#2A2A2A] rounded-full animate-pulse" />
        <div className="w-12 h-5 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse" />
      </div>

      {/* Question card skeleton */}
      <div className="bg-white dark:bg-[#252525] rounded-xl p-6 border border-gray-200 dark:border-[#3A3A3A] flex-1">
        {/* Question header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-24 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse" />
        </div>

        {/* Question text */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse w-11/12" />
          <div className="h-4 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse w-4/5" />
        </div>

        {/* Options skeleton */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[var(--color-bg-main)] rounded-xl border border-gray-200 dark:border-[var(--color-border)]"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[var(--color-bg-elevated)] animate-pulse flex-shrink-0" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-[var(--color-bg-elevated)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
