import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, List, MoreVertical, ChevronRight, GripVertical } from 'lucide-react';
import { preparatoriosService, rodadasService } from '../../services/preparatoriosService';
import { Preparatorio, Rodada } from '../../lib/database.types';

interface RodadaWithCount extends Rodada {
  missoesCount: number;
}

export const RodadasAdmin: React.FC = () => {
  const { preparatorioId } = useParams<{ preparatorioId: string }>();
  const navigate = useNavigate();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [rodadas, setRodadas] = useState<RodadaWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRodada, setEditingRodada] = useState<Rodada | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadData = async () => {
    if (!preparatorioId) return;

    try {
      setLoading(true);
      const prep = await preparatoriosService.getById(preparatorioId);
      if (!prep) {
        navigate('/admin/preparatorios');
        return;
      }
      setPreparatorio(prep);

      const rodadasData = await rodadasService.getByPreparatorio(preparatorioId);

      // Carregar contagem de missoes para cada rodada
      const withCounts = await Promise.all(
        rodadasData.map(async (r) => {
          const count = await rodadasService.getMissoesCount(r.id);
          return { ...r, missoesCount: count };
        })
      );

      setRodadas(withCounts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta rodada? Todas as missoes serao excluidas.')) {
      return;
    }

    try {
      await rodadasService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir rodada');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!preparatorio) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/admin/planos-preparatorios" className="hover:text-brand-yellow transition-colors">
          Preparatorios
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{preparatorio.nome}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-yellow">Rodadas</span>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <Link
            to="/admin/planos-preparatorios"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h2 className="text-3xl font-black text-white font-display uppercase">Rodadas</h2>
          <p className="text-gray-500 mt-1">
            Gerencie as rodadas de <span style={{ color: preparatorio.cor }}>{preparatorio.nome}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Rodada
        </button>
      </div>

      {rodadas.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma rodada cadastrada</h3>
          <p className="text-gray-500 mb-6">Crie a primeira rodada para este preparatorio.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Rodada
          </button>
        </div>
      ) : (
        <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-brand-dark/50 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                  Titulo
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">
                  Missoes
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase w-32">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rodadas.map((rodada) => (
                <tr key={rodada.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />
                      <span className="text-white font-bold">{rodada.numero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-white font-medium">{rodada.titulo}</p>
                      {rodada.nota && (
                        <p className="text-gray-500 text-xs mt-1">{rodada.nota}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-brand-dark border border-white/10 rounded text-white font-bold text-sm">
                      {rodada.missoesCount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/planos-preparatorios/${preparatorioId}/rodadas/${rodada.id}/missoes`}
                        className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
                        title="Ver Missoes"
                      >
                        <List className="w-4 h-4" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(rodada.id);
                          }}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === rodada.id && (
                          <div className="absolute right-0 top-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setEditingRodada(rodada);
                                setShowModal(true);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <hr className="border-white/10" />
                            <button
                              onClick={() => {
                                handleDelete(rodada.id);
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && preparatorioId && (
        <RodadaModal
          preparatorioId={preparatorioId}
          rodada={editingRodada}
          nextNumero={rodadas.length > 0 ? Math.max(...rodadas.map(r => r.numero)) + 1 : 1}
          onClose={() => {
            setShowModal(false);
            setEditingRodada(null);
          }}
          onSave={async () => {
            await loadData();
            setShowModal(false);
            setEditingRodada(null);
          }}
        />
      )}
    </div>
  );
};

// Modal de Criar/Editar Rodada
interface RodadaModalProps {
  preparatorioId: string;
  rodada: Rodada | null;
  nextNumero: number;
  onClose: () => void;
  onSave: () => void;
}

const RodadaModal: React.FC<RodadaModalProps> = ({ preparatorioId, rodada, nextNumero, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero: rodada?.numero ?? nextNumero,
    titulo: rodada?.titulo || '',
    nota: rodada?.nota || '',
    ordem: rodada?.ordem ?? nextNumero
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rodada) {
        await rodadasService.update(rodada.id, formData);
      } else {
        await rodadasService.create({
          preparatorio_id: preparatorioId,
          ...formData
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar rodada');
    } finally {
      setLoading(false);
    }
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numero = parseInt(e.target.value) || 1;
    setFormData({
      ...formData,
      numero,
      titulo: rodada ? formData.titulo : `${numero}a RODADA`,
      ordem: numero
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white uppercase">
            {rodada ? 'Editar Rodada' : 'Nova Rodada'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Numero da Rodada *</label>
            <input
              type="number"
              value={formData.numero}
              onChange={handleNumeroChange}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Titulo *</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
              placeholder="Ex: 1a RODADA (Missoes 1 a 10)"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nota (opcional)</label>
            <textarea
              value={formData.nota}
              onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
              rows={2}
              placeholder="Observacoes sobre esta rodada..."
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
              {loading ? 'Salvando...' : rodada ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
