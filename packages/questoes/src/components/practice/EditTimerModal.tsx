import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Save } from 'lucide-react';

interface EditTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMinutes: number;
  onSave: (minutes: number) => void;
  isSaving?: boolean;
}

export const EditTimerModal: React.FC<EditTimerModalProps> = ({
  isOpen,
  onClose,
  currentMinutes,
  onSave,
  isSaving = false,
}) => {
  const [minutes, setMinutes] = useState(currentMinutes);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMinutes(currentMinutes);
    }
  }, [isOpen, currentMinutes]);

  const handleSave = () => {
    if (minutes >= 1 && minutes <= 480) {
      onSave(minutes);
    }
  };

  const presetTimes = [30, 60, 90, 120, 180, 240];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Timer size={20} className="text-[var(--color-brand)]" />
              <h2 className="text-base font-semibold text-[var(--color-text-main)]">
                Configurar Tempo
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Custom input */}
            <div className="mb-4">
              <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
                Tempo em minutos
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-lg font-mono font-bold text-[var(--color-text-main)] text-center focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                />
                <span className="text-sm text-[var(--color-text-muted)]">min</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                Mínimo: 1 min · Máximo: 480 min (8h)
              </p>
            </div>

            {/* Preset times */}
            <div className="mb-4">
              <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
                Atalhos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setMinutes(time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      minutes === time
                        ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-black'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-sec)] hover:border-[var(--color-brand)] hover:text-[var(--color-text-main)]'
                    }`}
                  >
                    {time >= 60 ? `${time / 60}h` : `${time}min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              O cronômetro será reiniciado com o novo tempo. Esta preferência será salva para suas próximas sessões.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] hover:border-[var(--color-text-muted)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || minutes < 1 || minutes > 480}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand)] rounded-lg text-sm font-bold text-black hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditTimerModal;
