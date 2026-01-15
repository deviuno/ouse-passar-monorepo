import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Copy, BookOpen, RotateCcw, Zap, GripVertical, FileText, Loader2, ListChecks } from 'lucide-react';
import { preparatoriosService, rodadasService, missoesService } from '../../services/preparatoriosService';
import { Tables, Enums } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { QuestionsPreviewModal, ContentPreviewModal, MissaoModal } from '../../components/admin/missoes';

type Preparatorio = Tables<'preparatorios'>;
type Rodada = Tables<'rodadas'>;
type Missao = Tables<'missoes'>;
type MissaoTipo = Enums<'missao_tipo'>;

export const MissoesAdmin: React.FC = () => {
  const { preparatorioId, rodadaId } = useParams<{ preparatorioId: string; rodadaId: string }>();
  const navigate = useNavigate();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMissao, setEditingMissao] = useState<Missao | null>(null);
  const [filterTipo, setFilterTipo] = useState<MissaoTipo | 'todos'>('todos');
  const [contentPreviewMissao, setContentPreviewMissao] = useState<Missao | null>(null);
  const [questionsPreviewMissao, setQuestionsPreviewMissao] = useState<Missao | null>(null);
  const [missoesComConteudo, setMissoesComConteudo] = useState<Set<string>>(new Set());
  const [deleteConfirmMissao, setDeleteConfirmMissao] = useState<Missao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    if (!preparatorioId || !rodadaId) return;

    try {
      setLoading(true);
      const [prep, rod] = await Promise.all([
        preparatoriosService.getById(preparatorioId),
        rodadasService.getById(rodadaId)
      ]);

      if (!prep || !rod) {
        navigate('/admin/preparatorios');
        return;
      }

      setPreparatorio(prep);
      setRodada(rod);

      const missoesData = await missoesService.getByRodada(rodadaId);
      setMissoes(missoesData);

      // Carregar status de conteúdo para todas as missões de estudo
      const missaoIds = missoesData
        .filter(m => m.tipo === 'padrao' || m.tipo === 'estudo')
        .map(m => m.id);

      if (missaoIds.length > 0) {
        const { data: conteudos } = await supabase
          .from('missao_conteudos')
          .select('missao_id')
          .in('missao_id', missaoIds)
          .eq('status', 'completed');

        if (conteudos) {
          setMissoesComConteudo(new Set(conteudos.map(c => c.missao_id)));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId, rodadaId]);

  const handleDeleteClick = (missao: Missao) => {
    setDeleteConfirmMissao(missao);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmMissao) return;

    try {
      setDeleting(true);
      await missoesService.delete(deleteConfirmMissao.id);
      setDeleteConfirmMissao(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir missao');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await missoesService.duplicate(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao duplicar missao');
    }
  };

  const filteredMissoes = filterTipo === 'todos'
    ? missoes
    : missoes.filter(m => m.tipo === filterTipo);

  const getTipoIcon = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return <BookOpen className="w-4 h-4" />;
      case 'revisao': return <RotateCcw className="w-4 h-4" />;
      case 'acao': return <Zap className="w-4 h-4" />;
      case 'tecnicas': return <FileText className="w-4 h-4" />;
      case 'simulado': return <Edit className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'revisao': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'acao': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'tecnicas': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'simulado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTipoBg = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return 'border-l-blue-500';
      case 'revisao': return 'border-l-purple-500';
      case 'acao': return 'border-l-orange-500';
      case 'tecnicas': return 'border-l-green-500';
      case 'simulado': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!preparatorio || !rodada) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/admin/preparatorios" className="hover:text-brand-yellow transition-colors">
          Preparatorios
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/preparatorios/${preparatorioId}/rodadas`} className="hover:text-brand-yellow transition-colors">
          {preparatorio.nome}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Rodada {rodada.numero}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-yellow">Missoes</span>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <Link
            to={`/admin/preparatorios/${preparatorioId}/rodadas`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Rodadas
          </Link>
          <h2 className="text-3xl font-black text-white font-display uppercase">{rodada.titulo}</h2>
          <p className="text-gray-500 mt-1">{missoes.length} missoes cadastradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Missao
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterTipo('todos')}
          className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'todos'
              ? 'bg-brand-yellow text-brand-darker'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          Todos ({missoes.length})
        </button>
        <button
          onClick={() => setFilterTipo('padrao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'padrao'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Padrao ({missoes.filter(m => m.tipo === 'padrao').length})
        </button>
        <button
          onClick={() => setFilterTipo('revisao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'revisao'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <RotateCcw className="w-4 h-4" />
          Revisao ({missoes.filter(m => m.tipo === 'revisao').length})
        </button>
        <button
          onClick={() => setFilterTipo('acao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'acao'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <Zap className="w-4 h-4" />
          Acao ({missoes.filter(m => m.tipo === 'acao').length})
        </button>
      </div>

      {filteredMissoes.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            {missoes.length === 0 ? 'Nenhuma missao cadastrada' : 'Nenhuma missao encontrada com este filtro'}
          </h3>
          <p className="text-gray-500 mb-6">
            {missoes.length === 0 ? 'Crie a primeira missao para esta rodada.' : 'Altere o filtro para ver outras missoes.'}
          </p>
          {missoes.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Missao
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissoes.map((missao) => (
            <div
              key={missao.id}
              className={`bg-brand-card border border-white/10 rounded-sm border-l-4 ${getTipoBg(missao.tipo)} hover:border-white/20 transition-colors`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />
                  <span className="w-10 h-10 bg-brand-dark border border-white/10 rounded flex items-center justify-center text-white font-black">
                    {missao.numero}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase rounded border ${getTipoColor(missao.tipo)}`}>
                      {getTipoIcon(missao.tipo)}
                      {missao.tipo}
                    </span>
                    {missao.materia && (
                      <span className="text-brand-yellow font-bold text-sm">{missao.materia}</span>
                    )}
                  </div>

                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <>
                      {missao.assunto && (
                        <p className="text-gray-300 text-sm mb-1 line-clamp-2">{missao.assunto}</p>
                      )}
                      {missao.instrucoes && (
                        <p className="text-gray-500 text-xs">{missao.instrucoes}</p>
                      )}
                    </>
                  )}

                  {missao.tipo === 'revisao' && missao.tema && (
                    <p className="text-purple-300 text-sm font-medium">{missao.tema}</p>
                  )}

                  {missao.tipo === 'acao' && missao.acao && (
                    <p className="text-orange-300 text-sm font-medium">{missao.acao}</p>
                  )}

                  {missao.extra && missao.extra.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {missao.extra.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-brand-dark/50 text-gray-400 text-xs rounded">
                          + {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {missao.obs && (
                    <p className="mt-2 text-yellow-500/70 text-xs italic">{missao.obs}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Botão Conteúdo - apenas para missões de estudo */}
                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <button
                      onClick={() => setContentPreviewMissao(missao)}
                      className={`p-2 rounded transition-colors ${missoesComConteudo.has(missao.id)
                          ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                          : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                      title={missoesComConteudo.has(missao.id) ? "Ver Conteúdo" : "Gerar Conteúdo"}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  {/* Botão Questões - apenas para missões de estudo */}
                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <button
                      onClick={() => setQuestionsPreviewMissao(missao)}
                      className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
                      title="Ver Questões"
                    >
                      <ListChecks className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingMissao(missao);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(missao.id)}
                    className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(missao)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && rodadaId && preparatorioId && preparatorio && (
        <MissaoModal
          preparatorioId={preparatorioId}
          rodadaId={rodadaId}
          preparatorio={preparatorio}
          missao={editingMissao}
          nextNumero={missoes.length > 0 ? String(Math.max(...missoes.map(m => parseInt(m.numero) || 0)) + 1) : '1'}
          onClose={() => {
            setShowModal(false);
            setEditingMissao(null);
          }}
          onSave={async () => {
            await loadData();
            setShowModal(false);
            setEditingMissao(null);
          }}
        />
      )}

      {/* Modal de Preview de Conteúdo */}
      {contentPreviewMissao && (
        <ContentPreviewModal
          missao={contentPreviewMissao}
          hasContent={missoesComConteudo.has(contentPreviewMissao.id)}
          onClose={() => setContentPreviewMissao(null)}
          onContentGenerated={() => {
            setMissoesComConteudo(prev => new Set([...prev, contentPreviewMissao.id]));
          }}
        />
      )}

      {/* Modal de Preview de Questões */}
      {questionsPreviewMissao && (
        <QuestionsPreviewModal
          missao={questionsPreviewMissao}
          onClose={() => setQuestionsPreviewMissao(null)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmMissao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-white/10">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Missão</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-300">
                Tem certeza que deseja excluir a missão{' '}
                <span className="font-bold text-white">
                  {deleteConfirmMissao.numero}{deleteConfirmMissao.materia ? ` - ${deleteConfirmMissao.materia}` : ''}{deleteConfirmMissao.assunto ? `: ${deleteConfirmMissao.assunto}` : ''}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Todos os dados relacionados a esta missão serão removidos permanentemente.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-brand-dark/30">
              <button
                onClick={() => setDeleteConfirmMissao(null)}
                disabled={deleting}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 font-bold uppercase text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
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
