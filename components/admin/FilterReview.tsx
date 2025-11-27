import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
  Calendar,
  Users,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { QuestionFilters, AIAnalysis, MateriaIdentificada } from '../../services/simuladoService';
import { QuestionPreview } from './QuestionPreview';

interface FilterReviewProps {
  aiAnalysis: AIAnalysis | null;
  suggestedFilters: QuestionFilters | null;
  matchedQuestionsCount: number | null;
  onApprove: (filters: QuestionFilters) => void;
  onReject: () => void;
  isApproving?: boolean;
  disabled?: boolean;
}

export const FilterReview: React.FC<FilterReviewProps> = ({
  aiAnalysis,
  suggestedFilters,
  matchedQuestionsCount,
  onApprove,
  onReject,
  isApproving = false,
  disabled = false,
}) => {
  const [editedFilters, setEditedFilters] = useState<QuestionFilters>(suggestedFilters || {});
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['materias', 'bancas']);
  const [newItem, setNewItem] = useState<{ section: string; value: string }>({ section: '', value: '' });
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (suggestedFilters) {
      setEditedFilters(suggestedFilters);
    }
  }, [suggestedFilters]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const removeItem = (section: keyof QuestionFilters, index: number) => {
    setEditedFilters((prev) => {
      const arr = prev[section] as any[];
      if (arr) {
        return {
          ...prev,
          [section]: arr.filter((_, i) => i !== index),
        };
      }
      return prev;
    });
  };

  const addItem = (section: keyof QuestionFilters, value: string | number) => {
    setEditedFilters((prev) => {
      const arr = (prev[section] as any[]) || [];
      if (!arr.includes(value)) {
        return {
          ...prev,
          [section]: [...arr, value],
        };
      }
      return prev;
    });
    setNewItem({ section: '', value: '' });
  };

  const resetFilters = () => {
    if (suggestedFilters) {
      setEditedFilters(suggestedFilters);
    }
  };

  const handleApprove = () => {
    onApprove(editedFilters);
  };

  const renderFilterSection = (
    title: string,
    key: keyof QuestionFilters,
    icon: React.ReactNode,
    items: (string | number)[] | undefined
  ) => {
    const isExpanded = expandedSections.includes(key);
    const isAddingItem = newItem.section === key;

    return (
      <div className="border border-white/10 rounded-sm overflow-hidden">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 bg-brand-dark/50 hover:bg-brand-dark transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-brand-yellow">{icon}</span>
            <span className="font-bold text-white uppercase tracking-wide text-sm">{title}</span>
            <span className="text-gray-500 text-sm">({items?.length || 0})</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 space-y-3">
            {items && items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <div
                    key={`${key}-${index}`}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm
                      ${isEditing
                        ? 'bg-brand-dark border border-white/10'
                        : 'bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow'
                      }
                    `}
                  >
                    <span className={isEditing ? 'text-white' : ''}>{item}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeItem(key, index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Nenhum item</p>
            )}

            {isEditing && (
              <div className="pt-3 border-t border-white/5">
                {isAddingItem ? (
                  <div className="flex gap-2">
                    <input
                      type={key === 'anos' ? 'number' : 'text'}
                      value={newItem.value}
                      onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                      placeholder={`Novo ${title.toLowerCase().slice(0, -1)}...`}
                      className="flex-1 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (newItem.value) {
                          addItem(key, key === 'anos' ? parseInt(newItem.value) : newItem.value);
                        }
                      }}
                      className="px-3 py-2 bg-green-500/20 text-green-500 rounded-sm hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNewItem({ section: '', value: '' })}
                      className="px-3 py-2 bg-red-500/20 text-red-500 rounded-sm hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewItem({ section: key, value: '' })}
                    className="flex items-center gap-2 text-gray-400 hover:text-brand-yellow text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar {title.toLowerCase().slice(0, -1)}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!aiAnalysis && !suggestedFilters) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aguardando análise do edital...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Analysis Summary */}
      {aiAnalysis && (
        <div className="bg-brand-card border border-white/5 rounded-sm p-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-yellow" />
            Análise do Edital
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-brand-dark/50 p-4 rounded-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Concurso</p>
              <p className="text-white font-medium">{aiAnalysis.concurso.nome}</p>
            </div>
            <div className="bg-brand-dark/50 p-4 rounded-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Órgão</p>
              <p className="text-white font-medium">{aiAnalysis.concurso.orgao}</p>
            </div>
            <div className="bg-brand-dark/50 p-4 rounded-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Banca</p>
              <p className="text-white font-medium">{aiAnalysis.concurso.banca}</p>
            </div>
            <div className="bg-brand-dark/50 p-4 rounded-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Ano</p>
              <p className="text-white font-medium">{aiAnalysis.concurso.ano}</p>
            </div>
          </div>

          {aiAnalysis.concurso.cargos && aiAnalysis.concurso.cargos.length > 0 && (
            <div className="bg-brand-dark/50 p-4 rounded-sm mb-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Cargos</p>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.concurso.cargos.map((cargo, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300"
                  >
                    {cargo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.resumo && (
            <div className="bg-brand-dark/50 p-4 rounded-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Resumo da Análise</p>
              <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis.resumo}</p>
            </div>
          )}
        </div>
      )}

      {/* Materias Identificadas */}
      {aiAnalysis?.materias && aiAnalysis.materias.length > 0 && (
        <div className="bg-brand-card border border-white/5 rounded-sm p-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-yellow" />
            Matérias Identificadas
          </h3>

          <div className="space-y-3">
            {aiAnalysis.materias.map((materia, index) => (
              <div
                key={index}
                className="bg-brand-dark/50 p-4 rounded-sm border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{materia.nome_edital}</p>
                    {materia.nome_banco !== materia.nome_edital && (
                      <p className="text-gray-500 text-xs">
                        Mapeado para: <span className="text-brand-yellow">{materia.nome_banco}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {materia.peso && (
                      <span className="text-xs text-gray-500">Peso: {materia.peso}</span>
                    )}
                    {materia.questoes_encontradas !== undefined && (
                      <p className="text-brand-yellow font-bold">
                        {materia.questoes_encontradas} questões
                      </p>
                    )}
                  </div>
                </div>
                {materia.assuntos && materia.assuntos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {materia.assuntos.slice(0, 5).map((assunto, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded"
                      >
                        {assunto}
                      </span>
                    ))}
                    {materia.assuntos.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{materia.assuntos.length - 5} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Count */}
      {(matchedQuestionsCount !== null || previewCount !== null) && (
        <div className="bg-gradient-to-r from-brand-yellow/10 to-transparent border border-brand-yellow/30 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">
                Questões Encontradas
              </p>
              <p className="text-4xl font-black text-brand-yellow">
                {(previewCount ?? matchedQuestionsCount ?? 0).toLocaleString('pt-BR')}
              </p>
              {previewCount !== null && matchedQuestionsCount !== null && previewCount !== matchedQuestionsCount && (
                <p className="text-xs text-gray-500 mt-1">
                  Original: {matchedQuestionsCount.toLocaleString('pt-BR')} | Atual: {previewCount.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-brand-yellow" />
            </div>
          </div>
        </div>
      )}

      {/* Filters Editor */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Hash className="w-5 h-5 text-brand-yellow" />
            Filtros de Questões
          </h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={disabled}
              className={`
                px-4 py-1.5 rounded-sm text-sm font-bold uppercase tracking-wide transition-all flex items-center gap-2
                ${isEditing
                  ? 'bg-brand-yellow text-brand-darker'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Salvar' : 'Editar'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {renderFilterSection('Matérias', 'materias', <BookOpen className="w-4 h-4" />, editedFilters.materias)}
          {renderFilterSection('Bancas', 'bancas', <Building2 className="w-4 h-4" />, editedFilters.bancas)}
          {renderFilterSection('Anos', 'anos', <Calendar className="w-4 h-4" />, editedFilters.anos)}
          {renderFilterSection('Órgãos', 'orgaos', <Users className="w-4 h-4" />, editedFilters.orgaos)}
          {renderFilterSection('Assuntos', 'assuntos', <Hash className="w-4 h-4" />, editedFilters.assuntos)}
        </div>

        {/* Limit */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Limite de questões</span>
            {isEditing ? (
              <input
                type="number"
                value={editedFilters.limit || ''}
                onChange={(e) =>
                  setEditedFilters((prev) => ({
                    ...prev,
                    limit: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                placeholder="Sem limite"
                className="w-32 bg-brand-dark border border-white/10 rounded-sm py-1 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow text-right"
              />
            ) : (
              <span className="text-white font-medium">
                {editedFilters.limit ? editedFilters.limit.toLocaleString('pt-BR') : 'Sem limite'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question Preview */}
      <QuestionPreview
        filters={editedFilters}
        onCountUpdate={(count) => setPreviewCount(count)}
      />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onReject}
          disabled={disabled || isApproving}
          className={`
            flex-1 py-4 rounded-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2
            border border-white/10 text-gray-400 hover:text-white hover:border-white/20
            ${disabled || isApproving ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <X className="w-5 h-5" />
          Rejeitar
        </button>
        <button
          onClick={handleApprove}
          disabled={disabled || isApproving}
          className={`
            flex-1 py-4 rounded-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2
            bg-brand-yellow text-brand-darker hover:bg-white
            ${disabled || isApproving ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isApproving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Aprovando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Aprovar e Ativar
            </>
          )}
        </button>
      </div>
    </div>
  );
};
