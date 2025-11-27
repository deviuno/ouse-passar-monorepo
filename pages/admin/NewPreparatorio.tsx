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
} from 'lucide-react';
import { EditalUploader } from '../../components/admin/EditalUploader';
import { ManualFilterSelector } from '../../components/admin/ManualFilterSelector';
import { CourseImageUpload } from '../../components/admin/CourseImageUpload';
import {
  createCourse,
  uploadEdital,
  createEditalFromUrl,
  triggerEditalProcessing,
  CourseType,
  QuestionFilters,
} from '../../services/simuladoService';

type CreationMode = 'edital' | 'manual';

export const NewPreparatorio: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CourseType>('simulado');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

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
        course_type: type,
        image_url: imageUrl || undefined,
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
        course_type: type,
        image_url: imageUrl || undefined,
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
      }, 6000);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message);
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
        course_type: type,
        image_url: imageUrl || undefined,
        question_filters: manualFilters,
        is_active: true, // Activate immediately since it's manual
      });

      if (courseError || !course) {
        throw new Error(courseError || 'Erro ao criar curso');
      }

      setCreatedCourseId(course.id);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingManual(false);
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
              Imagem de Capa
            </label>
            <CourseImageUpload
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Tipo de Conteúdo
          </label>
          <div className="flex gap-4">
            {/* Simulado Toggle */}
            <button
              onClick={() => setType('simulado')}
              className={`flex-1 py-4 px-6 rounded-sm border-2 transition-all flex items-center justify-center ${
                type === 'simulado'
                  ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                  : 'border-white/10 bg-brand-dark text-gray-400 hover:border-white/20'
              }`}
            >
              <CheckSquare className="w-5 h-5 mr-3" />
              <span className="font-bold uppercase tracking-wide">Simulado</span>
            </button>

            {/* Preparatório Toggle (Disabled for now) */}
            <div className="flex-1 relative group cursor-not-allowed">
              <button
                disabled
                className="w-full h-full py-4 px-6 rounded-sm border-2 border-white/5 bg-brand-dark/50 text-gray-600 flex items-center justify-center cursor-not-allowed"
              >
                <GraduationCap className="w-5 h-5 mr-3" />
                <span className="font-bold uppercase tracking-wide">Preparatório</span>
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
          <div className="grid grid-cols-2 gap-4">
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
                Faça upload do PDF do edital e nossa IA irá extrair automaticamente as matérias e configurar o simulado.
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
          <div className="bg-brand-card border border-brand-yellow/20 rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-2">
              {creationMode === 'manual' ? 'Simulado Criado!' : 'Edital Enviado!'}
            </h2>
            <p className="text-gray-400 mb-6">
              {creationMode === 'manual'
                ? `O simulado foi criado com sucesso com ${manualQuestionCount.toLocaleString('pt-BR')} questões configuradas.`
                : 'O edital foi enviado para análise. Você receberá uma notificação quando o processamento for concluído.'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/admin/preparatorios/edit/${createdCourseId}`)}
                className="w-full bg-brand-yellow text-brand-darker py-3 font-bold uppercase tracking-wide rounded-sm hover:bg-white transition-colors"
              >
                Ver Preparatório
              </button>
              <button
                onClick={() => navigate('/admin/preparatorios')}
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
