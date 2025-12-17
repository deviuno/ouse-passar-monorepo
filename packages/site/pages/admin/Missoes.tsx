import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, MoreVertical, Copy, BookOpen, RotateCcw, Zap, GripVertical, FileText, X, Filter, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { preparatoriosService, rodadasService, missoesService, QuestaoFiltrosData, MissaoQuestaoFiltros } from '../../services/preparatoriosService';
import { editalService, EditalItem } from '../../services/editalService';
import { Preparatorio, Rodada, Missao, MissaoTipo } from '../../lib/database.types';
import { EditalTopicSelector } from '../../components/admin/EditalTopicSelector';
import { QuestionFilterSelector } from '../../components/admin/QuestionFilterSelector';
import { QuestionFilters } from '../../services/externalQuestionsService';

export const MissoesAdmin: React.FC = () => {
  const { preparatorioId, rodadaId } = useParams<{ preparatorioId: string; rodadaId: string }>();
  const navigate = useNavigate();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMissao, setEditingMissao] = useState<Missao | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<MissaoTipo | 'todos'>('todos');

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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId, rodadaId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta missao?')) {
      return;
    }

    try {
      await missoesService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir missao');
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

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const filteredMissoes = filterTipo === 'todos'
    ? missoes
    : missoes.filter(m => m.tipo === filterTipo);

  const getTipoIcon = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao': return <BookOpen className="w-4 h-4" />;
      case 'revisao': return <RotateCcw className="w-4 h-4" />;
      case 'acao': return <Zap className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'revisao': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'acao': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  const getTipoBg = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao': return 'border-l-blue-500';
      case 'revisao': return 'border-l-purple-500';
      case 'acao': return 'border-l-orange-500';
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
          className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
            filterTipo === 'todos'
              ? 'bg-brand-yellow text-brand-darker'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          Todos ({missoes.length})
        </button>
        <button
          onClick={() => setFilterTipo('padrao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
            filterTipo === 'padrao'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Padrao ({missoes.filter(m => m.tipo === 'padrao').length})
        </button>
        <button
          onClick={() => setFilterTipo('revisao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
            filterTipo === 'revisao'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Revisao ({missoes.filter(m => m.tipo === 'revisao').length})
        </button>
        <button
          onClick={() => setFilterTipo('acao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
            filterTipo === 'acao'
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
              className={`bg-brand-card border border-white/10 rounded-sm overflow-hidden border-l-4 ${getTipoBg(missao.tipo)} hover:border-white/20 transition-colors`}
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

                  {missao.tipo === 'padrao' && (
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
                      {missao.extra.map((item, i) => (
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

                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(missao.id);
                    }}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === missao.id && (
                    <div className="absolute right-0 top-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl z-10 min-w-[140px]">
                      <button
                        onClick={() => {
                          setEditingMissao(missao);
                          setShowModal(true);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(missao.id);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicar
                      </button>
                      <hr className="border-white/10" />
                      <button
                        onClick={() => {
                          handleDelete(missao.id);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && rodadaId && preparatorioId && (
        <MissaoModal
          preparatorioId={preparatorioId}
          rodadaId={rodadaId}
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
    </div>
  );
};

// Modal de Criar/Editar Missao (Wizard de 2 etapas)
interface MissaoModalProps {
  preparatorioId: string;
  rodadaId: string;
  missao: Missao | null;
  nextNumero: string;
  onClose: () => void;
  onSave: () => void;
}

const MissaoModal: React.FC<MissaoModalProps> = ({ preparatorioId, rodadaId, missao, nextNumero, onClose, onSave }) => {
  // Etapa do wizard (1 = dados da missao, 2 = filtros de questoes)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedMissaoId, setSavedMissaoId] = useState<string | null>(missao?.id || null);

  const [formData, setFormData] = useState({
    numero: missao?.numero ?? nextNumero,
    tipo: missao?.tipo ?? 'padrao' as MissaoTipo,
    materia: missao?.materia || '',
    assunto: missao?.assunto || '',
    instrucoes: missao?.instrucoes || '',
    tema: missao?.tema || '',
    acao: missao?.acao || '',
    extra: missao?.extra || [],
    obs: missao?.obs || '',
    ordem: missao?.ordem ?? parseInt(nextNumero)
  });

  const [newExtra, setNewExtra] = useState('');

  // Estado para topicos do edital
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedEditalItemIds, setSelectedEditalItemIds] = useState<string[]>([]);
  const [selectedEditalItems, setSelectedEditalItems] = useState<EditalItem[]>([]);
  const [usedEditalItemIds, setUsedEditalItemIds] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Estado para filtros de questoes
  const [existingFiltros, setExistingFiltros] = useState<MissaoQuestaoFiltros | null>(null);
  const [questoesCount, setQuestoesCount] = useState<number>(0);

  // Carregar topicos ja vinculados a esta missao e topicos ja usados
  useEffect(() => {
    const loadTopics = async () => {
      if (!preparatorioId) return;
      setLoadingTopics(true);
      try {
        // Carregar topicos ja usados em outras missoes
        const usedIds = await missoesService.getUsedEditalItemIds(preparatorioId);
        setUsedEditalItemIds(usedIds);

        // Se estiver editando, carregar topicos desta missao
        if (missao) {
          const itemIds = await missoesService.getEditalItems(missao.id);
          setSelectedEditalItemIds(itemIds);

          // Carregar detalhes dos itens selecionados
          if (itemIds.length > 0) {
            const items = await Promise.all(
              itemIds.map(id => editalService.getById(id))
            );
            setSelectedEditalItems(items.filter((i): i is EditalItem => i !== null));
          }

          // Carregar filtros de questoes existentes
          const filtros = await missoesService.getQuestaoFiltros(missao.id);
          if (filtros) {
            setExistingFiltros(filtros);
            setQuestoesCount(filtros.questoes_count);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar topicos:', error);
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [preparatorioId, missao]);

  const handleTopicsConfirm = async (ids: string[]) => {
    setSelectedEditalItemIds(ids);
    setShowTopicSelector(false);

    // Carregar detalhes dos itens selecionados
    if (ids.length > 0) {
      const items = await Promise.all(
        ids.map(id => editalService.getById(id))
      );
      setSelectedEditalItems(items.filter((i): i is EditalItem => i !== null));
    } else {
      setSelectedEditalItems([]);
    }
  };

  const removeEditalItem = (id: string) => {
    setSelectedEditalItemIds(prev => prev.filter(i => i !== id));
    setSelectedEditalItems(prev => prev.filter(i => i.id !== id));
  };

  // Salvar dados da missao e avancar para etapa 2
  const handleSaveAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        numero: formData.numero,
        tipo: formData.tipo,
        materia: formData.tipo === 'padrao' ? formData.materia || null : null,
        assunto: formData.tipo === 'padrao' ? formData.assunto || null : null,
        instrucoes: formData.tipo === 'padrao' ? formData.instrucoes || null : null,
        tema: formData.tipo === 'revisao' || formData.tipo === 'padrao' ? formData.tema || null : null,
        acao: formData.tipo === 'acao' ? formData.acao || null : null,
        extra: formData.extra.length > 0 ? formData.extra : null,
        obs: formData.obs || null,
        ordem: formData.ordem
      };

      let missaoId = savedMissaoId;

      if (missao) {
        await missoesService.update(missao.id, data);
        missaoId = missao.id;
      } else {
        const created = await missoesService.create({
          rodada_id: rodadaId,
          ...data
        });
        missaoId = created.id;
      }

      setSavedMissaoId(missaoId);

      // Salvar vinculos com topicos do edital
      if (missaoId && formData.tipo === 'padrao') {
        await missoesService.setEditalItems(missaoId, selectedEditalItemIds);
      }

      // Se for tipo padrao, avancar para etapa 2 (filtros de questoes)
      if (formData.tipo === 'padrao') {
        setStep(2);
      } else {
        // Se nao for padrao, finalizar
        onSave();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar missao');
    } finally {
      setLoading(false);
    }
  };

  // Salvar filtros de questoes
  const handleSaveFilters = async (filters: QuestionFilters, count: number) => {
    if (!savedMissaoId) return;

    try {
      const filtrosData: QuestaoFiltrosData = {
        materias: filters.materias,
        assuntos: filters.assuntos,
        bancas: filters.bancas,
        orgaos: filters.orgaos,
        anos: filters.anos,
      };

      await missoesService.setQuestaoFiltros(savedMissaoId, filtrosData, count);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
      alert('Erro ao salvar filtros de questoes');
    }
  };

  // Pular etapa de filtros
  const handleSkipFilters = () => {
    onSave();
  };

  const addExtra = () => {
    if (newExtra.trim()) {
      setFormData({ ...formData, extra: [...formData.extra, newExtra.trim()] });
      setNewExtra('');
    }
  };

  const removeExtra = (index: number) => {
    setFormData({
      ...formData,
      extra: formData.extra.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm my-8">
        {/* Header com indicador de etapa */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">
              {missao ? 'Editar Missao' : 'Nova Missao'}
            </h3>
            {formData.tipo === 'padrao' && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 text-xs ${step === 1 ? 'text-brand-yellow' : 'text-gray-500'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${step === 1 ? 'border-brand-yellow bg-brand-yellow/20' : 'border-gray-600'}`}>1</span>
                  <span>Dados</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <div className={`flex items-center gap-1 text-xs ${step === 2 ? 'text-brand-yellow' : 'text-gray-500'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${step === 2 ? 'border-brand-yellow bg-brand-yellow/20' : 'border-gray-600'}`}>2</span>
                  <span>Questoes</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Etapa 1: Dados da Missao */}
        {step === 1 && (
          <form onSubmit={handleSaveAndNext} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Numero *</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                  placeholder="Ex: 1, 10, 10,20"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as MissaoTipo })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                >
                  <option value="padrao">Padrao (Estudo)</option>
                  <option value="revisao">Revisao</option>
                  <option value="acao">Acao</option>
                </select>
              </div>
            </div>

            {/* Campos para tipo PADRAO */}
            {formData.tipo === 'padrao' && (
              <>
                {/* Topicos do Edital */}
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                    Topicos do Edital
                  </label>
                  <div className="bg-brand-dark border border-white/10 p-3">
                    {loadingTopics ? (
                      <p className="text-gray-500 text-sm">Carregando...</p>
                    ) : selectedEditalItems.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-3">Nenhum topico selecionado</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedEditalItems.map(item => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand-yellow/20 text-brand-yellow text-sm rounded border border-brand-yellow/30"
                          >
                            <FileText className="w-3 h-3" />
                            {item.titulo}
                            <button
                              type="button"
                              onClick={() => removeEditalItem(item.id)}
                              className="ml-1 text-brand-yellow/70 hover:text-brand-yellow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTopicSelector(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Selecionar Topicos do Edital
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Materia</label>
                  <input
                    type="text"
                    value={formData.materia}
                    onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                    placeholder="Ex: Direito Constitucional"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Assunto</label>
                  <textarea
                    value={formData.assunto}
                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Ex: Direitos e deveres individuais e coletivos"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Instrucoes</label>
                  <textarea
                    value={formData.instrucoes}
                    onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={2}
                    placeholder="Ex: Estudar a teoria pontual e resolver a lista de questoes."
                  />
                </div>
              </>
            )}

            {/* Campo para tipo REVISAO ou adicional do PADRAO */}
            {(formData.tipo === 'revisao' || formData.tipo === 'padrao') && (
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  {formData.tipo === 'revisao' ? 'Tema da Revisao *' : 'Tema de Revisao (opcional)'}
                </label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                  placeholder="Ex: REVISAO OUSE PASSAR"
                  required={formData.tipo === 'revisao'}
                />
              </div>
            )}

            {/* Campo para tipo ACAO */}
            {formData.tipo === 'acao' && (
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Acao *</label>
                <textarea
                  value={formData.acao}
                  onChange={(e) => setFormData({ ...formData, acao: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                  rows={2}
                  placeholder="Ex: SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
                  required
                />
              </div>
            )}

            {/* Extras */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Extras (opcional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newExtra}
                  onChange={(e) => setNewExtra(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExtra())}
                  className="flex-1 bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                  placeholder="Ex: Revisao: Parte 1 - Direito Constitucional"
                />
                <button
                  type="button"
                  onClick={addExtra}
                  className="px-4 bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.extra.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.extra.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-brand-dark/50 text-gray-300 text-sm rounded">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeExtra(i)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Observacao */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Observacao (opcional)</label>
              <input
                type="text"
                value={formData.obs}
                onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                placeholder="Ex: o aluno deve escolher entre Ingles ou Espanhol."
              />
            </div>

            {/* Indicador de filtros existentes */}
            {existingFiltros && questoesCount > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 flex items-center gap-3">
                <Filter className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">
                    Filtros de questoes configurados
                  </p>
                  <p className="text-blue-400/70 text-xs">
                    {questoesCount} questoes vinculadas a esta missao
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  'Salvando...'
                ) : formData.tipo === 'padrao' ? (
                  <>
                    Proximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {missao ? 'Salvar' : 'Criar'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Etapa 2: Filtros de Questoes */}
        {step === 2 && (
          <div className="flex flex-col">
            {/* Botao de voltar */}
            <div className="px-6 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-gray-500 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para dados da missao
              </button>
            </div>

            <QuestionFilterSelector
              initialFilters={existingFiltros?.filtros as QuestionFilters}
              onSave={handleSaveFilters}
              onCancel={handleSkipFilters}
            />
          </div>
        )}
      </div>

      {/* Modal de Selecao de Topicos */}
      {showTopicSelector && (
        <EditalTopicSelector
          preparatorioId={preparatorioId}
          selectedIds={selectedEditalItemIds}
          usedIds={usedEditalItemIds}
          currentMissaoId={missao?.id}
          onClose={() => setShowTopicSelector(false)}
          onConfirm={handleTopicsConfirm}
        />
      )}
    </div>
  );
};
