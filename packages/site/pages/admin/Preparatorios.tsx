import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  GraduationCap,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  Sparkles,
  Target,
} from 'lucide-react';
import { preparatoriosService } from '../../services/preparatoriosService';
import { editalService } from '../../services/editalService';
import { Preparatorio, PreparatorioContentType } from '../../lib/database.types';
import { useToast } from '../../components/ui/Toast';
import { QuickCreatePreparatorioModal } from '../../components/admin/QuickCreatePreparatorioModal';

// Tipo estendido com contagem de edital
interface PreparatorioWithStats extends Preparatorio {
  editalCount?: number;
}

export const Preparatorios: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [preparatorios, setPreparatorios] = useState<PreparatorioWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | PreparatorioContentType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    plano: 0,
    questoes: 0,
  });

  // Função para carregar preparatórios
  const loadPreparatorios = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar todos os preparatórios (incluindo inativos para admin)
      const data = await preparatoriosService.getAll(true);

      // Buscar contagem de edital para cada preparatório
      const preparatoriosWithStats = await Promise.all(
        data.map(async (prep) => {
          const editalItems = await editalService.getByPreparatorio(prep.id);
          return { ...prep, editalCount: editalItems.length };
        })
      );

      setPreparatorios(preparatoriosWithStats);

      // Calcular stats
      setStats({
        total: data.length,
        active: data.filter(p => p.is_active).length,
        plano: data.filter(p => p.content_types?.includes('plano')).length,
        questoes: data.filter(p => p.content_types?.includes('questoes')).length,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load preparatorios on mount
  useEffect(() => {
    loadPreparatorios();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmMessage = `⚠️ ATENÇÃO: Ao excluir este preparatório, serão excluídos PERMANENTEMENTE:

• Todas as rodadas e missões
• Todo o edital verticalizado (blocos, matérias, tópicos)
• Todas as configurações e vínculos

Esta ação NÃO pode ser desfeita. Deseja continuar?`;

    if (!confirm(confirmMessage)) return;

    try {
      await preparatoriosService.delete(id);
      setPreparatorios((prev) => prev.filter((p) => p.id !== id));
      toast.success('Preparatório excluído com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir preparatório');
    }
  };

  const handleToggleActive = async (prep: PreparatorioWithStats) => {
    setTogglingId(prep.id);
    try {
      await preparatoriosService.update(prep.id, { is_active: !prep.is_active });
      setPreparatorios((prev) =>
        prev.map((p) => (p.id === prep.id ? { ...p, is_active: !p.is_active } : p))
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        active: prev.active + (prep.is_active ? -1 : 1),
      }));
      toast.success(prep.is_active ? 'Preparatório despublicado' : 'Preparatório publicado');
    } catch (err: any) {
      toast.error('Erro ao alterar status');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter preparatorios
  const filteredPreparatorios = preparatorios.filter((prep) => {
    // Search filter - busca por nome
    if (searchTerm && !prep.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter - verifica se o content_types array contém o tipo selecionado
    if (filterType !== 'all' && !prep.content_types?.includes(filterType)) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active' && !prep.is_active) return false;
    if (filterStatus === 'inactive' && prep.is_active) return false;

    return true;
  });

  const getEditalStatusBadge = (prep: PreparatorioWithStats) => {
    if (!prep.editalCount || prep.editalCount === 0) {
      return (
        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs font-bold uppercase rounded">
          Sem edital
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
        <FileText className="w-3 h-3" />
        {prep.editalCount} itens
      </span>
    );
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickCreate(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-purple-500 transition-colors flex items-center"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Criar com IA
          </button>
          <Link
            to="/admin/preparatorios/new"
            className="bg-brand-yellow text-brand-darker px-4 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Manual
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Publicados</p>
          <p className="text-2xl font-black text-green-500">{stats.active}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Com Plano</p>
          <p className="text-2xl font-black text-purple-500">{stats.plano}</p>
        </div>
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Com Questões</p>
          <p className="text-2xl font-black text-brand-yellow">{stats.questoes}</p>
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
          <option value="active">Publicados</option>
          <option value="inactive">Não publicados</option>
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
      {!loading && filteredPreparatorios.length === 0 && (
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

      {/* Preparatorios List */}
      {!loading && filteredPreparatorios.length > 0 && (
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
                  Banca/Órgão
                </th>
                <th className="text-right py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPreparatorios.map((prep) => (
                <tr
                  key={prep.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-yellow/10 rounded-sm flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-brand-yellow" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{prep.nome}</p>
                        <p className="text-gray-600 text-xs font-mono">
                          /{prep.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {prep.content_types?.map((type) => {
                        const typeConfig: Record<PreparatorioContentType, { label: string; bgClass: string; textClass: string }> = {
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
                    {prep.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
                        <CheckCircle className="w-3 h-3" />
                        Publicado
                      </span>
                    ) : prep.montagem_status === 'em_andamento' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase rounded animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Gerando Missões
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs font-bold uppercase rounded">
                        Rascunho
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">{getEditalStatusBadge(prep)}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      {prep.banca && <span className="text-purple-400">{prep.banca}</span>}
                      {prep.banca && prep.orgao && <span className="text-gray-600 mx-1">/</span>}
                      {prep.orgao && <span className="text-blue-400">{prep.orgao}</span>}
                      {!prep.banca && !prep.orgao && <span className="text-gray-600">-</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle Ativo/Inativo */}
                      <button
                        onClick={() => handleToggleActive(prep)}
                        disabled={togglingId === prep.id}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          prep.is_active ? 'bg-green-500' : 'bg-gray-600'
                        } ${togglingId === prep.id ? 'opacity-50' : ''}`}
                        title={prep.is_active ? 'Clique para despublicar' : 'Clique para publicar'}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            prep.is_active ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      {/* Ver Rodadas */}
                      <Link
                        to={`/admin/preparatorios/${prep.id}/rodadas`}
                        className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                        title="Ver Rodadas"
                      >
                        <Target className="w-4 h-4" />
                      </Link>

                      {/* Editar */}
                      <Link
                        to={`/admin/preparatorios/edit/${prep.id}`}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Excluir */}
                      <button
                        onClick={() => handleDelete(prep.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criação Rápida com IA */}
      <QuickCreatePreparatorioModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={(preparatorioId) => {
          setShowQuickCreate(false);
          loadPreparatorios(); // Recarregar lista para mostrar o novo preparatório
          toast.success('Preparatório criado com sucesso!');
          navigate(`/admin/preparatorios/edit/${preparatorioId}`);
        }}
      />
    </div>
  );
};
