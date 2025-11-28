
import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, ShieldCheck, Star } from 'lucide-react';
import { Course } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onConfirm: (course: Course) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, course, onConfirm }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'card'>('pix');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBuy = () => {
    if (!course) return;
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm(course);
      onClose();
    }, 2000);
  };

  if (!shouldRender || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div 
        className={`w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl flex flex-col border-t border-x border-gray-800 shadow-[0_-10px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-transform duration-300 ease-out pointer-events-auto transform ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-[#252525]">
          <h3 className="font-bold text-white text-lg flex items-center">
             <ShieldCheck className="mr-2 text-green-500" size={20} />
             Checkout Seguro
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] no-scrollbar">
            
            {/* Course Summary */}
            <div className="bg-[#252525] p-5 rounded-2xl border border-gray-700 mb-6 flex items-start space-x-4">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-3xl border border-gray-800 shadow-lg">
                    {course.icon}
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg leading-tight mb-1">{course.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{course.subtitle}</p>
                    <div className="inline-block bg-[#FFB800]/20 border border-[#FFB800]/50 px-2 py-0.5 rounded text-xs font-bold text-[#FFB800]">
                        Acesso Imediato
                    </div>
                </div>
            </div>

            {/* Price Info */}
            <div className="flex justify-between items-end mb-6 px-2">
                <div>
                    <span className="block text-gray-500 text-xs line-through">De R$ 99,90</span>
                    <span className="block text-white font-bold text-sm">Por apenas</span>
                </div>
                <div className="text-3xl font-bold text-[#FFB800]">{course.price}</div>
            </div>

            {/* Benefits */}
            <ul className="space-y-3 mb-6 bg-[#1A1A1A] p-4 rounded-xl">
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3" />
                    Banco de questões ilimitado
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3" />
                    Comentários de professores IA
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3" />
                    Simulados com ranking
                </li>
                <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mr-3" />
                    Garantia de 7 dias
                </li>
            </ul>

            {/* Payment Methods */}
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Forma de Pagamento</h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                    onClick={() => setSelectedMethod('pix')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedMethod === 'pix' ? 'bg-[#FFB800]/10 border-[#FFB800] text-[#FFB800]' : 'bg-[#252525] border-gray-700 text-gray-500 hover:border-gray-500'}`}
                >
                    <Star size={24} className="mb-2" />
                    <span className="font-bold text-sm">Pix</span>
                    <span className="text-[10px] opacity-70">Aprovação Imediata</span>
                </button>
                <button 
                    onClick={() => setSelectedMethod('card')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedMethod === 'card' ? 'bg-[#FFB800]/10 border-[#FFB800] text-[#FFB800]' : 'bg-[#252525] border-gray-700 text-gray-500 hover:border-gray-500'}`}
                >
                    <CreditCard size={24} className="mb-2" />
                    <span className="font-bold text-sm">Cartão</span>
                    <span className="text-[10px] opacity-70">Até 3x sem juros</span>
                </button>
            </div>

            {/* CTA */}
            <button 
                onClick={handleBuy}
                disabled={isProcessing}
                className="w-full py-4 bg-[#FFB800] hover:bg-[#FFC933] text-black font-bold text-lg rounded-xl shadow-lg shadow-yellow-900/20 transition-all flex items-center justify-center"
            >
                {isProcessing ? (
                     <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>Pagar Agora</>
                )}
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-4 flex items-center justify-center">
                <ShieldCheck size={12} className="mr-1" /> Ambiente 100% seguro e criptografado
            </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
