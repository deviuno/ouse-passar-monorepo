import React, { useEffect, useState } from 'react';
import {
  X, ChevronRight, ChevronDown, FolderOpen, Folder, Book, FileText,
  Check, Search, Loader2
} from 'lucide-react';
import { editalService, EditalItemWithChildren } from '../../services/editalService';

interface EditalTopicSelectorProps {
  preparatorioId: string;
  selectedIds: string[];
  usedIds: string[]; // IDs ja usados em outras missoes (para ocultar)
  currentMissaoId?: string; // ID da missao atual (para nao ocultar seus proprios topicos)
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

export const EditalTopicSelector: React.FC<EditalTopicSelectorProps> = ({
  preparatorioId,
  selectedIds: initialSelectedIds,
  usedIds,
  currentMissaoId,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EditalItemWithChildren[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [preparatorioId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tree = await editalService.getTreeByPreparatorio(preparatorioId);
      setItems(tree);

      // Expandir todos por padrao
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
      console.error('Erro ao carregar edital:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Verifica se um item esta disponivel (nao usado em outras missoes)
  const isItemAvailable = (id: string): boolean => {
    // Se o item esta nos usedIds mas tambem nos selectedIds iniciais, esta disponivel (e da missao atual)
    if (initialSelectedIds.includes(id)) return true;
    // Se esta nos usedIds, nao esta disponivel
    return !usedIds.includes(id);
  };

  // Verifica se um bloco/materia tem filhos disponiveis
  const hasAvailableChildren = (item: EditalItemWithChildren): boolean => {
    if (item.tipo === 'topico') {
      return isItemAvailable(item.id);
    }
    return item.children.some(child => hasAvailableChildren(child));
  };

  // Filtra items baseado no termo de busca
  const matchesSearch = (item: EditalItemWithChildren): boolean => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (item.titulo.toLowerCase().includes(term)) return true;
    return item.children.some(child => matchesSearch(child));
  };

  // Conta topicos disponiveis em um item
  const countAvailableTopics = (item: EditalItemWithChildren): number => {
    if (item.tipo === 'topico') {
      return isItemAvailable(item.id) ? 1 : 0;
    }
    return item.children.reduce((sum, child) => sum + countAvailableTopics(child), 0);
  };

  // Conta topicos selecionados em um item
  const countSelectedTopics = (item: EditalItemWithChildren): number => {
    if (item.tipo === 'topico') {
      return selectedIds.has(item.id) ? 1 : 0;
    }
    return item.children.reduce((sum, child) => sum + countSelectedTopics(child), 0);
  };

  const getItemIcon = (tipo: string, isExpanded: boolean) => {
    switch (tipo) {
      case 'bloco':
        return isExpanded ? <FolderOpen className="w-4 h-4 text-purple-400" /> : <Folder className="w-4 h-4 text-purple-400" />;
      case 'materia':
        return <Book className="w-4 h-4 text-brand-yellow" />;
      case 'topico':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderItem = (item: EditalItemWithChildren, level: number = 0): React.ReactNode => {
    // Nao renderizar se nao tem filhos disponiveis
    if (!hasAvailableChildren(item)) return null;

    // Nao renderizar se nao corresponde a busca
    if (!matchesSearch(item)) return null;

    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children.length > 0 && item.children.some(c => hasAvailableChildren(c) && matchesSearch(c));
    const indent = level * 20;
    const isTopico = item.tipo === 'topico';
    const isSelected = selectedIds.has(item.id);
    const availableCount = countAvailableTopics(item);
    const selectedCount = countSelectedTopics(item);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-2 hover:bg-white/[0.03] transition-colors ${
            isTopico && isSelected ? 'bg-brand-yellow/10' : ''
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {/* Expand/Collapse para nao-topicos */}
          {!isTopico ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className={`p-0.5 ${hasChildren ? '' : 'opacity-0 pointer-events-none'}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            // Checkbox para topicos
            <button
              onClick={() => toggleSelect(item.id)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-brand-yellow border-brand-yellow'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-brand-darker" />}
            </button>
          )}

          {/* Icon */}
          {getItemIcon(item.tipo, isExpanded)}

          {/* Titulo */}
          <span
            className={`flex-1 text-sm ${isTopico ? 'text-white' : 'text-gray-300 font-medium'} ${
              isTopico && isSelected ? 'text-brand-yellow' : ''
            }`}
            onClick={() => isTopico && toggleSelect(item.id)}
            style={{ cursor: isTopico ? 'pointer' : 'default' }}
          >
            {item.titulo}
          </span>

          {/* Contador para blocos/materias */}
          {!isTopico && (
            <span className="text-xs text-gray-500">
              {selectedCount > 0 && (
                <span className="text-brand-yellow mr-1">{selectedCount}/</span>
              )}
              {availableCount} disponíveis
            </span>
          )}
        </div>

        {/* Filhos */}
        {isExpanded && hasChildren && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  // Total de topicos selecionados
  const totalSelected = selectedIds.size;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Selecionar Assuntos do Edital</h3>
            <p className="text-sm text-gray-500">
              {totalSelected} assunto{totalSelected !== 1 ? 's' : ''} selecionado{totalSelected !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar assunto..."
              className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:border-brand-yellow/50 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum item no edital</p>
              <p className="text-gray-600 text-sm mt-1">
                Cadastre o edital verticalizado primeiro para poder selecionar assuntos
              </p>
            </div>
          ) : (
            <div>
              {items.map(item => renderItem(item))}

              {/* Mensagem se todos os assuntos ja foram usados */}
              {items.every(item => !hasAvailableChildren(item)) && (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">Todos os assuntos ja foram atribuidos</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Nao ha mais assuntos disponiveis para selecao
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-white/10 bg-brand-dark/30">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
          >
            <Check className="w-4 h-4" />
            Adicionar {totalSelected > 0 ? `(${totalSelected})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
