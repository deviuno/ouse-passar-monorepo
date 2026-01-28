import React from 'react';

interface PhaseIndicatorProps {
  completedSessions: number;
  sessionsUntilLongBreak: number;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  completedSessions,
  sessionsUntilLongBreak,
}) => {
  const currentSessionInCycle = completedSessions % sessionsUntilLongBreak;

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: sessionsUntilLongBreak }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all ${
            index < currentSessionInCycle
              ? 'bg-[#10B981]'
              : index === currentSessionInCycle
                ? 'bg-[#FFB800]'
                : 'bg-[var(--color-border)]'
          }`}
          title={`Sessao ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PhaseIndicator;
