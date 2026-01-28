import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Edit, Trash2,
  MoreVertical, Book, FileText, List, GripVertical, Copy, FolderOpen, Folder, Sparkles,
  Search, Check, X, Loader2, ArrowRight, ArrowLeftRight
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { preparatoriosService } from '../../services/preparatoriosService';
import { editalService, EditalItem, EditalItemWithChildren, EditalItemTipo, TaxonomyNode } from '../../services/editalService';
// import { Preparatorio } from '../../lib/database.types'; // REMOVED

interface Preparatorio {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  is_active: boolean;
  ordem?: number;
  created_at?: string;
}
import { ImportEditalModal } from '../../components/admin/ImportEditalModal';
import { ParsedEdital, EditalExistsAction } from '../../services/editalAIService';
import { InlineDropdown } from '../../components/admin/edital-admin';

// Componente para renderizar um nó da árvore de taxonomia no dropdown
interface TaxonomyTreeNodeProps {
  node: TaxonomyNode;
  selectedAssuntos: string[];
  onToggleMultiple: (assuntos: string[], select: boolean) => void;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  searchTerm: string;
  level?: number;
}

const TaxonomyTreeNode: React.FC<TaxonomyTreeNodeProps> = ({
  node,
  selectedAssuntos,
  onToggleMultiple,
  expandedNodes,
  toggleExpanded,
  searchTerm,
  level = 0
}) => {
  const nodeId = `${node.materia}-${node.id}`;
  const isExpanded = expandedNodes.has(nodeId);
  const hasChildren = node.filhos && node.filhos.length > 0;

  // Calcular todos os assuntos deste nó e filhos
  const getAllAssuntos = (n: TaxonomyNode): string[] => {
    let assuntos = [...(n.assuntos_originais || [])];
    if (n.filhos) {
      for (const filho of n.filhos) {
        assuntos = [...assuntos, ...getAllAssuntos(filho)];
      }
    }
    return assuntos;
  };

  const allNodeAssuntos = getAllAssuntos(node);
  const selectedCount = allNodeAssuntos.filter(a => selectedAssuntos.includes(a)).length;
  const isPartiallySelected = selectedCount > 0 && selectedCount < allNodeAssuntos.length;
  const isFullySelected = selectedCount === allNodeAssuntos.length && allNodeAssuntos.length > 0;

  // Normalizar texto para busca
  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Verificar se corresponde à busca
  const matchesSearch = (n: TaxonomyNode): boolean => {
    if (!searchTerm) return true;
    const searchNorm = normalizeText(searchTerm);
    if (normalizeText(n.nome).includes(searchNorm)) return true;
    if (n.assuntos_originais?.some(a => normalizeText(a).includes(searchNorm))) return true;
    if (n.filhos?.some(f => matchesSearch(f))) return true;
    return false;
  };

  if (!matchesSearch(node)) return null;

  const handleToggleNode = () => {
    if (allNodeAssuntos.length > 0) {
      onToggleMultiple(allNodeAssuntos, !isFullySelected);
    }
  };

  const paddingLeft = 8 + level * 14;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer transition-colors hover:bg-white/5 ${isFullySelected ? 'bg-brand-yellow/10' : ''
          }`}
        style={{ paddingLeft }}
      >
        {/* Botão de expandir */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(nodeId);
            }}
            className="p-0.5 hover:bg-white/10 rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={10} className="text-gray-500" />
            ) : (
              <ChevronRight size={10} className="text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-[14px] flex-shrink-0" />
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggleNode}
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isFullySelected
              ? 'bg-brand-yellow border-brand-yellow'
              : isPartiallySelected
                ? 'bg-brand-yellow/50 border-brand-yellow'
                : 'border-gray-600 hover:border-gray-500'
            }`}
        >
          {(isFullySelected || isPartiallySelected) && (
            <Check size={8} className="text-black" />
          )}
        </button>

        {/* Nome do nó */}
        <span
          onClick={handleToggleNode}
          className={`flex-1 text-xs leading-tight ${isFullySelected ? 'text-brand-yellow' : 'text-gray-300'
            }`}
        >
          {node.nome}
        </span>

        {/* Badge com contagem */}
        {allNodeAssuntos.length > 0 && (
          <span className="text-[10px] text-gray-600 bg-white/5 px-1 py-0.5 rounded">
            {selectedCount > 0 ? `${selectedCount}/` : ''}{allNodeAssuntos.length}
          </span>
        )}
      </div>

      {/* Filhos */}
      {isExpanded && hasChildren && (
        <div>
          {node.filhos.map((filho) => (
            <TaxonomyTreeNode
              key={`${filho.materia}-${filho.id}`}
              node={filho}
              selectedAssuntos={selectedAssuntos}
              onToggleMultiple={onToggleMultiple}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              searchTerm={searchTerm}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente dropdown de assuntos com opção de trocar matéria (COM HIERARQUIA)
interface AssuntoDropdownProps {
  value: string[];
  parentMaterias: string[];
  allMaterias: string[];
  loadAssuntos: (materias: string[]) => Promise<string[]>;
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

const AssuntoDropdownWithMateriaSelector: React.FC<AssuntoDropdownProps> = ({
  value,
  parentMaterias,
  allMaterias,
  loadAssuntos,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingMateria, setIsSelectingMateria] = useState(false);
  const [customMateria, setCustomMateria] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[]>([]);
  const [flatAssuntos, setFlatAssuntos] = useState<string[]>([]); // Fallback
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Matéria efetiva (custom ou parent)
  const effectiveMateria = customMateria || (parentMaterias.length > 0 ? parentMaterias[0] : null);
  const isUsingDifferentMateria = customMateria !== null && !parentMaterias.includes(customMateria);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSelectingMateria(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular se deve abrir para cima ou para baixo
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // Altura aproximada do dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Se não há espaço suficiente abaixo mas há acima, abrir para cima
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Carregar taxonomia quando abrir ou trocar matéria
  useEffect(() => {
    if (isOpen && !isSelectingMateria && effectiveMateria) {
      setIsLoading(true);

      // Tentar carregar taxonomia hierárquica
      editalService.fetchTaxonomiaByMaterias([effectiveMateria])
        .then(taxonomyMap => {
          const nodes = taxonomyMap.get(effectiveMateria) || [];
          setTaxonomy(nodes);

          // Expandir todos os nós por padrão
          const getAllNodeIds = (nodeList: TaxonomyNode[]): string[] => {
            const ids: string[] = [];
            for (const node of nodeList) {
              if (node.filhos && node.filhos.length > 0) {
                ids.push(`${effectiveMateria}-${node.id}`);
                ids.push(...getAllNodeIds(node.filhos));
              }
            }
            return ids;
          };
          const allIds = getAllNodeIds(nodes);
          if (allIds.length > 0) {
            setExpandedNodes(new Set(allIds));
          }

          // Se não houver taxonomia, carregar lista plana como fallback
          if (nodes.length === 0) {
            return loadAssuntos([effectiveMateria]).then(data => {
              setFlatAssuntos(data);
            });
          }
          setFlatAssuntos([]);
        })
        .catch(err => {
          console.error('Erro ao carregar taxonomia:', err);
          // Fallback para lista plana
          loadAssuntos([effectiveMateria])
            .then(data => setFlatAssuntos(data))
            .catch(() => setFlatAssuntos([]));
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, isSelectingMateria, effectiveMateria, loadAssuntos]);

  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredMaterias = useMemo(() => {
    if (!search.trim()) return allMaterias;
    const searchNorm = normalizeText(search.trim());
    return allMaterias.filter(opt => normalizeText(opt).includes(searchNorm));
  }, [allMaterias, search]);

  // Filtrar assuntos flat pela busca
  const filteredFlatAssuntos = useMemo(() => {
    if (!search.trim()) return flatAssuntos;
    const searchNorm = normalizeText(search.trim());
    return flatAssuntos.filter(opt => normalizeText(opt).includes(searchNorm));
  }, [flatAssuntos, search]);

  // Toggle múltiplos assuntos
  const toggleMultipleAssuntos = (assuntos: string[], select: boolean) => {
    if (select) {
      const newAssuntos = assuntos.filter(a => !value.includes(a));
      onChange([...value, ...newAssuntos]);
    } else {
      onChange(value.filter(a => !assuntos.includes(a)));
    }
  };

  const toggleAssunto = (assunto: string) => {
    onChange(value.includes(assunto) ? value.filter(v => v !== assunto) : [...value, assunto]);
  };

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectMateria = (materia: string) => {
    setCustomMateria(materia);
    setIsSelectingMateria(false);
    setSearch('');
    setTaxonomy([]);
    setFlatAssuntos([]);
    onChange([]); // Limpar assuntos selecionados ao trocar matéria
  };

  const displayValue = value.length === 0
    ? (effectiveMateria ? "Selecionar assuntos..." : "Configure a matéria pai")
    : value.length === 1
      ? (value[0].length > 20 ? value[0].substring(0, 20) + '...' : value[0])
      : `${value.length} selecionados`;

  const hasTaxonomy = taxonomy.length > 0;

  return (
    <div ref={dropdownRef} className="relative min-w-[200px]">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled && effectiveMateria) setIsOpen(!isOpen);
        }}
        disabled={disabled || !effectiveMateria}
        className={`
          w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors
          ${disabled || !effectiveMateria
            ? 'bg-transparent text-gray-600 cursor-not-allowed'
            : isOpen
              ? 'bg-brand-dark border border-brand-yellow text-white'
              : value.length > 0
                ? isUsingDifferentMateria
                  ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50'
                  : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:border-green-500/50'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
          }
        `}
      >
        <span className="truncate flex items-center gap-1">
          {isUsingDifferentMateria && <ArrowLeftRight size={10} className="text-yellow-400" />}
          {displayValue}
        </span>
        {!disabled && effectiveMateria && (
          <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-96 bg-brand-dark border border-white/10 rounded shadow-xl ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header: Toggle entre assuntos e matérias */}
          <button
            onClick={() => {
              setIsSelectingMateria(!isSelectingMateria);
              setSearch('');
            }}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-xs border-b transition-colors
              ${isSelectingMateria
                ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30'
                : 'bg-purple-500/10 text-purple-400 border-white/10 hover:bg-purple-500/20'
              }
            `}
          >
            {isSelectingMateria ? (
              <>
                <ChevronDown size={12} />
                <span>Voltar aos Assuntos</span>
              </>
            ) : (
              <>
                <ChevronUp size={12} />
                <span>Trocar Matéria</span>
                {isUsingDifferentMateria && (
                  <span className="ml-auto text-yellow-400 text-[10px]">
                    ({customMateria?.substring(0, 15)}...)
                  </span>
                )}
              </>
            )}
          </button>

          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isSelectingMateria ? "Buscar matéria..." : "Buscar assunto..."}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded pl-7 pr-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[300px] overflow-y-auto">
            {isSelectingMateria ? (
              // Lista de matérias
              filteredMaterias.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">Nenhuma matéria encontrada</p>
              ) : (
                filteredMaterias.map(materia => {
                  const isParent = parentMaterias.includes(materia);
                  const isSelected = customMateria === materia;
                  return (
                    <button
                      key={materia}
                      onClick={() => selectMateria(materia)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors
                        ${isSelected ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'}
                      `}
                    >
                      <Book size={12} className={isParent ? 'text-brand-yellow' : 'text-gray-500'} />
                      <span className="flex-1">{materia}</span>
                      {isParent && <span className="text-[10px] text-gray-500">(pai)</span>}
                      {isSelected && <Check size={12} className="text-purple-400" />}
                    </button>
                  );
                })
              )
            ) : (
              // Lista de assuntos (hierárquica ou plana)
              isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={14} className="animate-spin text-brand-yellow" />
                  <span className="ml-2 text-xs text-gray-400">Carregando...</span>
                </div>
              ) : hasTaxonomy ? (
                // Taxonomia hierárquica
                taxonomy.map(node => (
                  <TaxonomyTreeNode
                    key={`${node.materia}-${node.id}`}
                    node={node}
                    selectedAssuntos={value}
                    onToggleMultiple={toggleMultipleAssuntos}
                    expandedNodes={expandedNodes}
                    toggleExpanded={toggleExpanded}
                    searchTerm={search}
                  />
                ))
              ) : filteredFlatAssuntos.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  {flatAssuntos.length === 0 ? 'Nenhum assunto disponível' : 'Nenhum resultado'}
                </p>
              ) : (
                // Fallback: Lista plana
                filteredFlatAssuntos.map(assunto => {
                  const isSelected = value.includes(assunto);
                  return (
                    <button
                      key={assunto}
                      onClick={() => toggleAssunto(assunto)}
                      className={`
                        w-full flex items-start gap-2 px-3 py-2 text-left text-xs transition-colors
                        ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-gray-300 hover:bg-white/5'}
                      `}
                    >
                      <div className={`
                        w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-600'}
                      `}>
                        {isSelected && <Check size={8} className="text-black" />}
                      </div>
                      <span className="break-words whitespace-normal leading-relaxed">{assunto}</span>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* Footer */}
          {!isSelectingMateria && value.length > 0 && (
            <div className="p-2 border-t border-white/10 flex justify-between items-center">
              <span className="text-gray-500 text-xs">{value.length} selecionado(s)</span>
              <button
                onClick={() => onChange([])}
                className="text-red-400 text-xs hover:underline"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Indicator de matéria diferente */}
          {isUsingDifferentMateria && !isSelectingMateria && (
            <div className="px-3 py-2 bg-yellow-500/10 border-t border-yellow-500/30 text-yellow-400 text-[10px] flex items-center gap-1">
              <ArrowLeftRight size={10} />
              <span>Usando matéria diferente: {customMateria}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente wrapper sortable para cada item do edital
interface SortableItemWrapperProps {
  id: string;
  children: (dragListeners: any) => React.ReactNode;
  disabled?: boolean;
}

const SortableItemWrapper: React.FC<SortableItemWrapperProps> = ({ id, children, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
};

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

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Filter options from database
  const [availableMaterias, setAvailableMaterias] = useState<string[]>([]);

  // Saving state per item
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());

  // Auto-configuring filters state
  const [autoConfiguring, setAutoConfiguring] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<EditalItemWithChildren | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa arrastar 8px para ativar
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Carregar apenas matérias (assuntos serão carregados sob demanda)
  const loadFilterOptions = async () => {
    try {
      const materias = await editalService.getDistinctMaterias();
      console.log('[EditalAdmin] Matérias carregadas:', materias.length);
      setAvailableMaterias(materias);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    }
  };

  // Função para carregar assuntos de matérias específicas (sob demanda)
  const loadAssuntosForMaterias = async (materias: string[]): Promise<string[]> => {
    if (!materias || materias.length === 0) return [];
    try {
      const assuntosData = await editalService.getDistinctAssuntos(materias);
      const assuntos = assuntosData.map(a => a.assunto);
      console.log('[EditalAdmin] Assuntos carregados para', materias, ':', assuntos.length);
      return [...new Set(assuntos)].sort();
    } catch (error) {
      console.error('Erro ao carregar assuntos:', error);
      return [];
    }
  };

  useEffect(() => {
    loadData();
    loadFilterOptions();
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

  // Salvar filtro de um item
  const handleFilterChange = async (itemId: string, field: 'materias' | 'assuntos', values: string[]) => {
    setSavingItems(prev => new Set(prev).add(itemId));

    try {
      // Encontrar item atual
      const findItem = (nodes: EditalItemWithChildren[]): EditalItemWithChildren | null => {
        for (const node of nodes) {
          if (node.id === itemId) return node;
          const found = findItem(node.children);
          if (found) return found;
        }
        return null;
      };

      const item = findItem(items);
      if (!item) return;

      const newFilters = {
        materias: field === 'materias' ? values : (item.filtro_materias || []),
        assuntos: field === 'assuntos' ? values : (item.filtro_assuntos || [])
      };

      await editalService.updateFilters(itemId, newFilters);

      // Atualizar estado local
      const updateItems = (nodes: EditalItemWithChildren[]): EditalItemWithChildren[] => {
        return nodes.map(node => {
          if (node.id === itemId) {
            return {
              ...node,
              filtro_materias: newFilters.materias,
              filtro_assuntos: newFilters.assuntos
            };
          }
          return {
            ...node,
            children: updateItems(node.children)
          };
        });
      };

      setItems(updateItems(items));
    } catch (error) {
      console.error('Erro ao salvar filtro:', error);
      alert('Erro ao salvar filtro');
    } finally {
      setSavingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Funções auxiliares para drag-and-drop
  const findItemById = (nodes: EditalItemWithChildren[], id: string): EditalItemWithChildren | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findItemById(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const findParentAndSiblings = (nodes: EditalItemWithChildren[], id: string, parent: EditalItemWithChildren | null = null): { parent: EditalItemWithChildren | null; siblings: EditalItemWithChildren[] } | null => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        return { parent, siblings: nodes };
      }
      const found = findParentAndSiblings(nodes[i].children, id, nodes[i]);
      if (found) return found;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const item = findItemById(items, active.id as string);
    setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveItem(null);

    if (!over || active.id === over.id) return;

    const activeItemInfo = findParentAndSiblings(items, active.id as string);
    const overItemInfo = findParentAndSiblings(items, over.id as string);

    if (!activeItemInfo || !overItemInfo) return;

    // Só permite reordenar itens no mesmo nível (mesmo parent)
    const sameParent = (activeItemInfo.parent?.id || null) === (overItemInfo.parent?.id || null);
    if (!sameParent) return;

    const siblings = activeItemInfo.siblings;
    const oldIndex = siblings.findIndex(s => s.id === active.id);
    const newIndex = siblings.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar array localmente
    const reordered = arrayMove(siblings, oldIndex, newIndex);

    // Atualizar estado local otimisticamente
    const updateSiblings = (nodes: EditalItemWithChildren[], parentId: string | null): EditalItemWithChildren[] => {
      if ((activeItemInfo.parent?.id || null) === parentId) {
        return reordered.map((item, idx) => ({ ...item, ordem: idx }));
      }
      return nodes.map(node => ({
        ...node,
        children: updateSiblings(node.children, node.id)
      }));
    };

    const parentId = activeItemInfo.parent?.id || null;
    if (parentId === null) {
      // Itens no root
      setItems(reordered.map((item, idx) => ({ ...item, ordem: idx })));
    } else {
      setItems(prev => updateSiblings(prev, null));
    }

    // Persistir no banco
    try {
      const updates = reordered.map((item, idx) => ({ id: item.id, ordem: idx }));
      await editalService.reorder(updates);
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      // Recarregar dados em caso de erro
      await loadData();
    }
  };

  // Funcao para salvar edital importado via IA
  const handleImportEdital = async (parsed: ParsedEdital, action: EditalExistsAction) => {
    if (!preparatorioId) return;

    // Se action === 'clear', deletar todos os itens existentes
    if (action === 'clear') {
      const rootItems = items.filter(i => !i.parent_id);
      for (const item of rootItems) {
        await editalService.delete(item.id);
      }
    }

    // Criar itens recursivamente
    for (let blocoIdx = 0; blocoIdx < parsed.blocos.length; blocoIdx++) {
      const bloco = parsed.blocos[blocoIdx];

      const blocoItem = await editalService.create({
        preparatorio_id: preparatorioId,
        tipo: 'bloco',
        titulo: bloco.titulo,
        ordem: blocoIdx,
      });

      for (let matIdx = 0; matIdx < bloco.materias.length; matIdx++) {
        const materia = bloco.materias[matIdx];

        const materiaItem = await editalService.create({
          preparatorio_id: preparatorioId,
          tipo: 'materia',
          titulo: materia.titulo,
          ordem: matIdx,
          parent_id: blocoItem.id,
        });

        for (let topIdx = 0; topIdx < materia.topicos.length; topIdx++) {
          const topico = materia.topicos[topIdx];

          const topicoItem = await editalService.create({
            preparatorio_id: preparatorioId,
            tipo: 'topico',
            titulo: topico.titulo,
            ordem: topIdx,
            parent_id: materiaItem.id,
          });

          // Subtopicos (sao do tipo 'topico' tambem)
          for (let subIdx = 0; subIdx < topico.subtopicos.length; subIdx++) {
            const subtopico = topico.subtopicos[subIdx];

            await editalService.create({
              preparatorio_id: preparatorioId,
              tipo: 'topico',
              titulo: subtopico.titulo,
              ordem: subIdx,
              parent_id: topicoItem.id,
            });
          }
        }
      }
    }

    // Auto-configurar filtros via IA
    console.log('[EditalAdmin] Itens criados, iniciando auto-configuração de filtros...');
    setAutoConfiguring(true);

    try {
      const autoConfigResult = await editalService.autoConfigureFilters(preparatorioId);

      if (autoConfigResult.success) {
        console.log(`[EditalAdmin] Auto-configurados ${autoConfigResult.itemsConfigured}/${autoConfigResult.itemsProcessed} itens`);
      } else {
        console.error('[EditalAdmin] Erro na auto-configuração:', autoConfigResult.error);
      }
    } catch (error) {
      console.error('[EditalAdmin] Erro ao chamar auto-configuração:', error);
      // Non-blocking - os itens foram criados, apenas os filtros não foram auto-configurados
    } finally {
      setAutoConfiguring(false);
    }

    // Recarregar lista
    await loadData();
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

  const getTipoColor = (tipo: EditalItemTipo) => {
    switch (tipo) {
      case 'bloco': return 'text-purple-400';
      case 'materia': return 'text-brand-yellow';
      case 'topico': return 'text-blue-400';
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

  const renderItem = (item: EditalItemWithChildren, level: number = 0, parentMaterias: string[] = [], dragListeners?: any) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children.length > 0;
    const indent = level * 24;
    const isSaving = savingItems.has(item.id);
    const isDragging = activeId === item.id;

    // Para os filhos, passar as matérias selecionadas deste item (se for matéria) ou manter o que veio do parent
    const materiasParaFilhos = item.tipo === 'materia' && item.filtro_materias && item.filtro_materias.length > 0
      ? item.filtro_materias
      : parentMaterias;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-white/[0.02] border-b border-white/5 group transition-colors ${isDragging ? 'bg-brand-yellow/10 border-brand-yellow/30' : ''
            }`}
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
          <div
            {...dragListeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-brand-yellow transition-all" />
          </div>

          {/* Icon */}
          <span className={getTipoColor(item.tipo)}>
            {getItemIcon(item.tipo, isExpanded)}
          </span>

          {/* Title */}
          <span className="text-white text-sm min-w-[150px]">{item.titulo}</span>

          {/* Saving indicator */}
          {isSaving && (
            <Loader2 className="w-3 h-3 text-brand-yellow animate-spin" />
          )}

          {/* Inline Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-1 justify-end mr-2">
            {item.tipo === 'materia' && (
              <InlineDropdown
                value={item.filtro_materias || []}
                options={availableMaterias}
                onChange={(values) => handleFilterChange(item.id, 'materias', values)}
                placeholder="Selecionar matéria..."
                single={true}
              />
            )}

            {item.tipo === 'topico' && (
              <AssuntoDropdownWithMateriaSelector
                value={item.filtro_assuntos || []}
                parentMaterias={parentMaterias}
                allMaterias={availableMaterias}
                loadAssuntos={loadAssuntosForMaterias}
                onChange={(values) => handleFilterChange(item.id, 'assuntos', values)}
                disabled={parentMaterias.length === 0}
              />
            )}
          </div>

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
          <SortableContext
            items={item.children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {item.children.map(child => (
                <SortableItemWrapper key={child.id} id={child.id}>
                  {(childDragListeners) => renderItem(child, level + 1, materiasParaFilhos, childDragListeners)}
                </SortableItemWrapper>
              ))}
            </div>
          </SortableContext>
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

  // Overlay de auto-configuração
  if (autoConfiguring) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
        <div className="text-center">
          <p className="text-white font-medium">Configurando filtros com IA...</p>
          <p className="text-gray-400 text-sm mt-1">Mapeando matérias e assuntos do banco de questões</p>
        </div>
      </div>
    );
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
            to={`/admin/preparatorios/edit/${preparatorioId}`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Preparatório
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

          {/* Action Buttons */}
          <button
            onClick={() => openAddModal(null, 'bloco')}
            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-2 font-bold uppercase text-xs hover:bg-purple-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Bloco
          </button>
          <button
            onClick={() => navigate(`/admin/preparatorios/${preparatorioId}/rodadas`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 font-bold uppercase text-xs hover:bg-green-500 transition-colors"
          >
            Configurar Missões
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Edital vazio</h3>
          <p className="text-gray-500 mb-6">
            Comece adicionando as materias do edital manualmente ou importe automaticamente via IA.
          </p>

          {/* Importar via IA - Destaque */}
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 font-bold uppercase text-sm hover:bg-purple-700 transition-colors mb-6"
          >
            <Sparkles className="w-5 h-5" />
            Importar Edital via IA
          </button>

          <p className="text-gray-600 text-xs uppercase mb-4">ou adicione manualmente</p>

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
              Criar Materia
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-white/10 rounded-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-dark/50 rounded-t-sm">
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
          </div>

          {/* Tree */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-white/5">
                {items.map(item => (
                  <SortableItemWrapper key={item.id} id={item.id}>
                    {(dragListeners) => renderItem(item, 0, [], dragListeners)}
                  </SortableItemWrapper>
                ))}
              </div>
            </SortableContext>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeItem ? (
                <div className="bg-brand-card border border-brand-yellow/50 shadow-xl px-4 py-2 rounded">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-brand-yellow" />
                    <span className={getTipoColor(activeItem.tipo)}>
                      {getItemIcon(activeItem.tipo, false)}
                    </span>
                    <span className="text-white text-sm">{activeItem.titulo}</span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Modal de adicionar/editar item */}
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

      {/* Modal de importacao via IA */}
      {showImportModal && (
        <ImportEditalModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportEdital}
          hasExistingItems={items.length > 0}
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
