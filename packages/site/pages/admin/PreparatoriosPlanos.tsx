import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, List, Book, ChevronRight, MessageSquare, LayoutGrid, LayoutList, FileText, Sparkles, Target } from 'lucide-react';
import { preparatoriosService } from '../../services/preparatoriosService';
// import { Preparatorio } from '../../lib/database.types';
interface Preparatorio {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor?: string;
  is_active: boolean;
  ordem?: number;
  content_types?: string[];
  created_at?: string;
  updated_at?: string;
}
import { QuickCreatePreparatorioModal } from '../../components/admin/QuickCreatePreparatorioModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

interface PreparatorioWithStats extends Preparatorio {
  stats: {
    rodadas: number;
    missoes: number;
    mensagens: number;
    edital_items: number;
  };
}

type ViewMode = 'card' | 'list';

export const PreparatoriosPlanos: React.FC = () => {
  const navigate = useNavigate();
  const [preparatorios, setPreparatorios] = useState<PreparatorioWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PreparatorioWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadPreparatorios = async () => {
    try {
      setLoading(true);
      const data = await preparatoriosService.getAll(true);

      // Carregar stats para cada preparatorio
      const withStats = await Promise.all(
        data.map(async (p) => {
          const stats = await preparatoriosService.getStats(p.id);
          return { ...p, stats };
        })
      );

      setPreparatorios(withStats);
    } catch (error) {
      console.error('Erro ao carregar preparatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreparatorios();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await preparatoriosService.toggleActive(id, !currentActive);
      await loadPreparatorios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (prep: PreparatorioWithStats) => {
    setDeleteTarget(prep);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await preparatoriosService.delete(deleteTarget.id);
      await loadPreparatorios();
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Separar e ordenar: ativos primeiro, depois inativos
  const sortedPreparatorios = [...preparatorios].sort((a, b) => {
    // Primeiro critério: ativos antes de inativos
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }
    // Segundo critério: por ordem
    return (a.ordem || 0) - (b.ordem || 0);
  });

  const activePreparatorios = sortedPreparatorios.filter(p => p.is_active);
  const inactivePreparatorios = sortedPreparatorios.filter(p => !p.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase">Preparatorios</h2>
          <p className="text-gray-500 mt-1">Gerencie os preparatorios e suas estruturas de estudo</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle de Visualização */}
          <div className="flex bg-brand-dark border border-white/10 rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 transition-colors ${viewMode === 'card'
                  ? 'bg-brand-yellow text-brand-darker'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list'
                  ? 'bg-brand-yellow text-brand-darker'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              title="Visualização em Lista"
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowQuickCreate(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 font-bold uppercase text-sm hover:bg-purple-500 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Criar com IA
          </button>
          <Link
            to="/admin/preparatorios/new"
            className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Manual
          </Link>
        </div>
      </div>

      {preparatorios.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <Book className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhum preparatorio cadastrado</h3>
          <p className="text-gray-500 mb-6">Crie seu primeiro preparatorio para comecar a gerenciar os planejamentos.</p>
          <Link
            to="/admin/preparatorios/new"
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Preparatorio
          </Link>
        </div>
      ) : viewMode === 'card' ? (
        /* =============== VISUALIZAÇÃO EM CARDS =============== */
        <div className="space-y-8">
          {/* Cards Ativos */}
          {activePreparatorios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePreparatorios.map((prep) => (
                <PreparatorioCard
                  key={prep.id}
                  prep={prep}
                  togglingId={togglingId}
                  handleToggleActive={handleToggleActive}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Separador e Cards Inativos */}
          {inactivePreparatorios.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-gray-500 text-sm uppercase font-bold">Inativos ({inactivePreparatorios.length})</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactivePreparatorios.map((prep) => (
                  <PreparatorioCard
                    key={prep.id}
                    prep={prep}
                    togglingId={togglingId}
                    handleToggleActive={handleToggleActive}
                    handleDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* =============== VISUALIZAÇÃO EM LISTA =============== */
        <div className="space-y-6">
          {/* Tabela de Ativos */}
          {activePreparatorios.length > 0 && (
            <div className="bg-brand-card border border-white/10 rounded-sm">
              <table className="w-full">
                <thead className="bg-brand-dark/50 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Preparatório</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Edital</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Rodadas</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Missões</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Msgs</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase w-40">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activePreparatorios.map((prep) => (
                    <PreparatorioListRow
                      key={prep.id}
                      prep={prep}
                      togglingId={togglingId}
                      handleToggleActive={handleToggleActive}
                      handleDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Separador e Tabela de Inativos */}
          {inactivePreparatorios.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-gray-500 text-sm uppercase font-bold">Inativos ({inactivePreparatorios.length})</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>
              <div className="bg-brand-card border border-white/10 rounded-sm opacity-60">
                <table className="w-full">
                  <thead className="bg-brand-dark/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Preparatório</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Edital</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Rodadas</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Missões</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Msgs</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase w-40">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inactivePreparatorios.map((prep) => (
                      <PreparatorioListRow
                        key={prep.id}
                        prep={prep}
                        togglingId={togglingId}
                        handleToggleActive={handleToggleActive}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Criação Rápida com IA */}
      <QuickCreatePreparatorioModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={(preparatorioId) => {
          setShowQuickCreate(false);
          loadPreparatorios();
          // Navegar diretamente para a aba de Vendas (step 4)
          navigate(`/admin/preparatorios/edit/${preparatorioId}?step=4`);
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Preparatório"
        itemName={deleteTarget?.nome}
        message={`Ao excluir "${deleteTarget?.nome || 'este preparatório'}", serão excluídos permanentemente: todas as rodadas e missões, todo o edital verticalizado, todas as configurações e vínculos.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

// Componente Card para visualização em grid
interface PreparatorioCardProps {
  prep: PreparatorioWithStats;
  togglingId: string | null;
  handleToggleActive: (id: string, isActive: boolean) => void;
  handleDelete: (prep: PreparatorioWithStats) => void;
}

const PreparatorioCard: React.FC<PreparatorioCardProps> = ({
  prep,
  togglingId,
  handleToggleActive,
  handleDelete
}) => (
  <div
    className={`bg-brand-card border rounded-sm transition-all duration-300 ${prep.is_active ? 'border-white/10 hover:border-brand-yellow/30' : 'border-white/5 opacity-60'
      }`}
  >
    {/* Header */}
    <div
      className="p-4 flex items-center justify-between"
      style={{ backgroundColor: `${prep.cor}15` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${prep.cor}30`, color: prep.cor }}
        >
          <Book className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-bold uppercase">{prep.nome}</h3>
          <p className="text-gray-500 text-xs">/{prep.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Toggle Ativo/Inativo */}
        <button
          onClick={() => handleToggleActive(prep.id, prep.is_active)}
          disabled={togglingId === prep.id}
          className={`relative w-10 h-5 rounded-full transition-colors ${prep.is_active ? 'bg-green-500' : 'bg-gray-600'
            } ${togglingId === prep.id ? 'opacity-50' : ''}`}
          title={prep.is_active ? 'Clique para despublicar' : 'Clique para publicar'}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${prep.is_active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
          />
        </button>
        <Link
          to={`/admin/preparatorios/edit/${prep.id}`}
          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-white/5 rounded transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={() => handleDelete(prep)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Status Badge + Content Types */}
    <div className="px-4 py-2 border-b border-white/5 flex flex-wrap gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase rounded ${prep.is_active
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
        }`}>
        {prep.is_active ? 'Ativo' : 'Inativo'}
      </span>
      {/* Edital Status Badge */}
      {prep.stats.edital_items > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30 rounded">
          <FileText className="w-3 h-3" />
          Edital ({prep.stats.edital_items})
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
          <FileText className="w-3 h-3" />
          Sem Edital
        </span>
      )}
      {prep.content_types?.includes('plano') && (
        <span className="px-2 py-1 text-xs font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
          Plano
        </span>
      )}
      {prep.content_types?.includes('questoes') && (
        <span className="px-2 py-1 text-xs font-bold uppercase bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30 rounded">
          Questões
        </span>
      )}
      {prep.content_types?.includes('preparatorio') && (
        <span className="px-2 py-1 text-xs font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
          Portal
        </span>
      )}
    </div>

    {/* Body */}
    <div className="p-4">
      {prep.descricao && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{prep.descricao}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-brand-dark/50 border border-white/5 p-3 text-center rounded-sm">
          <p className="text-2xl font-black text-white">{prep.stats.rodadas}</p>
          <p className="text-xs text-gray-500 uppercase">Rodadas</p>
        </div>
        <div className="bg-brand-dark/50 border border-white/5 p-3 text-center rounded-sm">
          <p className="text-2xl font-black text-white">{prep.stats.missoes}</p>
          <p className="text-xs text-gray-500 uppercase">Missoes</p>
        </div>
        <div className="bg-brand-dark/50 border border-white/5 p-3 text-center rounded-sm">
          <p className="text-2xl font-black text-white">{prep.stats.mensagens}</p>
          <p className="text-xs text-gray-500 uppercase">Msgs</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          to={`/admin/preparatorios/${prep.id}/rodadas`}
          className="flex items-center justify-between w-full p-3 bg-brand-yellow/10 border border-brand-yellow/30 text-sm text-brand-yellow hover:bg-brand-yellow/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Gerenciar Rodadas</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          to={`/admin/preparatorios/${prep.id}/mensagens`}
          className="flex items-center justify-between w-full p-3 bg-brand-dark/50 border border-white/10 text-sm text-gray-300 hover:border-brand-yellow/30 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Mensagens de Incentivo</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          to={`/admin/preparatorios/${prep.id}/edital`}
          className="flex items-center justify-between w-full p-3 bg-brand-dark/50 border border-white/10 text-sm text-gray-300 hover:border-brand-yellow/30 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Edital Verticalizado</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

// Componente Row para visualização em lista
interface PreparatorioListRowProps {
  prep: PreparatorioWithStats;
  togglingId: string | null;
  handleToggleActive: (id: string, isActive: boolean) => void;
  handleDelete: (prep: PreparatorioWithStats) => void;
}

const PreparatorioListRow: React.FC<PreparatorioListRowProps> = ({
  prep,
  togglingId,
  handleToggleActive,
  handleDelete
}) => (
  <tr className="hover:bg-white/[0.02] transition-colors">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${prep.cor}30`, color: prep.cor }}
        >
          <Book className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold truncate">{prep.nome}</p>
          <p className="text-gray-500 text-xs">/{prep.slug}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-4 text-center">
      {prep.stats.edital_items > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30 rounded">
          <FileText className="w-3 h-3" />
          {prep.stats.edital_items}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
          <FileText className="w-3 h-3" />
          Sem
        </span>
      )}
    </td>
    <td className="px-4 py-4 text-center">
      <span className="text-white font-bold">{prep.stats.rodadas}</span>
    </td>
    <td className="px-4 py-4 text-center">
      <span className="text-white font-bold">{prep.stats.missoes}</span>
    </td>
    <td className="px-4 py-4 text-center">
      <span className="text-white font-bold">{prep.stats.mensagens}</span>
    </td>
    <td className="px-4 py-4">
      <div className="flex items-center justify-end gap-1">
        {/* Toggle Ativo/Inativo */}
        <button
          onClick={() => handleToggleActive(prep.id, prep.is_active)}
          disabled={togglingId === prep.id}
          className={`relative w-10 h-5 rounded-full transition-colors ${prep.is_active ? 'bg-green-500' : 'bg-gray-600'
            } ${togglingId === prep.id ? 'opacity-50' : ''}`}
          title={prep.is_active ? 'Clique para despublicar' : 'Clique para publicar'}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${prep.is_active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
          />
        </button>
        <Link
          to={`/admin/preparatorios/${prep.id}/rodadas`}
          className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
          title="Gerenciar Rodadas"
        >
          <Target className="w-4 h-4" />
        </Link>
        <Link
          to={`/admin/preparatorios/${prep.id}/edital`}
          className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
          title="Edital Verticalizado"
        >
          <FileText className="w-4 h-4" />
        </Link>
        <Link
          to={`/admin/preparatorios/edit/${prep.id}`}
          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-white/5 rounded transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={() => handleDelete(prep)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

