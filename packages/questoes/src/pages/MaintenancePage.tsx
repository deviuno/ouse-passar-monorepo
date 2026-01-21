import React from 'react';
import { Wrench, RefreshCw } from 'lucide-react';
import { Logo } from '../components/ui';

interface MaintenancePageProps {
  onRetry?: () => void;
}

export function MaintenancePage({ onRetry }: MaintenancePageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 opacity-80">
        <Logo className="h-12" variant="dark" />
      </div>

      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-[#FFB800]/10 flex items-center justify-center mb-6">
        <Wrench className="w-12 h-12 text-[#FFB800]" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-3 text-center">
        Sistema em Manutenção
      </h1>

      {/* Description */}
      <p className="text-gray-400 text-center max-w-md mb-8">
        Estamos realizando melhorias no sistema para oferecer uma experiência ainda melhor.
        Por favor, tente novamente em alguns minutos.
      </p>

      {/* Retry Button */}
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 px-6 py-3 bg-[#FFB800] text-black font-bold rounded-xl hover:bg-[#FFB800]/90 transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Tentar Novamente
      </button>

      {/* Footer */}
      <p className="text-gray-500 text-sm mt-12">
        Agradecemos sua compreensão!
      </p>
    </div>
  );
}

export default MaintenancePage;
