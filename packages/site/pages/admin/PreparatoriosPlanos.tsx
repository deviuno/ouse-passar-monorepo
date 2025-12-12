import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, List, MoreVertical, Book, ChevronRight, MessageSquare, DollarSign } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { preparatoriosService } from '../../services/preparatoriosService';
import { Preparatorio } from '../../lib/database.types';
import { PreparatorioImageUpload } from '../../components/admin/PreparatorioImageUpload';

interface PreparatorioWithStats extends Preparatorio {
  stats: {
    rodadas: number;
    missoes: number;
    mensagens: number;
  };
}

export const PreparatoriosPlanos: React.FC = () => {
  const navigate = useNavigate();
  const [preparatorios, setPreparatorios] = useState<PreparatorioWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPreparatorio, setEditingPreparatorio] = useState<Preparatorio | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    try {
      await preparatoriosService.toggleActive(id, !currentActive);
      await loadPreparatorios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este preparatorio? Esta acao ira excluir todas as rodadas e missoes associadas.')) {
      return;
    }

    try {
      await preparatoriosService.delete(id);
      await loadPreparatorios();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir preparatorio');
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Fechar menu ao clicar fora
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase">Preparatorios</h2>
          <p className="text-gray-500 mt-1">Gerencie os preparatorios e suas estruturas de estudo</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Preparatorio
        </button>
      </div>

      {preparatorios.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <Book className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhum preparatorio cadastrado</h3>
          <p className="text-gray-500 mb-6">Crie seu primeiro preparatorio para comecar a gerenciar os planejamentos.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Preparatorio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preparatorios.map((prep) => (
            <div
              key={prep.id}
              className={`bg-brand-card border rounded-sm overflow-hidden transition-all duration-300 ${
                prep.is_active ? 'border-white/10 hover:border-brand-yellow/30' : 'border-white/5 opacity-60'
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
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(prep.id);
                    }}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === prep.id && (
                    <div className="absolute right-0 top-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl z-10 min-w-[160px]">
                      <button
                        onClick={() => {
                          setEditingPreparatorio(prep);
                          setShowCreateModal(true);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          handleToggleActive(prep.id, prep.is_active);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        {prep.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Ativar
                          </>
                        )}
                      </button>
                      <hr className="border-white/10 my-1" />
                      <button
                        onClick={() => {
                          handleDelete(prep.id);
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

              {/* Status Badge */}
              <div className="px-4 py-2 border-b border-white/5">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase rounded ${
                  prep.is_active
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                }`}>
                  {prep.is_active ? 'Ativo' : 'Inativo'}
                </span>
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
                    to={`/admin/planos-preparatorios/${prep.id}/rodadas`}
                    className="flex items-center justify-between w-full p-3 bg-brand-dark/50 border border-white/10 text-sm text-gray-300 hover:border-brand-yellow/30 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span>Gerenciar Rodadas</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/admin/planos-preparatorios/${prep.id}/mensagens`}
                    className="flex items-center justify-between w-full p-3 bg-brand-dark/50 border border-white/10 text-sm text-gray-300 hover:border-brand-yellow/30 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Mensagens de Incentivo</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showCreateModal && (
        <PreparatorioModal
          preparatorio={editingPreparatorio}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPreparatorio(null);
          }}
          onSave={async () => {
            await loadPreparatorios();
            setShowCreateModal(false);
            setEditingPreparatorio(null);
          }}
        />
      )}
    </div>
  );
};

// Modal de Criar/Editar Preparatorio
interface PreparatorioModalProps {
  preparatorio: Preparatorio | null;
  onClose: () => void;
  onSave: () => void;
}

const PreparatorioModal: React.FC<PreparatorioModalProps> = ({ preparatorio, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'vendas'>('geral');
  const [formData, setFormData] = useState({
    nome: preparatorio?.nome || '',
    slug: preparatorio?.slug || '',
    descricao: preparatorio?.descricao || '',
    icone: preparatorio?.icone || 'book',
    cor: preparatorio?.cor || '#3B82F6',
    is_active: preparatorio?.is_active ?? true,
    ordem: preparatorio?.ordem ?? 0,
    // Campos de vendas
    imagem_capa: preparatorio?.imagem_capa || '',
    preco: preparatorio?.preco || null,
    preco_desconto: preparatorio?.preco_desconto || null,
    checkout_url: preparatorio?.checkout_url || '',
    descricao_curta: preparatorio?.descricao_curta || '',
    descricao_vendas: preparatorio?.descricao_vendas || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (preparatorio) {
        await preparatoriosService.update(preparatorio.id, formData);
      } else {
        await preparatoriosService.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar preparatorio');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nome = e.target.value;
    setFormData({
      ...formData,
      nome,
      slug: preparatorio ? formData.slug : generateSlug(nome)
    });
  };

  const coresPreDefinidas = [
    '#1E40AF', // Azul PRF
    '#DC2626', // Vermelho
    '#059669', // Verde
    '#7C3AED', // Roxo
    '#D97706', // Laranja
    '#0891B2', // Ciano
    '#BE185D', // Rosa
    '#4B5563', // Cinza
  ];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'align',
    'blockquote', 'code-block', 'link', 'image',
    'color', 'background'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
          <h3 className="text-xl font-bold text-white uppercase">
            {preparatorio ? 'Editar Preparatorio' : 'Novo Preparatorio'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-6 py-3 text-sm font-bold uppercase transition-colors ${
              activeTab === 'geral'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Geral
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendas')}
            className={`px-6 py-3 text-sm font-bold uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'vendas'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Vendas
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Tab Geral */}
            {activeTab === 'geral' && (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={handleNomeChange}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                    placeholder="Ex: PRF - Policia Rodoviaria Federal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                    placeholder="Ex: prf"
                    required
                  />
                  <p className="text-gray-600 text-xs mt-1">URL: /planejamento/{formData.slug || 'slug'}</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descricao Interna</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Descricao breve do preparatorio (uso interno)..."
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Cor do Tema</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {coresPreDefinidas.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor })}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          formData.cor === cor ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-full h-10 bg-brand-dark border border-white/10 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Ordem</label>
                    <input
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                      className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Status</label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-brand-dark border border-white/10">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                      />
                      <span className="text-white text-sm">Ativo</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Tab Vendas */}
            {activeTab === 'vendas' && (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Imagem de Capa</label>
                  <PreparatorioImageUpload
                    value={formData.imagem_capa}
                    onChange={(url) => setFormData({ ...formData, imagem_capa: url })}
                  />
                  <p className="text-gray-600 text-xs mt-1">Imagem exibida nos cards e pagina de vendas</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Preco (R$)</label>
                    <input
                      type="number"
                      value={formData.preco || ''}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                      placeholder="297.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Preco com Desconto (R$)</label>
                    <input
                      type="number"
                      value={formData.preco_desconto || ''}
                      onChange={(e) => setFormData({ ...formData, preco_desconto: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                      placeholder="197.00"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-gray-600 text-xs mt-1">Deixe vazio se nao houver desconto</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">URL do Checkout</label>
                  <input
                    type="url"
                    value={formData.checkout_url}
                    onChange={(e) => setFormData({ ...formData, checkout_url: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                    placeholder="https://checkout.exemplo.com/preparatorio-prf"
                  />
                  <p className="text-gray-600 text-xs mt-1">Link para pagina de pagamento</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descricao Curta</label>
                  <textarea
                    value={formData.descricao_curta}
                    onChange={(e) => setFormData({ ...formData, descricao_curta: e.target.value.slice(0, 300) })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Planejamento completo para o concurso da PRF..."
                    maxLength={300}
                  />
                  <p className="text-gray-600 text-xs mt-1">{formData.descricao_curta.length}/300 caracteres - Exibida nos cards</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descricao para Vendas</label>
                  <div className="preparatorio-editor">
                    <ReactQuill
                      theme="snow"
                      value={formData.descricao_vendas}
                      onChange={(value) => setFormData({ ...formData, descricao_vendas: value })}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Escreva a descricao persuasiva para a pagina de vendas..."
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-1">Texto persuasivo para pagina de vendas com formatacao</p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
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
              {loading ? 'Salvando...' : preparatorio ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Styles for Quill Editor */}
      <style>{`
        .preparatorio-editor {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preparatorio-editor .ql-toolbar {
          background: #2a2a2a;
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 8px;
        }

        .preparatorio-editor .ql-container {
          min-height: 200px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: #1a1a1a;
          border: none !important;
        }

        .preparatorio-editor .ql-editor {
          min-height: 200px;
          padding: 12px;
          color: #ffffff;
        }

        .preparatorio-editor .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.4);
          font-style: normal;
        }

        .preparatorio-editor .ql-toolbar button {
          color: #ffffff;
        }

        .preparatorio-editor .ql-toolbar button:hover {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar button.ql-active {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar .ql-stroke {
          stroke: #ffffff;
        }

        .preparatorio-editor .ql-toolbar .ql-stroke:hover {
          stroke: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar .ql-fill {
          fill: #ffffff;
        }

        .preparatorio-editor .ql-toolbar .ql-fill:hover {
          fill: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar button:hover .ql-fill {
          fill: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar .ql-picker-label {
          color: #ffffff;
        }

        .preparatorio-editor .ql-toolbar .ql-picker-label:hover {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar .ql-picker-label.ql-active {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-toolbar .ql-picker-options {
          background: #2a2a2a;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preparatorio-editor .ql-toolbar .ql-picker-item {
          color: #ffffff;
        }

        .preparatorio-editor .ql-toolbar .ql-picker-item:hover {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-editor h1,
        .preparatorio-editor .ql-editor h2,
        .preparatorio-editor .ql-editor h3,
        .preparatorio-editor .ql-editor h4,
        .preparatorio-editor .ql-editor h5,
        .preparatorio-editor .ql-editor h6 {
          color: #ffffff;
        }

        .preparatorio-editor .ql-editor a {
          color: #fbbf24;
        }

        .preparatorio-editor .ql-editor blockquote {
          border-left-color: #fbbf24;
          color: rgba(255, 255, 255, 0.8);
        }

        .preparatorio-editor .ql-editor code,
        .preparatorio-editor .ql-editor pre {
          background: #2a2a2a;
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
};
