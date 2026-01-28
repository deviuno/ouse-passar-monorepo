import React, { useState } from 'react';
import { X, Minus, Plus, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { PomodoroSettings as Settings } from '../../stores/useStudyTimerStore';

interface PomodoroSettingsProps {
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
  onClose: () => void;
}

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Incremento para campos que avançam de 1 em 1 (Intervalo Curto)
  const incrementByOne = (key: 'breakDuration', delta: number) => {
    const currentMinutes = Math.floor(localSettings[key] / 60);
    const newMinutes = Math.max(1, Math.min(60, currentMinutes + delta));
    updateSetting(key, newMinutes * 60);
  };

  // Incremento para campos que avançam em múltiplos de 5 (Tempo de Estudo, Intervalo Longo)
  // Sequência: 1, 5, 10, 15, 20, 25, 30...
  const incrementByFive = (key: 'studyDuration' | 'longBreakDuration', direction: 'up' | 'down') => {
    const currentMinutes = Math.floor(localSettings[key] / 60);
    let newMinutes: number;

    if (direction === 'up') {
      if (currentMinutes < 5) {
        newMinutes = 5;
      } else {
        newMinutes = Math.ceil(currentMinutes / 5) * 5 + 5;
      }
    } else {
      if (currentMinutes <= 5) {
        newMinutes = 1;
      } else {
        newMinutes = Math.floor((currentMinutes - 1) / 5) * 5;
        if (newMinutes < 5) newMinutes = 1;
      }
    }

    newMinutes = Math.max(1, Math.min(60, newMinutes));
    updateSetting(key, newMinutes * 60);
  };

  const formatMinutes = (seconds: number) => Math.floor(seconds / 60);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)]">
            Configurações Pomodoro
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Study Duration */}
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              Tempo de Estudo
            </label>
            <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] rounded-lg px-4 py-3">
              <button
                onClick={() => incrementByFive('studyDuration', 'down')}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-semibold text-[var(--color-text-main)] tabular-nums">
                {formatMinutes(localSettings.studyDuration)} min
              </span>
              <button
                onClick={() => incrementByFive('studyDuration', 'up')}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              Intervalo Curto
            </label>
            <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] rounded-lg px-4 py-3">
              <button
                onClick={() => incrementByOne('breakDuration', -1)}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-semibold text-[var(--color-text-main)] tabular-nums">
                {formatMinutes(localSettings.breakDuration)} min
              </span>
              <button
                onClick={() => incrementByOne('breakDuration', 1)}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Long Break Duration */}
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              Intervalo Longo
            </label>
            <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] rounded-lg px-4 py-3">
              <button
                onClick={() => incrementByFive('longBreakDuration', 'down')}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-semibold text-[var(--color-text-main)] tabular-nums">
                {formatMinutes(localSettings.longBreakDuration)} min
              </span>
              <button
                onClick={() => incrementByFive('longBreakDuration', 'up')}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions until long break */}
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              Sessões até intervalo longo
            </label>
            <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] rounded-lg px-4 py-3">
              <button
                onClick={() => updateSetting('sessionsUntilLongBreak', Math.max(2, localSettings.sessionsUntilLongBreak - 1))}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-semibold text-[var(--color-text-main)] tabular-nums">
                {localSettings.sessionsUntilLongBreak}
              </span>
              <button
                onClick={() => updateSetting('sessionsUntilLongBreak', Math.min(8, localSettings.sessionsUntilLongBreak + 1))}
                className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            {/* Sound toggle */}
            <button
              onClick={() => updateSetting('soundEnabled', !localSettings.soundEnabled)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {localSettings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#FFB800]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
                <span className="text-sm text-[var(--color-text-main)]">
                  Som ao trocar de fase
                </span>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  localSettings.soundEnabled ? 'bg-[#FFB800]' : 'bg-[var(--color-border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                    localSettings.soundEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>

            {/* Notification toggle */}
            <button
              onClick={() => updateSetting('notificationsEnabled', !localSettings.notificationsEnabled)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {localSettings.notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-[#FFB800]" />
                ) : (
                  <BellOff className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
                <span className="text-sm text-[var(--color-text-main)]">
                  Notificação no navegador
                </span>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  localSettings.notificationsEnabled ? 'bg-[#FFB800]' : 'bg-[var(--color-border)]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                    localSettings.notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#FFB800] hover:bg-[#FFC933] text-black font-semibold rounded-lg transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroSettings;
