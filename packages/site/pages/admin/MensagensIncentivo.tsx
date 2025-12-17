import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, ArrowLeft, MessageSquare, Sparkles, Loader2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { preparatoriosService, mensagensIncentivoService } from '../../services/preparatoriosService';
import { mensagensIncentivoService as mensagensAIService } from '../../services/mensagensIncentivoService';
import { Preparatorio, MensagemIncentivo } from '../../lib/database.types';
import { useToast } from '../../components/ui/Toast';

export const MensagensIncentivoAdmin: React.FC = () => {
  const { preparatorioId } = useParams<{ preparatorioId: string }>();
  const toast = useToast();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [mensagens, setMensagens] = useState<MensagemIncentivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState<MensagemIncentivo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal de geração com IA
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [cargoInput, setCargoInput] = useState('');

  // Modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!preparatorioId) return;

    try {
      setLoading(true);
      const [prepData, mensagensData] = await Promise.all([
        preparatoriosService.getById(preparatorioId),
        mensagensIncentivoService.getByPreparatorio(preparatorioId)
      ]);
      setPreparatorio(prepData);
      setMensagens(mensagensData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await mensagensIncentivoService.toggleActive(id, !isActive);
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await mensagensIncentivoService.delete(deletingId);
      await loadData();
      toast.success('Mensagem excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir mensagem');
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const handleGenerateClick = () => {
    // Inicializar o cargo com o valor do preparatório ou vazio
    setCargoInput(preparatorio?.cargo || '');
    setShowGenerateModal(true);
  };

  const handleGenerateConfirm = async () => {
    if (!preparatorioId || !preparatorio) return;

    // Se não tem cargo no preparatório e não foi informado, não permite continuar
    const cargoFinal = cargoInput.trim() || preparatorio.cargo || preparatorio.nome;

    setIsGenerating(true);
    try {
      const result = await mensagensAIService.regenerate(
        preparatorioId,
        cargoFinal,
        preparatorio.orgao || undefined
      );

      if (result.success) {
        await loadData();
        toast.success(`${result.count} mensagens de incentivo geradas com sucesso!`);
        setShowGenerateModal(false);
        setCargoInput('');
      } else {
        throw new Error(result.error || 'Erro ao gerar mensagens');
      }
    } catch (error: any) {
      console.error('Erro ao gerar mensagens:', error);
      toast.error(error.message || 'Erro ao gerar mensagens');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!preparatorio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Preparatorio nao encontrado</p>
        <Link to="/admin/preparatorios" className="text-brand-yellow hover:underline mt-4 inline-block">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/admin/preparatorios/edit/${preparatorioId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Preparatório
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white font-display uppercase">Mensagens de Incentivo</h2>
            <p className="text-gray-500 mt-1">
              <span style={{ color: preparatorio.cor }}>{preparatorio.nome}</span> - Gerencie as mensagens de incentivo
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botão IA - Gerar ou Atualizar */}
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 font-bold uppercase text-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            >
              {mensagens.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <Sparkles className="w-3 h-3" />
                  Atualizar
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar
                </>
              )}
            </button>
            <button
              onClick={() => {
                setEditingMensagem(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Mensagem
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Mensagens */}
      {mensagens.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma mensagem cadastrada</h3>
          <p className="text-gray-500 mb-6">Gere mensagens de incentivo personalizadas automaticamente ou crie manualmente.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 font-bold uppercase text-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 rounded-sm"
            >
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </button>
            <span className="text-gray-600">ou</span>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 font-bold uppercase text-sm hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {mensagens.map((mensagem, index) => (
            <div
              key={mensagem.id}
              className={`bg-brand-card border rounded-sm p-4 flex items-center gap-4 transition-all ${
                mensagem.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="text-gray-600 cursor-grab">
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <p className="text-white">{mensagem.mensagem}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    mensagem.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {mensagem.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <span className="text-xs text-gray-600">#{index + 1}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(mensagem.id, mensagem.is_active)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                  title={mensagem.is_active ? 'Desativar' : 'Ativar'}
                >
                  {mensagem.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setEditingMensagem(mensagem);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(mensagem.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <MensagemModal
          preparatorioId={preparatorioId!}
          mensagem={editingMensagem}
          onClose={() => {
            setShowModal(false);
            setEditingMensagem(null);
          }}
          onSave={async () => {
            await loadData();
            setShowModal(false);
            setEditingMensagem(null);
          }}
        />
      )}

      {/* Modal de Geração com IA */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase">
                  {mensagens.length > 0 ? 'Atualizar Mensagens' : 'Gerar Mensagens'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setCargoInput('');
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {mensagens.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-200 text-sm">
                    Esta ação irá <strong>substituir todas as {mensagens.length} mensagens atuais</strong> por novas mensagens personalizadas.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  Cargo para personalização {!preparatorio?.cargo && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={cargoInput}
                  onChange={(e) => setCargoInput(e.target.value)}
                  placeholder={preparatorio?.cargo || 'Ex: Policial Rodoviário Federal, Juiz Federal, Auditor Fiscal...'}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                />
                <p className="text-gray-600 text-xs mt-2">
                  As mensagens serão personalizadas para este cargo. Ex: "Futuro PRF, as estradas esperam por você!"
                </p>
              </div>

              {preparatorio?.orgao && (
                <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                  <p className="text-gray-400 text-xs">
                    <span className="font-bold text-gray-300">Órgão:</span> {preparatorio.orgao}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowGenerateModal(false);
                  setCargoInput('');
                }}
                disabled={isGenerating}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateConfirm}
                disabled={isGenerating || (!cargoInput.trim() && !preparatorio?.cargo)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 font-bold uppercase text-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {mensagens.length > 0 ? 'Atualizar' : 'Gerar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Excluir Mensagem</h3>
              <p className="text-gray-400 text-center">
                Tem certeza que deseja excluir esta mensagem de incentivo? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="flex-1 px-6 py-2 border border-white/20 text-gray-400 font-bold uppercase text-sm hover:text-white hover:border-white/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-2 bg-red-500 text-white font-bold uppercase text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MensagemModalProps {
  preparatorioId: string;
  mensagem: MensagemIncentivo | null;
  onClose: () => void;
  onSave: () => void;
}

const MensagemModal: React.FC<MensagemModalProps> = ({ preparatorioId, mensagem, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mensagem: mensagem?.mensagem || '',
    is_active: mensagem?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mensagem) {
        await mensagensIncentivoService.update(mensagem.id, formData);
      } else {
        await mensagensIncentivoService.create({
          preparatorio_id: preparatorioId,
          mensagem: formData.mensagem,
          is_active: formData.is_active
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white uppercase">
            {mensagem ? 'Editar Mensagem' : 'Nova Mensagem'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Mensagem *</label>
            <textarea
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
              rows={4}
              placeholder="Digite uma mensagem motivacional para o aluno..."
              required
            />
            <p className="text-gray-600 text-xs mt-1">
              Esta mensagem sera exibida aleatoriamente nos planejamentos gerados.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
              />
              <span className="text-white text-sm">Mensagem ativa</span>
            </label>
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
              {loading ? 'Salvando...' : mensagem ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
