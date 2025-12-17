import React, { useState } from 'react';
import {
  X, Sparkles, ChevronRight, ChevronDown, Edit, Trash2, Plus,
  Loader2, FolderOpen, Folder, Book, FileText, AlertTriangle, Check
} from 'lucide-react';
import {
  editalAIService,
  ParsedEdital,
  ParsedBloco,
  ParsedMateria,
  ParsedTopico,
  ParsedSubtopico,
  countItems,
  EditalExistsAction
} from '../../services/editalAIService';

type ModalPhase = 'input' | 'loading' | 'preview' | 'confirm-existing';

interface ImportEditalModalProps {
  onClose: () => void;
  onImport: (parsed: ParsedEdital, action: EditalExistsAction) => Promise<void>;
  hasExistingItems: boolean;
}

export const ImportEditalModal: React.FC<ImportEditalModalProps> = ({
  onClose,
  onImport,
  hasExistingItems
}) => {
  const [phase, setPhase] = useState<ModalPhase>('input');
  const [texto, setTexto] = useState('');
  const [parsed, setParsed] = useState<ParsedEdital | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Para edicao inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleProcessar = async () => {
    if (texto.trim().length < 50) {
      setError('Cole pelo menos 50 caracteres do texto do edital.');
      return;
    }

    setError(null);
    setPhase('loading');

    try {
      const result = await editalAIService.parseEdital(texto);
      setParsed(result);

      // Expandir todos por padrao
      const allIds = new Set<string>();
      result.blocos.forEach(b => {
        if (b._tempId) allIds.add(b._tempId);
        b.materias.forEach(m => {
          if (m._tempId) allIds.add(m._tempId);
          m.topicos.forEach(t => {
            if (t._tempId) allIds.add(t._tempId);
          });
        });
      });
      setExpandedItems(allIds);

      // Se ja existe edital, perguntar ao usuario
      if (hasExistingItems) {
        setPhase('confirm-existing');
      } else {
        setPhase('preview');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar edital');
      setPhase('input');
    }
  };

  const handleConfirmExisting = (action: EditalExistsAction) => {
    if (action === 'cancel') {
      onClose();
      return;
    }
    setPhase('preview');
  };

  const handleSalvar = async (action: EditalExistsAction = 'clear') => {
    if (!parsed) return;

    setSaving(true);
    try {
      await onImport(parsed, hasExistingItems ? action : 'clear');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar edital');
      setSaving(false);
    }
  };

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

  // Funcoes de edicao da estrutura parseada
  const updateBlocoTitulo = (blocoId: string, novoTitulo: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.map(b =>
        b._tempId === blocoId ? { ...b, titulo: novoTitulo } : b
      )
    });
  };

  const updateMateriaTitulo = (blocoId: string, materiaId: string, novoTitulo: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.map(b =>
        b._tempId === blocoId
          ? {
              ...b,
              materias: b.materias.map(m =>
                m._tempId === materiaId ? { ...m, titulo: novoTitulo } : m
              )
            }
          : b
      )
    });
  };

  const updateTopicoTitulo = (blocoId: string, materiaId: string, topicoId: string, novoTitulo: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.map(b =>
        b._tempId === blocoId
          ? {
              ...b,
              materias: b.materias.map(m =>
                m._tempId === materiaId
                  ? {
                      ...m,
                      topicos: m.topicos.map(t =>
                        t._tempId === topicoId ? { ...t, titulo: novoTitulo } : t
                      )
                    }
                  : m
              )
            }
          : b
      )
    });
  };

  const deleteBloco = (blocoId: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.filter(b => b._tempId !== blocoId)
    });
  };

  const deleteMateria = (blocoId: string, materiaId: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.map(b =>
        b._tempId === blocoId
          ? { ...b, materias: b.materias.filter(m => m._tempId !== materiaId) }
          : b
      )
    });
  };

  const deleteTopico = (blocoId: string, materiaId: string, topicoId: string) => {
    if (!parsed) return;
    setParsed({
      ...parsed,
      blocos: parsed.blocos.map(b =>
        b._tempId === blocoId
          ? {
              ...b,
              materias: b.materias.map(m =>
                m._tempId === materiaId
                  ? { ...m, topicos: m.topicos.filter(t => t._tempId !== topicoId) }
                  : m
              )
            }
          : b
      )
    });
  };

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditingValue(value);
  };

  const finishEdit = (type: 'bloco' | 'materia' | 'topico', blocoId: string, materiaId?: string, topicoId?: string) => {
    if (!editingValue.trim()) {
      setEditingId(null);
      return;
    }

    if (type === 'bloco') {
      updateBlocoTitulo(blocoId, editingValue.trim());
    } else if (type === 'materia' && materiaId) {
      updateMateriaTitulo(blocoId, materiaId, editingValue.trim());
    } else if (type === 'topico' && materiaId && topicoId) {
      updateTopicoTitulo(blocoId, materiaId, topicoId, editingValue.trim());
    }

    setEditingId(null);
  };

  const counts = parsed ? countItems(parsed) : { blocos: 0, materias: 0, topicos: 0, subtopicos: 0 };

  // Renderizar item editavel
  const renderEditableItem = (
    id: string,
    titulo: string,
    tipo: 'bloco' | 'materia' | 'topico',
    level: number,
    blocoId: string,
    materiaId?: string,
    topicoId?: string,
    hasChildren?: boolean
  ) => {
    const isExpanded = expandedItems.has(id);
    const indent = level * 20;

    const getIcon = () => {
      switch (tipo) {
        case 'bloco':
          return isExpanded ? <FolderOpen className="w-4 h-4 text-purple-400" /> : <Folder className="w-4 h-4 text-purple-400" />;
        case 'materia':
          return <Book className="w-4 h-4 text-brand-yellow" />;
        case 'topico':
          return <FileText className="w-4 h-4 text-blue-400" />;
      }
    };

    return (
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/[0.03] group"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand */}
        <button
          onClick={() => toggleExpand(id)}
          className={`p-0.5 ${hasChildren ? '' : 'opacity-0 pointer-events-none'}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </button>

        {/* Icon */}
        {getIcon()}

        {/* Titulo editavel */}
        {editingId === id ? (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={() => finishEdit(tipo, blocoId, materiaId, topicoId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEdit(tipo, blocoId, materiaId, topicoId);
              if (e.key === 'Escape') setEditingId(null);
            }}
            className="flex-1 bg-brand-dark border border-brand-yellow/50 px-2 py-0.5 text-sm text-white outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm text-white truncate">{titulo}</span>
        )}

        {/* Acoes */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => startEdit(id, titulo)}
            className="p-1 text-gray-500 hover:text-brand-yellow"
            title="Editar"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (tipo === 'bloco') deleteBloco(blocoId);
              else if (tipo === 'materia' && materiaId) deleteMateria(blocoId, materiaId);
              else if (tipo === 'topico' && materiaId && topicoId) deleteTopico(blocoId, materiaId, topicoId);
            }}
            className="p-1 text-gray-500 hover:text-red-400"
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Importar Edital via IA</h3>
              <p className="text-sm text-gray-500">Cole o texto do edital para estruturar automaticamente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Fase: Input */}
          {phase === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  Texto do Edital *
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="w-full h-64 bg-brand-dark border border-white/10 p-4 text-white text-sm font-mono resize-none focus:border-purple-500/50 outline-none transition-colors"
                  placeholder={`Cole aqui o texto do edital. Exemplo:

BLOCO I: CONHECIMENTOS GERAIS
LINGUA PORTUGUESA: 1. Compreensao de textos. 2. Tipologia textual. 3. Ortografia oficial.
RACIOCINIO LOGICO: 1. Estruturas Logicas. 2. Diagramas logicos.

BLOCO II: CONHECIMENTOS ESPECIFICOS
LEGISLACAO DE TRANSITO: 1. Sistema Nacional de Transito. 2. CTB.`}
                />
                <p className="text-xs text-gray-600 mt-2">
                  {texto.length} caracteres {texto.length < 50 && '(minimo 50)'}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Fase: Loading */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <Loader2 className="w-20 h-20 text-purple-500 animate-spin absolute -top-2 -left-2" />
              </div>
              <p className="text-white font-bold mt-6">Processando com IA...</p>
              <p className="text-gray-500 text-sm mt-2">Analisando estrutura do edital</p>
            </div>
          )}

          {/* Fase: Confirm Existing */}
          {phase === 'confirm-existing' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-sm">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-bold mb-1">Edital ja possui itens</h4>
                  <p className="text-gray-300 text-sm">
                    O edital deste preparatorio ja possui itens cadastrados. O que deseja fazer?
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => handleConfirmExisting('clear')}
                  className="flex items-start gap-4 p-4 bg-brand-dark border border-white/10 hover:border-purple-500/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Limpar e importar</p>
                    <p className="text-gray-500 text-sm">Remove todos os itens existentes e importa a nova estrutura</p>
                  </div>
                </button>

                <button
                  onClick={() => handleConfirmExisting('merge')}
                  className="flex items-start gap-4 p-4 bg-brand-dark border border-white/10 hover:border-purple-500/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Mesclar com existente</p>
                    <p className="text-gray-500 text-sm">Adiciona os novos itens ao final, mantendo os existentes</p>
                  </div>
                </button>

                <button
                  onClick={() => handleConfirmExisting('cancel')}
                  className="flex items-start gap-4 p-4 bg-brand-dark border border-white/10 hover:border-white/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Cancelar</p>
                    <p className="text-gray-500 text-sm">Voltar sem fazer alteracoes</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Fase: Preview */}
          {phase === 'preview' && parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <Check className="w-5 h-5" />
                <span className="font-bold">Estrutura extraida com sucesso!</span>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Revise a estrutura abaixo. Voce pode editar titulos ou remover itens antes de confirmar.
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 p-3 bg-brand-dark border border-white/10 mb-4">
                <div className="text-center">
                  <p className="text-xl font-black text-purple-400">{counts.blocos}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Blocos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-brand-yellow">{counts.materias}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Materias</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-blue-400">{counts.topicos}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Topicos</p>
                </div>
                {counts.subtopicos > 0 && (
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-400">{counts.subtopicos}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Subtopicos</p>
                  </div>
                )}
              </div>

              {/* Tree Preview */}
              <div className="bg-brand-dark border border-white/10 max-h-80 overflow-y-auto">
                {parsed.blocos.map(bloco => (
                  <div key={bloco._tempId}>
                    {renderEditableItem(
                      bloco._tempId!,
                      bloco.titulo,
                      'bloco',
                      0,
                      bloco._tempId!,
                      undefined,
                      undefined,
                      bloco.materias.length > 0
                    )}

                    {expandedItems.has(bloco._tempId!) && bloco.materias.map(materia => (
                      <div key={materia._tempId}>
                        {renderEditableItem(
                          materia._tempId!,
                          materia.titulo,
                          'materia',
                          1,
                          bloco._tempId!,
                          materia._tempId!,
                          undefined,
                          materia.topicos.length > 0
                        )}

                        {expandedItems.has(materia._tempId!) && materia.topicos.map(topico => (
                          <div key={topico._tempId}>
                            {renderEditableItem(
                              topico._tempId!,
                              topico.titulo,
                              'topico',
                              2,
                              bloco._tempId!,
                              materia._tempId!,
                              topico._tempId!,
                              topico.subtopicos.length > 0
                            )}

                            {/* Subtopicos como topicos filhos */}
                            {expandedItems.has(topico._tempId!) && topico.subtopicos.map((sub, idx) => (
                              <div
                                key={sub._tempId || idx}
                                className="flex items-center gap-2 py-1.5 px-2 text-sm text-gray-400"
                                style={{ paddingLeft: '88px' }}
                              >
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span className="truncate">{sub.titulo}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-white/10">
          {phase === 'input' && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessar}
                disabled={texto.trim().length < 50}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 font-bold uppercase text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Processar com IA
              </button>
            </>
          )}

          {phase === 'loading' && (
            <div className="w-full text-center text-gray-500 text-sm">
              Isso pode levar alguns segundos...
            </div>
          )}

          {phase === 'preview' && (
            <>
              <button
                onClick={() => setPhase('input')}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => handleSalvar(hasExistingItems ? 'clear' : 'clear')}
                disabled={saving || parsed?.blocos.length === 0}
                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar e Salvar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
