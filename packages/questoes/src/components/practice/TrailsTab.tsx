import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, Loader2, BookOpen, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { editalService, EditalItemWithChildren } from '../../services/editalService';

interface TrailsTabProps {
  preparatorioId: string | undefined;
  banca: string | undefined;
  preparatorioNome?: string;
  preparatorioSlug?: string;
}

// Componente para renderizar um item do edital
const EditalItemNode: React.FC<{
  item: EditalItemWithChildren;
  banca: string;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  onPraticar: (item: EditalItemWithChildren) => void;
  level?: number;
  parentMateria?: string; // Matéria pai (para tópicos)
  isMobile?: boolean; // Para ajustes de layout mobile
}> = ({ item, banca, expandedNodes, toggleExpanded, onPraticar, level = 0, parentMateria, isMobile = false }) => {
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  // Determinar ícone baseado no tipo
  const getIcon = () => {
    switch (item.tipo) {
      case 'bloco':
        return <FolderOpen size={18} className="text-[var(--color-brand)]" />;
      case 'materia':
        return <BookOpen size={18} className="text-blue-400" />;
      case 'topico':
        return <FileText size={16} className="text-[var(--color-text-muted)]" />;
      default:
        return null;
    }
  };

  // Função para iniciar prática
  const handlePraticar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPraticar(item);
  };

  // Verificar se tem filtros configurados
  const hasFilters = (item.filtro_materias?.length > 0) || (item.filtro_assuntos?.length > 0);

  // Tópicos com filtros são clicáveis para praticar
  const isClickableTopic = item.tipo === 'topico' && hasFilters;

  // Desktop: indentação progressiva / Mobile: espaçamento mínimo (alinhado à esquerda)
  const paddingLeft = isMobile ? 8 : (16 + level * 20);

  // Cor de fundo baseada no tipo
  const getBgColor = () => {
    if (item.tipo === 'bloco') return 'bg-[var(--color-bg-elevated)]';
    if (item.tipo === 'materia') return 'hover:bg-[var(--color-bg-elevated)]';
    return 'hover:bg-[var(--color-bg-elevated)]';
  };

  // Handler para clique na linha
  const handleRowClick = () => {
    if (isClickableTopic) {
      onPraticar(item);
    } else if (hasChildren) {
      toggleExpanded(item.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-start justify-between py-3 px-2 md:px-4 cursor-pointer transition-colors ${getBgColor()} border-b border-[var(--color-border)]`}
        style={{ paddingLeft }}
        onClick={handleRowClick}
      >
        <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
          {/* Botão de expandir */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-colors flex-shrink-0 mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
              ) : (
                <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" /> // Spacer para alinhar
          )}

          {/* Ícone - oculto no mobile */}
          <span className="flex-shrink-0 hidden md:block">{getIcon()}</span>

          {/* Título - no mobile sem truncate para permitir wrap */}
          <span
            className={`${isMobile ? '' : 'truncate'} ${item.tipo === 'bloco'
                ? 'font-bold text-[var(--color-text-main)] text-sm uppercase tracking-wide'
                : item.tipo === 'materia'
                  ? 'font-semibold text-[var(--color-text-main)] text-sm'
                  : 'text-[var(--color-text-sec)] text-sm'
              }`}
          >
            {item.titulo}
          </span>

          {/* Badge com contagem de filhos */}
          {hasChildren && (
            <span className="ml-2 px-2 py-0.5 bg-[var(--color-bg-elevated)] rounded-full text-xs text-[var(--color-text-muted)] flex-shrink-0">
              {item.children.length}
            </span>
          )}

        </div>

        {/* Botão Praticar (apenas para tópicos COM filtros configurados) */}
        {item.tipo === 'topico' && hasFilters && (
          <button
            onClick={handlePraticar}
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-shrink-0 ml-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-light)] text-black transform hover:scale-105"
            title="Iniciar prática"
          >
            <Play size={12} fill="currentColor" />
            {/* Mobile: "Ir" / Desktop: "Praticar" */}
            <span className="md:hidden">Ir</span>
            <span className="hidden md:inline">Praticar</span>
          </button>
        )}
      </div>

      {/* Filhos (animado) */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {item.children.map((child) => (
              <EditalItemNode
                key={child.id}
                item={child}
                banca={banca}
                expandedNodes={expandedNodes}
                toggleExpanded={toggleExpanded}
                onPraticar={onPraticar}
                level={level + 1}
                parentMateria={item.tipo === 'materia' ? item.titulo : parentMateria}
                isMobile={isMobile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente principal
export const TrailsTab: React.FC<TrailsTabProps> = ({
  preparatorioId,
  banca,
  preparatorioNome,
  preparatorioSlug
}) => {
  const navigate = useNavigate();
  const [editalTree, setEditalTree] = useState<EditalItemWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para navegar para a prática com filtros configurados
  const handlePraticar = (item: EditalItemWithChildren) => {
    const params = new URLSearchParams();

    // Usar filtros configurados (arrays JSON)
    if (item.filtro_materias && item.filtro_materias.length > 0) {
      params.set('materias', JSON.stringify(item.filtro_materias));
    }

    if (item.filtro_assuntos && item.filtro_assuntos.length > 0) {
      params.set('assuntos', JSON.stringify(item.filtro_assuntos));
    }

    // Banca do preparatório
    if (banca) params.set('banca', banca);

    // Identificador do preparatório (para mostrar sidebar do edital)
    if (preparatorioId) params.set('preparatorioId', preparatorioId);

    // Título do item do edital (para header)
    params.set('editalItemTitle', item.titulo);

    // Slug do preparatório (para navegação de volta)
    if (preparatorioSlug) params.set('preparatorioSlug', preparatorioSlug);

    params.set('autostart', 'true');

    navigate(`/praticar?${params.toString()}`);
  };

  // Carregar edital
  useEffect(() => {
    const loadEdital = async () => {
      if (!preparatorioId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tree = await editalService.getTreeByPreparatorio(preparatorioId);
        setEditalTree(tree);

        // Expandir TODOS os nós por padrão
        const allIds = new Set<string>();
        const collectAllIds = (items: EditalItemWithChildren[]) => {
          items.forEach((item) => {
            allIds.add(item.id);
            if (item.children) collectAllIds(item.children);
          });
        };
        collectAllIds(tree);
        setExpandedNodes(allIds);
      } catch (err) {
        console.error('[TrailsTab] Erro ao carregar edital:', err);
        setError('Erro ao carregar edital. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEdital();
  }, [preparatorioId]);

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (items: EditalItemWithChildren[]) => {
      items.forEach((item) => {
        allIds.add(item.id);
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(editalTree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Estado: Sem preparatório selecionado
  if (!preparatorioId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle size={48} className="text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Nenhum preparatório selecionado
        </h3>
        <p className="text-gray-400 text-sm text-center max-w-md">
          Selecione um preparatório no menu superior para visualizar o edital verticalizado
          e praticar questões por assunto.
        </p>
      </div>
    );
  }

  // Estado: Carregando
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 size={32} className="text-[#FFB800] animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Carregando edital...</p>
      </div>
    );
  }

  // Estado: Erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar</h3>
        <p className="text-gray-400 text-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-black font-bold rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Estado: Edital vazio
  if (editalTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <BookOpen size={48} className="text-[var(--color-text-muted)] mb-4" />
        <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">
          Edital não cadastrado
        </h3>
        <p className="text-[var(--color-text-sec)] text-sm text-center max-w-md">
          O edital verticalizado para este preparatório ainda não foi cadastrado.
          Em breve estará disponível!
        </p>
      </div>
    );
  }

  // Contar totais
  const countItems = (items: EditalItemWithChildren[]): { blocos: number; materias: number; topicos: number } => {
    let blocos = 0, materias = 0, topicos = 0;
    const count = (list: EditalItemWithChildren[]) => {
      list.forEach((item) => {
        if (item.tipo === 'bloco') blocos++;
        if (item.tipo === 'materia') materias++;
        if (item.tipo === 'topico') topicos++;
        if (item.children) count(item.children);
      });
    };
    count(items);
    return { blocos, materias, topicos };
  };

  const counts = countItems(editalTree);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 md:px-4 py-3 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="min-w-0 flex-1">
          <h3 className="text-[var(--color-text-main)] font-semibold text-sm truncate">
            {/* Mobile: apenas nome do preparatório / Desktop: título completo */}
            <span className="md:hidden">{preparatorioNome || 'Edital Verticalizado'}</span>
            <span className="hidden md:inline">Edital Verticalizado {preparatorioNome && `- ${preparatorioNome}`}</span>
          </h3>
          <p className="text-[var(--color-text-sec)] text-xs mt-0.5">
            {counts.blocos} blocos, {counts.materias} matérias, {counts.topicos} tópicos
            {/* Banca apenas no desktop */}
            <span className="hidden md:inline">{banca && ` | Banca: ${banca}`}</span>
          </p>
        </div>
        {/* Botões apenas no desktop */}
        <div className="hidden md:flex gap-2 flex-shrink-0">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded transition-colors"
          >
            Expandir tudo
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded transition-colors"
          >
            Recolher tudo
          </button>
        </div>
      </div>

      {/* Lista do edital */}
      <div className="flex-1 overflow-y-auto">
        {editalTree.map((item) => (
          <EditalItemNode
            key={item.id}
            item={item}
            banca={banca || ''}
            expandedNodes={expandedNodes}
            toggleExpanded={toggleExpanded}
            onPraticar={handlePraticar}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

export default TrailsTab;
