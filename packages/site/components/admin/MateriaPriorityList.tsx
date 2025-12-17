import React, { useState } from 'react';
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

    // Mapa de justificativas da IA
    const justificativaMap = new Map<string, { score: number; justificativa: string }>();
    priorizacaoIA?.forEach(p => {
        justificativaMap.set(p.id, { score: p.score, justificativa: p.justificativa });
    });

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        const fromIndex = draggedIndex;

        if (fromIndex !== null && fromIndex !== toIndex) {
            const result = [...materias];
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);

            // Atualizar prioridades
            const reordered = result.map((m, idx) => ({
                ...m,
                prioridade: idx + 1,
            }));

            onChange(reordered);
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const result = [...materias];
        [result[index - 1], result[index]] = [result[index], result[index - 1]];
        const reordered = result.map((m, idx) => ({ ...m, prioridade: idx + 1 }));
        onChange(reordered);
    };

    const moveDown = (index: number) => {
        if (index === materias.length - 1) return;
        const result = [...materias];
        [result[index], result[index + 1]] = [result[index + 1], result[index]];
        const reordered = result.map((m, idx) => ({ ...m, prioridade: idx + 1 }));
        onChange(reordered);
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
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`
                            bg-brand-card border rounded-sm transition-all cursor-move
                            ${isDragging ? 'opacity-50 border-brand-yellow' : 'border-white/10'}
                            ${isDragOver ? 'border-brand-yellow border-2' : ''}
                            hover:border-white/20
                        `}
                    >
                        <div className="flex items-center gap-3 p-4">
                            {/* Drag Handle */}
                            <div className="text-gray-500 hover:text-white">
                                <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Numero */}
                            <div className="w-8 h-8 bg-brand-yellow/20 border border-brand-yellow/50 rounded flex items-center justify-center">
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
                                            className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1"
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
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveDown(index)}
                                    disabled={index === materias.length - 1}
                                    className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
