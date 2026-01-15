import React from 'react';
import { motion } from 'framer-motion';

export function ContentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-4"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse" />
        </div>
      </div>

      {/* Audio player skeleton */}
      <div className="bg-white dark:bg-[#252525] rounded-xl p-4 mb-6 border border-gray-200 dark:border-[#3A3A3A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-[#3A3A3A] animate-pulse" />
          <div className="flex-1">
            <div className="h-2 bg-gray-300 dark:bg-[#3A3A3A] rounded-full animate-pulse" />
          </div>
          <div className="w-12 h-4 bg-gray-300 dark:bg-[#3A3A3A] rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton - multiple paragraphs */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-11/12" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-4/5" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-10/12" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded animate-pulse w-5/6" />
        </div>
      </div>

      {/* Button skeleton */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#3A3A3A]">
        <div className="h-12 bg-gray-300 dark:bg-[#3A3A3A] rounded-xl animate-pulse w-full" />
      </div>
    </motion.div>
  );
}
