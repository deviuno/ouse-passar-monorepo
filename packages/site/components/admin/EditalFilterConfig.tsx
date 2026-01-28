import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Check, Loader2, Filter, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { editalService, EditalItem, TaxonomyNode } from '../../services/editalService';

interface EditalFilterConfigProps {
  item: EditalItem;
  banca?: string;
  onClose: () => void;
  onSave: () => void;
}

// ============================================
// Funções de busca flexível (mesmo padrão do app)
// ============================================

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const SYNONYMS: Record<string, string[]> = {
  'portugues': ['lingua portuguesa', 'portugues', 'lp', 'gramatica', 'redacao'],
  'lingua portuguesa': ['portugues', 'lp', 'gramatica', 'redacao'],
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
  'informatica': ['ti', 'tecnologia da informacao', 'computacao'],
  'raciocinio logico': ['logica', 'rl', 'raciocinio'],
  'logica': ['raciocinio logico', 'rl'],
  'matematica': ['mat', 'calculo', 'aritmetica'],
};

const fuzzyMatch = (searchTerm: string, text: string): boolean => {
  if (!searchTerm || !text) return !searchTerm;

  const normalizedSearch = normalizeText(searchTerm);
  const normalizedText = normalizeText(text);

  if (normalizedText.includes(normalizedSearch)) return true;

  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  if (searchWords.length > 1) {
    const allWordsMatch = searchWords.every(word => normalizedText.includes(word));
    if (allWordsMatch) return true;
  }

  const synonymsForSearch = SYNONYMS[normalizedSearch] || [];
  for (const synonym of synonymsForSearch) {
    if (normalizedText.includes(normalizeText(synonym))) return true;
  }

  return false;
};

// ============================================
// Componente para nó da árvore de taxonomia
// ============================================

interface TaxonomyNodeItemProps {
  node: TaxonomyNode;
  selectedAssuntos: string[];
  onToggleMultiple: (assuntos: string[], select: boolean) => void;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  searchTerm: string;
  level?: number;
}

const TaxonomyNodeItem: React.FC<TaxonomyNodeItemProps> = ({
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
  const hasChildNodes = node.filhos && node.filhos.length > 0;
  const assuntosOriginais = node.assuntos_originais || [];
  // Considera expandível se tem filhos OU se tem assuntos_originais
  const hasChildren = hasChildNodes || assuntosOriginais.length > 0;

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

  // Se o nó não tem assuntos mapeados (nem ele nem seus filhos), usa o nome do nó como assunto
  const selectableAssuntos = allNodeAssuntos.length > 0 ? allNodeAssuntos : [node.nome];

  const selectedCount = selectableAssuntos.filter(a => selectedAssuntos.includes(a)).length;
  const isPartiallySelected = selectedCount > 0 && selectedCount < selectableAssuntos.length;
  const isFullySelected = selectedCount === selectableAssuntos.length && selectableAssuntos.length > 0;

  // Verificar se corresponde à busca
  const matchesSearch = (n: TaxonomyNode): boolean => {
    if (!searchTerm) return true;
    if (fuzzyMatch(searchTerm, n.nome)) return true;
    if (fuzzyMatch(searchTerm, n.materia)) return true;
    if (n.assuntos_originais?.some(a => fuzzyMatch(searchTerm, a))) return true;
    if (n.filhos?.some(f => matchesSearch(f))) return true;
    return false;
  };

  if (!matchesSearch(node)) return null;

  const handleToggleNode = () => {
    onToggleMultiple(selectableAssuntos, !isFullySelected);
  };

  // Função para toggle de um assunto individual
  const handleToggleAssunto = (assunto: string) => {
    const isSelected = selectedAssuntos.includes(assunto);
    onToggleMultiple([assunto], !isSelected);
  };

  const paddingLeft = 8 + level * 16;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors hover:bg-white/5 ${
          isFullySelected ? 'bg-brand-yellow/10' : ''
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
            className="p-0.5 hover:bg-white/10 rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Checkbox */}
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isFullySelected
              ? 'bg-brand-yellow border-brand-yellow'
              : isPartiallySelected
              ? 'bg-brand-yellow/50 border-brand-yellow'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          {(isFullySelected || isPartiallySelected) && (
            <Check className="w-3 h-3 text-black" />
          )}
        </div>

        {/* Nome do nó */}
        <span
          className={`flex-1 text-sm ${
            isFullySelected ? 'text-brand-yellow' : 'text-gray-300'
          }`}
        >
          {node.nome}
        </span>

        {/* Badge com contagem */}
        {selectableAssuntos.length > 0 && (
          <span className="text-xs text-gray-600 bg-brand-dark px-1.5 py-0.5 rounded">
            {selectedCount > 0 ? `${selectedCount}/` : ''}{selectableAssuntos.length}
          </span>
        )}
      </div>

      {/* Filhos e Assuntos Originais */}
      {isExpanded && hasChildren && (
        <div>
          {/* Renderizar nós filhos */}
          {hasChildNodes && node.filhos.map((filho) => (
            <TaxonomyNodeItem
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

          {/* Renderizar assuntos originais (quando expandido) */}
          {assuntosOriginais.length > 0 && (
            <div className={hasChildNodes ? "mt-1 pt-1 border-t border-white/5" : ""}>
              {assuntosOriginais
                .filter(a => !searchTerm || fuzzyMatch(searchTerm, a))
                .map((assunto) => {
                  const isAssuntoSelected = selectedAssuntos.includes(assunto);
                  return (
                    <button
                      key={assunto}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAssunto(assunto);
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2 text-left text-xs transition-colors hover:bg-white/5 ${
                        isAssuntoSelected ? 'bg-brand-yellow/10' : ''
                      }`}
                      style={{ paddingLeft: paddingLeft + 20 }}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                        isAssuntoSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-600'
                      }`}>
                        {isAssuntoSelected && <Check className="w-2 h-2 text-black" />}
                      </div>
                      <span className={`leading-tight break-words ${isAssuntoSelected ? 'text-brand-yellow' : 'text-gray-400'}`}>
                        {assunto}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// Componente principal
// ============================================

export const EditalFilterConfig: React.FC<EditalFilterConfigProps> = ({
  item,
  banca,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados das opções
  const [allMaterias, setAllMaterias] = useState<string[]>([]);
  const [allAssuntos, setAllAssuntos] = useState<{ assunto: string; materia: string }[]>([]);
  const [taxonomyByMateria, setTaxonomyByMateria] = useState<Map<string, TaxonomyNode[]>>(new Map());
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  // Seleções
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>(item.filtro_materias || []);
  const [selectedAssuntos, setSelectedAssuntos] = useState<string[]>(item.filtro_assuntos || []);

  // Filtros de busca
  const [materiaSearch, setMateriaSearch] = useState('');
  const [assuntoSearch, setAssuntoSearch] = useState('');

  // Estado para nós expandidos
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Preview de questões
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [materias, assuntos] = await Promise.all([
          editalService.getDistinctMaterias(),
          editalService.getDistinctAssuntos()
        ]);
        setAllMaterias(materias);
        setAllAssuntos(assuntos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Carregar taxonomia quando matérias mudam
  useEffect(() => {
    const loadTaxonomy = async () => {
      if (selectedMaterias.length === 0) {
        setTaxonomyByMateria(new Map());
        return;
      }

      try {
        setLoadingTaxonomy(true);
        const taxonomy = await editalService.fetchTaxonomiaByMaterias(selectedMaterias);
        setTaxonomyByMateria(taxonomy);

        // Expandir todos os nós por padrão
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
        for (const [materia, nodes] of taxonomy.entries()) {
          allIds.push(...getAllNodeIds(nodes, materia));
        }

        if (allIds.length > 0) {
          setExpandedNodes(new Set(allIds));
        }
      } catch (error) {
        console.error('Erro ao carregar taxonomia:', error);
      } finally {
        setLoadingTaxonomy(false);
      }
    };

    loadTaxonomy();
  }, [selectedMaterias]);

  // Atualizar contagem quando mudar seleção
  useEffect(() => {
    const updateCount = async () => {
      if (selectedMaterias.length === 0 && selectedAssuntos.length === 0) {
        setQuestionCount(null);
        return;
      }

      try {
        setCountLoading(true);
        const count = await editalService.countQuestoesByFilter(
          selectedMaterias.length > 0 ? selectedMaterias : undefined,
          selectedAssuntos.length > 0 ? selectedAssuntos : undefined,
          banca
        );
        setQuestionCount(count);
      } catch (error) {
        console.error('Erro ao contar questões:', error);
      } finally {
        setCountLoading(false);
      }
    };

    const timer = setTimeout(updateCount, 300);
    return () => clearTimeout(timer);
  }, [selectedMaterias, selectedAssuntos, banca]);

  // Filtrar matérias por busca
  const filteredMaterias = useMemo(() => {
    if (!materiaSearch) return allMaterias;
    return allMaterias.filter(m => fuzzyMatch(materiaSearch, m));
  }, [allMaterias, materiaSearch]);

  // Verificar se há taxonomia disponível
  const hasTaxonomy = taxonomyByMateria.size > 0 &&
    Array.from(taxonomyByMateria.values()).some(nodes => nodes.length > 0);

  // Filtrar assuntos flat que não estão na taxonomia (fallback)
  const assuntosSemTaxonomia = useMemo(() => {
    if (selectedMaterias.length === 0) return [];

    const assuntosFiltrados = allAssuntos.filter(a => selectedMaterias.includes(a.materia));

    if (!hasTaxonomy) return assuntosFiltrados;

    // Verificar se o assunto está em alguma taxonomia
    return assuntosFiltrados.filter(({ assunto }) => {
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
  }, [allAssuntos, selectedMaterias, taxonomyByMateria, hasTaxonomy]);

  // Filtrar assuntos flat pela busca
  const filteredFlatAssuntos = useMemo(() => {
    if (!assuntoSearch) return assuntosSemTaxonomia;
    return assuntosSemTaxonomia.filter(({ assunto }) => fuzzyMatch(assuntoSearch, assunto));
  }, [assuntosSemTaxonomia, assuntoSearch]);

  // Toggle matéria
  const toggleMateria = (materia: string) => {
    setSelectedMaterias(prev => {
      if (prev.includes(materia)) {
        return prev.filter(m => m !== materia);
      }
      return [...prev, materia];
    });
  };

  // Toggle assunto individual
  const toggleAssunto = (assunto: string) => {
    setSelectedAssuntos(prev => {
      if (prev.includes(assunto)) {
        return prev.filter(a => a !== assunto);
      }
      return [...prev, assunto];
    });
  };

  // Toggle múltiplos assuntos (para nós da árvore)
  const toggleMultipleAssuntos = (assuntos: string[], select: boolean) => {
    setSelectedAssuntos(prev => {
      if (select) {
        // Adicionar assuntos que ainda não estão selecionados
        const newAssuntos = assuntos.filter(a => !prev.includes(a));
        return [...prev, ...newAssuntos];
      } else {
        // Remover assuntos
        return prev.filter(a => !assuntos.includes(a));
      }
    });
  };

  // Toggle expandir nó
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

  // Salvar
  const handleSave = async () => {
    try {
      setSaving(true);
      await editalService.updateFilters(item.id, {
        materias: selectedMaterias,
        assuntos: selectedAssuntos
      });
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  // Limpar seleções
  const clearAll = () => {
    setSelectedMaterias([]);
    setSelectedAssuntos([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-brand-card border border-white/10 p-8 rounded-sm">
          <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-sm flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2">
              <Filter className="w-5 h-5 text-brand-yellow" />
              Configurar Filtros
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Item: <span className="text-white">{item.titulo}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Matérias */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Matérias do Banco de Questões
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={materiaSearch}
                  onChange={(e) => setMateriaSearch(e.target.value)}
                  placeholder="Buscar matérias..."
                  className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedMaterias.length} selecionada(s)
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredMaterias.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Nenhuma matéria encontrada</p>
              ) : (
                filteredMaterias.map(materia => (
                  <button
                    key={materia}
                    onClick={() => toggleMateria(materia)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                      selectedMaterias.includes(materia)
                        ? 'bg-brand-yellow/20 text-brand-yellow'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selectedMaterias.includes(materia)
                        ? 'bg-brand-yellow border-brand-yellow'
                        : 'border-gray-600'
                    }`}>
                      {selectedMaterias.includes(materia) && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </div>
                    {materia}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Assuntos (Hierárquico) */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Assuntos (Hierárquico)
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={assuntoSearch}
                  onChange={(e) => setAssuntoSearch(e.target.value)}
                  placeholder="Buscar assuntos..."
                  className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedAssuntos.length} selecionado(s)
                {loadingTaxonomy && <span className="ml-2 text-brand-yellow">(carregando...)</span>}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedMaterias.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">
                    Selecione pelo menos uma matéria para ver os assuntos disponíveis
                  </p>
                </div>
              ) : loadingTaxonomy ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
                  <span className="ml-2 text-gray-400 text-sm">Carregando taxonomia...</span>
                </div>
              ) : (
                <>
                  {/* Taxonomia hierárquica por matéria */}
                  {Array.from(taxonomyByMateria.entries()).map(([materia, nodes]) => {
                    if (nodes.length === 0) return null;

                    // Verificar se a matéria corresponde à busca
                    const materiaMatches = assuntoSearch ? fuzzyMatch(assuntoSearch, materia) : false;

                    // Filtrar nós que correspondem à busca
                    const matchesSearch = (n: TaxonomyNode): boolean => {
                      if (!assuntoSearch) return true;
                      if (materiaMatches) return true;
                      if (fuzzyMatch(assuntoSearch, n.nome)) return true;
                      if (n.assuntos_originais?.some(a => fuzzyMatch(assuntoSearch, a))) return true;
                      if (n.filhos?.some(f => matchesSearch(f))) return true;
                      return false;
                    };

                    const filteredNodes = nodes.filter(matchesSearch);
                    if (filteredNodes.length === 0) return null;

                    return (
                      <div key={materia}>
                        {/* Header da matéria */}
                        <div className="px-3 py-2 bg-brand-dark/50 border-y border-white/5 sticky top-0 z-10">
                          <span className="text-xs font-bold text-brand-yellow uppercase tracking-wide">
                            {materia}
                          </span>
                        </div>

                        {/* Árvore de taxonomia */}
                        {filteredNodes.map((node) => (
                          <TaxonomyNodeItem
                            key={`${node.materia}-${node.id}`}
                            node={node}
                            selectedAssuntos={selectedAssuntos}
                            onToggleMultiple={toggleMultipleAssuntos}
                            expandedNodes={expandedNodes}
                            toggleExpanded={toggleExpanded}
                            searchTerm={assuntoSearch}
                          />
                        ))}
                      </div>
                    );
                  })}

                  {/* Assuntos sem taxonomia (fallback) */}
                  {filteredFlatAssuntos.length > 0 && (
                    <div>
                      {hasTaxonomy && (
                        <div className="px-3 py-2 bg-brand-dark/50 border-y border-white/5 sticky top-0 z-10">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Outros Assuntos
                          </span>
                        </div>
                      )}
                      {filteredFlatAssuntos.map(({ assunto, materia }) => {
                        const isSelected = selectedAssuntos.includes(assunto);
                        return (
                          <button
                            key={`${materia}-${assunto}`}
                            onClick={() => toggleAssunto(assunto)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                              isSelected
                                ? 'bg-brand-yellow/20 text-brand-yellow'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-brand-yellow border-brand-yellow'
                                : 'border-gray-600'
                            }`}>
                              {isSelected && (
                                <Check className="w-3 h-3 text-black" />
                              )}
                            </div>
                            <span className="truncate">{assunto}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Mensagem se não há assuntos */}
                  {!hasTaxonomy && filteredFlatAssuntos.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      Nenhum assunto encontrado para as matérias selecionadas
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="bg-brand-dark border border-white/10 px-4 py-2 rounded">
              {countLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Contando...</span>
                </div>
              ) : questionCount !== null ? (
                <p className="text-sm">
                  <span className="text-brand-yellow font-bold">{questionCount.toLocaleString()}</span>
                  <span className="text-gray-400"> questões disponíveis</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">Selecione filtros para ver o total</p>
              )}
            </div>

            {/* Limpar */}
            {(selectedMaterias.length > 0 || selectedAssuntos.length > 0) && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
