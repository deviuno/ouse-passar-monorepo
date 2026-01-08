import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Play,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Eye,
  AlertCircle,
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import {
  questionGeneratorService,
  QuestionGenerationParams,
  GeneratedQuestion,
} from '../../services/questionGeneratorService';
import { formatBancaDisplay, sortBancas } from '../../utils/bancaFormatter';

// ==================== COMPONENTES ====================

// Componente de dropdown filtrável com seleção única
interface SearchableSelectProps {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  displayFormatter?: (item: string) => string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  items,
  value,
  onChange,
  placeholder = 'Selecionar...',
  isLoading = false,
  disabled = false,
  displayFormatter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Função para formatar item para exibição
  const formatItem = (item: string) => displayFormatter ? displayFormatter(item) : item;

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

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    // Buscar tanto no valor original quanto no formatado
    return items.filter((item) =>
      item.toLowerCase().includes(searchLower) ||
      formatItem(item).toLowerCase().includes(searchLower)
    );
  }, [items, search, displayFormatter]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Label */}
      <label className="block text-sm text-gray-400 mb-1">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors text-left
          ${disabled
            ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#4A4A4A] cursor-not-allowed'
            : isOpen
              ? 'bg-[#252525] border-brand-yellow text-white'
              : 'bg-[#252525] border-[#3A3A3A] text-white hover:border-[#4A4A4A]'
          }
        `}
      >
        <span className={!value ? 'text-[#6E6E6E]' : 'text-white truncate'}>
          {value ? formatItem(value) : placeholder}
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
            {/* Search */}
            <div className="p-2 border-b border-[#3A3A3A]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-[#252525] border border-[#3A3A3A] rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-[#6E6E6E] focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-brand-yellow" />
                  <span className="ml-2 text-[#6E6E6E] text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-[#6E6E6E] text-xs text-center py-4">Nenhum resultado</p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = value === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${isSelected ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-white hover:bg-[#252525]'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-brand-yellow border-brand-yellow' : 'border-[#4A4A4A]'}
                      `}>
                        {isSelected && <Check size={10} className="text-black" />}
                      </div>
                      <span className="truncate">{formatItem(item)}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer - limpar seleção */}
            {value && (
              <div className="p-2 border-t border-[#3A3A3A]">
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-[#E74C3C] text-xs hover:underline"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const labels: Record<string, string> = {
    pending: 'Pendente',
    published: 'Publicada',
    rejected: 'Rejeitada',
    active: 'Ativa',
  };

  return (
    <span className={`px-2 py-1 text-xs font-bold rounded border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const QuestionCard: React.FC<{
  question: GeneratedQuestion;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onGenerateComment: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  isGeneratingComment?: boolean;
}> = ({ question, onEdit, onPublish, onDelete, onGenerateComment, isExpanded, onToggle, isGeneratingComment }) => {
  return (
    <div className="bg-[#252525] rounded-lg border border-[#3A3A3A] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusBadge status={question.generation_status || 'pending'} />
          <span className="text-white font-medium truncate">
            {question.enunciado.substring(0, 80)}...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{question.materia}</span>
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#3A3A3A] p-4 space-y-4">
          {/* Info Tags */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-[#3A3A3A] text-gray-300 rounded">
              {question.banca}
            </span>
            <span className="px-2 py-1 bg-[#3A3A3A] text-gray-300 rounded">
              {question.materia}
            </span>
            {question.assunto && (
              <span className="px-2 py-1 bg-[#3A3A3A] text-gray-300 rounded">
                {question.assunto}
              </span>
            )}
            <span className="px-2 py-1 bg-[#3A3A3A] text-gray-300 rounded">
              Gabarito: {question.gabarito}
            </span>
            <span className={`px-2 py-1 rounded ${
              question.is_ai_generated
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-[#3A3A3A] text-gray-300'
            }`}>
              Questão Original: {question.is_ai_generated ? 'Sim' : 'Não'}
            </span>
          </div>

          {/* Enunciado */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 mb-2">Enunciado</h4>
            <p className="text-white text-sm whitespace-pre-wrap">{question.enunciado}</p>
          </div>

          {/* Alternativas */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 mb-2">Alternativas</h4>
            <div className="space-y-2">
              {question.alternativas.map((alt) => (
                <div
                  key={alt.letter}
                  className={`p-2 rounded text-sm ${
                    alt.letter === question.gabarito
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-[#3A3A3A] text-gray-300'
                  }`}
                >
                  <span className="font-bold mr-2">{alt.letter})</span>
                  {alt.text}
                </div>
              ))}
            </div>
          </div>

          {/* Justificativa */}
          {question.justificativa_gabarito && (
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-2">Justificativa</h4>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {question.justificativa_gabarito}
              </p>
            </div>
          )}

          {/* Comentario */}
          {question.comentario && (
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-2">Comentario</h4>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{question.comentario}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3A3A3A]">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded transition-colors"
            >
              <Edit3 size={14} />
              Editar
            </button>
            {!question.comentario && (
              <button
                onClick={onGenerateComment}
                disabled={isGeneratingComment}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-black bg-brand-yellow hover:bg-brand-yellow-light rounded transition-colors disabled:opacity-70 disabled:cursor-wait"
              >
                {isGeneratingComment ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    Gerar Comentario
                  </>
                )}
              </button>
            )}
            {question.generation_status === 'pending' && (
              <>
                <button
                  onClick={onPublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-black bg-green-500 hover:bg-green-600 rounded transition-colors"
                >
                  <CheckCircle size={14} />
                  Publicar
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  <Trash2 size={14} />
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionEditorModal: React.FC<{
  question: GeneratedQuestion;
  onClose: () => void;
  onSave: (updates: Partial<GeneratedQuestion>) => void;
  materias: string[];
  assuntos: string[];
}> = ({ question, onClose, onSave, materias, assuntos }) => {
  const [formData, setFormData] = useState({
    enunciado: question.enunciado,
    alternativas: [...question.alternativas],
    gabarito: question.gabarito,
    comentario: question.comentario || question.justificativa_gabarito || '',
    materia: question.materia || '',
    assunto: question.assunto || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAlternativaChange = (index: number, value: string) => {
    const newAlts = [...formData.alternativas];
    newAlts[index] = { ...newAlts[index], text: value };
    setFormData({ ...formData, alternativas: newAlts });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] rounded-lg border border-[#3A3A3A] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
          <h3 className="text-lg font-bold text-white">Editar Questao</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
          >
            <XCircle size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Enunciado */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Enunciado</label>
            <textarea
              value={formData.enunciado}
              onChange={(e) => setFormData({ ...formData, enunciado: e.target.value })}
              className="w-full p-3 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm resize-none focus:outline-none focus:border-brand-yellow"
              rows={6}
            />
          </div>

          {/* Alternativas */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Alternativas</label>
            <div className="space-y-2">
              {formData.alternativas.map((alt, index) => (
                <div key={alt.letter} className="flex items-start gap-2">
                  <span className="px-2 py-2 bg-[#3A3A3A] text-white font-bold rounded text-sm">
                    {alt.letter}
                  </span>
                  <textarea
                    value={alt.text}
                    onChange={(e) => handleAlternativaChange(index, e.target.value)}
                    className="flex-1 p-2 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm resize-none focus:outline-none focus:border-brand-yellow"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gabarito */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Gabarito</label>
            <select
              value={formData.gabarito}
              onChange={(e) => setFormData({ ...formData, gabarito: e.target.value })}
              className="w-full p-2 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm focus:outline-none focus:border-brand-yellow"
            >
              {formData.alternativas.map((alt) => (
                <option key={alt.letter} value={alt.letter}>
                  {alt.letter}
                </option>
              ))}
            </select>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Comentario</label>
            <textarea
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full p-3 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm resize-none focus:outline-none focus:border-brand-yellow"
              rows={4}
            />
          </div>

          {/* Materia/Assunto */}
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Materia"
              items={materias}
              value={formData.materia}
              onChange={(value) => setFormData({ ...formData, materia: value })}
              placeholder="Selecione a materia..."
            />
            <SearchableSelect
              label="Assunto"
              items={assuntos}
              value={formData.assunto}
              onChange={(value) => setFormData({ ...formData, assunto: value })}
              placeholder="Selecione o assunto..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#3A3A3A]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black bg-brand-yellow hover:bg-brand-yellow-light rounded transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== PAGINA PRINCIPAL ====================

export const GerarQuestoes: React.FC = () => {
  const { user } = useAuth();

  // Form State
  const [formData, setFormData] = useState<QuestionGenerationParams>({
    banca: '',
    materia: '',
    assunto: '',
    tipo: 'multipla_escolha',
    escolaridade: 'superior',
    quantidade: 5,
  });

  // Options
  const [bancas, setBancas] = useState<string[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [assuntos, setAssuntos] = useState<string[]>([]);

  // Generated Questions
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<GeneratedQuestion[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCommentId, setGeneratingCommentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'pending'>('generate');

  // Carregar filtros e questoes pendentes
  useEffect(() => {
    loadFilters();
    loadPendingQuestions();
  }, []);

  // Carregar assuntos quando materia muda
  useEffect(() => {
    if (formData.materia) {
      loadAssuntos(formData.materia);
    }
  }, [formData.materia]);

  const loadFilters = async () => {
    try {
      const result = await questionGeneratorService.getFilters();
      setBancas(sortBancas(result.bancas));
      setMaterias(result.materias);
    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
    }
  };

  const loadAssuntos = async (materia: string) => {
    try {
      const result = await questionGeneratorService.getAssuntos(materia);
      setAssuntos(result.assuntos);
    } catch (err) {
      console.error('Erro ao carregar assuntos:', err);
    }
  };

  const loadPendingQuestions = async () => {
    setIsLoading(true);
    try {
      const result = await questionGeneratorService.listGeneratedQuestions('pending');
      setPendingQuestions(result.questions);
    } catch (err) {
      console.error('Erro ao carregar questoes pendentes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.banca || !formData.materia) {
      setError('Selecione banca e materia');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedQuestions([]);

    try {
      const result = await questionGeneratorService.generateQuestions({
        ...formData,
        userId: user?.id,
      });

      setGeneratedQuestions(result.questions);
      // Atualizar lista de pendentes
      loadPendingQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar questoes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (question: GeneratedQuestion) => {
    if (!question.id) return;

    try {
      await questionGeneratorService.publishQuestion(question.id);
      loadPendingQuestions();
      setGeneratedQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id ? { ...q, generation_status: 'published' } : q
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar questao');
    }
  };

  const handleDelete = async (question: GeneratedQuestion) => {
    if (!question.id) return;

    if (!confirm('Tem certeza que deseja rejeitar esta questao?')) return;

    try {
      await questionGeneratorService.deleteQuestion(question.id);
      loadPendingQuestions();
      setGeneratedQuestions((prev) => prev.filter((q) => q.id !== question.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar questao');
    }
  };

  const handleSaveEdit = async (updates: Partial<GeneratedQuestion>) => {
    if (!editingQuestion?.id) return;

    try {
      await questionGeneratorService.updateQuestion(editingQuestion.id, updates);
      loadPendingQuestions();
      setGeneratedQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...updates } : q))
      );
    } catch (err) {
      throw err;
    }
  };

  const handleGenerateComment = async (question: GeneratedQuestion) => {
    if (!question.id) return;

    setGeneratingCommentId(question.id);
    try {
      const comentario = await questionGeneratorService.generateComment(
        question.id,
        question.enunciado,
        question.alternativas,
        question.gabarito
      );

      // Atualizar local
      const updatedQuestion = { ...question, comentario };
      setGeneratedQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? updatedQuestion : q))
      );
      setPendingQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? updatedQuestion : q))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar comentario');
    } finally {
      setGeneratingCommentId(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase flex items-center gap-3">
            <Sparkles className="text-brand-yellow" />
            Gerar Questoes
          </h2>
          <p className="text-gray-400 mt-1">
            Gere questoes de concurso usando IA
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#3A3A3A]">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'generate'
              ? 'text-brand-yellow border-brand-yellow'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Gerar Novas
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'pending'
              ? 'text-brand-yellow border-brand-yellow'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Pendentes ({pendingQuestions.length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A] p-4 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-gray-400 uppercase">Parametros</h3>

            {/* Banca */}
            <SearchableSelect
              label="Banca *"
              items={bancas}
              value={formData.banca}
              onChange={(value) => setFormData({ ...formData, banca: value })}
              placeholder="Selecione a banca..."
              displayFormatter={formatBancaDisplay}
            />

            {/* Materia */}
            <SearchableSelect
              label="Materia *"
              items={materias}
              value={formData.materia}
              onChange={(value) => setFormData({ ...formData, materia: value, assunto: '' })}
              placeholder="Selecione a materia..."
            />

            {/* Assunto */}
            <SearchableSelect
              label="Assunto (opcional)"
              items={assuntos}
              value={formData.assunto || ''}
              onChange={(value) => setFormData({ ...formData, assunto: value })}
              placeholder="Todos os assuntos"
              disabled={!formData.materia}
            />

            {/* Tipo */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo: e.target.value as 'multipla_escolha' | 'verdadeiro_falso',
                  })
                }
                className="w-full p-2 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm focus:outline-none focus:border-brand-yellow"
              >
                <option value="multipla_escolha">Multipla Escolha (A-E)</option>
                <option value="verdadeiro_falso">Verdadeiro/Falso</option>
              </select>
            </div>

            {/* Escolaridade */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Escolaridade</label>
              <select
                value={formData.escolaridade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    escolaridade: e.target.value as 'fundamental' | 'medio' | 'superior',
                  })
                }
                className="w-full p-2 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm focus:outline-none focus:border-brand-yellow"
              >
                <option value="fundamental">Fundamental</option>
                <option value="medio">Medio</option>
                <option value="superior">Superior</option>
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Quantidade: {formData.quantidade}
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={formData.quantidade}
                onChange={(e) =>
                  setFormData({ ...formData, quantidade: parseInt(e.target.value, 10) })
                }
                className="w-full accent-brand-yellow"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.banca || !formData.materia}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-black bg-brand-yellow hover:bg-brand-yellow-light rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Gerar {formData.quantidade} Questoes
                </>
              )}
            </button>
          </div>

          {/* Generated Questions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                Questoes Geradas ({generatedQuestions.length})
              </h3>
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A]">
                <Loader2 size={32} className="text-brand-yellow animate-spin mb-4" />
                <p className="text-gray-400">Gerando questoes com IA...</p>
                <p className="text-gray-500 text-sm mt-1">Isso pode levar alguns segundos</p>
              </div>
            ) : generatedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A]">
                <Sparkles size={32} className="text-gray-500 mb-4" />
                <p className="text-gray-400">Nenhuma questao gerada ainda</p>
                <p className="text-gray-500 text-sm mt-1">
                  Configure os parametros e clique em "Gerar"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isExpanded={expandedIds.has(q.id || 0)}
                    onToggle={() => toggleExpanded(q.id || 0)}
                    onEdit={() => setEditingQuestion(q)}
                    onPublish={() => handlePublish(q)}
                    onDelete={() => handleDelete(q)}
                    onGenerateComment={() => handleGenerateComment(q)}
                    isGeneratingComment={generatingCommentId === q.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase">
              Questoes Pendentes de Revisao ({pendingQuestions.length})
            </h3>
            <button
              onClick={loadPendingQuestions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="text-brand-yellow animate-spin" />
            </div>
          ) : pendingQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A]">
              <CheckCircle size={32} className="text-green-500 mb-4" />
              <p className="text-gray-400">Nenhuma questao pendente</p>
              <p className="text-gray-500 text-sm mt-1">
                Todas as questoes foram revisadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isExpanded={expandedIds.has(q.id || 0)}
                  onToggle={() => toggleExpanded(q.id || 0)}
                  onEdit={() => setEditingQuestion(q)}
                  onPublish={() => handlePublish(q)}
                  onDelete={() => handleDelete(q)}
                  onGenerateComment={() => handleGenerateComment(q)}
                  isGeneratingComment={generatingCommentId === q.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveEdit}
          materias={materias}
          assuntos={assuntos}
        />
      )}
    </div>
  );
};

export default GerarQuestoes;
