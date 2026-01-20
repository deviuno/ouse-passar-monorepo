import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, Play, Loader2, BookOpen, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { editalService, EditalItemWithChildren } from '../../services/editalService';

interface EditalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  preparatorioId: string;
  banca?: string;
  currentAssuntos?: string[]; // Para destacar o tópico atual
  preparatorioSlug?: string; // Para navegação de volta
}

// Componente para renderizar um item do edital no sidebar
const EditalItemNode: React.FC<{
  item: EditalItemWithChildren;
  banca: string;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  onPraticar: (item: EditalItemWithChildren) => void;
  level?: number;
  currentAssuntos?: string[];
}> = ({ item, banca, expandedNodes, toggleExpanded, onPraticar, level = 0, currentAssuntos }) => {
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const hasFilters = (item.filtro_materias?.length > 0) || (item.filtro_assuntos?.length > 0);

  // Tópicos com filtros são clicáveis para praticar
  const isClickableTopic = item.tipo === 'topico' && hasFilters;

  // Verificar se este é o tópico atual
  const isCurrentTopic = currentAssuntos && item.filtro_assuntos &&
    item.filtro_assuntos.some(a => currentAssuntos.includes(a));

  const getIcon = () => {
    switch (item.tipo) {
      case 'bloco':
        return <FolderOpen size={16} className="text-[var(--color-brand)]" />;
      case 'materia':
        return <BookOpen size={16} className="text-[var(--color-info)]" />;
      case 'topico':
        return <FileText size={14} className="text-[var(--color-text-muted)]" />;
      default:
        return null;
    }
  };

  const handlePraticar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPraticar(item);
  };

  const paddingLeft = 12 + level * 16;

  // Handler para clique na linha
  const handleRowClick = () => {
    // Se é o tópico atual, não fazer nada
    if (isCurrentTopic) return;

    if (isClickableTopic) {
      onPraticar(item);
    } else if (hasChildren) {
      toggleExpanded(item.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 px-3 cursor-pointer transition-colors border-b border-[var(--color-border)] ${
          isCurrentTopic ? 'bg-[var(--color-brand)]/10 border-l-2 border-l-[var(--color-brand)]' : 'hover:bg-[var(--color-bg-elevated)]'
        }`}
        style={{ paddingLeft }}
        onClick={handleRowClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Botão de expandir */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="p-0.5 hover:bg-[var(--color-border)] rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
              ) : (
                <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {/* Ícone */}
          <span className="flex-shrink-0">{getIcon()}</span>

          {/* Título */}
          <span
            className={`truncate text-xs ${
              item.tipo === 'bloco'
                ? 'font-bold text-[var(--color-text-main)] uppercase tracking-wide'
                : item.tipo === 'materia'
                ? 'font-semibold text-[var(--color-text-main)]'
                : isCurrentTopic
                ? 'text-[var(--color-brand)] font-medium'
                : 'text-[var(--color-text-sec)]'
            }`}
          >
            {item.titulo}
          </span>

          {/* Badge com contagem */}
          {hasChildren && (
            <span className="ml-1 px-1.5 py-0.5 bg-[var(--color-border)] rounded-full text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
              {item.children.length}
            </span>
          )}
        </div>

        {/* Botão Praticar */}
        {item.tipo === 'topico' && hasFilters && (
          <button
            onClick={handlePraticar}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-all flex-shrink-0 ml-1 ${
              isCurrentTopic
                ? 'bg-[var(--color-brand)]/20 text-[var(--color-brand)] cursor-default'
                : 'bg-[#ffac00] hover:bg-[#ffbc33] text-black'
            }`}
            disabled={isCurrentTopic}
            title={isCurrentTopic ? 'Você está praticando este tópico' : 'Praticar este tópico'}
          >
            <Play size={10} fill="currentColor" />
            {isCurrentTopic ? 'Atual' : 'Ir'}
          </button>
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
            {item.children.map((child) => (
              <EditalItemNode
                key={child.id}
                item={child}
                banca={banca}
                expandedNodes={expandedNodes}
                toggleExpanded={toggleExpanded}
                onPraticar={onPraticar}
                level={level + 1}
                currentAssuntos={currentAssuntos}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const EditalSidebar: React.FC<EditalSidebarProps> = ({
  isOpen,
  onClose,
  preparatorioId,
  banca,
  currentAssuntos,
  preparatorioSlug,
}) => {
  const navigate = useNavigate();
  const [editalTree, setEditalTree] = useState<EditalItemWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Função para navegar para outro tópico
  const handlePraticar = (item: EditalItemWithChildren) => {
    const params = new URLSearchParams();

    if (item.filtro_materias && item.filtro_materias.length > 0) {
      params.set('materias', JSON.stringify(item.filtro_materias));
    }

    if (item.filtro_assuntos && item.filtro_assuntos.length > 0) {
      params.set('assuntos', JSON.stringify(item.filtro_assuntos));
    }

    if (banca) params.set('banca', banca);
    if (preparatorioId) params.set('preparatorioId', preparatorioId);

    // Título do item do edital (para header)
    params.set('editalItemTitle', item.titulo);

    // Slug do preparatório (para navegação de volta)
    if (preparatorioSlug) params.set('preparatorioSlug', preparatorioSlug);

    params.set('autostart', 'true');

    onClose();
    navigate(`/praticar?${params.toString()}`);
  };

  // Carregar edital
  useEffect(() => {
    const loadEdital = async () => {
      if (!preparatorioId || !isOpen) return;

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
        console.error('[EditalSidebar] Erro ao carregar edital:', err);
        setError('Erro ao carregar edital');
      } finally {
        setIsLoading(false);
      }
    };

    loadEdital();
  }, [preparatorioId, isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--color-bg-card)] border-l border-[var(--color-border)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg">
                  <BookOpen size={18} className="text-[var(--color-brand)]" />
                </div>
                <div>
                  <h2 className="text-[var(--color-text-main)] font-bold text-sm">Edital Verticalizado</h2>
                  <p className="text-[var(--color-text-muted)] text-xs">Escolha outro tópico para praticar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
              >
                <X size={20} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={24} className="text-[var(--color-brand)] animate-spin mb-3" />
                  <p className="text-[var(--color-text-muted)] text-sm">Carregando edital...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <AlertCircle size={32} className="text-[var(--color-error)] mb-3" />
                  <p className="text-[var(--color-text-muted)] text-sm text-center">{error}</p>
                </div>
              ) : editalTree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <BookOpen size={32} className="text-[var(--color-text-muted)] mb-3" />
                  <p className="text-[var(--color-text-muted)] text-sm text-center">Edital não disponível</p>
                </div>
              ) : (
                <div>
                  {editalTree.map((item) => (
                    <EditalItemNode
                      key={item.id}
                      item={item}
                      banca={banca || ''}
                      expandedNodes={expandedNodes}
                      toggleExpanded={toggleExpanded}
                      onPraticar={handlePraticar}
                      currentAssuntos={currentAssuntos}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditalSidebar;
