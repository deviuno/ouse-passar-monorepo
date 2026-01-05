import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Building2,
  DollarSign,
  Loader2,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { getFilterOptions } from '../../services/externalQuestionsService';
import { PreparatorioImageUpload, PreparatorioImageUploadRef } from './PreparatorioImageUpload';

// Types
export interface ProductPricing {
  preco: string;
  precoDesconto: string;
  checkoutUrl: string;
  guruProductId: string;
}

export interface PreparatorioWizardData {
  // Step 1: Informações Gerais
  nome: string;
  descricao: string;
  imagemCapa: string;

  // Step 2: Informações Técnicas
  banca: string;
  orgao: string;
  logoUrl: string; // Logo quadrada do órgão
  cargo: string;
  nivel: 'fundamental' | 'medio' | 'superior';
  escolaridade: string;
  modalidade: 'presencial' | 'remoto' | 'hibrido';
  regiao: string;

  // Step 3: Detalhes do Concurso
  salario: string;
  cargaHoraria: string;
  vagas: string;
  taxaInscricao: string;
  inscricoesInicio: string;
  inscricoesFim: string;
  dataPrevista: string;
  anoPrevisto: string;

  // Step 4: Vendas - Preços por Produto
  // Planejador
  precoPlanejador: string;
  precoPlanejadorDesconto: string;
  checkoutPlanejador: string;
  guruProductIdPlanejador: string;
  // Turma de Elite (trilhas individuais)
  preco8Questoes: string;
  preco8QuestoesDesconto: string;
  checkout8Questoes: string;
  guruProductId8Questoes: string;
  // Simulados
  precoSimulados: string;
  precoSimuladosDesconto: string;
  checkoutSimulados: string;
  guruProductIdSimulados: string;
  // Reta Final
  precoRetaFinal: string;
  precoRetaFinalDesconto: string;
  checkoutRetaFinal: string;
  guruProductIdRetaFinal: string;
  // Plataforma Completa
  precoPlataformaCompleta: string;
  precoPlataformaCompletaDesconto: string;
  checkoutPlataformaCompleta: string;
  guruProductIdPlataformaCompleta: string;
  // Trilhas de Questões
  precoTrilhas: string;
  precoTrilhasDesconto: string;
  checkoutTrilhas: string;
  guruProductIdTrilhas: string;
  // Descrições
  descricaoCurta: string;
  descricaoVendas: string;

  // Campos legados (mantidos para compatibilidade)
  preco: string;
  precoDesconto: string;
  checkoutUrl: string;
}

interface PreparatorioWizardProps {
  initialData?: Partial<PreparatorioWizardData>;
  onSubmit: (data: PreparatorioWizardData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  initialStep?: number;
}

interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Geral', description: 'Informações básicas', icon: FileText },
  { id: 2, title: 'Técnico', description: 'Dados do concurso', icon: Building2 },
  { id: 3, title: 'Detalhes', description: 'Vagas e datas', icon: FileText },
  { id: 4, title: 'Vendas', description: 'Preços e checkout', icon: DollarSign },
];

const NIVEIS = [
  { value: 'fundamental', label: 'Fundamental' },
  { value: 'medio', label: 'Médio' },
  { value: 'superior', label: 'Superior' },
];

const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Híbrido' },
];

const REGIOES = [
  'Nacional',
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
  'Acre (AC)',
  'Alagoas (AL)',
  'Amapá (AP)',
  'Amazonas (AM)',
  'Bahia (BA)',
  'Ceará (CE)',
  'Distrito Federal (DF)',
  'Espírito Santo (ES)',
  'Goiás (GO)',
  'Maranhão (MA)',
  'Mato Grosso (MT)',
  'Mato Grosso do Sul (MS)',
  'Minas Gerais (MG)',
  'Pará (PA)',
  'Paraíba (PB)',
  'Paraná (PR)',
  'Pernambuco (PE)',
  'Piauí (PI)',
  'Rio de Janeiro (RJ)',
  'Rio Grande do Norte (RN)',
  'Rio Grande do Sul (RS)',
  'Rondônia (RO)',
  'Roraima (RR)',
  'Santa Catarina (SC)',
  'São Paulo (SP)',
  'Sergipe (SE)',
  'Tocantins (TO)',
];

// Searchable Select Component
interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  loading?: boolean;
  allowCustom?: boolean;
}

// Componente de card de preço de produto - definido fora para evitar re-criação
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

const ProductPriceCard: React.FC<ProductPriceCardProps> = ({
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
  // Verifica se o produto está configurado (tem pelo menos preço e checkout)
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

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  loading = false,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomValue = () => {
    if (searchTerm.trim() && allowCustom) {
      onChange(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 pr-10 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSearchTerm('');
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />
          <div className="absolute z-20 w-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3">
                {allowCustom && searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-3 py-2 text-brand-yellow hover:bg-white/5 rounded"
                  >
                    Usar "{searchTerm.trim()}"
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum resultado encontrado</p>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.slice(0, 50).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors ${opt === value ? 'text-brand-yellow bg-brand-yellow/10' : 'text-white'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
                {filteredOptions.length > 50 && (
                  <p className="px-4 py-2 text-xs text-gray-500">
                    +{filteredOptions.length - 50} resultados. Digite para filtrar.
                  </p>
                )}
                {allowCustom && searchTerm.trim() && !filteredOptions.includes(searchTerm.trim()) && (
                  <button
                    type="button"
                    onClick={handleCustomValue}
                    className="w-full text-left px-4 py-2 text-brand-yellow hover:bg-white/5 border-t border-white/5"
                  >
                    Usar "{searchTerm.trim()}"
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || "http://localhost:400"

// Main Wizard Component
export const PreparatorioWizard: React.FC<PreparatorioWizardProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Criar Preparatório',
  initialStep = 1,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [logoSource, setLogoSource] = useState<'google_search' | 'ai_generated' | null>(null);
  const imageUploadRef = useRef<PreparatorioImageUploadRef>(null);
  const [filterOptions, setFilterOptions] = useState<{
    bancas: string[];
    orgaos: string[];
    cargos: string[];
  }>({
    bancas: [],
    orgaos: [],
    cargos: [],
  });

  const [formData, setFormData] = useState<PreparatorioWizardData>({
    nome: initialData?.nome || '',
    descricao: initialData?.descricao || '',
    imagemCapa: initialData?.imagemCapa || '',
    banca: initialData?.banca || '',
    orgao: initialData?.orgao || '',
    logoUrl: initialData?.logoUrl || '',
    cargo: initialData?.cargo || '',
    nivel: initialData?.nivel || 'medio',
    escolaridade: initialData?.escolaridade || '',
    modalidade: initialData?.modalidade || 'presencial',
    regiao: initialData?.regiao || '',
    salario: initialData?.salario || '',
    cargaHoraria: initialData?.cargaHoraria || '',
    vagas: initialData?.vagas || '',
    taxaInscricao: initialData?.taxaInscricao || '',
    inscricoesInicio: initialData?.inscricoesInicio || '',
    inscricoesFim: initialData?.inscricoesFim || '',
    dataPrevista: initialData?.dataPrevista || '',
    anoPrevisto: initialData?.anoPrevisto || '',
    // Preços por produto
    precoPlanejador: initialData?.precoPlanejador || '',
    precoPlanejadorDesconto: initialData?.precoPlanejadorDesconto || '',
    checkoutPlanejador: initialData?.checkoutPlanejador || '',
    guruProductIdPlanejador: initialData?.guruProductIdPlanejador || '',
    preco8Questoes: initialData?.preco8Questoes || '',
    preco8QuestoesDesconto: initialData?.preco8QuestoesDesconto || '',
    checkout8Questoes: initialData?.checkout8Questoes || '',
    guruProductId8Questoes: initialData?.guruProductId8Questoes || '',
    precoSimulados: initialData?.precoSimulados || '',
    precoSimuladosDesconto: initialData?.precoSimuladosDesconto || '',
    checkoutSimulados: initialData?.checkoutSimulados || '',
    guruProductIdSimulados: initialData?.guruProductIdSimulados || '',
    precoRetaFinal: initialData?.precoRetaFinal || '',
    precoRetaFinalDesconto: initialData?.precoRetaFinalDesconto || '',
    checkoutRetaFinal: initialData?.checkoutRetaFinal || '',
    guruProductIdRetaFinal: initialData?.guruProductIdRetaFinal || '',
    precoPlataformaCompleta: initialData?.precoPlataformaCompleta || '',
    precoPlataformaCompletaDesconto: initialData?.precoPlataformaCompletaDesconto || '',
    checkoutPlataformaCompleta: initialData?.checkoutPlataformaCompleta || '',
    guruProductIdPlataformaCompleta: initialData?.guruProductIdPlataformaCompleta || '',
    precoTrilhas: initialData?.precoTrilhas || '',
    precoTrilhasDesconto: initialData?.precoTrilhasDesconto || '',
    checkoutTrilhas: initialData?.checkoutTrilhas || '',
    guruProductIdTrilhas: initialData?.guruProductIdTrilhas || '',
    descricaoCurta: initialData?.descricaoCurta || '',
    descricaoVendas: initialData?.descricaoVendas || '',
    // Campos legados
    preco: initialData?.preco || '',
    precoDesconto: initialData?.precoDesconto || '',
    checkoutUrl: initialData?.checkoutUrl || '',
  });

  // Load filter options from questions database
  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const options = await getFilterOptions();
        setFilterOptions({
          bancas: options.bancas || [],
          orgaos: options.orgaos || [],
          cargos: options.cargos || [],
        });
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const updateField = <K extends keyof PreparatorioWizardData>(
    field: K,
    value: PreparatorioWizardData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Buscar logo do órgão via Google Search ou gerar com IA
  const buscarLogoOrgao = async () => {
    if (!formData.orgao.trim()) {
      return;
    }

    setLoadingLogo(true);
    setLogoSource(null);

    try {
      const response = await fetch(`${MASTRA_URL}/api/preparatorio/buscar-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgao: formData.orgao }),
      });

      const data = await response.json();

      if (data.success && data.logoUrl) {
        updateField('logoUrl', data.logoUrl);
        setLogoSource(data.source);
      } else {
        console.error('Erro ao buscar logo:', data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar logo:', error);
    } finally {
      setLoadingLogo(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.nome.trim();
      case 2:
        return true; // Technical info is optional
      case 3:
        return true; // Details are optional
      case 4:
        return true; // Sales info is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit(formData);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            type="button"
            onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-3 ${step.id === currentStep
                ? 'text-brand-yellow'
                : step.id < currentStep
                  ? 'text-green-500'
                  : 'text-gray-500'
              }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step.id === currentStep
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : step.id < currentStep
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-transparent'
                }`}
            >
              {step.id < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="font-bold text-sm uppercase tracking-wide">{step.title}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </button>
          {index < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 ${step.id < currentStep ? 'bg-green-500' : 'bg-gray-700'
                }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          Nome do Preparatório *
        </label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) => updateField('nome', e.target.value)}
          placeholder="Ex: Concurso Polícia Federal 2025"
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          Descrição
        </label>
        <textarea
          value={formData.descricao}
          onChange={(e) => updateField('descricao', e.target.value)}
          rows={4}
          placeholder="Descreva o objetivo deste preparatório..."
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Imagem de Capa
          </label>
          <button
            type="button"
            onClick={() => imageUploadRef.current?.openAiModal()}
            className="flex items-center gap-1 text-brand-yellow hover:text-white text-xs font-bold uppercase tracking-wide transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Gerar com IA
          </button>
        </div>
        <PreparatorioImageUpload
          ref={imageUploadRef}
          value={formData.imagemCapa}
          onChange={(url) => updateField('imagemCapa', url)}
          cargo={formData.cargo}
          orgao={formData.orgao}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SearchableSelect
          options={filterOptions.bancas}
          value={formData.banca}
          onChange={(v) => updateField('banca', v)}
          placeholder="Selecione ou digite a banca..."
          label="Banca Organizadora"
          loading={loadingOptions}
        />

        <SearchableSelect
          options={filterOptions.orgaos}
          value={formData.orgao}
          onChange={(v) => updateField('orgao', v)}
          placeholder="Selecione ou digite o órgão..."
          label="Órgão"
          loading={loadingOptions}
        />
      </div>

      {/* Logo do Órgão */}
      <div className="bg-brand-dark/50 border border-white/10 rounded-lg p-4">
        <div className="flex items-start gap-4">
          {/* Preview da Logo */}
          <div className="flex-shrink-0">
            {formData.logoUrl ? (
              <div className="relative group">
                <img
                  src={formData.logoUrl}
                  alt="Logo do órgão"
                  className="w-20 h-20 object-contain rounded-lg bg-white/10 p-2"
                />
                <button
                  type="button"
                  onClick={() => updateField('logoUrl', '')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                <Building2 size={32} className="text-gray-500" />
              </div>
            )}
          </div>

          {/* Informações e Botão */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
              Logo do Órgão
            </label>
            <p className="text-sm text-gray-500 mb-3">
              {logoSource === 'google_search'
                ? 'Logo encontrada na internet'
                : logoSource === 'ai_generated'
                  ? 'Logo gerada por IA'
                  : 'Miniatura quadrada que aparece no header da trilha'}
            </p>
            <button
              type="button"
              onClick={buscarLogoOrgao}
              disabled={loadingLogo || !formData.orgao.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingLogo ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Buscar Logo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SearchableSelect
          options={filterOptions.cargos}
          value={formData.cargo}
          onChange={(v) => updateField('cargo', v)}
          placeholder="Selecione ou digite o cargo..."
          label="Cargo"
          loading={loadingOptions}
        />

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nível de Escolaridade
          </label>
          <select
            value={formData.nivel}
            onChange={(e) => updateField('nivel', e.target.value as any)}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
          >
            {NIVEIS.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Modalidade
          </label>
          <select
            value={formData.modalidade}
            onChange={(e) => updateField('modalidade', e.target.value as any)}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
          >
            {MODALIDADES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <SearchableSelect
          options={REGIOES}
          value={formData.regiao}
          onChange={(v) => updateField('regiao', v)}
          placeholder="Selecione a região..."
          label="Região/Estado"
          allowCustom={false}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          Escolaridade/Requisitos
        </label>
        <input
          type="text"
          value={formData.escolaridade}
          onChange={(e) => updateField('escolaridade', e.target.value)}
          placeholder="Ex: Graduação em Direito, CNH categoria B..."
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Salário (R$)
          </label>
          <input
            type="text"
            value={formData.salario}
            onChange={(e) => updateField('salario', e.target.value)}
            placeholder="Ex: 12.500,00"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Carga Horária
          </label>
          <input
            type="text"
            value={formData.cargaHoraria}
            onChange={(e) => updateField('cargaHoraria', e.target.value)}
            placeholder="Ex: 40h semanais"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Vagas
          </label>
          <input
            type="number"
            value={formData.vagas}
            onChange={(e) => updateField('vagas', e.target.value)}
            placeholder="Ex: 500"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Taxa de Inscrição (R$)
          </label>
          <input
            type="text"
            value={formData.taxaInscricao}
            onChange={(e) => updateField('taxaInscricao', e.target.value)}
            placeholder="Ex: 180,00"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Ano Previsto
          </label>
          <input
            type="number"
            value={formData.anoPrevisto}
            onChange={(e) => updateField('anoPrevisto', e.target.value)}
            placeholder="Ex: 2025"
            min="2024"
            max="2030"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Início das Inscrições
          </label>
          <input
            type="date"
            value={formData.inscricoesInicio}
            onChange={(e) => updateField('inscricoesInicio', e.target.value)}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Fim das Inscrições
          </label>
          <input
            type="date"
            value={formData.inscricoesFim}
            onChange={(e) => updateField('inscricoesFim', e.target.value)}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Data da Prova
          </label>
          <input
            type="date"
            value={formData.dataPrevista}
            onChange={(e) => updateField('dataPrevista', e.target.value)}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <strong>Configure os preços de cada produto.</strong> Cada forma de consumir o preparatório pode ter seu próprio preço e link de checkout.
        </p>
        <p className="text-blue-400/70 text-sm mt-2">
          <strong>Produtos sem preço ou checkout serão ocultados</strong> na área do aluno. O ID do Produto (Guru) é necessário para processar pagamentos automaticamente.
        </p>
      </div>

      {/* Grid de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProductPriceCard
          title="Planejador"
          icon="📅"
          description="Planejamento personalizado de estudos"
          precoValue={formData.precoPlanejador}
          descontoValue={formData.precoPlanejadorDesconto}
          checkoutValue={formData.checkoutPlanejador}
          guruProductIdValue={formData.guruProductIdPlanejador}
          onPrecoChange={(v) => updateField('precoPlanejador', v)}
          onDescontoChange={(v) => updateField('precoPlanejadorDesconto', v)}
          onCheckoutChange={(v) => updateField('checkoutPlanejador', v)}
          onGuruProductIdChange={(v) => updateField('guruProductIdPlanejador', v)}
        />

        <ProductPriceCard
          title="Turma de Elite"
          icon="👑"
          description="Trilhas individuais do preparatório"
          precoValue={formData.preco8Questoes}
          descontoValue={formData.preco8QuestoesDesconto}
          checkoutValue={formData.checkout8Questoes}
          guruProductIdValue={formData.guruProductId8Questoes}
          onPrecoChange={(v) => updateField('preco8Questoes', v)}
          onDescontoChange={(v) => updateField('preco8QuestoesDesconto', v)}
          onCheckoutChange={(v) => updateField('checkout8Questoes', v)}
          onGuruProductIdChange={(v) => updateField('guruProductId8Questoes', v)}
        />

        <ProductPriceCard
          title="Simulados"
          icon="📝"
          description="Simulados no formato da prova"
          precoValue={formData.precoSimulados}
          descontoValue={formData.precoSimuladosDesconto}
          checkoutValue={formData.checkoutSimulados}
          guruProductIdValue={formData.guruProductIdSimulados}
          onPrecoChange={(v) => updateField('precoSimulados', v)}
          onDescontoChange={(v) => updateField('precoSimuladosDesconto', v)}
          onCheckoutChange={(v) => updateField('checkoutSimulados', v)}
          onGuruProductIdChange={(v) => updateField('guruProductIdSimulados', v)}
        />

        <ProductPriceCard
          title="Reta Final"
          icon="🎯"
          description="Revisão intensiva pré-prova"
          precoValue={formData.precoRetaFinal}
          descontoValue={formData.precoRetaFinalDesconto}
          checkoutValue={formData.checkoutRetaFinal}
          guruProductIdValue={formData.guruProductIdRetaFinal}
          onPrecoChange={(v) => updateField('precoRetaFinal', v)}
          onDescontoChange={(v) => updateField('precoRetaFinalDesconto', v)}
          onCheckoutChange={(v) => updateField('checkoutRetaFinal', v)}
          onGuruProductIdChange={(v) => updateField('guruProductIdRetaFinal', v)}
        />
      </div>

      {/* Plataforma Completa */}
      <ProductPriceCard
        title="Plataforma Completa"
        icon="🚀"
        description="Acesso a todos os produtos acima + recursos exclusivos"
        precoValue={formData.precoPlataformaCompleta}
        descontoValue={formData.precoPlataformaCompletaDesconto}
        checkoutValue={formData.checkoutPlataformaCompleta}
        guruProductIdValue={formData.guruProductIdPlataformaCompleta}
        onPrecoChange={(v) => updateField('precoPlataformaCompleta', v)}
        onDescontoChange={(v) => updateField('precoPlataformaCompletaDesconto', v)}
        onCheckoutChange={(v) => updateField('checkoutPlataformaCompleta', v)}
        onGuruProductIdChange={(v) => updateField('guruProductIdPlataformaCompleta', v)}
      />

      {/* Trilhas de Questões */}
      <ProductPriceCard
        title="Trilhas de Questões"
        icon="🎯"
        description="Edital verticalizado com prática guiada de questões"
        precoValue={formData.precoTrilhas}
        descontoValue={formData.precoTrilhasDesconto}
        checkoutValue={formData.checkoutTrilhas}
        guruProductIdValue={formData.guruProductIdTrilhas}
        onPrecoChange={(v) => updateField('precoTrilhas', v)}
        onDescontoChange={(v) => updateField('precoTrilhasDesconto', v)}
        onCheckoutChange={(v) => updateField('checkoutTrilhas', v)}
        onGuruProductIdChange={(v) => updateField('guruProductIdTrilhas', v)}
      />

      {/* Descrições */}
      <div className="border-t border-white/10 pt-6 space-y-4">
        <h4 className="text-white font-bold uppercase text-sm tracking-wide">Textos de Venda</h4>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Descrição Curta
          </label>
          <input
            type="text"
            value={formData.descricaoCurta}
            onChange={(e) => updateField('descricaoCurta', e.target.value)}
            placeholder="Uma linha descrevendo o preparatório..."
            maxLength={150}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.descricaoCurta.length}/150 caracteres
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Descrição de Vendas
          </label>
          <textarea
            value={formData.descricaoVendas}
            onChange={(e) => updateField('descricaoVendas', e.target.value)}
            rows={4}
            placeholder="Descrição detalhada para a página de vendas (suporta markdown)..."
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="bg-brand-card border border-white/5 rounded-sm">
      {/* Step Indicator */}
      <div className="p-6 border-b border-white/5">
        {renderStepIndicator()}
      </div>

      {/* Step Content */}
      <div className="p-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-white/5 flex justify-between">
        <button
          type="button"
          onClick={currentStep === 1 ? onCancel : handlePrev}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? 'Cancelar' : 'Voltar'}
        </button>

        {currentStep < STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !validateStep(currentStep)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-sm font-bold uppercase tracking-wide hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PreparatorioWizard;
