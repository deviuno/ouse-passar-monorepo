import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Check,
  Plus,
  PartyPopper
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import {
  questionGeneratorService,
  QuestionGenerationParams,
  GeneratedQuestion,
} from '../../services/questionGeneratorService';
import { formatBancaDisplay, sortBancas } from '../../utils/bancaFormatter';

// Tempo em ms para manter questões destacadas (60 minutos)
const NEW_QUESTION_HIGHLIGHT_DURATION = 60 * 60 * 1000;

// ==================== COMPONENTES ====================

// Componente de dropdown filtrável com seleção única e opção de adicionar novo
interface SearchableSelectProps {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  displayFormatter?: (item: string) => string;
  allowCustom?: boolean; // Permite adicionar valores personalizados
  customLabel?: string; // Label para o botão de adicionar (ex: "Adicionar matéria")
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
  allowCustom = false,
  customLabel = 'Adicionar novo',
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

  // Verificar se o termo de busca é um valor novo (não existe na lista)
  const isNewValue = useMemo(() => {
    if (!search.trim() || !allowCustom) return false;
    const searchLower = search.toLowerCase().trim();
    return !items.some(item =>
      item.toLowerCase() === searchLower ||
      formatItem(item).toLowerCase() === searchLower
    );
  }, [items, search, allowCustom, displayFormatter]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddCustom = () => {
    if (search.trim()) {
      onChange(search.trim());
      setIsOpen(false);
      setSearch('');
    }
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
                  placeholder={allowCustom ? "Buscar ou digitar novo..." : "Buscar..."}
                  autoFocus
                  className="w-full bg-[#252525] border border-[#3A3A3A] rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-[#6E6E6E] focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>

            {/* Add Custom Option - quando o valor não existe */}
            {isNewValue && (
              <div className="p-2 border-b border-[#3A3A3A]">
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded transition-colors"
                >
                  <Plus size={14} />
                  <span>{customLabel}: <strong>"{search.trim()}"</strong></span>
                </button>
              </div>
            )}

            {/* Items List */}
            <div className="max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-brand-yellow" />
                  <span className="ml-2 text-[#6E6E6E] text-xs">Carregando...</span>
                </div>
              ) : filteredItems.length === 0 && !isNewValue ? (
                <p className="text-[#6E6E6E] text-xs text-center py-4">
                  {allowCustom ? 'Nenhum resultado. Digite para criar novo.' : 'Nenhum resultado'}
                </p>
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
  isNew?: boolean; // Indica se a questão foi recém-criada
}> = ({ question, onEdit, onPublish, onDelete, onGenerateComment, isExpanded, onToggle, isGeneratingComment, isNew }) => {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-[#252525] rounded-lg border overflow-hidden ${
        isNew
          ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,184,0,0.3)] ring-2 ring-brand-yellow/20'
          : 'border-[#3A3A3A]'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isNew && (
            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-brand-yellow text-black rounded animate-pulse">
              Nova
            </span>
          )}
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
    </motion.div>
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

  // Background generation state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<{ generated: number; total: number } | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // New questions tracking (IDs criadas nesta sessão)
  const [newQuestionIds, setNewQuestionIds] = useState<Set<number>>(new Set());
  const newQuestionIdsTimestampRef = useRef<number>(Date.now());

  // Completion popup state
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completedJobStats, setCompletedJobStats] = useState<{ generated: number; total: number } | null>(null);

  // Ref para rastrear IDs conhecidas (para detectar novas)
  const knownQuestionIdsRef = useRef<Set<number>>(new Set());

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

  // Verificar status do job e fazer auto-refresh
  useEffect(() => {
    if (activeJobId) {
      // Mudar para aba de pendentes para ver as questões sendo geradas
      setActiveTab('pending');

      // Função para verificar status e atualizar
      const checkStatusAndRefresh = async () => {
        try {
          // Verificar status do job
          const statusResult = await questionGeneratorService.getJobStatus(activeJobId);

          if (statusResult.success && statusResult.job) {
            const job = statusResult.job;

            // Atualizar progresso
            setJobProgress({ generated: job.totalSaved, total: job.totalRequested });
            setGenerationMessage(
              `Gerando questões: ${job.totalSaved}/${job.totalRequested} salvas...`
            );

            // Se o job completou
            if (job.status === 'completed' || job.status === 'error') {
              // Parar auto-refresh
              if (autoRefreshRef.current) {
                clearInterval(autoRefreshRef.current);
                autoRefreshRef.current = null;
              }

              // Mostrar popup de conclusão
              setCompletedJobStats({ generated: job.totalSaved, total: job.totalRequested });
              setShowCompletionPopup(true);

              // Limpar job ativo
              setActiveJobId(null);
              setGenerationMessage(null);
              setJobProgress(null);
            }
          }

          // Atualizar lista de questões
          await loadPendingQuestions();

        } catch (err) {
          console.error('Erro ao verificar status do job:', err);
        }
      };

      // Verificar imediatamente
      checkStatusAndRefresh();

      // Iniciar auto-refresh a cada 5 segundos
      autoRefreshRef.current = setInterval(checkStatusAndRefresh, 5000);

      return () => {
        if (autoRefreshRef.current) {
          clearInterval(autoRefreshRef.current);
        }
      };
    } else {
      // Parar auto-refresh quando não há job ativo
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }
  }, [activeJobId]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, []);

  // Timer para limpar IDs de questões novas após 60 minutos
  useEffect(() => {
    if (newQuestionIds.size > 0) {
      const timer = setTimeout(() => {
        setNewQuestionIds(new Set());
        newQuestionIdsTimestampRef.current = Date.now();
      }, NEW_QUESTION_HIGHLIGHT_DURATION);

      return () => clearTimeout(timer);
    }
  }, [newQuestionIds.size]);

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

  const loadPendingQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await questionGeneratorService.listGeneratedQuestions('pending');

      // Detectar novas questões (IDs que não existiam antes)
      const currentIds = new Set(result.questions.map(q => q.id).filter(Boolean) as number[]);
      const newIds: number[] = [];

      currentIds.forEach(id => {
        if (!knownQuestionIdsRef.current.has(id)) {
          newIds.push(id);
          knownQuestionIdsRef.current.add(id);
        }
      });

      // Se há novas questões e temos um job ativo, adicionar às IDs novas
      if (newIds.length > 0 && activeJobId) {
        setNewQuestionIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.add(id));
          return next;
        });
      }

      setPendingQuestions(result.questions);
    } catch (err) {
      console.error('Erro ao carregar questoes pendentes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeJobId]);

  const handleGenerate = async () => {
    if (!formData.banca || !formData.materia) {
      setError('Selecione banca e materia');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedQuestions([]);
    setGenerationMessage(null);

    try {
      const result = await questionGeneratorService.generateQuestions({
        ...formData,
        userId: user?.id,
      });

      // Se recebeu jobId, é geração em background
      if (result.jobId) {
        setActiveJobId(result.jobId);
        setGenerationMessage(result.message || `Gerando ${formData.quantidade} questões em background...`);
        // Auto-refresh será iniciado pelo useEffect
      } else {
        // Fallback para resposta síncrona (se backend antigo)
        setGeneratedQuestions(result.questions);
      }

      // Atualizar lista de pendentes imediatamente
      loadPendingQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar questoes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopAutoRefresh = () => {
    setActiveJobId(null);
    setGenerationMessage(null);
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
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
              placeholder="Selecione ou crie uma materia..."
              allowCustom={true}
              customLabel="Criar materia"
            />

            {/* Assunto */}
            <SearchableSelect
              label="Assunto (opcional)"
              items={assuntos}
              value={formData.assunto || ''}
              onChange={(value) => setFormData({ ...formData, assunto: value })}
              placeholder="Todos os assuntos"
              disabled={!formData.materia}
              allowCustom={true}
              customLabel="Criar assunto"
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
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={formData.quantidade}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-brand-yellow"
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={formData.quantidade}
                  onChange={(e) => {
                    const val = Math.min(200, Math.max(1, parseInt(e.target.value, 10) || 1));
                    setFormData({ ...formData, quantidade: val });
                  }}
                  className="w-16 px-2 py-1 bg-[#252525] border border-[#3A3A3A] rounded text-white text-sm text-center focus:outline-none focus:border-brand-yellow"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>200</span>
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
          {/* Banner de geração em andamento */}
          {activeJobId && generationMessage && (
            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-400 font-medium">{generationMessage}</p>
                  <p className="text-blue-400/70 text-sm mt-0.5">
                    Novas questões aparecem automaticamente conforme são geradas. Atualizando a cada 5 segundos...
                  </p>
                </div>
              </div>
              <button
                onClick={handleStopAutoRefresh}
                className="px-3 py-1.5 text-sm text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/10 transition-colors"
              >
                Parar atualização
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase">
              Questoes Pendentes de Revisao ({pendingQuestions.length})
            </h3>
            <button
              onClick={loadPendingQuestions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={activeJobId ? 'animate-spin' : ''} />
              {activeJobId ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {isLoading && pendingQuestions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="text-brand-yellow animate-spin" />
            </div>
          ) : pendingQuestions.length === 0 && !activeJobId ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A]">
              <CheckCircle size={32} className="text-green-500 mb-4" />
              <p className="text-gray-400">Nenhuma questao pendente</p>
              <p className="text-gray-500 text-sm mt-1">
                Todas as questoes foram revisadas
              </p>
            </div>
          ) : pendingQuestions.length === 0 && activeJobId ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#1E1E1E] rounded-lg border border-[#3A3A3A]">
              <Loader2 size={32} className="text-brand-yellow animate-spin mb-4" />
              <p className="text-gray-400">Gerando questões...</p>
              <p className="text-gray-500 text-sm mt-1">
                As questões aparecerão aqui conforme forem sendo geradas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
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
                    isNew={q.id ? newQuestionIds.has(q.id) : false}
                  />
                ))}
              </AnimatePresence>
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

      {/* Completion Popup */}
      <AnimatePresence>
        {showCompletionPopup && completedJobStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompletionPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#1E1E1E] rounded-xl border border-[#3A3A3A] p-8 max-w-md w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <PartyPopper size={32} className="text-green-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Geracao Concluida!
              </h3>

              <p className="text-gray-400 mb-6">
                {completedJobStats.generated === completedJobStats.total ? (
                  <>
                    Todas as <span className="text-brand-yellow font-bold">{completedJobStats.generated}</span> questoes
                    foram geradas com sucesso!
                  </>
                ) : (
                  <>
                    <span className="text-brand-yellow font-bold">{completedJobStats.generated}</span> de {completedJobStats.total} questoes
                    foram geradas.
                  </>
                )}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCompletionPopup(false);
                    setActiveTab('pending');
                  }}
                  className="w-full py-3 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-black font-bold rounded-lg transition-colors"
                >
                  Ver Questoes Pendentes
                </button>
                <button
                  onClick={() => setShowCompletionPopup(false)}
                  className="w-full py-2 px-4 text-gray-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GerarQuestoes;
