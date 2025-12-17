import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, ArrowLeft, MessageSquare } from 'lucide-react';
import { preparatoriosService, mensagensIncentivoService } from '../../services/preparatoriosService';
import { Preparatorio, MensagemIncentivo } from '../../lib/database.types';

export const MensagensIncentivoAdmin: React.FC = () => {
  const { preparatorioId } = useParams<{ preparatorioId: string }>();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [mensagens, setMensagens] = useState<MensagemIncentivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState<MensagemIncentivo | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      await mensagensIncentivoService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir mensagem');
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
          to="/admin/preparatorios"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Preparatorios
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white font-display uppercase">Mensagens de Incentivo</h2>
            <p className="text-gray-500 mt-1">
              <span style={{ color: preparatorio.cor }}>{preparatorio.nome}</span> - Gerencie as mensagens de incentivo
            </p>
          </div>
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

      {/* Lista de Mensagens */}
      {mensagens.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma mensagem cadastrada</h3>
          <p className="text-gray-500 mb-6">Crie mensagens de incentivo para motivar os alunos.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Mensagem
          </button>
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
                  onClick={() => handleDelete(mensagem.id)}
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

      {/* Modal */}
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
