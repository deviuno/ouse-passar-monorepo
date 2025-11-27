import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { FilterReview } from '../../components/admin/FilterReview';
import {
  getCourseById,
  getEditalByCourseId,
  updateCourse,
  approveFilters,
  triggerEditalProcessing,
  deleteCourse,
  Course,
  Edital,
  QuestionFilters,
} from '../../services/simuladoService';

export const EditarPreparatorio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [edital, setEdital] = useState<Edital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load course and edital
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        setError('ID do curso inválido');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { course: courseData, error: courseError } = await getCourseById(id);
        if (courseError) throw new Error(courseError);
        if (!courseData) throw new Error('Curso não encontrado');

        setCourse(courseData);
        setTitle(courseData.title);
        setDescription(courseData.description || '');
        setPrice(courseData.price?.toString() || '');

        // Load edital
        const { edital: editalData } = await getEditalByCourseId(id);
        setEdital(editalData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Poll for edital status updates
  useEffect(() => {
    if (!edital || !['pending', 'processing'].includes(edital.status)) return;

    const interval = setInterval(async () => {
      if (!id) return;
      const { edital: updatedEdital } = await getEditalByCourseId(id);
      if (updatedEdital) {
        setEdital(updatedEdital);
        if (!['pending', 'processing'].includes(updatedEdital.status)) {
          clearInterval(interval);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [edital?.status, id]);

  const handleSaveBasicInfo = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const { error } = await updateCourse(id, {
        title,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
      });

      if (error) throw new Error(error);

      // Refresh course data
      const { course: updatedCourse } = await getCourseById(id);
      if (updatedCourse) setCourse(updatedCourse);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveFilters = async (filters: QuestionFilters) => {
    if (!id) return;

    setIsApproving(true);
    try {
      const questionsCount = edital?.matched_questions_count || 0;
      const { error } = await approveFilters(id, filters, questionsCount);

      if (error) throw new Error(error);

      // Refresh data
      const { course: updatedCourse } = await getCourseById(id);
      if (updatedCourse) setCourse(updatedCourse);

      const { edital: updatedEdital } = await getEditalByCourseId(id);
      if (updatedEdital) setEdital(updatedEdital);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectFilters = () => {
    navigate('/admin/preparatorios');
  };

  const handleReprocess = async () => {
    if (!edital) return;

    setIsReprocessing(true);
    try {
      await triggerEditalProcessing(edital.id);
      // Refresh edital
      if (id) {
        const { edital: updatedEdital } = await getEditalByCourseId(id);
        if (updatedEdital) setEdital(updatedEdital);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteCourse(id);
      if (error) throw new Error(error);
      navigate('/admin/preparatorios');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Aguardando
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Concluído
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm">
            <AlertCircle className="w-4 h-4" />
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/preparatorios" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Preparatórios
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin/preparatorios" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Preparatórios
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
              Editar Preparatório
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {course?.is_active ? (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
                  Ativo
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs font-bold uppercase rounded">
                  Inativo
                </span>
              )}
              <span className="px-2 py-0.5 bg-brand-yellow/20 text-brand-yellow text-xs font-bold uppercase rounded">
                {course?.course_type}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-400"
          >
            <span className="sr-only">Fechar</span>
            ×
          </button>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-4">
          Informações Básicas
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Nome do Preparatório
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow resize-none"
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
              placeholder="0,00"
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
            />
          </div>

          <button
            onClick={handleSaveBasicInfo}
            disabled={isSaving}
            className={`
              px-6 py-2 rounded-sm font-bold uppercase tracking-wide transition-all flex items-center gap-2
              ${isSaving ? 'bg-gray-700 text-gray-400' : 'bg-brand-yellow text-brand-darker hover:bg-white'}
            `}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Edital Status */}
      {edital && (
        <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-yellow" />
              Edital
            </h2>
            {getStatusBadge(edital.status)}
          </div>

          <div className="bg-brand-dark/50 p-4 rounded-sm mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{edital.file_name}</p>
                <p className="text-gray-500 text-sm">
                  Enviado em {new Date(edital.uploaded_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {edital.file_url && (
                  <a
                    href={edital.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                    title="Abrir edital"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {['error', 'completed'].includes(edital.status) && (
                  <button
                    onClick={handleReprocess}
                    disabled={isReprocessing}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    title="Reprocessar edital"
                  >
                    <RefreshCw className={`w-4 h-4 ${isReprocessing ? 'animate-spin' : ''}`} />
                    Reprocessar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {edital.status === 'error' && edital.error_message && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-4">
              <p className="text-red-500 text-sm">{edital.error_message}</p>
            </div>
          )}

          {/* Processing Status */}
          {edital.status === 'processing' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <div>
                  <p className="text-blue-500 font-medium">Processando edital...</p>
                  <p className="text-blue-400/70 text-sm">A IA está analisando o conteúdo do edital</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Status */}
          {edital.status === 'pending' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-500 font-medium">Aguardando processamento</p>
                  <p className="text-yellow-400/70 text-sm">O edital será analisado em breve</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Review */}
      {edital?.status === 'completed' && (
        <FilterReview
          aiAnalysis={edital.ai_analysis}
          suggestedFilters={edital.suggested_filters}
          matchedQuestionsCount={edital.matched_questions_count}
          onApprove={handleApproveFilters}
          onReject={handleRejectFilters}
          isApproving={isApproving}
          disabled={course?.is_active}
        />
      )}

      {/* Already Active Message */}
      {course?.is_active && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-sm p-6 mt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-green-500 font-bold text-lg">Simulado Ativo</p>
              <p className="text-green-400/70">
                Este simulado está disponível para os usuários com{' '}
                <span className="font-bold text-green-500">
                  {course.questions_count?.toLocaleString('pt-BR')} questões
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir o preparatório{' '}
              <span className="text-white font-medium">"{course?.title}"</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-sm font-bold uppercase tracking-wide hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
