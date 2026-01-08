import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  PlayCircle,
  Loader2,
  Save,
  X,
  Check,
  Lock,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getCourseById,
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  generateSlug,
} from '../../../services/eadService';
import type { EadCourse, EadModule, EadLesson, ContentType } from '../../../types/ead';

interface ModuleFormData {
  title: string;
  description: string;
  isFree: boolean;
  isActive: boolean;
  isLocked: boolean;
  releaseAfterDays: string;
}

interface LessonFormData {
  title: string;
  slug: string;
  description: string;
  contentType: ContentType;
  videoUrl: string;
  videoDurationSeconds: number;
  textContent: string;
  isFree: boolean;
  isActive: boolean;
  pointsOnComplete: number;
}

const defaultModuleForm: ModuleFormData = {
  title: '',
  description: '',
  isFree: false,
  isActive: true,
  isLocked: false,
  releaseAfterDays: '',
};

const defaultLessonForm: LessonFormData = {
  title: '',
  slug: '',
  description: '',
  contentType: 'video',
  videoUrl: '',
  videoDurationSeconds: 0,
  textContent: '',
  isFree: false,
  isActive: true,
  pointsOnComplete: 10,
};

export const CourseContent: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();

  const [course, setCourse] = useState<EadCourse | null>(null);
  const [modules, setModules] = useState<EadModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  // Form states
  const [editingModule, setEditingModule] = useState<EadModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<EadLesson | null>(null);
  const [parentModuleId, setParentModuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [moduleForm, setModuleForm] = useState<ModuleFormData>(defaultModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormData>(defaultLessonForm);

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    try {
      const [courseData, modulesData] = await Promise.all([
        getCourseById(courseId),
        getModulesByCourse(courseId, true), // Include lessons
      ]);

      setCourse(courseData);
      setModules(modulesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Open module modal
  const openModuleModal = (module?: EadModule) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description || '',
        isFree: module.isFree,
        isActive: module.isActive,
        isLocked: module.isLocked || false,
        releaseAfterDays: module.releaseAfterDays?.toString() || '',
      });
    } else {
      setEditingModule(null);
      setModuleForm(defaultModuleForm);
    }
    setModuleModalOpen(true);
  };

  // Open lesson modal
  const openLessonModal = (moduleId: string, lesson?: EadLesson) => {
    setParentModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description || '',
        contentType: lesson.contentType,
        videoUrl: lesson.videoUrl || '',
        videoDurationSeconds: lesson.videoDurationSeconds || 0,
        textContent: lesson.textContent || '',
        isFree: lesson.isFree,
        isActive: lesson.isActive,
        pointsOnComplete: lesson.pointsOnComplete,
      });
    } else {
      setEditingLesson(null);
      setLessonForm(defaultLessonForm);
    }
    setLessonModalOpen(true);
  };

  // Save module
  const saveModule = async () => {
    if (!moduleForm.title.trim() || !courseId) {
      alert('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const moduleData = {
        title: moduleForm.title,
        description: moduleForm.description || null,
        isFree: moduleForm.isFree,
        isActive: moduleForm.isActive,
        isLocked: moduleForm.isLocked,
        releaseAfterDays: moduleForm.releaseAfterDays ? parseInt(moduleForm.releaseAfterDays) : null,
      };

      if (editingModule) {
        await updateModule(editingModule.id, moduleData);
        alert('Módulo atualizado!');
      } else {
        const maxOrder = modules.length > 0
          ? Math.max(...modules.map((m) => m.sortOrder))
          : 0;

        await createModule(courseId, {
          ...moduleData,
          sortOrder: maxOrder + 1,
        });
        alert('Módulo criado!');
      }

      setModuleModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      alert('Erro ao salvar módulo');
    } finally {
      setSaving(false);
    }
  };

  // Save lesson
  const saveLesson = async () => {
    if (!lessonForm.title.trim() || !parentModuleId) {
      alert('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const slug = lessonForm.slug || generateSlug(lessonForm.title);

      const lessonData = {
        title: lessonForm.title,
        slug,
        description: lessonForm.description || null,
        contentType: lessonForm.contentType,
        videoUrl: lessonForm.videoUrl || null,
        videoDurationSeconds: lessonForm.videoDurationSeconds || null,
        textContent: lessonForm.textContent || null,
        isFree: lessonForm.isFree,
        isActive: lessonForm.isActive,
        pointsOnComplete: lessonForm.pointsOnComplete,
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, lessonData);
        alert('Aula atualizada!');
      } else {
        const moduleLessons = modules.find((m) => m.id === parentModuleId)?.lessons || [];
        const maxOrder = moduleLessons.length > 0
          ? Math.max(...moduleLessons.map((l) => l.sortOrder))
          : 0;

        await createLesson(parentModuleId, {
          ...lessonData,
          sortOrder: maxOrder + 1,
        });
        alert('Aula criada!');
      }

      setLessonModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Erro ao salvar aula');
    } finally {
      setSaving(false);
    }
  };

  // Delete module
  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;

    try {
      await deleteModule(deleteModuleId);
      alert('Módulo excluído!');
      setModules(modules.filter((m) => m.id !== deleteModuleId));
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      alert('Erro ao excluir módulo');
    } finally {
      setDeleteModuleId(null);
    }
  };

  // Delete lesson
  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;

    try {
      await deleteLesson(deleteLessonId);
      alert('Aula excluída!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      alert('Erro ao excluir aula');
    } finally {
      setDeleteLessonId(null);
    }
  };

  const getLessonIcon = (type: ContentType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      case 'exercise':
        return <Edit2 className="w-4 h-4" />;
      default:
        return <PlayCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded" />
          <div>
            <div className="h-8 bg-white/5 rounded w-64" />
            <div className="h-4 bg-white/5 rounded w-32 mt-2" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/academy/cursos/${courseId}/editar`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Módulos e Aulas</h1>
            <p className="text-gray-400 mt-1">{course?.title}</p>
          </div>
        </div>
        <button
          onClick={() => openModuleModal()}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Módulo
        </button>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="bg-brand-card border border-white/5 rounded-lg p-12 text-center">
          <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum módulo criado
          </h3>
          <p className="text-gray-400 mb-4">
            Comece adicionando o primeiro módulo do curso
          </p>
          <button
            onClick={() => openModuleModal()}
            className="text-brand-yellow hover:underline"
          >
            Criar primeiro módulo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div
              key={module.id}
              className="bg-brand-card border border-white/5 rounded-lg overflow-hidden"
            >
              {/* Module Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-500" />
                  <div className="flex items-center gap-2">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">
                          {moduleIndex + 1}.
                        </span>
                        <h3 className="text-white font-medium">{module.title}</h3>
                        {module.isFree && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                            Grátis
                          </span>
                        )}
                        {!module.isActive && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
                            Inativo
                          </span>
                        )}
                        {module.isLocked && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Bloqueado
                          </span>
                        )}
                        {module.releaseAfterDays && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            +{module.releaseAfterDays} dias
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {module.lessons?.length || 0} aula{module.lessons?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openModuleModal(module)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModuleId(module.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Module Content (Lessons) */}
              {expandedModules.has(module.id) && (
                <div className="border-t border-white/5">
                  <div className="divide-y divide-white/5">
                    {(!module.lessons || module.lessons.length === 0) ? (
                      <div className="p-4 text-center text-gray-400">
                        Nenhuma aula neste módulo
                      </div>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-500 w-12">
                              {moduleIndex + 1}.{lessonIndex + 1}
                            </span>
                            <span className="text-gray-400">
                              {getLessonIcon(lesson.contentType)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white text-sm font-medium">
                                  {lesson.title}
                                </p>
                                {lesson.isFree && (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                    Grátis
                                  </span>
                                )}
                                {!lesson.isActive && (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
                                    Inativo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {lesson.contentType === 'video' && lesson.videoDurationSeconds
                                  ? formatDuration(lesson.videoDurationSeconds)
                                  : lesson.contentType}
                                {' • '}{lesson.pointsOnComplete} pts
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openLessonModal(module.id, lesson)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteLessonId(lesson.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <button
                      onClick={() => openLessonModal(module.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Aula
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {editingModule
                    ? 'Atualize as informações do módulo'
                    : 'Adicione um novo módulo ao curso'}
                </p>
              </div>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="Ex: Introdução ao Curso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                  rows={3}
                  placeholder="Descrição do módulo..."
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                <div>
                  <p className="text-white font-medium">Módulo Gratuito</p>
                  <p className="text-sm text-gray-400">
                    Disponível para visualização sem matrícula
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleForm.isFree}
                    onChange={(e) => setModuleForm({ ...moduleForm, isFree: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                <div>
                  <p className="text-white font-medium">Módulo Ativo</p>
                  <p className="text-sm text-gray-400">Visível para os alunos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleForm.isActive}
                    onChange={(e) => setModuleForm({ ...moduleForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div>
                  <p className="text-white font-medium">Módulo Bloqueado</p>
                  <p className="text-sm text-gray-400">
                    Impede acesso mesmo para matriculados
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleForm.isLocked}
                    onChange={(e) => setModuleForm({ ...moduleForm, isLocked: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Liberar após dias (Drip Content)
                </label>
                <input
                  type="number"
                  value={moduleForm.releaseAfterDays}
                  onChange={(e) => setModuleForm({ ...moduleForm, releaseAfterDays: e.target.value })}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="Ex: 7"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se definido, o módulo só será desbloqueado X dias após a matrícula. Deixe em branco para liberar imediatamente.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setModuleModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveModule}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2.5 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {editingLesson
                    ? 'Atualize as informações da aula'
                    : 'Adicione uma nova aula ao módulo'}
                </p>
              </div>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setLessonForm({
                        ...lessonForm,
                        title,
                        slug: !editingLesson ? generateSlug(title) : lessonForm.slug,
                      });
                    }}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    placeholder="Ex: Bem-vindo ao Curso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={lessonForm.slug}
                    onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    placeholder="bem-vindo-ao-curso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                  rows={2}
                  placeholder="Descrição da aula..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Conteúdo
                  </label>
                  <select
                    value={lessonForm.contentType}
                    onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value as ContentType })}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  >
                    <option value="video">Vídeo</option>
                    <option value="text">Texto</option>
                    <option value="quiz">Quiz</option>
                    <option value="exercise">Exercício</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pontos ao Completar
                  </label>
                  <input
                    type="number"
                    value={lessonForm.pointsOnComplete}
                    onChange={(e) => setLessonForm({ ...lessonForm, pointsOnComplete: parseInt(e.target.value) || 0 })}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              {lessonForm.contentType === 'video' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL do Vídeo
                    </label>
                    <input
                      type="url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                      placeholder="https://player.pandavideo.com.br/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL de embed do Panda Video, YouTube ou Vimeo
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duração (segundos)
                    </label>
                    <input
                      type="number"
                      value={lessonForm.videoDurationSeconds}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoDurationSeconds: parseInt(e.target.value) || 0 })}
                      className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                      min="0"
                      placeholder="600"
                    />
                  </div>
                </div>
              )}

              {(lessonForm.contentType === 'text' || lessonForm.contentType === 'exercise') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Conteúdo de Texto
                  </label>
                  <textarea
                    value={lessonForm.textContent}
                    onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })}
                    className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                    rows={6}
                    placeholder="Conteúdo da aula em texto..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="text-white font-medium">Aula Gratuita</p>
                    <p className="text-sm text-gray-400">Disponível para preview</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonForm.isFree}
                      onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="text-white font-medium">Aula Ativa</p>
                    <p className="text-sm text-gray-400">Visível para alunos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonForm.isActive}
                      onChange={(e) => setLessonForm({ ...lessonForm, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setLessonModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveLesson}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2.5 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Module Confirmation */}
      {deleteModuleId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-2">Excluir Módulo</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir este módulo? Todas as aulas serão
              removidas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModuleId(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteModule}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation */}
      {deleteLessonId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-2">Excluir Aula</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser
              desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteLessonId(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLesson}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent;
