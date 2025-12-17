import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  GraduationCap,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { getCourses, deleteCourse, Course, getCoursesStats, ContentType } from '../../services/simuladoService';
import { useToast } from '../../components/ui/Toast';

export const Preparatorios: React.FC = () => {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | ContentType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    simulados: 0,
    preparatorios: 0,
    pendingEditais: 0,
  });

  // Load courses
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [coursesResult, statsResult] = await Promise.all([
          getCourses({ includeEdital: true }),
          getCoursesStats(),
        ]);

        if (coursesResult.error) throw new Error(coursesResult.error);

        setCourses(coursesResult.courses);
        setStats(statsResult);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este preparatório?')) return;

    try {
      const { error } = await deleteCourse(id);
      if (error) throw new Error(error);

      setCourses((prev) => prev.filter((c) => c.id !== id));
      setOpenMenu(null);
      toast.success('Preparatório excluído com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir preparatório');
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    // Search filter
    if (searchTerm && !course.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter - verifica se o content_types array contém o tipo selecionado
    if (filterType !== 'all' && !course.content_types?.includes(filterType)) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active' && !course.is_active) return false;
    if (filterStatus === 'inactive' && course.is_active) return false;
    if (filterStatus === 'pending' && course.edital?.status !== 'pending' && course.edital?.status !== 'processing') {
      return false;
    }

    return true;
  });

  const getEditalStatusBadge = (course: Course) => {
    if (!course.edital) {
      return (
        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs font-bold uppercase rounded">
          Sem edital
        </span>
      );
    }

    switch (course.edital.status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase rounded">
            <Clock className="w-3 h-3" />
            Aguardando
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-500 text-xs font-bold uppercase rounded">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
            <CheckCircle className="w-3 h-3" />
            Analisado
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded">
            <AlertCircle className="w-3 h-3" />
            Erro
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
            Preparatórios & Simulados
          </h1>
          <p className="text-gray-400 mt-1">Gerencie seus cursos preparatórios e simulados.</p>
        </div>
        <Link
          to="/admin/preparatorios/new"
          className="bg-brand-yellow text-brand-darker px-4 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Preparatório
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Ativos</p>
          <p className="text-2xl font-black text-green-500">{stats.active}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Questões</p>
          <p className="text-2xl font-black text-brand-yellow">{stats.simulados}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Preparatórios</p>
          <p className="text-2xl font-black text-blue-500">{stats.preparatorios}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-black text-yellow-500">{stats.pendingEditais}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-brand-card border border-white/5 p-4 rounded-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar preparatório..."
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
        >
          <option value="all">Todos os tipos</option>
          <option value="plano">Plano</option>
          <option value="questoes">Questões</option>
          <option value="preparatorio">Preparatórios</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-brand-card border border-white/5 rounded-sm p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-yellow mx-auto animate-spin" />
          <p className="text-gray-400 mt-4">Carregando...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
          <div className="p-12 text-center text-gray-500">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Nenhum preparatório encontrado com os filtros aplicados.'
                : 'Nenhum preparatório encontrado.'}
            </p>
            <p className="text-sm mt-2">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros.'
                : 'Clique no botão acima para criar o primeiro.'}
            </p>
          </div>
        </div>
      )}

      {/* Courses List */}
      {!loading && filteredCourses.length > 0 && (
        <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Nome
                </th>
                <th className="text-left py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Tipo
                </th>
                <th className="text-left py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Edital
                </th>
                <th className="text-left py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Questões
                </th>
                <th className="text-right py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-yellow/10 rounded-sm flex items-center justify-center">
                        {course.content_types?.includes('questoes') ? (
                          <CheckSquare className="w-5 h-5 text-brand-yellow" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-brand-yellow" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{course.title}</p>
                        {course.description && (
                          <p className="text-gray-500 text-sm truncate max-w-xs">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {course.content_types?.map((type) => {
                        const typeConfig: Record<ContentType, { label: string; bgClass: string; textClass: string }> = {
                          plano: { label: 'Plano', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400' },
                          questoes: { label: 'Questões', bgClass: 'bg-brand-yellow/20', textClass: 'text-brand-yellow' },
                          preparatorio: { label: 'Prep.', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
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
                  </td>
                  <td className="py-4 px-6">
                    {course.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
                        <CheckCircle className="w-3 h-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs font-bold uppercase rounded">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">{getEditalStatusBadge(course)}</td>
                  <td className="py-4 px-6">
                    <span className="text-white font-bold">
                      {course.questions_count > 0
                        ? course.questions_count.toLocaleString('pt-BR')
                        : '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2 relative">
                      <Link
                        to={`/admin/preparatorios/edit/${course.id}`}
                        className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === course.id ? null : course.id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenu === course.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl z-20 min-w-[150px]">
                              <Link
                                to={`/admin/preparatorios/edit/${course.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Ver detalhes
                              </Link>
                              <button
                                onClick={() => handleDelete(course.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
