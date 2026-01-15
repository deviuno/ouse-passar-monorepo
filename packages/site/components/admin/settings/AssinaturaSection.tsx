import React from 'react';
import {
  CreditCard,
  CheckCircle,
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AssinaturaSectionProps {
  settings: SystemSetting[];
  onValueChange: (setting: SystemSetting, value: any) => void;
  modifiedSettings: Map<string, any>;
}

export function AssinaturaSection({
  settings,
  onValueChange,
  modifiedSettings,
}: AssinaturaSectionProps) {
  const assinaturaSettings = settings.filter((s) => s.category === 'assinatura');

  const getSettingValue = (key: string): string => {
    const modKey = `assinatura:${key}`;
    if (modifiedSettings.has(modKey)) {
      const val = modifiedSettings.get(modKey);
      if (typeof val === 'string') {
        return val.replace(/^"|"$/g, '');
      }
      return String(val);
    }
    const setting = assinaturaSettings.find((s) => s.key === key);
    if (!setting) return '';
    const val = setting.value;
    if (typeof val === 'string') {
      return val.replace(/^"|"$/g, '');
    }
    return String(val ?? '');
  };

  const getSetting = (key: string): SystemSetting | undefined => {
    return assinaturaSettings.find((s) => s.key === key);
  };

  const handleChange = (key: string, value: string) => {
    const setting = getSetting(key);
    if (setting) {
      // For text/number fields, wrap in quotes for JSON
      onValueChange(setting, `"${value}"`);
    }
  };

  const handleNumberChange = (key: string, value: string) => {
    const setting = getSetting(key);
    if (setting) {
      // For numbers, don't wrap in quotes
      onValueChange(setting, value || '0');
    }
  };

  const isModified = (key: string) => modifiedSettings.has(`assinatura:${key}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-card border border-white/10 rounded-sm">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-brand-yellow/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Assinatura Ouse Questões</h2>
              <p className="text-gray-400 text-sm">Assinatura anual da plataforma (acesso ao "Praticar Questões")</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="p-6 space-y-6">
          {/* Pricing Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price */}
            <div className={`p-4 rounded-lg border ${isModified('assinatura_preco') ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-black/20'}`}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                Preço (R$)
                {isModified('assinatura_preco') && <CheckCircle className="w-4 h-4 text-brand-yellow" />}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={getSettingValue('assinatura_preco')}
                  onChange={(e) => handleChange('assinatura_preco', e.target.value)}
                  placeholder="97.00"
                  className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 pl-10 text-white focus:outline-none focus:border-brand-yellow"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Valor cheio da assinatura anual</p>
            </div>

            {/* Discount Price */}
            <div className={`p-4 rounded-lg border ${isModified('assinatura_preco_desconto') ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-black/20'}`}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                Preço com Desconto (R$)
                {isModified('assinatura_preco_desconto') && <CheckCircle className="w-4 h-4 text-brand-yellow" />}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={getSettingValue('assinatura_preco_desconto')}
                  onChange={(e) => handleChange('assinatura_preco_desconto', e.target.value)}
                  placeholder="0"
                  className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 pl-10 text-white focus:outline-none focus:border-brand-yellow"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Deixe 0 se não houver desconto</p>
            </div>
          </div>

          {/* Duration */}
          <div className={`p-4 rounded-lg border ${isModified('assinatura_duracao_meses') ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-black/20'}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              Duração (meses)
              {isModified('assinatura_duracao_meses') && <CheckCircle className="w-4 h-4 text-brand-yellow" />}
            </label>
            <input
              type="number"
              value={getSettingValue('assinatura_duracao_meses')}
              onChange={(e) => handleNumberChange('assinatura_duracao_meses', e.target.value)}
              min="1"
              max="24"
              className="w-full md:w-32 bg-brand-dark border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-brand-yellow"
            />
            <p className="text-xs text-gray-500 mt-1">Padrão: 12 meses (assinatura anual)</p>
          </div>

          {/* Checkout URL */}
          <div className={`p-4 rounded-lg border ${isModified('assinatura_checkout_url') ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-black/20'}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              URL de Checkout
              {isModified('assinatura_checkout_url') && <CheckCircle className="w-4 h-4 text-brand-yellow" />}
            </label>
            <input
              type="url"
              value={getSettingValue('assinatura_checkout_url')}
              onChange={(e) => handleChange('assinatura_checkout_url', e.target.value)}
              placeholder="https://pay.digitalmanager.guru/..."
              className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-brand-yellow"
            />
            <p className="text-xs text-gray-500 mt-1">Link de pagamento do Guru para a assinatura</p>
          </div>

          {/* Guru Product ID */}
          <div className={`p-4 rounded-lg border ${isModified('assinatura_guru_product_id') ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-black/20'}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              ID do Produto (Guru)
              {isModified('assinatura_guru_product_id') && <CheckCircle className="w-4 h-4 text-brand-yellow" />}
            </label>
            <input
              type="text"
              value={getSettingValue('assinatura_guru_product_id')}
              onChange={(e) => handleChange('assinatura_guru_product_id', e.target.value)}
              placeholder="prod_xxxx"
              className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-brand-yellow"
            />
            <p className="text-xs text-gray-500 mt-1">ID do produto no Guru Manager para integração</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
        <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Sobre a Assinatura Ouse Questões
        </h3>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• <strong>Acesso:</strong> Dá acesso ao módulo "Praticar Questões" sem vinculação a preparatório</li>
          <li>• <strong>Duração:</strong> Assinatura anual (12 meses por padrão)</li>
          <li>• <strong>Diferença da Turma de Elite:</strong> A Turma de Elite é vinculada a um preparatório específico e inclui trilhas. A Assinatura Ouse Questões é acesso à plataforma de questões.</li>
          <li>• <strong>Pagamento:</strong> Configurado via Guru Manager (checkout + integração de webhook)</li>
        </ul>
      </div>
    </div>
  );
}
