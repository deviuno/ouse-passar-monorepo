import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Search, X, FileText, Loader2, Check } from 'lucide-react';
import { TaxonomyNode } from '../../services/questionsService';

// ============================================
// Funções de busca flexível
// ============================================

// Remove acentos e converte para minúsculas
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Mapa de sinônimos e termos relacionados
// Cada chave pode corresponder a múltiplos valores
const SYNONYMS: Record<string, string[]> = {
  // Língua Portuguesa
  'portugues': ['lingua portuguesa', 'portugues', 'lp', 'gramatica', 'redacao', 'interpretacao de texto'],
  'lingua portuguesa': ['portugues', 'lp', 'gramatica', 'redacao'],
  'gramatica': ['lingua portuguesa', 'portugues'],
  'redacao': ['lingua portuguesa', 'portugues', 'producao textual'],

  // Direito
  'constitucional': ['direito constitucional', 'constituicao', 'cf'],
  'direito constitucional': ['constitucional', 'constituicao', 'cf'],
  'administrativo': ['direito administrativo', 'admin'],
  'direito administrativo': ['administrativo', 'admin'],
  'penal': ['direito penal', 'criminal'],
  'direito penal': ['penal', 'criminal'],
  'civil': ['direito civil', 'codigo civil'],
  'direito civil': ['civil', 'codigo civil'],
  'tributario': ['direito tributario', 'tributos', 'impostos'],
  'trabalho': ['direito do trabalho', 'trabalhista', 'clt'],
  'direito do trabalho': ['trabalho', 'trabalhista', 'clt'],

  // Outras matérias
  'informatica': ['ti', 'tecnologia da informacao', 'computacao'],
  'raciocinio logico': ['logica', 'rl', 'raciocinio'],
  'logica': ['raciocinio logico', 'rl'],
  'matematica': ['mat', 'calculo', 'aritmetica'],
  'contabilidade': ['contabil', 'contab'],
  'administracao': ['adm', 'gestao'],
  'economia': ['econ', 'macroeconomia', 'microeconomia'],
  'atualidades': ['conhecimentos gerais', 'cg', 'atualidade'],
  'conhecimentos gerais': ['atualidades', 'cg'],
  'afirmativa': ['acao afirmativa', 'acoes afirmativas'],
  'acao afirmativa': ['afirmativa', 'acoes afirmativas'],

  // Abreviações comuns
  'cf': ['constituicao federal', 'constituicao', 'direito constitucional'],
  'clt': ['consolidacao das leis do trabalho', 'direito do trabalho'],
  'cp': ['codigo penal', 'direito penal'],
  'cc': ['codigo civil', 'direito civil'],
  'cpc': ['codigo de processo civil', 'processo civil'],
  'cpp': ['codigo de processo penal', 'processo penal'],
};

// Verifica se o termo de busca corresponde ao texto
// Considera: sem acento, case insensitive, sinônimos
const fuzzyMatch = (searchTerm: string, text: string): boolean => {
  if (!searchTerm || !text) return !searchTerm;

  const normalizedSearch = normalizeText(searchTerm);
  const normalizedText = normalizeText(text);

  // Match direto (sem acento, case insensitive)
  if (normalizedText.includes(normalizedSearch)) {
    return true;
  }

  // Verificar cada palavra do termo de busca
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  if (searchWords.length > 1) {
    // Se todas as palavras estão presentes no texto
    const allWordsMatch = searchWords.every(word => normalizedText.includes(word));
    if (allWordsMatch) return true;
  }

  // Verificar sinônimos
  const synonymsForSearch = SYNONYMS[normalizedSearch] || [];
  for (const synonym of synonymsForSearch) {
    if (normalizedText.includes(normalizeText(synonym))) {
      return true;
    }
  }

  // Verificar se o texto contém algum sinônimo que corresponde à busca
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (normalizedText.includes(normalizeText(key))) {
      // O texto contém esta chave, verificar se a busca é um dos sinônimos
      for (const value of values) {
        if (normalizeText(value).includes(normalizedSearch) ||
            normalizedSearch.includes(normalizeText(value))) {
          return true;
        }
      }
    }
  }

  return false;
};

// ============================================

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

  // Se o nó não tem assuntos mapeados (nem ele nem seus filhos), usa o nome do nó como assunto
  // Isso permite selecionar nós da taxonomia que ainda não foram mapeados
  const selectableAssuntos = allNodeAssuntos.length > 0 ? allNodeAssuntos : [node.nome];

  const selectedCount = selectableAssuntos.filter(a => selectedAssuntos.includes(a)).length;
  const isPartiallySelected = selectedCount > 0 && selectedCount < selectableAssuntos.length;
  const isFullySelected = selectedCount === selectableAssuntos.length && selectableAssuntos.length > 0;

  // Verificar se o nó ou seus filhos correspondem à busca (fuzzy match)
  const matchesSearch = (n: TaxonomyNode): boolean => {
    if (!searchTerm) return true;
    // Usa fuzzyMatch para busca flexível (sem acento, case insensitive, sinônimos)
    if (fuzzyMatch(searchTerm, n.nome)) return true;
    if (fuzzyMatch(searchTerm, n.materia)) return true;
    if (n.assuntos_originais?.some(a => fuzzyMatch(searchTerm, a))) return true;
    if (n.filhos?.some(f => matchesSearch(f))) return true;
    return false;
  };

  if (!matchesSearch(node)) return null;

  const handleToggleNode = () => {
    // Sempre permite selecionar usando selectableAssuntos (que usa o nome do nó como fallback)
    onToggleMultiple(selectableAssuntos, !isFullySelected);
  };

  const paddingLeft = 8 + level * 12;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer transition-colors hover:bg-[var(--color-bg-elevated)] ${
          isFullySelected ? 'bg-[var(--color-brand)]/10' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleToggleNode}
      >
        {/* Botão de expandir */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(nodeId);
            }}
            className="p-0.5 hover:bg-[var(--color-border)] rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={12} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight size={12} className="text-[var(--color-text-muted)]" />
            )}
          </button>
        ) : (
          <span className="w-[13px] flex-shrink-0" />
        )}

        {/* Checkbox */}
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isFullySelected
              ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
              : isPartiallySelected
              ? 'bg-[var(--color-brand)]/50 border-[var(--color-brand)]'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)]'
          }`}
        >
          {(isFullySelected || isPartiallySelected) && (
            <Check size={10} className="text-black" />
          )}
        </div>

        {/* Nome do nó */}
        <span
          className={`flex-1 text-sm ${
            isFullySelected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-main)]'
          }`}
        >
          {node.nome}
        </span>
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

  // Filtrar assuntos sem taxonomia pela busca (fuzzy match)
  const filteredFlatAssuntos = assuntosSemTaxonomia.filter(
    assunto => !searchTerm || fuzzyMatch(searchTerm, assunto)
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
        <span className="text-[var(--color-brand)]">{icon || <FileText size={16} />}</span>
        <span className="text-[var(--color-text-main)] text-sm font-medium">{label}</span>
        {selectedAssuntos.length > 0 && (
          <span className="px-1.5 py-0.5 bg-[var(--color-brand)] text-black text-xs font-bold rounded">
            {selectedAssuntos.length}
          </span>
        )}
        <span className="text-[var(--color-text-muted)] text-xs">({totalAvailable})</span>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors
          ${disabled
            ? 'bg-[var(--color-bg-main)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
            : isOpen
              ? 'bg-[var(--color-bg-elevated)] border-[var(--color-brand)] text-[var(--color-text-main)]'
              : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-border-strong)]'
          }
        `}
      >
        <span className={selectedAssuntos.length === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-main)] truncate'}>
          {selectedAssuntos.length === 0
            ? placeholder
            : selectedAssuntos.length === 1
              ? selectedAssuntos[0]
              : `${selectedAssuntos.length} selecionados`
          }
        </span>
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown size={16} className={`text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            className="absolute z-50 w-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-elevated)] overflow-hidden"
          >
            {/* Busca */}
            <div className="p-2 border-b border-[var(--color-border)]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded pl-8 pr-3 py-1.5 text-[var(--color-text-main)] text-sm placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
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
                  <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />
                  <span className="ml-2 text-[var(--color-text-muted)] text-xs">Carregando...</span>
                </div>
              ) : totalAvailable === 0 ? (
                <p className="text-[var(--color-text-muted)] text-xs text-center py-4">Nenhum resultado</p>
              ) : (
                <>
                  {/* Matérias com taxonomia */}
                  {Array.from(taxonomyByMateria.entries()).map(([materia, nodes]) => {
                    if (nodes.length === 0) return null;

                    // Verificar se o nome da matéria corresponde à busca
                    const materiaMatches = searchTerm ? fuzzyMatch(searchTerm, materia) : false;

                    // Filtrar nós que correspondem à busca (fuzzy match)
                    const matchesSearch = (n: TaxonomyNode): boolean => {
                      if (!searchTerm) return true;
                      // Se a matéria corresponde, mostrar todos os nós
                      if (materiaMatches) return true;
                      // Usa fuzzyMatch para busca flexível
                      if (fuzzyMatch(searchTerm, n.nome)) return true;
                      if (fuzzyMatch(searchTerm, n.materia)) return true;
                      if (n.assuntos_originais?.some(a => fuzzyMatch(searchTerm, a))) return true;
                      if (n.filhos?.some(f => matchesSearch(f))) return true;
                      return false;
                    };

                    const filteredNodes = nodes.filter(matchesSearch);
                    if (filteredNodes.length === 0) return null;

                    return (
                      <div key={materia}>
                        {/* Header da matéria */}
                        <div className="px-3 py-2 bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)] sticky top-0">
                          <span className="text-xs font-bold text-[var(--color-brand)] uppercase tracking-wide">
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
                        <div className="px-3 py-2 bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)] sticky top-0">
                          <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
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
                            className={`w-full flex items-start gap-1.5 px-2 py-1.5 text-left text-sm transition-colors ${
                              isSelected ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)]'
                            }`}
                            style={{ paddingLeft: 8 }}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'bg-[var(--color-brand)] border-[var(--color-brand)]' : 'border-[var(--color-border-strong)]'
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
              <div className="p-2 border-t border-[var(--color-border)] flex justify-between items-center">
                <span className="text-[var(--color-text-muted)] text-xs">{selectedAssuntos.length} selecionado(s)</span>
                <button
                  onClick={() => { onClear(); setSearchTerm(''); }}
                  className="text-[var(--color-error)] text-xs hover:underline"
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
