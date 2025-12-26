import React from 'react';
import { Lock, Flame, BookOpen } from 'lucide-react';
import { StudyMode } from '../../types/trail';
import { RETA_FINAL_THEME } from '../../services/retaFinalService';

interface ModeToggleProps {
  currentMode: StudyMode;
  hasNormalAccess: boolean;
  hasRetaFinalAccess: boolean;
  onModeChange: (mode: StudyMode) => void;
  onUpsellClick: (targetMode: StudyMode) => void;
  isLoading?: boolean;
}

export function ModeToggle({
  currentMode,
  hasNormalAccess,
  hasRetaFinalAccess,
  onModeChange,
  onUpsellClick,
  isLoading = false,
}: ModeToggleProps) {
  const handleModeClick = (mode: StudyMode) => {
    if (isLoading) return;

    // Check if user has access to the mode
    if (mode === 'normal' && !hasNormalAccess) {
      onUpsellClick('normal');
      return;
    }
    if (mode === 'reta_final' && !hasRetaFinalAccess) {
      onUpsellClick('reta_final');
      return;
    }

    // User has access, switch mode
    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  const isRetaFinalActive = currentMode === 'reta_final';

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-transparent">
      {/* Normal Mode Button */}
      <button
        onClick={() => handleModeClick('normal')}
        disabled={isLoading}
        className={`
          relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200
          ${currentMode === 'normal'
            ? 'bg-[#2A2A2A] text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-300'
          }
          ${!hasNormalAccess ? 'opacity-60' : ''}
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Normal</span>
        {!hasNormalAccess && (
          <Lock className="w-3 h-3 ml-0.5 text-gray-500" />
        )}
      </button>

      {/* Reta Final Mode Button */}
      <button
        onClick={() => handleModeClick('reta_final')}
        disabled={isLoading}
        className={`
          relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200
          ${isRetaFinalActive
            ? 'text-black shadow-sm'
            : 'text-gray-400 hover:text-orange-300'
          }
          ${!hasRetaFinalAccess ? 'opacity-60' : ''}
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          background: isRetaFinalActive
            ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary} 0%, ${RETA_FINAL_THEME.colors.accent} 100%)`
            : 'transparent',
        }}
      >
        <Flame className={`w-3.5 h-3.5 ${isRetaFinalActive ? 'text-black' : ''}`} />
        <span>Reta Final</span>
        {!hasRetaFinalAccess && (
          <Lock className="w-3 h-3 ml-0.5 text-gray-500" />
        )}
      </button>
    </div>
  );
}

// Compact version for smaller spaces (mobile) - with full text but smaller
export function ModeToggleCompact({
  currentMode,
  hasNormalAccess,
  hasRetaFinalAccess,
  onModeChange,
  onUpsellClick,
  isLoading = false,
}: ModeToggleProps) {
  const handleModeClick = (mode: StudyMode) => {
    if (isLoading) return;

    if (mode === 'normal' && !hasNormalAccess) {
      onUpsellClick('normal');
      return;
    }
    if (mode === 'reta_final' && !hasRetaFinalAccess) {
      onUpsellClick('reta_final');
      return;
    }

    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  const isRetaFinalActive = currentMode === 'reta_final';

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-transparent">
      {/* Normal Mode Button */}
      <button
        onClick={() => handleModeClick('normal')}
        disabled={isLoading}
        className={`
          relative flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-200
          ${currentMode === 'normal'
            ? 'bg-[#2A2A2A] text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-300'
          }
          ${!hasNormalAccess ? 'opacity-60' : ''}
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <BookOpen className="w-3 h-3" />
        <span>Normal</span>
        {!hasNormalAccess && (
          <Lock className="w-2.5 h-2.5 text-gray-500" />
        )}
      </button>

      {/* Reta Final Mode Button */}
      <button
        onClick={() => handleModeClick('reta_final')}
        disabled={isLoading}
        className={`
          relative flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-200
          ${isRetaFinalActive
            ? 'text-black shadow-sm'
            : 'text-gray-400 hover:text-orange-300'
          }
          ${!hasRetaFinalAccess ? 'opacity-60' : ''}
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          background: isRetaFinalActive
            ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary} 0%, ${RETA_FINAL_THEME.colors.accent} 100%)`
            : 'transparent',
        }}
      >
        <Flame className={`w-3 h-3 ${isRetaFinalActive ? 'text-black' : ''}`} />
        <span className="whitespace-nowrap">Reta Final</span>
        {!hasRetaFinalAccess && (
          <Lock className="w-2.5 h-2.5 text-gray-500" />
        )}
      </button>
    </div>
  );
}

export default ModeToggle;
