import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Search, X, FileText, Loader2, Check } from 'lucide-react';
import { TaxonomyNode } from '../../services/questionsService';

interface HierarchicalAssuntosDropdownProps {
  label: string;
  icon?: React.ReactNode;
  taxonomyByMateria: Map<string, TaxonomyNode[]>;
  flatAssuntos: string[]; // Assuntos sem taxonomia (fallback)
  selectedAssuntos: string[];
  onToggleAssunto: (assunto: string) => void;
  onToggleMultiple: (assuntos: string[], select: boolean) => void;
  onClear: () => void;
  isLoading?: boolean;
  isLoadingTaxonomy?: boolean; // Loading da taxonomia (separado)
  disabled?: boolean;
  placeholder?: string;
  totalCount?: number; // Contagem total fornecida externamente
}

// Componente para renderizar um nó da árvore
const TaxonomyNodeItem: React.FC<{
  node: TaxonomyNode;
  selectedAssuntos: string[];
  onToggleAssunto: (assunto: string) => void;
  onToggleMultiple: (assuntos: string[], select: boolean) => void;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  searchTerm: string;
  level?: number;
}> = ({
  node,
  selectedAssuntos,
  onToggleAssunto,
  onToggleMultiple,
  expandedNodes,
  toggleExpanded,
  searchTerm,
  level = 0
}) => {
  const nodeId = `${node.materia}-${node.id}`;
  const isExpanded = expandedNodes.has(nodeId);
  const hasChildren = node.filhos && node.filhos.length > 0;
  const assuntosOriginais = node.assuntos_originais || [];

  // Calcular quantos assuntos estão selecionados neste nó e seus filhos
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

  // Verificar se o nó ou seus filhos correspondem à busca
  const matchesSearch = (n: TaxonomyNode): boolean => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (n.nome.toLowerCase().includes(term)) return true;
    if (n.assuntos_originais?.some(a => a.toLowerCase().includes(term))) return true;
    if (n.filhos?.some(f => matchesSearch(f))) return true;
    return false;
  };

  if (!matchesSearch(node)) return null;

  const handleToggleNode = () => {
    if (allNodeAssuntos.length > 0) {
      onToggleMultiple(allNodeAssuntos, !isFullySelected);
    }
  };

  const paddingLeft = 12 + level * 16;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors hover:bg-[#252525] ${
          isFullySelected ? 'bg-[#FFB800]/10' : ''
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
            className="p-0.5 hover:bg-[#3A3A3A] rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-[#A0A0A0]" />
            ) : (
              <ChevronRight size={14} className="text-[#A0A0A0]" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggleNode}
          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isFullySelected
              ? 'bg-[#FFB800] border-[#FFB800]'
              : isPartiallySelected
              ? 'bg-[#FFB800]/50 border-[#FFB800]'
              : 'border-[#4A4A4A] hover:border-[#6A6A6A]'
          }`}
        >
          {(isFullySelected || isPartiallySelected) && (
            <Check size={10} className="text-black" />
          )}
        </button>

        {/* Nome do nó */}
        <span
          onClick={handleToggleNode}
          className={`flex-1 text-sm ${
            isFullySelected ? 'text-[#FFB800]' : 'text-white'
          }`}
        >
          {node.nome}
        </span>

        {/* Badge com contagem */}
        {allNodeAssuntos.length > 0 && (
          <span className="text-xs text-[#6E6E6E] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
            {selectedCount > 0 ? `${selectedCount}/` : ''}{allNodeAssuntos.length}
          </span>
        )}
      </div>

      {/* Filhos */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.filhos.map((filho) => (
              <TaxonomyNodeItem
                key={`${filho.materia}-${filho.id}`}
                node={filho}
                selectedAssuntos={selectedAssuntos}
                onToggleAssunto={onToggleAssunto}
                onToggleMultiple={onToggleMultiple}
                expandedNodes={expandedNodes}
                toggleExpanded={toggleExpanded}
                searchTerm={searchTerm}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const HierarchicalAssuntosDropdown: React.FC<HierarchicalAssuntosDropdownProps> = ({
  label,
  icon,
  taxonomyByMateria,
  flatAssuntos,
  selectedAssuntos,
  onToggleAssunto,
  onToggleMultiple,
  onClear,
  isLoading = false,
  isLoadingTaxonomy = false,
  disabled = false,
  placeholder = 'Selecionar...',
  totalCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expandir todos os nós por padrão quando a taxonomia mudar
  useEffect(() => {
    const getAllNodeIds = (nodes: TaxonomyNode[], materia: string): string[] => {
      const ids: string[] = [];
      for (const node of nodes) {
        if (node.filhos && node.filhos.length > 0) {
          ids.push(`${materia}-${node.id}`);
          ids.push(...getAllNodeIds(node.filhos, materia));
        }
      }
      return ids;
    };

    const allIds: string[] = [];
    for (const [materia, nodes] of taxonomyByMateria.entries()) {
      allIds.push(...getAllNodeIds(nodes, materia));
    }

    if (allIds.length > 0) {
      setExpandedNodes(new Set(allIds));
    }
  }, [taxonomyByMateria]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Verificar se há taxonomia disponível
  const hasTaxonomy = taxonomyByMateria.size > 0 &&
    Array.from(taxonomyByMateria.values()).some(nodes => nodes.length > 0);

  // Filtrar assuntos flat que não estão na taxonomia
  const assuntosSemTaxonomia = flatAssuntos.filter(assunto => {
    // Verificar se o assunto está em alguma taxonomia
    for (const nodes of taxonomyByMateria.values()) {
      const isInTaxonomy = (nodeList: TaxonomyNode[]): boolean => {
        for (const node of nodeList) {
          if (node.assuntos_originais?.includes(assunto)) return true;
          if (node.filhos && isInTaxonomy(node.filhos)) return true;
        }
        return false;
      };
      if (isInTaxonomy(nodes)) return false;
    }
    return true;
  });

  // Filtrar assuntos sem taxonomia pela busca
  const filteredFlatAssuntos = assuntosSemTaxonomia.filter(
    assunto => !searchTerm || assunto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contar total de assuntos disponíveis
  // Usar totalCount se fornecido, senão calcular a partir da taxonomia, senão usar flatAssuntos
  const countFromTaxonomy = (() => {
    if (taxonomyByMateria.size === 0) return 0;
    let count = 0;
    const countNode = (node: TaxonomyNode): number => {
      let nodeCount = node.assuntos_originais?.length || 0;
      if (node.filhos) {
        for (const filho of node.filhos) {
          nodeCount += countNode(filho);
        }
      }
      return nodeCount;
    };
    for (const nodes of taxonomyByMateria.values()) {
      for (const node of nodes) {
        count += countNode(node);
      }
    }
    return count;
  })();

  // Usar totalCount se fornecido, senão priorizar count da taxonomia, senão flatAssuntos
  const totalAvailable = totalCount ?? (countFromTaxonomy > 0 ? countFromTaxonomy : flatAssuntos.length);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#FFB800]">{icon || <FileText size={16} />}</span>
        <span className="text-white text-sm font-medium">{label}</span>
        {selectedAssuntos.length > 0 && (
          <span className="px-1.5 py-0.5 bg-[#FFB800] text-black text-xs font-bold rounded">
            {selectedAssuntos.length}
          </span>
        )}
        <span className="text-[#6E6E6E] text-xs">({totalAvailable})</span>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors
          ${disabled
            ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#4A4A4A] cursor-not-allowed'
            : isOpen
              ? 'bg-[#252525] border-[#FFB800] text-white'
              : 'bg-[#1E1E1E] border-[#3A3A3A] text-white hover:border-[#4A4A4A]'
          }
        `}
      >
        <span className={selectedAssuntos.length === 0 ? 'text-[#6E6E6E]' : 'text-white truncate'}>
          {selectedAssuntos.length === 0
            ? placeholder
            : selectedAssuntos.length === 1
              ? selectedAssuntos[0]
              : `${selectedAssuntos.length} selecionados`
          }
        </span>
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-[#A0A0A0]" />
        ) : (
          <ChevronDown size={16} className={`text-[#6E6E6E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg shadow-xl overflow-hidden"
          >
            {/* Busca */}
            <div className="p-2 border-b border-[#3A3A3A]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-[#252525] border border-[#3A3A3A] rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-[#6E6E6E] focus:outline-none focus:border-[#FFB800]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E6E] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-[#FFB800]" />
                  <span className="ml-2 text-[#6E6E6E] text-xs">Carregando...</span>
                </div>
              ) : totalAvailable === 0 ? (
                <p className="text-[#6E6E6E] text-xs text-center py-4">Nenhum resultado</p>
              ) : (
                <>
                  {/* Matérias com taxonomia */}
                  {Array.from(taxonomyByMateria.entries()).map(([materia, nodes]) => {
                    if (nodes.length === 0) return null;

                    // Filtrar nós que correspondem à busca
                    const matchesSearch = (n: TaxonomyNode): boolean => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      if (n.nome.toLowerCase().includes(term)) return true;
                      if (n.assuntos_originais?.some(a => a.toLowerCase().includes(term))) return true;
                      if (n.filhos?.some(f => matchesSearch(f))) return true;
                      return false;
                    };

                    const filteredNodes = nodes.filter(matchesSearch);
                    if (filteredNodes.length === 0) return null;

                    return (
                      <div key={materia}>
                        {/* Header da matéria */}
                        <div className="px-3 py-2 bg-[#252525] border-y border-[#3A3A3A] sticky top-0">
                          <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wide">
                            {materia}
                          </span>
                        </div>

                        {/* Árvore de taxonomia */}
                        {filteredNodes.map((node) => (
                          <TaxonomyNodeItem
                            key={`${node.materia}-${node.id}`}
                            node={node}
                            selectedAssuntos={selectedAssuntos}
                            onToggleAssunto={onToggleAssunto}
                            onToggleMultiple={onToggleMultiple}
                            expandedNodes={expandedNodes}
                            toggleExpanded={toggleExpanded}
                            searchTerm={searchTerm}
                          />
                        ))}
                      </div>
                    );
                  })}

                  {/* Assuntos sem taxonomia */}
                  {filteredFlatAssuntos.length > 0 && (
                    <div>
                      {hasTaxonomy && (
                        <div className="px-3 py-2 bg-[#252525] border-y border-[#3A3A3A] sticky top-0">
                          <span className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wide">
                            Outros Assuntos
                          </span>
                        </div>
                      )}
                      {filteredFlatAssuntos.map((assunto) => {
                        const isSelected = selectedAssuntos.includes(assunto);
                        return (
                          <button
                            key={assunto}
                            onClick={() => onToggleAssunto(assunto)}
                            className={`w-full flex items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'text-white hover:bg-[#252525]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'bg-[#FFB800] border-[#FFB800]' : 'border-[#4A4A4A]'
                            }`}>
                              {isSelected && <Check size={10} className="text-black" />}
                            </div>
                            <span className="break-words whitespace-normal leading-tight">{assunto}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {selectedAssuntos.length > 0 && (
              <div className="p-2 border-t border-[#3A3A3A] flex justify-between items-center">
                <span className="text-[#6E6E6E] text-xs">{selectedAssuntos.length} selecionado(s)</span>
                <button
                  onClick={() => { onClear(); setSearchTerm(''); }}
                  className="text-[#E74C3C] text-xs hover:underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HierarchicalAssuntosDropdown;
