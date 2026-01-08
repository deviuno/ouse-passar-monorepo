import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  Edit2,
  Trash2,
  PlayCircle,
  Users,
  Eye,
  MoreVertical,
  BookOpen,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { getCourses, getCategories, deleteCourse, updateCourse } from '../../../services/eadService';
import type { EadCourse, EadCategory, CourseFilters, CourseStatus } from '../../../types/ead';

export const AcademyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EadCourse[]>([]);
  const [categories, setCategories] = useState<EadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    categoryId: undefined,
    status: undefined,
    sortBy: 'recent',
  });

  const limit = 10;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [page, filters]);

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const { courses: data, total: totalCount } = await getCourses({
        filters,
        page,
        limit,
      });
      setCourses(data);
      setTotal(totalCount);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      await loadCourses();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      alert('Erro ao deletar curso');
    }
  };

  const handleStatusChange = async (course: EadCourse, newStatus: CourseStatus) => {
    try {
      await updateCourse(course.id, { status: newStatus });
      await loadCourses();
      setMenuOpen(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
            Publicado
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
            Rascunho
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
            Arquivado
          </span>
        );
    }
  };

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'iniciante':
        return <span className="text-green-400 text-xs">Iniciante</span>;
      case 'intermediario':
        return <span className="text-yellow-400 text-xs">Intermediário</span>;
      case 'avancado':
        return <span className="text-red-400 text-xs">Avançado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/academy"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Cursos</h1>
            <p className="text-gray-400 mt-1">{total} cursos cadastrados</p>
          </div>
        </div>
        <Link
          to="/admin/academy/cursos/novo"
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Curso
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-brand-card border border-white/5 rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Buscar cursos..."
                className="w-full bg-brand-darker border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
              />
            </div>
          </div>

          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as CourseStatus) || undefined,
              }))
            }
            className="bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
            <option value="archived">Arquivados</option>
          </select>

          <select
            value={filters.categoryId || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                categoryId: e.target.value || undefined,
              }))
            }
            className="bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy || 'recent'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as CourseFilters['sortBy'],
              }))
            }
            className="bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
          >
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais populares</option>
            <option value="title">Título A-Z</option>
          </select>
        </form>
      </div>

      {/* Lista de Cursos */}
      <div className="bg-brand-card border border-white/5 rounded-lg overflow-hidden">
        {loading ? (
          <div className="animate-pulse divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-16 bg-white/5 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-400 mb-4">
              {filters.search || filters.categoryId || filters.status
                ? 'Tente ajustar os filtros'
                : 'Comece criando seu primeiro curso'}
            </p>
            <Link
              to="/admin/academy/cursos/novo"
              className="text-brand-yellow hover:underline"
            >
              Criar novo curso
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-24 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">{course.title}</h3>
                    {getStatusBadge(course.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      {course.totalLessons} aulas
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrolledCount} alunos
                    </span>
                    {course.category && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {course.category.name}
                      </span>
                    )}
                    {getDifficultyBadge(course.difficultyLevel)}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/academy/cursos/${course.id}/conteudo`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Gerenciar Módulos"
                  >
                    <Layers className="w-5 h-5" />
                  </Link>

                  <Link
                    to={`/admin/academy/cursos/${course.id}/editar`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === course.id ? null : course.id)
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {menuOpen === course.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-brand-darker border border-white/10 rounded-lg shadow-xl z-20 py-1">
                          {course.status !== 'published' && (
                            <button
                              onClick={() => handleStatusChange(course, 'published')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                              Publicar
                            </button>
                          )}
                          {course.status !== 'draft' && (
                            <button
                              onClick={() => handleStatusChange(course, 'draft')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                              Voltar para Rascunho
                            </button>
                          )}
                          {course.status !== 'archived' && (
                            <button
                              onClick={() => handleStatusChange(course, 'archived')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                              Arquivar
                            </button>
                          )}
                          <hr className="my-1 border-white/10" />
                          <button
                            onClick={() => {
                              setDeleteConfirm(course.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Mostrando {(page - 1) * limit + 1} a{' '}
              {Math.min(page * limit, total)} de {total} cursos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
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
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

export default AcademyCourses;
