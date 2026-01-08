import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  PlayCircle,
  CheckCircle,
  Plus,
  TrendingUp,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { getAcademyStats, getCourses, getCategories } from '../../../services/eadService';
import type { EadCourse, EadCategory } from '../../../types/ead';

interface Stats {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalLessons: number;
  completedEnrollments: number;
}

export const AcademyDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCourses, setRecentCourses] = useState<EadCourse[]>([]);
  const [categories, setCategories] = useState<EadCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, coursesData, categoriesData] = await Promise.all([
        getAcademyStats(),
        getCourses({ page: 1, limit: 5 }),
        getCategories(true),
      ]);

      setStats(statsData);
      setRecentCourses(coursesData.courses);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats
    ? stats.totalEnrollments > 0
      ? ((stats.completedEnrollments / stats.totalEnrollments) * 100).toFixed(1)
      : '0'
    : '0';

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/5 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Academy</h1>
          <p className="text-gray-400 mt-1">Gerencie seus cursos e conteúdos EAD</p>
        </div>
        <Link
          to="/admin/academy/cursos/novo"
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Curso
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Cursos</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalCourses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-400">{stats?.publishedCourses || 0}</span>
            <span className="text-gray-500">publicados</span>
          </div>
        </div>

        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Matrículas</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalEnrollments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-400">{stats?.completedEnrollments || 0}</span>
            <span className="text-gray-500">concluídas</span>
          </div>
        </div>

        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Aulas</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalLessons || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <PlayCircle className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500">videoaulas e conteúdos</span>
          </div>
        </div>

        <div className="bg-brand-card border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-white mt-1">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-500">cursos completos</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/academy/cursos"
          className="bg-brand-card border border-white/5 rounded-lg p-4 hover:border-brand-yellow/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Gerenciar Cursos</p>
              <p className="text-gray-400 text-sm">Ver todos os cursos</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/academy/categorias"
          className="bg-brand-card border border-white/5 rounded-lg p-4 hover:border-brand-yellow/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <FolderOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Categorias</p>
              <p className="text-gray-400 text-sm">{categories.length} categorias</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/academy/cursos/novo"
          className="bg-brand-card border border-white/5 rounded-lg p-4 hover:border-brand-yellow/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Plus className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Novo Curso</p>
              <p className="text-gray-400 text-sm">Criar curso</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Courses */}
      <div className="bg-brand-card border border-white/5 rounded-lg">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Cursos Recentes</h2>
            <Link
              to="/admin/academy/cursos"
              className="text-brand-yellow text-sm hover:underline"
            >
              Ver todos
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {recentCourses.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum curso criado ainda</p>
              <Link
                to="/admin/academy/cursos/novo"
                className="text-brand-yellow hover:underline mt-2 inline-block"
              >
                Criar primeiro curso
              </Link>
            </div>
          ) : (
            recentCourses.map((course) => (
              <Link
                key={course.id}
                to={`/admin/academy/cursos/${course.id}/editar`}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="w-16 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{course.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      {course.totalLessons} aulas
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrolledCount} alunos
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      course.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : course.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {course.status === 'published'
                      ? 'Publicado'
                      : course.status === 'draft'
                      ? 'Rascunho'
                      : 'Arquivado'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Categories Overview */}
      <div className="bg-brand-card border border-white/5 rounded-lg">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Categorias</h2>
            <Link
              to="/admin/academy/categorias"
              className="text-brand-yellow text-sm hover:underline"
            >
              Gerenciar
            </Link>
          </div>
        </div>

        <div className="p-4">
          {categories.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma categoria criada</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border"
                  style={{
                    backgroundColor: category.color ? `${category.color}20` : 'rgba(255,255,255,0.1)',
                    borderColor: category.color || 'rgba(255,255,255,0.2)',
                    color: category.color || '#fff',
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;
