import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Target } from 'lucide-react';
import { Modal } from './Modal';

interface ModuleBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName?: string;
}

export function ModuleBlockedModal({
  isOpen,
  onClose,
  moduleName = 'Este módulo',
}: ModuleBlockedModalProps) {
  const navigate = useNavigate();

  const handleGoToPractice = () => {
    onClose();
    navigate('/praticar');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Módulo Indisponível"
      icon={<Lock size={20} className="text-[#FFB800]" />}
      size="sm"
    >
      <div className="flex flex-col items-center text-center py-4">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-[#FFB800]/10 flex items-center justify-center mb-4">
          <Lock size={32} className="text-[#FFB800]" />
        </div>

        {/* Message */}
        <p className="text-[#E0E0E0] mb-2">
          {moduleName} está temporariamente indisponível.
        </p>
        <p className="text-[#A0A0A0] text-sm mb-6">
          Enquanto isso, continue praticando questões para manter seu progresso!
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleGoToPractice}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#FFB800] hover:bg-[#FFC933] text-black font-semibold rounded-xl transition-colors"
          >
            <Target size={20} />
            Ir para Praticar Questões
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 text-[#A0A0A0] hover:text-white hover:bg-[#3A3A3A] rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ModuleBlockedModal;
