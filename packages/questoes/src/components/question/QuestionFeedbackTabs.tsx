import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  MessageSquare,
  BarChart2,
  FolderPlus,
  StickyNote,
  Flag,
  Loader2,
  Plus,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ParsedQuestion } from '../../types';
import { QuestionStatistics } from '../../services/questionFeedbackService';
import { getUserNotebooks, Notebook } from '../../services/notebooksService';
import { getOptimizedImageUrl } from '../../utils/image';
import CommentsSection from './CommentsSection';
import { ReportQuestionModal } from './ReportQuestionModal';
import { PegadinhaModal } from './PegadinhaModal';
import { REPORT_MOTIVOS, ReportMotivo } from '../../services/questionReportsService';

type TabId = 'explicacao' | 'comentarios' | 'estatisticas' | 'cadernos' | 'anotacoes' | 'erro';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'explicacao', label: 'Explicação', icon: <BookOpen size={16} /> },
  { id: 'comentarios', label: 'Comentários', icon: <MessageSquare size={16} /> },
  { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart2 size={16} /> },
  { id: 'cadernos', label: 'Cadernos', icon: <FolderPlus size={16} /> },
  { id: 'anotacoes', label: 'Anotações', icon: <StickyNote size={16} /> },
  { id: 'erro', label: 'Notificar', icon: <Flag size={16} /> },
];

interface QuestionFeedbackTabsProps {
  question: ParsedQuestion;
  explanation: string | null;
  loadingExplanation: boolean;
  questionStats: QuestionStatistics | null;
  userId: string | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  selectedAlt: string | null;
  isCorrect: boolean;
}

// Função para converter URLs de imagem em markdown
const preprocessImageUrls = (text: string): string => {
  if (!text) return '';
  let processed = text.replace(
    /Disponível em:\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))[^\n]*/gi,
    '\n\n![Imagem da questão]($1)\n\n'
  );
  processed = processed.replace(
    /(?<!\]\()(?<!\!)\b(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))\b(?!\))/gi,
    '\n\n![Imagem]($1)\n\n'
  );
  processed = processed.replace(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    '\n\n![Imagem]($1)\n\n'
  );
  return processed;
};

export function QuestionFeedbackTabs({
  question,
  explanation,
  loadingExplanation,
  questionStats,
  userId,
  onShowToast,
  selectedAlt,
  isCorrect,
}: QuestionFeedbackTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('explicacao');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPegadinhaModal, setShowPegadinhaModal] = useState(false);
  const [selectedReportMotivo, setSelectedReportMotivo] = useState<ReportMotivo | undefined>(undefined);

  // Cadernos state
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(false);
  const [savedToNotebooks, setSavedToNotebooks] = useState<Set<string>>(new Set());

  // Anotações state
  const [annotation, setAnnotation] = useState('');
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [savedAnnotation, setSavedAnnotation] = useState<string | null>(null);

  // Load notebooks when tab is selected
  useEffect(() => {
    if (activeTab === 'cadernos' && userId && notebooks.length === 0) {
      loadNotebooks();
    }
  }, [activeTab, userId]);

  const loadNotebooks = async () => {
    if (!userId) return;
    setLoadingNotebooks(true);
    try {
      const data = await getUserNotebooks(userId);
      setNotebooks(data);
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    } finally {
      setLoadingNotebooks(false);
    }
  };

  const handleSaveToNotebook = async (notebookId: string) => {
    // TODO: Implementar lógica de salvar questão no caderno
    // Por enquanto, apenas simula o salvamento
    setSavedToNotebooks(prev => new Set(prev).add(notebookId));
    onShowToast?.('Questão salva no caderno!', 'success');
  };

  const handleSaveAnnotation = async () => {
    if (!annotation.trim()) return;
    setSavingAnnotation(true);
    try {
      // TODO: Implementar salvamento real no banco
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
      setSavedAnnotation(annotation);
      onShowToast?.('Anotação salva com sucesso!', 'success');
    } catch (error) {
      onShowToast?.('Erro ao salvar anotação', 'error');
    } finally {
      setSavingAnnotation(false);
    }
  };

  // Build stats data
  const buildStatsData = () => {
    const alternatives = question.parsedAlternativas.map(a => a.letter);
    if (questionStats && questionStats.totalAnswers > 0) {
      return alternatives.map(alt => ({
        alternative: alt,
        percentage: questionStats.alternativeDistribution[alt] || 0,
      }));
    }
    return alternatives.map(alt => ({ alternative: alt, percentage: 0 }));
  };

  const stats = buildStatsData();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'explicacao':
        return (
          <div className="animate-fade-in">
            {/* Pegadinha Badge */}
            {question.isPegadinha && (
              <button
                onClick={() => setShowPegadinhaModal(true)}
                className="w-full mb-4 flex items-center justify-start bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all group text-left"
              >
                <div className="bg-orange-500/20 p-2 rounded-md mr-3 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide mb-0.5">
                    Alerta de Pegadinha
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300">
                    Toque para ver a armadilha desta questão.
                  </span>
                </div>
              </button>
            )}

            {loadingExplanation ? (
              <div className="space-y-2">
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-full"></div>
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-main)] leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-[var(--color-brand)] mt-4 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-[var(--color-text-main)] mt-3 mb-1">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-[var(--color-text-main)]">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-[var(--color-text-main)]">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--color-text-main)]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--color-text-main)]">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--color-brand)] pl-4 my-3 italic text-[var(--color-text-muted)]">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded text-[var(--color-brand)] text-sm">{children}</code>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={getOptimizedImageUrl(src, 800, 85)}
                        alt={alt || 'Imagem'}
                        className="max-w-full h-auto rounded-lg my-3 border border-[var(--color-border)]"
                        loading="lazy"
                      />
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-light)]">{children}</a>
                    ),
                  }}
                >
                  {preprocessImageUrls(explanation || 'Nenhuma explicação disponível para esta questão.')}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );

      case 'comentarios':
        return (
          <div className="animate-fade-in">
            <CommentsSection
              questionId={question.id}
              userId={userId}
              onShowToast={onShowToast}
            />
          </div>
        );

      case 'estatisticas':
        return (
          <div className="animate-fade-in space-y-6">
            {/* Gráfico de distribuição de alternativas */}
            <div>
              <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
                <BarChart2 size={16} className="mr-2 text-[var(--color-brand)]" />
                Distribuição das Respostas
              </h4>

              {questionStats && questionStats.totalAnswers > 0 ? (
                <>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">
                    {questionStats.accuracyRate}% acertaram • {questionStats.totalAnswers} respostas
                  </p>
                  <div className="space-y-3">
                    {stats.map((stat) => {
                      const isCorrectAlt = stat.alternative === question.gabarito;
                      const isSelected = stat.alternative === selectedAlt;
                      let barColor = 'bg-gray-600';
                      if (isCorrectAlt) barColor = 'bg-[#2ECC71]';
                      else if (isSelected) barColor = 'bg-[#E74C3C]';

                      return (
                        <div key={stat.alternative}>
                          <div className="flex justify-between text-xs mb-1 font-bold">
                            <span className={`${isCorrectAlt ? 'text-[#2ECC71]' : isSelected ? 'text-[#E74C3C]' : 'text-[var(--color-text-sec)]'}`}>
                              Alternativa {stat.alternative}
                              {isSelected && ' (Você)'}
                              {isCorrectAlt && ' ✓'}
                            </span>
                            <span className="text-[var(--color-text-main)]">{stat.percentage}%</span>
                          </div>
                          <div className="w-full h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                  Ainda não há dados estatísticos suficientes para esta questão.
                </p>
              )}
            </div>

            {/* Gráfico de dificuldade percebida */}
            {questionStats && (questionStats.difficultyDistribution.easy > 0 || questionStats.difficultyDistribution.medium > 0 || questionStats.difficultyDistribution.hard > 0) && (
              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4">
                  Dificuldade Percebida pela Comunidade
                </h4>
                <div className="flex gap-2">
                  <div className="flex-1 text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{questionStats.difficultyDistribution.easy}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Fácil</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{questionStats.difficultyDistribution.medium}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Médio</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{questionStats.difficultyDistribution.hard}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Difícil</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'cadernos':
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[var(--color-text-sec)] flex items-center">
                <FolderPlus size={16} className="mr-2 text-[var(--color-brand)]" />
                Salvar em Caderno
              </h4>
              {userId && (
                <button
                  className="px-3 py-1.5 bg-[var(--color-brand)] text-black rounded-lg font-medium text-xs hover:bg-[var(--color-brand-light)] transition-colors flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  Novo Caderno
                </button>
              )}
            </div>

            {!userId ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Faça login para salvar questões em cadernos.
              </p>
            ) : loadingNotebooks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
              </div>
            ) : notebooks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Você ainda não tem cadernos criados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notebooks.map((notebook) => {
                  const isSaved = savedToNotebooks.has(notebook.id);
                  return (
                    <button
                      key={notebook.id}
                      onClick={() => !isSaved && handleSaveToNotebook(notebook.id)}
                      disabled={isSaved}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                        isSaved
                          ? 'border-green-500/50 bg-green-500/10'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-[var(--color-text-main)] text-sm truncate">{notebook.title}</p>
                        {notebook.description && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{notebook.description}</p>
                        )}
                      </div>
                      {isSaved ? (
                        <Check size={18} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Plus size={18} className="text-[var(--color-text-muted)] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'anotacoes':
        return (
          <div className="animate-fade-in">
            <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
              <StickyNote size={16} className="mr-2 text-[var(--color-brand)]" />
              Criar Anotação
            </h4>

            {!userId ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Faça login para criar anotações.
              </p>
            ) : savedAnnotation ? (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-500 font-bold flex items-center">
                    <Check size={14} className="mr-1" /> Anotação salva
                  </span>
                  <button
                    onClick={() => {
                      setSavedAnnotation(null);
                      setAnnotation(savedAnnotation);
                    }}
                    className="text-xs text-[var(--color-brand)] hover:underline"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-main)] whitespace-pre-wrap">{savedAnnotation}</p>
              </div>
            ) : (
              <>
                <textarea
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  placeholder="Escreva sua anotação sobre esta questão..."
                  rows={4}
                  className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                />
                <button
                  onClick={handleSaveAnnotation}
                  disabled={!annotation.trim() || savingAnnotation}
                  className="mt-3 w-full py-2.5 bg-[var(--color-brand)] text-black rounded-lg font-medium text-sm hover:bg-[var(--color-brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {savingAnnotation ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <StickyNote size={16} className="mr-2" />
                      Salvar Anotação
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        );

      case 'erro':
        const handleSelectMotivo = (motivo: ReportMotivo) => {
          setSelectedReportMotivo(motivo);
          setShowReportModal(true);
        };

        return (
          <div className="animate-fade-in">
            <h4 className="text-sm font-bold text-[var(--color-text-sec)] mb-4 flex items-center">
              <Flag size={16} className="mr-2 text-[var(--color-brand)]" />
              Notificar Problema
            </h4>

            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Encontrou algum problema nesta questão? Selecione o motivo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REPORT_MOTIVOS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleSelectMotivo(item.value)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-6">
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 mb-4 gap-1 scrollbar-hide -mx-3 px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--color-brand)] text-black'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-sec)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        {renderTabContent()}
      </div>

      {/* Modals */}
      <PegadinhaModal
        isOpen={showPegadinhaModal}
        onClose={() => setShowPegadinhaModal(false)}
        explicacao={question.explicacaoPegadinha ?? undefined}
      />

      <ReportQuestionModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedReportMotivo(undefined);
        }}
        questionId={question.id}
        questionInfo={{
          materia: question.materia,
          assunto: question.assunto,
          banca: question.banca,
          ano: question.ano,
        }}
        onSuccess={() => {
          onShowToast?.('Report enviado com sucesso!', 'success');
          setShowReportModal(false);
          setSelectedReportMotivo(undefined);
        }}
        initialMotivo={selectedReportMotivo}
      />
    </div>
  );
}

export default QuestionFeedbackTabs;
