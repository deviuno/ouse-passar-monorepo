import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, Loader2, BookOpen, Layers, FileText, AlertCircle, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
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
  parentMateria?: string;
  isMobile?: boolean;
}> = ({ item, banca, expandedNodes, toggleExpanded, onPraticar, level = 0, parentMateria, isMobile = false }) => {
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const hasFilters = (item.filtro_materias?.length > 0) || (item.filtro_assuntos?.length > 0);
  const isClickableTopic = item.tipo === 'topico' && hasFilters;

  // Indentação baseada no nível
  const indentPx = isMobile ? 12 : (16 + level * 24);

  // Estilos por tipo de item
  const getItemStyles = () => {
    switch (item.tipo) {
      case 'bloco':
        return {
          container: 'bg-[var(--color-bg-elevated)] border-l-4 border-l-[var(--color-brand)]',
          icon: <Layers size={16} className="text-[var(--color-brand)]" />,
          text: 'font-bold text-[var(--color-text-main)] text-[13px] uppercase tracking-wider',
        };
      case 'materia':
        return {
          container: 'hover:bg-[var(--color-bg-elevated)]/50 border-l-4 border-l-[var(--color-info)]',
          icon: <BookOpen size={16} className="text-[var(--color-info)]" />,
          text: 'font-semibold text-[var(--color-text-main)] text-sm',
        };
      default:
        return {
          container: `hover:bg-[var(--color-bg-elevated)]/30 ${isClickableTopic ? 'cursor-pointer' : ''}`,
          icon: <FileText size={14} className="text-[var(--color-text-muted)]" />,
          text: 'text-[var(--color-text-sec)] text-sm',
        };
    }
  };

  const styles = getItemStyles();

  const handleRowClick = () => {
    if (isClickableTopic) {
      onPraticar(item);
    } else if (hasChildren) {
      toggleExpanded(item.id);
    }
  };

  const handlePraticar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPraticar(item);
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between py-3 px-3 md:px-4 transition-colors cursor-pointer ${styles.container} border-b border-[var(--color-border)]/50`}
        style={{ paddingLeft: indentPx }}
        onClick={handleRowClick}
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Chevron de expandir */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="p-1 hover:bg-[var(--color-bg-elevated)] rounded-md transition-colors flex-shrink-0"
            >
              <ChevronRight
                size={16}
                className={`text-[var(--color-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <div className="w-7 flex-shrink-0" />
          )}

          {/* Ícone do tipo - oculto no mobile */}
          <span className="flex-shrink-0 hidden md:flex items-center justify-center w-6">
            {styles.icon}
          </span>

          {/* Título */}
          <span className={`${isMobile ? 'leading-snug' : 'truncate'} ${styles.text}`}>
            {item.titulo}
          </span>

          {/* Badge de contagem */}
          {hasChildren && (
            <span className="ml-auto mr-2 px-2 py-0.5 bg-[var(--color-bg-main)] rounded text-[11px] font-medium text-[var(--color-text-muted)] flex-shrink-0 tabular-nums">
              {item.children.length}
            </span>
          )}
        </div>

        {/* Botão Praticar */}
        {item.tipo === 'topico' && hasFilters && (
          <button
            onClick={handlePraticar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-shrink-0 ml-2 bg-[#ffac00] hover:bg-[#ffbc33] text-black hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play size={12} fill="currentColor" />
            <span className="hidden sm:inline">Praticar</span>
          </button>
        )}
      </div>

      {/* Filhos animados */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
        <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-main)] mb-2">
          Nenhum preparatório selecionado
        </h3>
        <p className="text-[var(--color-text-sec)] text-sm text-center max-w-md leading-relaxed">
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
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
          <Loader2 size={24} className="text-[var(--color-brand)] animate-spin" />
        </div>
        <p className="text-[var(--color-text-sec)] text-sm">Carregando edital...</p>
      </div>
    );
  }

  // Estado: Erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-feedback-error-bg)] flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-[var(--color-error)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-main)] mb-2">Erro ao carregar</h3>
        <p className="text-[var(--color-text-sec)] text-sm text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#ffac00] hover:bg-[#ffbc33] text-black font-bold rounded-lg transition-colors text-sm"
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
        <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
          <BookOpen size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-main)] mb-2">
          Edital não cadastrado
        </h3>
        <p className="text-[var(--color-text-sec)] text-sm text-center max-w-md leading-relaxed">
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
      <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex-1">
          <h3 className="text-[var(--color-text-main)] font-semibold text-sm truncate">
            Edital Verticalizado
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <Layers size={12} />
              <span className="tabular-nums">{counts.blocos}</span> blocos
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <BookOpen size={12} />
              <span className="tabular-nums">{counts.materias}</span> matérias
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <FileText size={12} />
              <span className="tabular-nums">{counts.topicos}</span> tópicos
            </span>
          </div>
        </div>

        {/* Botões de expandir/recolher */}
        <div className="hidden md:flex gap-1 flex-shrink-0">
          <button
            onClick={expandAll}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            title="Expandir tudo"
          >
            <ChevronsUpDown size={18} />
          </button>
          <button
            onClick={collapseAll}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
            title="Recolher tudo"
          >
            <ChevronsDownUp size={18} />
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
