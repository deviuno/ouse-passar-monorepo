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

// Compact version for smaller spaces
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
      {/* Normal Mode */}
      <button
        onClick={() => handleModeClick('normal')}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-200
          ${currentMode === 'normal'
            ? 'bg-[#2A2A2A] text-white'
            : 'text-gray-500 hover:text-gray-400'
          }
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={hasNormalAccess ? 'Modo Normal' : 'Modo Normal (bloqueado)'}
      >
        {!hasNormalAccess ? (
          <Lock className="w-4 h-4" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
      </button>

      {/* Reta Final Mode */}
      <button
        onClick={() => handleModeClick('reta_final')}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-200
          ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          background: isRetaFinalActive
            ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary} 0%, ${RETA_FINAL_THEME.colors.accent} 100%)`
            : 'transparent',
          color: isRetaFinalActive ? '#000' : '#6B7280',
        }}
        title={hasRetaFinalAccess ? 'Modo Reta Final' : 'Modo Reta Final (bloqueado)'}
      >
        {!hasRetaFinalAccess ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Flame className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default ModeToggle;
