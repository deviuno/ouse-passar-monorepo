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
export interface PreparatorioWizardData {
  // Step 1: Informações Gerais
  nome: string;
  descricao: string;
  imagemCapa: string;

  // Step 2: Informações Técnicas
  banca: string;
  orgao: string;
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

  // Step 4: Vendas
  preco: string;
  precoDesconto: string;
  checkoutUrl: string;
  descricaoCurta: string;
  descricaoVendas: string;
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
                    className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors ${
                      opt === value ? 'text-brand-yellow bg-brand-yellow/10' : 'text-white'
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
    preco: initialData?.preco || '',
    precoDesconto: initialData?.precoDesconto || '',
    checkoutUrl: initialData?.checkoutUrl || '',
    descricaoCurta: initialData?.descricaoCurta || '',
    descricaoVendas: initialData?.descricaoVendas || '',
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
            className={`flex items-center gap-3 ${
              step.id === currentStep
                ? 'text-brand-yellow'
                : step.id < currentStep
                ? 'text-green-500'
                : 'text-gray-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                step.id === currentStep
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
              className={`flex-1 h-0.5 mx-4 ${
                step.id < currentStep ? 'bg-green-500' : 'bg-gray-700'
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Preço (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.preco}
            onChange={(e) => updateField('preco', e.target.value)}
            placeholder="0,00 (deixe vazio para gratuito)"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Preço com Desconto (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.precoDesconto}
            onChange={(e) => updateField('precoDesconto', e.target.value)}
            placeholder="Opcional"
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          URL do Checkout
        </label>
        <input
          type="url"
          value={formData.checkoutUrl}
          onChange={(e) => updateField('checkoutUrl', e.target.value)}
          placeholder="https://checkout.com/seu-produto"
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
        />
      </div>

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
          rows={6}
          placeholder="Descrição detalhada para a página de vendas (suporta markdown)..."
          className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none"
        />
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
