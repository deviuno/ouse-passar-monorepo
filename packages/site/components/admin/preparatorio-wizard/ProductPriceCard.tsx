import React from 'react';

interface ProductPriceCardProps {
  title: string;
  icon: string;
  description: string;
  precoValue: string;
  descontoValue: string;
  checkoutValue: string;
  guruProductIdValue: string;
  onPrecoChange: (value: string) => void;
  onDescontoChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  onGuruProductIdChange: (value: string) => void;
}

export const ProductPriceCard: React.FC<ProductPriceCardProps> = ({
  title,
  icon,
  description,
  precoValue,
  descontoValue,
  checkoutValue,
  guruProductIdValue,
  onPrecoChange,
  onDescontoChange,
  onCheckoutChange,
  onGuruProductIdChange,
}) => {
  const isConfigured = precoValue && checkoutValue;

  return (
    <div className={`bg-brand-dark/50 border rounded-lg p-4 transition-colors ${
      isConfigured
        ? 'border-green-500/30 hover:border-green-500/50'
        : 'border-white/10 hover:border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="text-white font-bold">{title}</h4>
            <p className="text-gray-500 text-xs">{description}</p>
          </div>
        </div>
        {isConfigured ? (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Ativo
          </span>
        ) : (
          <span className="text-xs bg-gray-500/20 text-gray-500 px-2 py-1 rounded-full">
            Oculto
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Preço (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={precoValue}
            onChange={(e) => onPrecoChange(e.target.value)}
            placeholder="0,00"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Desconto (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={descontoValue}
            onChange={(e) => onDescontoChange(e.target.value)}
            placeholder="Opcional"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Link de Checkout
        </label>
        <input
          type="url"
          value={checkoutValue}
          onChange={(e) => onCheckoutChange(e.target.value)}
          placeholder="https://pay.digitalmanager.guru/..."
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          ID do Produto (Guru)
        </label>
        <input
          type="text"
          value={guruProductIdValue}
          onChange={(e) => onGuruProductIdChange(e.target.value)}
          placeholder="prod_abc123..."
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600 font-mono"
        />
        <p className="text-xs text-gray-600 mt-1">
          Encontre em: Guru Admin → Produtos → ID do produto
        </p>
      </div>
    </div>
  );
};
