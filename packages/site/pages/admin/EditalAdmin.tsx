import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Edit, Trash2,
  MoreVertical, Book, FileText, List, GripVertical, Copy, FolderOpen, Folder
} from 'lucide-react';
import { preparatoriosService } from '../../services/preparatoriosService';
import { editalService, EditalItem, EditalItemWithChildren, EditalItemTipo } from '../../services/editalService';
import { Preparatorio } from '../../lib/database.types';

export const EditalAdmin: React.FC = () => {
  const { preparatorioId } = useParams<{ preparatorioId: string }>();
  const navigate = useNavigate();

  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [items, setItems] = useState<EditalItemWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EditalItem | null>(null);
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [modalTipo, setModalTipo] = useState<EditalItemTipo>('materia');

  // Menu state
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

      const tree = await editalService.getTreeByPreparatorio(preparatorioId);
      setItems(tree);

      // Expandir todos por padrão
      const allIds = new Set<string>();
      const collectIds = (nodes: EditalItemWithChildren[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          collectIds(node.children);
        });
      };
      collectIds(tree);
      setExpandedItems(allIds);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Todos os subitens também serão excluídos.')) {
      return;
    }

    try {
      await editalService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir item');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await editalService.duplicate(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao duplicar item');
    }
  };

  const openAddModal = (parentId: string | null, tipo: EditalItemTipo) => {
    setEditingItem(null);
    setModalParentId(parentId);
    setModalTipo(tipo);
    setShowModal(true);
  };

  const openEditModal = (item: EditalItem) => {
    setEditingItem(item);
    setModalParentId(item.parent_id);
    setModalTipo(item.tipo);
    setShowModal(true);
  };

  const getItemIcon = (tipo: EditalItemTipo, isExpanded: boolean) => {
    switch (tipo) {
      case 'bloco':
        return isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />;
      case 'materia':
        return <Book className="w-4 h-4" />;
      case 'topico':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTipoLabel = (tipo: EditalItemTipo) => {
    switch (tipo) {
      case 'bloco': return 'Bloco';
      case 'materia': return 'Matéria';
      case 'topico': return 'Tópico/Assunto';
    }
  };

  const getTipoColor = (tipo: EditalItemTipo) => {
    switch (tipo) {
      case 'bloco': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'materia': return 'text-brand-yellow bg-brand-yellow/20 border-brand-yellow/30';
      case 'topico': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const countItems = (nodes: EditalItemWithChildren[]): { materias: number; topicos: number } => {
    let materias = 0;
    let topicos = 0;

    const count = (items: EditalItemWithChildren[]) => {
      items.forEach(item => {
        if (item.tipo === 'materia') materias++;
        if (item.tipo === 'topico') topicos++;
        count(item.children);
      });
    };

    count(nodes);
    return { materias, topicos };
  };

  const renderItem = (item: EditalItemWithChildren, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children.length > 0;
    const indent = level * 24;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-white/[0.02] border-b border-white/5 group transition-colors`}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpand(item.id)}
            className={`p-1 rounded transition-colors ${hasChildren ? 'hover:bg-white/10' : 'opacity-0 pointer-events-none'}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Drag Handle */}
          <GripVertical className="w-4 h-4 text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Icon */}
          <span className={getTipoColor(item.tipo).split(' ')[0]}>
            {getItemIcon(item.tipo, isExpanded)}
          </span>

          {/* Title */}
          <span className="flex-1 text-white text-sm">{item.titulo}</span>

          {/* Tipo Badge */}
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getTipoColor(item.tipo)}`}>
            {getTipoLabel(item.tipo)}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Add Child Button */}
            {item.tipo !== 'topico' && (
              <button
                onClick={() => openAddModal(item.id, item.tipo === 'bloco' ? 'materia' : 'topico')}
                className="p-1.5 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
                title={`Adicionar ${item.tipo === 'bloco' ? 'Matéria' : 'Tópico'}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                }}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === item.id && (
                <div className="absolute right-0 top-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl z-20 min-w-[140px]">
                  <button
                    onClick={() => {
                      openEditModal(item);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicate(item.id);
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
                      handleDelete(item.id);
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

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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

  const counts = countItems(items);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/admin/preparatorios" className="hover:text-brand-yellow transition-colors">
          Preparatórios
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{preparatorio.nome}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-yellow">Edital</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link
            to={`/admin/preparatorios/${preparatorioId}/rodadas`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Rodadas
          </Link>
          <h2 className="text-3xl font-black text-white font-display uppercase">Edital Verticalizado</h2>
          <p className="text-gray-500 mt-1">
            Gerencie as matérias e tópicos do edital de{' '}
            <span style={{ color: preparatorio.cor }}>{preparatorio.nome}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 mr-4">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{counts.materias}</p>
              <p className="text-xs text-gray-500 uppercase">Matérias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{counts.topicos}</p>
              <p className="text-xs text-gray-500 uppercase">Tópicos</p>
            </div>
          </div>

          {/* Add Buttons */}
          <button
            onClick={() => openAddModal(null, 'bloco')}
            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-2 font-bold uppercase text-xs hover:bg-purple-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Bloco
          </button>
          <button
            onClick={() => openAddModal(null, 'materia')}
            className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Matéria
          </button>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Edital vazio</h3>
          <p className="text-gray-500 mb-6">
            Comece adicionando as matérias do edital. Você pode organizar por blocos (ex: Conhecimentos Básicos, Específicos).
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => openAddModal(null, 'bloco')}
              className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 font-bold uppercase text-sm hover:bg-purple-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Bloco
            </button>
            <button
              onClick={() => openAddModal(null, 'materia')}
              className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Matéria
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-dark/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const allIds = new Set<string>();
                  const collectIds = (nodes: EditalItemWithChildren[]) => {
                    nodes.forEach(node => {
                      allIds.add(node.id);
                      collectIds(node.children);
                    });
                  };
                  collectIds(items);
                  setExpandedItems(allIds);
                }}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Expandir Todos
              </button>
              <button
                onClick={() => setExpandedItems(new Set())}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Recolher Todos
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Arraste os itens para reordenar
            </p>
          </div>

          {/* Tree */}
          <div className="divide-y divide-white/5">
            {items.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && preparatorioId && (
        <EditalItemModal
          preparatorioId={preparatorioId}
          item={editingItem}
          parentId={modalParentId}
          tipo={modalTipo}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={async () => {
            await loadData();
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// ==================== MODAL ====================

interface EditalItemModalProps {
  preparatorioId: string;
  item: EditalItem | null;
  parentId: string | null;
  tipo: EditalItemTipo;
  onClose: () => void;
  onSave: () => void;
}

const EditalItemModal: React.FC<EditalItemModalProps> = ({
  preparatorioId,
  item,
  parentId,
  tipo,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState(item?.titulo || '');

  const getTipoLabel = (t: EditalItemTipo) => {
    switch (t) {
      case 'bloco': return 'Bloco';
      case 'materia': return 'Matéria';
      case 'topico': return 'Tópico/Assunto';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setLoading(true);

    try {
      if (item) {
        await editalService.update(item.id, { titulo: titulo.trim() });
      } else {
        await editalService.create({
          preparatorio_id: preparatorioId,
          tipo,
          titulo: titulo.trim(),
          parent_id: parentId
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white uppercase">
            {item ? `Editar ${getTipoLabel(tipo)}` : `Novo ${getTipoLabel(tipo)}`}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
              Nome do {getTipoLabel(tipo)} *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
              placeholder={
                tipo === 'bloco' ? 'Ex: Conhecimentos Básicos' :
                tipo === 'materia' ? 'Ex: Língua Portuguesa' :
                'Ex: Compreensão e interpretação de textos'
              }
              autoFocus
              required
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
              disabled={loading || !titulo.trim()}
              className="bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : item ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
