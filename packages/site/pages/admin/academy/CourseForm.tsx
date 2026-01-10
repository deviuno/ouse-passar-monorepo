import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Loader2,
  Video,
  Layers,
  Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import {
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategories,
  generateSlug,
} from '../../../services/eadService';
import { ImageUploader } from '../../../components/admin/ImageUploader';
import { BadgePositionSelector } from '../../../components/admin/BadgePositionSelector';
import { useToast } from '../../../components/ui/Toast';
import type { EadCategory, CourseStatus, DifficultyLevel, AccessType, CourseDisplayFormat, CourseBadge } from '../../../types/ead';

interface CourseFormData {
  title: string;
  slug: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  difficultyLevel: DifficultyLevel;
  estimatedDurationHours: number;
  isFree: boolean;
  price: number | null;
  originalPrice: number | null;
  thumbnailUrl: string;
  coverImageUrl: string;
  previewVideoUrl: string;
  displayFormat: CourseDisplayFormat;
  posterImageUrl: string;
  badges: CourseBadge[];
  status: CourseStatus;
  accessType: AccessType;
  accessDays: number;
  pointsOnComplete: number;
  guruProductId: string;
  checkoutUrl: string;
}

const defaultFormData: CourseFormData = {
  title: '',
  slug: '',
  subtitle: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  difficultyLevel: 'iniciante',
  estimatedDurationHours: 0,
  isFree: false,
  price: null,
  originalPrice: null,
  thumbnailUrl: '',
  coverImageUrl: '',
  previewVideoUrl: '',
  displayFormat: 'card',
  posterImageUrl: '',
  badges: [],
  status: 'draft',
  accessType: 'lifetime',
  accessDays: 365,
  pointsOnComplete: 100,
  guruProductId: '',
  checkoutUrl: '',
};

export const CourseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const toast = useToast();

  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const [categories, setCategories] = useState<EadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [courseStats, setCourseStats] = useState({
    enrolledCount: 0,
    totalModules: 0,
    totalLessons: 0,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const cats = await getCategories(true);
      setCategories(cats);

      // Load course if editing
      if (id) {
        const course = await getCourseById(id);
        if (course) {
          setFormData({
            title: course.title,
            slug: course.slug,
            subtitle: course.subtitle || '',
            shortDescription: course.shortDescription || '',
            description: course.description || '',
            categoryId: course.categoryId || '',
            difficultyLevel: course.difficultyLevel,
            estimatedDurationHours: course.estimatedDurationHours || 0,
            isFree: course.isFree,
            price: course.price,
            originalPrice: course.originalPrice,
            thumbnailUrl: course.thumbnailUrl || '',
            coverImageUrl: course.coverImageUrl || '',
            previewVideoUrl: course.previewVideoUrl || '',
            displayFormat: course.displayFormat || 'card',
            posterImageUrl: course.posterImageUrl || '',
            badges: course.badges || [],
            status: course.status,
            accessType: course.accessType,
            accessDays: course.accessDays || 365,
            pointsOnComplete: course.pointsOnComplete,
            guruProductId: course.guruProductId || '',
            checkoutUrl: course.checkoutUrl || '',
          });
          setCourseStats({
            enrolledCount: course.enrolledCount,
            totalModules: course.totalModules,
            totalLessons: course.totalLessons,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !isEditing || !prev.slug ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const courseData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        subtitle: formData.subtitle || null,
        shortDescription: formData.shortDescription || null,
        description: formData.description || null,
        categoryId: formData.categoryId || null,
        difficultyLevel: formData.difficultyLevel,
        estimatedDurationHours: formData.estimatedDurationHours,
        isFree: formData.isFree,
        price: formData.isFree ? null : formData.price,
        originalPrice: formData.isFree ? null : formData.originalPrice,
        thumbnailUrl: formData.thumbnailUrl || null,
        coverImageUrl: formData.coverImageUrl || null,
        previewVideoUrl: formData.previewVideoUrl || null,
        displayFormat: formData.displayFormat,
        posterImageUrl: formData.posterImageUrl || null,
        badges: formData.badges,
        status: formData.status,
        accessType: formData.accessType,
        accessDays: formData.accessType === 'rental' ? formData.accessDays : null,
        pointsOnComplete: formData.pointsOnComplete,
        guruProductId: formData.guruProductId || null,
        checkoutUrl: formData.checkoutUrl || null,
      };

      if (isEditing && id) {
        await updateCourse(id, courseData);
        toast.success('Curso atualizado com sucesso!');
      } else {
        const newCourse = await createCourse(courseData);
        toast.success('Curso criado com sucesso!');
        navigate(`/admin/academy/cursos/${newCourse.id}/editar`);
      }
    } catch (error: any) {
      console.error('Erro ao salvar curso:', error);
      if (error.code === '23505') {
        toast.error('Já existe um curso com este slug');
      } else {
        toast.error('Erro ao salvar curso');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteCourse(id);
      toast.success('Curso excluído com sucesso');
      navigate('/admin/academy/cursos');
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      toast.error('Erro ao excluir curso');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded" />
          <div>
            <div className="h-8 bg-white/5 rounded w-48" />
            <div className="h-4 bg-white/5 rounded w-32 mt-2" />
          </div>
        </div>
        <div className="h-96 bg-white/5 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/academy/cursos"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar Curso' : 'Novo Curso'}
            </h1>
            {isEditing && (
              <p className="text-gray-400 mt-1">
                {courseStats.totalModules} módulos • {courseStats.totalLessons} aulas • {courseStats.enrolledCount} alunos
              </p>
            )}
          </div>
        </div>
        {isEditing && (
          <Link
            to={`/admin/academy/cursos/${id}/conteudo`}
            className="flex items-center gap-2 border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Layers className="w-5 h-5" />
            Gerenciar Módulos
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Informações Básicas</h2>
            <p className="text-gray-400 text-sm mt-1">Dados principais do curso</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                placeholder="Ex: Preparatório OAB - 1ª Fase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slug
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm border border-r-0 border-white/10 rounded-l-lg bg-brand-darker text-gray-400">
                  /academy/cursos/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="flex-1 bg-brand-darker border border-white/10 rounded-r-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="preparatorio-oab-1-fase"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL amigável do curso (apenas letras minúsculas, números e hífens)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subtítulo
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                placeholder="Ex: Aprovação garantida no Exame da Ordem"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição Curta
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                rows={2}
                placeholder="Uma breve descrição para exibir nos cards"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 200 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição Completa
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                rows={5}
                placeholder="Descrição detalhada do curso..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nível de Dificuldade
                </label>
                <select
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, difficultyLevel: e.target.value as DifficultyLevel }))}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duração Estimada (horas)
              </label>
              <input
                type="number"
                value={formData.estimatedDurationHours}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDurationHours: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                min="0"
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Mídia</h2>
            <p className="text-gray-400 text-sm mt-1">Imagens e vídeo de apresentação</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader
                label="Thumbnail"
                value={formData.thumbnailUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl: url }))}
                bucket="course-images"
                folder="thumbnails"
                description="Formato recomendado: 16:9 (400x225px)"
                aspectRatio="16/9"
              />

              <ImageUploader
                label="Imagem de Capa"
                value={formData.coverImageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, coverImageUrl: url }))}
                bucket="course-images"
                folder="covers"
                description="Formato recomendado: Banner (1920x600px)"
                aspectRatio="3/1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Video className="w-4 h-4 inline mr-2" />
                URL do Vídeo de Preview
              </label>
              <input
                type="url"
                value={formData.previewVideoUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, previewVideoUrl: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                placeholder="https://player.pandavideo.com.br/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Vídeo de apresentação (Panda Video, YouTube ou Vimeo embed)
              </p>
            </div>
          </div>
        </div>

        {/* Display Format & Badges */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Formato de Exibição</h2>
            <p className="text-gray-400 text-sm mt-1">Configure como o card do curso será exibido</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Format Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Formato do Card
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, displayFormat: 'card' }))}
                  className={`p-4 border rounded-lg transition-all ${
                    formData.displayFormat === 'card'
                      ? 'border-brand-yellow bg-brand-yellow/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="aspect-video bg-brand-darker rounded mb-3 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className={`font-medium ${formData.displayFormat === 'card' ? 'text-brand-yellow' : 'text-white'}`}>
                    Card Tradicional
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Formato 16:9 (horizontal)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, displayFormat: 'netflix' }))}
                  className={`p-4 border rounded-lg transition-all ${
                    formData.displayFormat === 'netflix'
                      ? 'border-brand-yellow bg-brand-yellow/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="aspect-[5/7] bg-brand-darker rounded mb-3 flex items-center justify-center max-h-24 mx-auto">
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className={`font-medium ${formData.displayFormat === 'netflix' ? 'text-brand-yellow' : 'text-white'}`}>
                    Estilo Netflix
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Formato 5:7 (poster vertical)</p>
                </button>
              </div>
            </div>

            {/* Poster Image (only for Netflix format) */}
            {formData.displayFormat === 'netflix' && (
              <ImageUploader
                label="Imagem Poster"
                value={formData.posterImageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, posterImageUrl: url }))}
                bucket="course-images"
                folder="posters"
                description="Formato recomendado: 5:7 (500x700px)"
                aspectRatio="5/7"
              />
            )}

            {/* Badge Position Selector */}
            <BadgePositionSelector
              badges={formData.badges}
              onChange={(badges) => setFormData((prev) => ({ ...prev, badges }))}
              displayFormat={formData.displayFormat}
              thumbnailUrl={formData.thumbnailUrl}
              posterImageUrl={formData.posterImageUrl}
              price={formData.price}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Preço e Acesso</h2>
            <p className="text-gray-400 text-sm mt-1">Configure o modelo de monetização</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
              <div>
                <p className="text-white font-medium">Curso Gratuito</p>
                <p className="text-sm text-gray-400">Marque se o curso for totalmente gratuito</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isFree: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
              </label>
            </div>

            {!formData.isFree && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || null }))}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço Original (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: parseFloat(e.target.value) || null }))}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para mostrar desconto</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Acesso
                </label>
                <select
                  value={formData.accessType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accessType: e.target.value as AccessType }))}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                >
                  <option value="lifetime">Vitalício</option>
                  <option value="subscription">Assinatura</option>
                  <option value="rental">Aluguel (Tempo Limitado)</option>
                </select>
              </div>

              {formData.accessType === 'rental' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dias de Acesso
                  </label>
                  <input
                    type="number"
                    value={formData.accessDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accessDays: parseInt(e.target.value) || 365 }))}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    min="1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integration */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Integração com Pagamentos</h2>
            <p className="text-gray-400 text-sm mt-1">IDs dos produtos nas plataformas de pagamento</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID do Produto Guru
              </label>
              <input
                type="text"
                value={formData.guruProductId}
                onChange={(e) => setFormData((prev) => ({ ...prev, guruProductId: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                placeholder="Ex: abc123"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID do produto na plataforma Digital Manager Guru
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL de Checkout (Recomendado)
              </label>
              <input
                type="url"
                value={formData.checkoutUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, checkoutUrl: e.target.value }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                placeholder="https://pay.exemplo.com/checkout/seu-produto"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL direta para a página de pagamento. Este campo tem prioridade sobre o ID do produto.
              </p>
            </div>
          </div>
        </div>

        {/* Gamification */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Gamificação</h2>
            <p className="text-gray-400 text-sm mt-1">Pontos e recompensas</p>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pontos ao Completar
              </label>
              <input
                type="number"
                value={formData.pointsOnComplete}
                onChange={(e) => setFormData((prev) => ({ ...prev, pointsOnComplete: parseInt(e.target.value) || 0 }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pontos que o aluno ganha ao completar o curso
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-brand-card border border-white/5 rounded-lg">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Status de Publicação</h2>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as CourseStatus }))}
                className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Rascunho: visível apenas no admin. Publicado: visível para todos.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          {isEditing && (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Excluir Curso
            </button>
          )}

          <div className={`flex gap-3 ${!isEditing ? 'ml-auto' : ''}`}>
            <Link
              to="/admin/academy/cursos"
              className="px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2.5 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Curso'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-2">Excluir Curso</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir este curso? Esta ação não pode ser
              desfeita e todos os módulos, aulas e matrículas serão removidos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseForm;
