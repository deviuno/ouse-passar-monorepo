import React, { useState, useRef, useCallback } from 'react';
import { GripVertical, ChevronUp, ChevronDown, BookOpen, Sparkles } from 'lucide-react';
import { MateriaOrdenada, MateriaPriorizada } from '../../services/rodadasGeneratorService';

interface MateriaPriorityListProps {
    materias: MateriaOrdenada[];
    priorizacaoIA?: MateriaPriorizada[];
    onChange: (materias: MateriaOrdenada[]) => void;
    loading?: boolean;
}

export const MateriaPriorityList: React.FC<MateriaPriorityListProps> = ({
    materias,
    priorizacaoIA,
    onChange,
    loading = false,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNode = useRef<HTMLDivElement | null>(null);
    const dragStartY = useRef<number>(0);

    // Mapa de justificativas da IA
    const justificativaMap = new Map<string, { score: number; justificativa: string }>();
    priorizacaoIA?.forEach(p => {
        justificativaMap.set(p.id, { score: p.score, justificativa: p.justificativa });
    });

    // Reorder function
    const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        const result = [...materias];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);

        // Atualizar prioridades
        const reordered = result.map((m, idx) => ({
            ...m,
            prioridade: idx + 1,
        }));

        onChange(reordered);
    }, [materias, onChange]);

    // HTML5 Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));

        // Set a transparent drag image to avoid default browser behavior
        const dragImage = document.createElement('div');
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);

        setDraggedIndex(index);
        dragNode.current = e.currentTarget;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedIndex !== null && index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Only clear if we're leaving the current target
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedIndex !== null && draggedIndex !== toIndex) {
            reorderItems(draggedIndex, toIndex);
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
        dragNode.current = null;
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        dragNode.current = null;
    };

    // Touch handlers for mobile support
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
        const touch = e.touches[0];
        dragStartY.current = touch.clientY;
        setDraggedIndex(index);
        dragNode.current = e.currentTarget;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (draggedIndex === null) return;

        const touch = e.touches[0];
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

        for (const el of elements) {
            const dataIndex = el.getAttribute('data-index');
            if (dataIndex !== null) {
                const index = parseInt(dataIndex, 10);
                if (index !== draggedIndex) {
                    setDragOverIndex(index);
                }
                break;
            }
        }
    };

    const handleTouchEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            reorderItems(draggedIndex, dragOverIndex);
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
        dragNode.current = null;
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        reorderItems(index, index - 1);
    };

    const moveDown = (index: number) => {
        if (index === materias.length - 1) return;
        reorderItems(index, index + 1);
    };

    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="bg-brand-dark/50 border border-white/10 p-4 animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white/10 rounded"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-white/10 rounded w-48 mb-2"></div>
                                <div className="h-3 bg-white/10 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {materias.map((materia, index) => {
                const iaInfo = justificativaMap.get(materia.id);
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                    <div
                        key={materia.id}
                        data-index={index}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: isDragOver && draggedIndex !== null
                                ? draggedIndex < index
                                    ? 'translateY(-4px)'
                                    : 'translateY(4px)'
                                : 'none',
                            transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease',
                        }}
                        className={`
                            bg-brand-card border rounded-sm select-none
                            ${isDragging
                                ? 'opacity-50 border-brand-yellow shadow-lg scale-[1.02] z-10'
                                : 'border-white/10'
                            }
                            ${isDragOver && !isDragging
                                ? 'border-brand-yellow border-2 bg-brand-yellow/5'
                                : ''
                            }
                            hover:border-white/20
                            touch-none
                        `}
                    >
                        <div className="flex items-center gap-3 p-4">
                            {/* Drag Handle - made larger for easier grabbing */}
                            <div
                                className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1 -m-1 touch-none"
                                title="Arraste para reordenar"
                            >
                                <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Numero */}
                            <div className="w-8 h-8 bg-brand-yellow/20 border border-brand-yellow/50 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-yellow font-black text-sm">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-white font-bold truncate">
                                        {materia.titulo}
                                    </h4>
                                    {iaInfo && (
                                        <span
                                            className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1 flex-shrink-0"
                                            title={iaInfo.justificativa}
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            {iaInfo.score}%
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        {materia.topicos.length} topicos
                                    </span>
                                    {iaInfo && (
                                        <span className="text-gray-500 text-xs truncate max-w-[200px]" title={iaInfo.justificativa}>
                                            {iaInfo.justificativa}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Botoes de mover */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveUp(index);
                                    }}
                                    disabled={index === 0}
                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover para cima"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveDown(index);
                                    }}
                                    disabled={index === materias.length - 1}
                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover para baixo"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
