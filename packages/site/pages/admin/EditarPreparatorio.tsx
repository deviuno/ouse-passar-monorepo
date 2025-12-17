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
  Edit3,
  Image,
  DollarSign,
  Hash,
  Filter,
  Calendar,
  Building2,
  BookOpen,
  Users,
} from 'lucide-react';
import { FilterReview } from '../../components/admin/FilterReview';
import { useToast } from '../../components/ui/Toast';
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
  ContentType,
} from '../../services/simuladoService';

export const EditarPreparatorio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [edital, setEdital] = useState<Edital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [blockSize, setBlockSize] = useState<string>('20');
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
        setBlockSize(courseData.block_size?.toString() || '20');

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
        block_size: blockSize ? parseInt(blockSize, 10) : 20,
      });

      if (error) throw new Error(error);

      // Refresh course data
      const { course: updatedCourse } = await getCourseById(id);
      if (updatedCourse) setCourse(updatedCourse);

      toast.success('Alterações salvas com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
      setPrice(course.price?.toString() || '');
      setBlockSize(course.block_size?.toString() || '20');
    }
    setIsEditing(false);
  };

  // Helper to format filters for display
  const formatFilterValue = (values: string[] | number[] | undefined): string => {
    if (!values || values.length === 0) return 'Não definido';
    if (values.length <= 3) return values.join(', ');
    return `${values.slice(0, 3).join(', ')} +${values.length - 3} mais`;
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

      toast.success('Filtros aprovados! Simulado ativado.');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao aprovar filtros');
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
      toast.success('Preparatório excluído com sucesso!');
      navigate('/admin/preparatorios');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao excluir preparatório');
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
              {course?.title}
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
              {/* Exibir content_types */}
              {course?.content_types?.map((type) => {
                const typeConfig: Record<ContentType, { label: string; bgClass: string; textClass: string }> = {
                  plano: { label: 'Plano', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400' },
                  questoes: { label: 'Questões', bgClass: 'bg-brand-yellow/20', textClass: 'text-brand-yellow' },
                  preparatorio: { label: 'Preparatório', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
                };
                const config = typeConfig[type];
                return (
                  <span
                    key={type}
                    className={`px-2 py-0.5 ${config.bgClass} ${config.textClass} text-xs font-bold uppercase rounded`}
                  >
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-brand-yellow hover:bg-brand-yellow/10 rounded-sm transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
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

      {/* Course Details View (when not editing) */}
      {!isEditing && (
        <>
          {/* Course Image and Basic Info */}
          <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden mb-6">
            {/* Image Header */}
            {course?.image_url ? (
              <div className="h-48 bg-brand-dark">
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 bg-brand-dark flex items-center justify-center">
                <Image className="w-12 h-12 text-gray-600" />
              </div>
            )}

            <div className="p-6">
              {/* Description */}
              {course?.description && (
                <p className="text-gray-400 mb-6">{course.description}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-brand-dark/50 p-4 rounded-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                    <DollarSign className="w-4 h-4" />
                    Preço
                  </div>
                  <p className="text-white font-bold text-lg">
                    {course?.price ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
                  </p>
                </div>

                <div className="bg-brand-dark/50 p-4 rounded-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                    <Hash className="w-4 h-4" />
                    Total de Questões
                  </div>
                  <p className="text-white font-bold text-lg">
                    {course?.questions_count?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>

                <div className="bg-brand-dark/50 p-4 rounded-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                    <Filter className="w-4 h-4" />
                    Questões por Bloco
                  </div>
                  <p className="text-white font-bold text-lg">
                    {course?.block_size || 20}
                  </p>
                </div>

                <div className="bg-brand-dark/50 p-4 rounded-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                    <Calendar className="w-4 h-4" />
                    Criado em
                  </div>
                  <p className="text-white font-bold text-lg">
                    {course?.created_at ? new Date(course.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Applied Filters */}
          {course?.question_filters && Object.keys(course.question_filters).length > 0 && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-brand-yellow" />
                Filtros Aplicados
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.question_filters.materias && course.question_filters.materias.length > 0 && (
                  <div className="bg-brand-dark/50 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                      <BookOpen className="w-4 h-4" />
                      Matérias
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.question_filters.materias.map((materia, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                        >
                          {materia}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {course.question_filters.bancas && course.question_filters.bancas.length > 0 && (
                  <div className="bg-brand-dark/50 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                      <Users className="w-4 h-4" />
                      Bancas
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.question_filters.bancas.map((banca, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded"
                        >
                          {banca}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {course.question_filters.orgaos && course.question_filters.orgaos.length > 0 && (
                  <div className="bg-brand-dark/50 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                      <Building2 className="w-4 h-4" />
                      Órgãos
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.question_filters.orgaos.map((orgao, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded"
                        >
                          {orgao}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {course.question_filters.anos && course.question_filters.anos.length > 0 && (
                  <div className="bg-brand-dark/50 p-4 rounded-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
                      <Calendar className="w-4 h-4" />
                      Anos
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.question_filters.anos.map((ano, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded"
                        >
                          {ano}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Form (when editing) */}
      {isEditing && (
        <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-4">
            Editar Informações
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
                  placeholder="0,00"
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
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
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-6 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBasicInfo}
                disabled={isSaving}
                className={`
                  flex-1 px-6 py-2 rounded-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2
                  ${isSaving ? 'bg-gray-700 text-gray-400' : 'bg-brand-yellow text-brand-darker hover:bg-white'}
                `}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                {' '}em blocos de{' '}
                <span className="font-bold text-green-500">
                  {course.block_size || 20} questões
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
