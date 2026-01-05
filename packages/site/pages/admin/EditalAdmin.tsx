import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Edit, Trash2,
  MoreVertical, Book, FileText, List, GripVertical, Copy, FolderOpen, Folder, Sparkles,
  Search, Check, X, Loader2
} from 'lucide-react';
import { preparatoriosService } from '../../services/preparatoriosService';
import { editalService, EditalItem, EditalItemWithChildren, EditalItemTipo } from '../../services/editalService';
import { Preparatorio } from '../../lib/database.types';
import { ImportEditalModal } from '../../components/admin/ImportEditalModal';
import { ParsedEdital, EditalExistsAction } from '../../services/editalAIService';

// Componente de Dropdown Inline com carregamento sob demanda
interface InlineDropdownProps {
  value: string[];
  options?: string[];
  loadOptions?: () => Promise<string[]>; // Função para carregar opções sob demanda
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  single?: boolean;
}

const InlineDropdown: React.FC<InlineDropdownProps> = ({
  value,
  options: staticOptions,
  loadOptions,
  onChange,
  placeholder,
  disabled = false,
  single = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<string[]>(staticOptions || []);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualizar options quando staticOptions mudar
  useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  // Carregar opções quando abrir (se tiver loadOptions)
  useEffect(() => {
    if (isOpen && loadOptions && options.length === 0) {
      setIsLoading(true);
      loadOptions()
        .then(data => {
          setOptions(data);
        })
        .catch(err => {
          console.error('Erro ao carregar opções:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, loadOptions]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchNorm = normalizeText(search.trim());
    return options.filter(opt => normalizeText(opt).includes(searchNorm));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    if (single) {
      onChange(value.includes(opt) ? [] : [opt]);
    } else {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    }
  };

  const displayValue = value.length === 0
    ? placeholder
    : value.length === 1
      ? (value[0].length > 25 ? value[0].substring(0, 25) + '...' : value[0])
      : `${value.length} selecionados`;

  return (
    <div ref={dropdownRef} className="relative min-w-[200px]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors
          ${disabled
            ? 'bg-transparent text-gray-600 cursor-not-allowed'
            : isOpen
              ? 'bg-brand-dark border border-brand-yellow text-white'
              : value.length > 0
                ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:border-green-500/50'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
          }
        `}
      >
        <span className="truncate">{displayValue}</span>
        {!disabled && (
          <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 w-72 mt-1 bg-brand-dark border border-white/10 rounded shadow-xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded pl-7 pr-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[250px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={14} className="animate-spin text-brand-yellow" />
                <span className="ml-2 text-xs text-gray-400">Carregando...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">
                {options.length === 0 ? 'Nenhuma opção disponível' : 'Nenhum resultado'}
              </p>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors
                      ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-gray-300 hover:bg-white/5'}
                    `}
                  >
                    <div className={`
                      w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-600'}
                    `}>
                      {isSelected && <Check size={8} className="text-black" />}
                    </div>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {value.length > 0 && (
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
        </div>
      )}
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

  const renderItem = (item: EditalItemWithChildren, level: number = 0, parentMaterias: string[] = []) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children.length > 0;
    const indent = level * 24;
    const isSaving = savingItems.has(item.id);

    // Para os filhos, passar as matérias selecionadas deste item (se for matéria) ou manter o que veio do parent
    const materiasParaFilhos = item.tipo === 'materia' && item.filtro_materias && item.filtro_materias.length > 0
      ? item.filtro_materias
      : parentMaterias;

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
              <InlineDropdown
                value={item.filtro_assuntos || []}
                loadOptions={() => loadAssuntosForMaterias(parentMaterias)}
                onChange={(values) => handleFilterChange(item.id, 'assuntos', values)}
                placeholder={parentMaterias.length === 0 ? "Configure a matéria pai" : "Selecionar assuntos..."}
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
          <div>
            {item.children.map(child => renderItem(child, level + 1, materiasParaFilhos))}
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

          {/* Add Buttons */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 px-3 py-2 font-bold uppercase text-xs hover:bg-purple-600/30 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Importar via IA
          </button>
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
              Configure os filtros diretamente nos dropdowns (v3 - sob demanda)
            </p>
          </div>

          {/* Tree */}
          <div className="divide-y divide-white/5">
            {items.map(item => renderItem(item))}
          </div>
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
