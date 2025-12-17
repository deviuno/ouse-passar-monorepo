import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  BrainCircuit,
  Database,
  CheckSquare,
  GraduationCap,
  FileUp,
  Settings2,
  Sparkles,
  Calendar,
  CalendarDays,
  Building2,
  Briefcase,
} from 'lucide-react';
import { EditalUploader } from '../../components/admin/EditalUploader';
import { ManualFilterSelector } from '../../components/admin/ManualFilterSelector';
import { CourseImageUpload } from '../../components/admin/CourseImageUpload';
import { useToast } from '../../components/ui/Toast';
import {
  createCourse,
  uploadEdital,
  createEditalFromUrl,
  triggerEditalProcessing,
  ContentType,
  QuestionFilters,
} from '../../services/simuladoService';
import { preparatoriosService } from '../../services/preparatoriosService';
import { n8nService } from '../../services/n8nService';
import { CreatePreparatorioN8NPayload } from '../../lib/database.types';

type CreationMode = 'edital' | 'manual' | 'n8n';

export const NewPreparatorio: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contentTypes, setContentTypes] = useState<ContentType[]>(['questoes']); // Default: questões selecionado
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [blockSize, setBlockSize] = useState<string>('20');

  // Toggle para tipos de conteúdo (multi-select)
  const toggleContentType = (type: ContentType) => {
    setContentTypes(prev => {
      if (prev.includes(type)) {
        // Remove se já existe (mas garante pelo menos um selecionado)
        const newTypes = prev.filter(t => t !== type);
        return newTypes.length > 0 ? newTypes : prev;
      } else {
        // Adiciona se não existe
        return [...prev, type];
      }
    });
  };

  // Creation mode state
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);

  // Manual mode state
  const [manualFilters, setManualFilters] = useState<QuestionFilters>({});
  const [manualQuestionCount, setManualQuestionCount] = useState<number>(0);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | undefined>();

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // N8N mode state
  const [n8nOrgao, setN8nOrgao] = useState('');
  const [n8nBanca, setN8nBanca] = useState('');
  const [n8nNivel, setN8nNivel] = useState<'fundamental' | 'medio' | 'superior'>('medio');
  const [n8nCargo, setN8nCargo] = useState('');
  const [n8nRequisitos, setN8nRequisitos] = useState('');
  const [n8nAreasConhecimento, setN8nAreasConhecimento] = useState('');
  const [n8nDataPrevista, setN8nDataPrevista] = useState('');
  const [isSavingN8n, setIsSavingN8n] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!name) {
      setUploadError('Preencha o nome do preparatório primeiro');
      return;
    }

    setUploadError(undefined);
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Create course first
      const { course, error: courseError } = await createCourse({
        title: name,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        content_types: contentTypes,
        image_url: imageUrl || undefined,
        block_size: blockSize ? parseInt(blockSize, 10) : 20,
      });

      if (courseError || !course) {
        throw new Error(courseError || 'Erro ao criar curso');
      }

      setCreatedCourseId(course.id);

      // Upload edital
      const { edital, error: editalError } = await uploadEdital(course.id, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (editalError || !edital) {
        throw new Error(editalError || 'Erro ao fazer upload do edital');
      }

      // Start processing
      setIsUploading(false);
      await startProcessing(edital.id, course.id);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message);
      setError(err.message);
      toast.error('Erro ao criar preparatório');
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!name) {
      setUploadError('Preencha o nome do preparatório primeiro');
      return;
    }

    setUploadError(undefined);
    setError(null);
    setIsUploading(true);
    setUploadProgress(50);

    try {
      // Create course first
      const { course, error: courseError } = await createCourse({
        title: name,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        content_types: contentTypes,
        image_url: imageUrl || undefined,
        block_size: blockSize ? parseInt(blockSize, 10) : 20,
      });

      if (courseError || !course) {
        throw new Error(courseError || 'Erro ao criar curso');
      }

      setCreatedCourseId(course.id);

      // Create edital from URL
      const { edital, error: editalError } = await createEditalFromUrl(course.id, url);

      setUploadProgress(100);

      if (editalError || !edital) {
        throw new Error(editalError || 'Erro ao criar edital');
      }

      // Start processing
      setIsUploading(false);
      await startProcessing(edital.id, course.id);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message);
      setError(err.message);
      toast.error('Erro ao criar preparatório');
    }
  };

  const startProcessing = async (editalId: string, courseId: string) => {
    setIsProcessing(true);
    setProcessingStep(1);

    try {
      // Trigger n8n webhook
      const { success, error: webhookError } = await triggerEditalProcessing(editalId);

      if (!success) {
        // If webhook fails, still show success but note that manual processing is needed
        console.warn('Webhook failed:', webhookError);
      }

      // Simulate processing steps for UX
      setTimeout(() => setProcessingStep(2), 2000);
      setTimeout(() => setProcessingStep(3), 4500);
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(true);
        toast.success('Edital enviado para processamento!');
      }, 6000);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message);
      toast.error('Erro no processamento');
    }
  };

  const handleManualFiltersChange = (filters: QuestionFilters, count: number) => {
    setManualFilters(filters);
    setManualQuestionCount(count);
  };

  const handleSaveManual = async () => {
    if (!name) {
      setError('Preencha o nome do preparatório');
      return;
    }

    if (manualQuestionCount === 0) {
      setError('Selecione pelo menos um filtro para gerar questões');
      return;
    }

    setIsSavingManual(true);
    setError(null);

    try {
      // Create course
      const { course, error: courseError } = await createCourse({
        title: name,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        content_types: contentTypes,
        image_url: imageUrl || undefined,
        question_filters: manualFilters,
        questions_count: manualQuestionCount,
        block_size: blockSize ? parseInt(blockSize, 10) : 20,
        is_active: true, // Activate immediately since it's manual
      });

      if (courseError || !course) {
        throw new Error(courseError || 'Erro ao criar curso');
      }

      setCreatedCourseId(course.id);
      setShowSuccess(true);
      toast.success('Simulado criado com sucesso!');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao criar simulado');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleN8NSubmit = async () => {
    if (!name) {
      setError('Preencha o nome do preparatório');
      return;
    }

    if (!n8nOrgao || !n8nBanca || !n8nCargo) {
      setError('Preencha os campos obrigatórios: Órgão, Banca e Cargo');
      return;
    }

    setIsSavingN8n(true);
    setError(null);
    setIsProcessing(true);
    setProcessingStep(1);

    try {
      // Create preparatorio in database first
      const { preparatorio, error: prepError } = await preparatoriosService.createPreparatorio({
        nome: name,
        descricao: description || undefined,
        preco: price ? parseFloat(price) : undefined,
        imagem_url: imageUrl || undefined,
        orgao: n8nOrgao,
        banca: n8nBanca,
        nivel: n8nNivel,
        cargo: n8nCargo,
        requisitos: n8nRequisitos || undefined,
        areas_conhecimento: n8nAreasConhecimento
          ? n8nAreasConhecimento.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        data_prevista: n8nDataPrevista || undefined,
      });

      if (prepError || !preparatorio) {
        throw new Error(prepError || 'Erro ao criar preparatório');
      }

      setCreatedCourseId(preparatorio.id);
      setProcessingStep(2);

      // Prepare N8N payload
      const n8nPayload: CreatePreparatorioN8NPayload = {
        nome: name,
        orgao: n8nOrgao,
        banca: n8nBanca,
        nivel: n8nNivel,
        cargo: n8nCargo,
        requisitos: n8nRequisitos || undefined,
        areas_conhecimento: n8nAreasConhecimento
          ? n8nAreasConhecimento.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        data_prevista: n8nDataPrevista || undefined,
      };

      // Send to N8N for structure creation
      const { success, message } = await n8nService.createPreparatorioStructure(
        preparatorio.id,
        n8nPayload
      );

      setProcessingStep(3);

      if (!success) {
        console.warn('N8N webhook warning:', message);
        // Still show success - N8N processes in background
      }

      // Finish processing animation
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(true);
        toast.success('Preparatório enviado para processamento!');
      }, 1500);

    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message);
      toast.error('Erro ao criar preparatório');
    } finally {
      setIsSavingN8n(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          to="/admin/preparatorios"
          className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Preparatórios
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
          Novo Preparatório
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-400">
            ×
          </button>
        </div>
      )}

      <div className="bg-brand-card border border-white/5 rounded-sm p-8 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Nome do Preparatório *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Simulado Polícia Federal 2025"
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreva o objetivo deste preparatório..."
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00 (deixe vazio para gratuito)"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Questões por Bloco
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={blockSize}
                onChange={(e) => setBlockSize(e.target.value)}
                placeholder="20"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Questões por bloco: quantidade que aparece por vez no simulado do aluno.
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Imagem de Capa
            </label>
            <CourseImageUpload
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
        </div>

        {/* Type Selection - Multi-select */}
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Tipo de Conteúdo
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Selecione onde este conteúdo estará disponível. Você pode selecionar múltiplas opções.
          </p>
          <div className="flex gap-4">
            {/* Plano - App de Planejamento */}
            <button
              onClick={() => toggleContentType('plano')}
              className={`flex-1 py-4 px-6 rounded-sm border-2 transition-all flex items-center justify-center ${
                contentTypes.includes('plano')
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-white/10 bg-brand-dark text-gray-400 hover:border-white/20'
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              <div className="text-left">
                <span className="font-bold uppercase tracking-wide block">Plano</span>
                <span className="text-xs opacity-70 normal-case">App Planejamento</span>
              </div>
            </button>

            {/* Questões - App Ouse Questões */}
            <button
              onClick={() => toggleContentType('questoes')}
              className={`flex-1 py-4 px-6 rounded-sm border-2 transition-all flex items-center justify-center ${
                contentTypes.includes('questoes')
                  ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                  : 'border-white/10 bg-brand-dark text-gray-400 hover:border-white/20'
              }`}
            >
              <CheckSquare className="w-5 h-5 mr-3" />
              <div className="text-left">
                <span className="font-bold uppercase tracking-wide block">Questões</span>
                <span className="text-xs opacity-70 normal-case">App Ouse Questões</span>
              </div>
            </button>

            {/* Preparatório - Portal futuro (Disabled for now) */}
            <div className="flex-1 relative group cursor-not-allowed">
              <button
                disabled
                className="w-full h-full py-4 px-6 rounded-sm border-2 border-white/5 bg-brand-dark/50 text-gray-600 flex items-center justify-center cursor-not-allowed"
              >
                <GraduationCap className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <span className="font-bold uppercase tracking-wide block">Preparatório</span>
                  <span className="text-xs opacity-50 normal-case">Portal (em breve)</span>
                </div>
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black border border-white/10 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10">
                Este recurso ainda não está disponível.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Creation Mode Selection */}
        <div className="pt-6 border-t border-white/5">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Como deseja criar o simulado?
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Edital Mode */}
            <button
              onClick={() => setCreationMode('edital')}
              disabled={isProcessing || showSuccess}
              className={`
                p-6 rounded-sm border-2 transition-all text-left
                ${creationMode === 'edital'
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-white/10 bg-brand-dark hover:border-white/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${creationMode === 'edital' ? 'bg-brand-yellow/20' : 'bg-white/5'}
                `}>
                  <FileUp className={`w-5 h-5 ${creationMode === 'edital' ? 'text-brand-yellow' : 'text-gray-400'}`} />
                </div>
                <span className={`font-bold uppercase tracking-wide ${creationMode === 'edital' ? 'text-brand-yellow' : 'text-white'}`}>
                  Via Edital
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Faça upload do PDF do edital e nossa IA irá extrair automaticamente as matérias.
              </p>
            </button>

            {/* Manual Mode */}
            <button
              onClick={() => setCreationMode('manual')}
              disabled={isProcessing || showSuccess}
              className={`
                p-6 rounded-sm border-2 transition-all text-left
                ${creationMode === 'manual'
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-white/10 bg-brand-dark hover:border-white/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${creationMode === 'manual' ? 'bg-brand-yellow/20' : 'bg-white/5'}
                `}>
                  <Settings2 className={`w-5 h-5 ${creationMode === 'manual' ? 'text-brand-yellow' : 'text-gray-400'}`} />
                </div>
                <span className={`font-bold uppercase tracking-wide ${creationMode === 'manual' ? 'text-brand-yellow' : 'text-white'}`}>
                  Manual
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Selecione manualmente as matérias, bancas, anos e órgãos para montar o simulado.
              </p>
            </button>

            {/* N8N Mode */}
            <button
              onClick={() => setCreationMode('n8n')}
              disabled={isProcessing || showSuccess}
              className={`
                p-6 rounded-sm border-2 transition-all text-left
                ${creationMode === 'n8n'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-brand-dark hover:border-white/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${creationMode === 'n8n' ? 'bg-purple-500/20' : 'bg-white/5'}
                `}>
                  <Sparkles className={`w-5 h-5 ${creationMode === 'n8n' ? 'text-purple-400' : 'text-gray-400'}`} />
                </div>
                <span className={`font-bold uppercase tracking-wide ${creationMode === 'n8n' ? 'text-purple-400' : 'text-white'}`}>
                  IA Automática
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Informe os dados do concurso e a IA gerará matérias, assuntos e conteúdo automaticamente.
              </p>
            </button>
          </div>
        </div>

        {/* Edital Upload Section */}
        {creationMode === 'edital' && (
          <div className="pt-6 border-t border-white/5">
            <EditalUploader
              onFileSelect={handleFileSelect}
              onUrlSubmit={handleUrlSubmit}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={uploadError}
              disabled={isProcessing || showSuccess}
            />
          </div>
        )}

        {/* Manual Filter Section */}
        {creationMode === 'manual' && (
          <div className="pt-6 border-t border-white/5 space-y-6">
            <ManualFilterSelector
              onFiltersChange={handleManualFiltersChange}
              disabled={isSavingManual || showSuccess}
            />

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setCreationMode(null)}
                disabled={isSavingManual}
                className="px-6 py-3 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveManual}
                disabled={isSavingManual || manualQuestionCount === 0 || !name}
                className="flex-1 bg-brand-yellow text-brand-darker py-3 px-6 font-bold uppercase tracking-wide rounded-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingManual ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Criar Simulado ({manualQuestionCount.toLocaleString('pt-BR')} questões)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* N8N Mode Section */}
        {creationMode === 'n8n' && (
          <div className="pt-6 border-t border-white/5 space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-sm p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-300 font-medium">Modo IA Automática</p>
                <p className="text-sm text-purple-300/70 mt-1">
                  Preencha os dados do concurso e nossa IA irá gerar automaticamente as matérias,
                  assuntos e conteúdo didático personalizado para cada tópico.
                </p>
              </div>
            </div>

            {/* N8N Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Órgão *
                </label>
                <input
                  type="text"
                  value={n8nOrgao}
                  onChange={(e) => setN8nOrgao(e.target.value)}
                  placeholder="Ex: Polícia Federal, TRF, INSS..."
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Banca *
                </label>
                <input
                  type="text"
                  value={n8nBanca}
                  onChange={(e) => setN8nBanca(e.target.value)}
                  placeholder="Ex: CEBRASPE, FGV, VUNESP..."
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Cargo *
                </label>
                <input
                  type="text"
                  value={n8nCargo}
                  onChange={(e) => setN8nCargo(e.target.value)}
                  placeholder="Ex: Agente Administrativo, Analista..."
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nível de Escolaridade
                </label>
                <select
                  value={n8nNivel}
                  onChange={(e) => setN8nNivel(e.target.value as 'fundamental' | 'medio' | 'superior')}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="fundamental">Fundamental</option>
                  <option value="medio">Médio</option>
                  <option value="superior">Superior</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Prevista da Prova
                </label>
                <input
                  type="date"
                  value={n8nDataPrevista}
                  onChange={(e) => setN8nDataPrevista(e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Requisitos do Cargo
                </label>
                <input
                  type="text"
                  value={n8nRequisitos}
                  onChange={(e) => setN8nRequisitos(e.target.value)}
                  placeholder="Ex: Graduação em Direito, CNH categoria B..."
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Áreas de Conhecimento
              </label>
              <textarea
                value={n8nAreasConhecimento}
                onChange={(e) => setN8nAreasConhecimento(e.target.value)}
                rows={3}
                placeholder="Separe as áreas por vírgula. Ex: Direito Constitucional, Português, Raciocínio Lógico, Informática..."
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional: se não informar, a IA irá sugerir com base no órgão e cargo.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setCreationMode(null)}
                disabled={isSavingN8n}
                className="px-6 py-3 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleN8NSubmit}
                disabled={isSavingN8n || !name || !n8nOrgao || !n8nBanca || !n8nCargo}
                className="flex-1 bg-purple-600 text-white py-3 px-6 font-bold uppercase tracking-wide rounded-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingN8n ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar com IA
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent animate-pulse"></div>

            <div className="space-y-6">
              {/* Step 1: Enviando Edital */}
              <div
                className={`flex items-center transition-opacity duration-500 ${
                  processingStep >= 1 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${
                    processingStep > 1
                      ? 'bg-green-500/20 text-green-500'
                      : processingStep === 1
                      ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {processingStep > 1 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className={`font-bold ${processingStep === 1 ? 'text-brand-yellow' : 'text-white'}`}>
                    Enviando para Análise
                  </p>
                  <p className="text-xs text-gray-500">Preparando edital para processamento...</p>
                </div>
              </div>

              {/* Step 2: Analisando Edital */}
              <div
                className={`flex items-center transition-opacity duration-500 ${
                  processingStep >= 2 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${
                    processingStep > 2
                      ? 'bg-green-500/20 text-green-500'
                      : processingStep === 2
                      ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {processingStep > 2 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <BrainCircuit className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className={`font-bold ${processingStep === 2 ? 'text-brand-yellow' : 'text-white'}`}>
                    Iniciando IA
                  </p>
                  <p className="text-xs text-gray-500">A análise será processada em segundo plano...</p>
                </div>
              </div>

              {/* Step 3: Mapeando Questões */}
              <div
                className={`flex items-center transition-opacity duration-500 ${
                  processingStep >= 3 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${
                    processingStep > 3
                      ? 'bg-green-500/20 text-green-500'
                      : processingStep === 3
                      ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {processingStep > 3 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Database className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className={`font-bold ${processingStep === 3 ? 'text-brand-yellow' : 'text-white'}`}>
                    Finalizando
                  </p>
                  <p className="text-xs text-gray-500">Você será notificado quando a análise terminar...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-brand-card border ${creationMode === 'n8n' ? 'border-purple-500/20' : 'border-brand-yellow/20'} rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-scale-in`}>
            <div className={`w-20 h-20 ${creationMode === 'n8n' ? 'bg-purple-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {creationMode === 'n8n' ? (
                <Sparkles className="w-10 h-10 text-purple-400" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-2">
              {creationMode === 'manual'
                ? 'Simulado Criado!'
                : creationMode === 'n8n'
                ? 'Preparatório em Processamento!'
                : 'Edital Enviado!'}
            </h2>
            <p className="text-gray-400 mb-6">
              {creationMode === 'manual'
                ? `O simulado foi criado com sucesso com ${manualQuestionCount.toLocaleString('pt-BR')} questões configuradas.`
                : creationMode === 'n8n'
                ? 'O preparatório foi enviado para processamento. A IA está gerando as matérias, assuntos e conteúdo. Você pode acompanhar o progresso na página do preparatório.'
                : 'O edital foi enviado para análise. Você receberá uma notificação quando o processamento for concluído.'
              }
            </p>
            <div className="space-y-3">
              {creationMode === 'n8n' ? (
                <button
                  onClick={() => navigate(`/admin/preparatorios/${createdCourseId}/rodadas`)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 font-bold uppercase tracking-wide rounded-sm transition-colors"
                >
                  Ver Preparatório
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/admin/preparatorios/edit/${createdCourseId}`)}
                  className="w-full bg-brand-yellow hover:bg-white text-brand-darker py-3 font-bold uppercase tracking-wide rounded-sm transition-colors"
                >
                  Ver Preparatório
                </button>
              )}
              <button
                onClick={() => navigate(creationMode === 'n8n' ? '/admin/preparatorios' : '/admin/preparatorios')}
                className="w-full border border-white/10 text-gray-400 py-3 font-bold uppercase tracking-wide rounded-sm hover:text-white hover:border-white/20 transition-colors"
              >
                Voltar para Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
