import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, MoreVertical, Copy, BookOpen, RotateCcw, Zap, GripVertical } from 'lucide-react';
import { preparatoriosService, rodadasService, missoesService } from '../../services/preparatoriosService';
import { Preparatorio, Rodada, Missao, MissaoTipo } from '../../lib/database.types';

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
      {showModal && rodadaId && (
        <MissaoModal
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

// Modal de Criar/Editar Missao
interface MissaoModalProps {
  rodadaId: string;
  missao: Missao | null;
  nextNumero: string;
  onClose: () => void;
  onSave: () => void;
}

const MissaoModal: React.FC<MissaoModalProps> = ({ rodadaId, missao, nextNumero, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (missao) {
        await missoesService.update(missao.id, data);
      } else {
        await missoesService.create({
          rodada_id: rodadaId,
          ...data
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar missao');
    } finally {
      setLoading(false);
    }
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
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white uppercase">
            {missao ? 'Editar Missao' : 'Nova Missao'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
              className="bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : missao ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
