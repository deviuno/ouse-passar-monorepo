import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Copy, BookOpen, RotateCcw, Zap, GripVertical, FileText, X, Filter, ArrowRight, ArrowLeft, Check, Sparkles, Loader2, Volume2, ListChecks, Play, Pause, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { preparatoriosService, rodadasService, missoesService, QuestaoFiltrosData, MissaoQuestaoFiltros, PreparatorioWithRodadas, MultiTurmaTarget } from '../../services/preparatoriosService';
import { MultiTurmaSelector } from '../../components/admin/MultiTurmaSelector';
import { editalService, EditalItem } from '../../services/editalService';
import { Tables, Enums } from '../../lib/database.types';

type Preparatorio = Tables<'preparatorios'>;
type Rodada = Tables<'rodadas'>;
type Missao = Tables<'missoes'>;
type MissaoTipo = Enums<'missao_tipo'>;
import { EditalTopicSelector } from '../../components/admin/EditalTopicSelector';
import { QuestionFilterSelector } from '../../components/admin/QuestionFilterSelector';
import { QuestionFilters, getQuestionsForFilters, ExternalQuestion, getMateriasByAssuntos } from '../../services/externalQuestionsService';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';

export const MissoesAdmin: React.FC = () => {
  const { preparatorioId, rodadaId } = useParams<{ preparatorioId: string; rodadaId: string }>();
  const navigate = useNavigate();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMissao, setEditingMissao] = useState<Missao | null>(null);
  const [filterTipo, setFilterTipo] = useState<MissaoTipo | 'todos'>('todos');
  const [contentPreviewMissao, setContentPreviewMissao] = useState<Missao | null>(null);
  const [questionsPreviewMissao, setQuestionsPreviewMissao] = useState<Missao | null>(null);
  const [missoesComConteudo, setMissoesComConteudo] = useState<Set<string>>(new Set());

  const loadData = async () => {
    if (!preparatorioId || !rodadaId) return;

    try {
      setLoading(true);
      const [prep, rod] = await Promise.all([
        preparatoriosService.getById(preparatorioId),
        rodadasService.getById(rodadaId)
      ]);

      if (!prep || !rod) {
        navigate('/admin/preparatorios');
        return;
      }

      setPreparatorio(prep);
      setRodada(rod);

      const missoesData = await missoesService.getByRodada(rodadaId);
      setMissoes(missoesData);

      // Carregar status de conteúdo para todas as missões de estudo
      const missaoIds = missoesData
        .filter(m => m.tipo === 'padrao' || m.tipo === 'estudo')
        .map(m => m.id);

      if (missaoIds.length > 0) {
        const { data: conteudos } = await supabase
          .from('missao_conteudos')
          .select('missao_id')
          .in('missao_id', missaoIds)
          .eq('status', 'completed');

        if (conteudos) {
          setMissoesComConteudo(new Set(conteudos.map(c => c.missao_id)));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preparatorioId, rodadaId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta missao?')) {
      return;
    }

    try {
      await missoesService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir missao');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await missoesService.duplicate(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao duplicar missao');
    }
  };

  const filteredMissoes = filterTipo === 'todos'
    ? missoes
    : missoes.filter(m => m.tipo === filterTipo);

  const getTipoIcon = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return <BookOpen className="w-4 h-4" />;
      case 'revisao': return <RotateCcw className="w-4 h-4" />;
      case 'acao': return <Zap className="w-4 h-4" />;
      case 'tecnicas': return <FileText className="w-4 h-4" />;
      case 'simulado': return <Edit className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'revisao': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'acao': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'tecnicas': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'simulado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTipoBg = (tipo: MissaoTipo) => {
    switch (tipo) {
      case 'padrao':
      case 'estudo': return 'border-l-blue-500';
      case 'revisao': return 'border-l-purple-500';
      case 'acao': return 'border-l-orange-500';
      case 'tecnicas': return 'border-l-green-500';
      case 'simulado': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!preparatorio || !rodada) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/admin/preparatorios" className="hover:text-brand-yellow transition-colors">
          Preparatorios
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/preparatorios/${preparatorioId}/rodadas`} className="hover:text-brand-yellow transition-colors">
          {preparatorio.nome}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Rodada {rodada.numero}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-yellow">Missoes</span>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <Link
            to={`/admin/preparatorios/${preparatorioId}/rodadas`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Rodadas
          </Link>
          <h2 className="text-3xl font-black text-white font-display uppercase">{rodada.titulo}</h2>
          <p className="text-gray-500 mt-1">{missoes.length} missoes cadastradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Missao
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterTipo('todos')}
          className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'todos'
              ? 'bg-brand-yellow text-brand-darker'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          Todos ({missoes.length})
        </button>
        <button
          onClick={() => setFilterTipo('padrao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'padrao'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Padrao ({missoes.filter(m => m.tipo === 'padrao').length})
        </button>
        <button
          onClick={() => setFilterTipo('revisao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'revisao'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <RotateCcw className="w-4 h-4" />
          Revisao ({missoes.filter(m => m.tipo === 'revisao').length})
        </button>
        <button
          onClick={() => setFilterTipo('acao')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${filterTipo === 'acao'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'bg-brand-card border border-white/10 text-gray-400 hover:text-white'
            }`}
        >
          <Zap className="w-4 h-4" />
          Acao ({missoes.filter(m => m.tipo === 'acao').length})
        </button>
      </div>

      {filteredMissoes.length === 0 ? (
        <div className="bg-brand-card border border-white/10 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            {missoes.length === 0 ? 'Nenhuma missao cadastrada' : 'Nenhuma missao encontrada com este filtro'}
          </h3>
          <p className="text-gray-500 mb-6">
            {missoes.length === 0 ? 'Crie a primeira missao para esta rodada.' : 'Altere o filtro para ver outras missoes.'}
          </p>
          {missoes.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Missao
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissoes.map((missao) => (
            <div
              key={missao.id}
              className={`bg-brand-card border border-white/10 rounded-sm border-l-4 ${getTipoBg(missao.tipo)} hover:border-white/20 transition-colors`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-600 cursor-move" />
                  <span className="w-10 h-10 bg-brand-dark border border-white/10 rounded flex items-center justify-center text-white font-black">
                    {missao.numero}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase rounded border ${getTipoColor(missao.tipo)}`}>
                      {getTipoIcon(missao.tipo)}
                      {missao.tipo}
                    </span>
                    {missao.materia && (
                      <span className="text-brand-yellow font-bold text-sm">{missao.materia}</span>
                    )}
                  </div>

                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <>
                      {missao.assunto && (
                        <p className="text-gray-300 text-sm mb-1 line-clamp-2">{missao.assunto}</p>
                      )}
                      {missao.instrucoes && (
                        <p className="text-gray-500 text-xs">{missao.instrucoes}</p>
                      )}
                    </>
                  )}

                  {missao.tipo === 'revisao' && missao.tema && (
                    <p className="text-purple-300 text-sm font-medium">{missao.tema}</p>
                  )}

                  {missao.tipo === 'acao' && missao.acao && (
                    <p className="text-orange-300 text-sm font-medium">{missao.acao}</p>
                  )}

                  {missao.extra && missao.extra.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {missao.extra.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-brand-dark/50 text-gray-400 text-xs rounded">
                          + {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {missao.obs && (
                    <p className="mt-2 text-yellow-500/70 text-xs italic">{missao.obs}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Botão Conteúdo - apenas para missões de estudo */}
                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <button
                      onClick={() => setContentPreviewMissao(missao)}
                      className={`p-2 rounded transition-colors ${missoesComConteudo.has(missao.id)
                          ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                          : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                      title={missoesComConteudo.has(missao.id) ? "Ver Conteúdo" : "Gerar Conteúdo"}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  {/* Botão Questões - apenas para missões de estudo */}
                  {(missao.tipo === 'padrao' || missao.tipo === 'estudo') && (
                    <button
                      onClick={() => setQuestionsPreviewMissao(missao)}
                      className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded transition-colors"
                      title="Ver Questões"
                    >
                      <ListChecks className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingMissao(missao);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(missao.id)}
                    className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(missao.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && rodadaId && preparatorioId && preparatorio && (
        <MissaoModal
          preparatorioId={preparatorioId}
          rodadaId={rodadaId}
          preparatorio={preparatorio}
          missao={editingMissao}
          nextNumero={missoes.length > 0 ? String(Math.max(...missoes.map(m => parseInt(m.numero) || 0)) + 1) : '1'}
          onClose={() => {
            setShowModal(false);
            setEditingMissao(null);
          }}
          onSave={async () => {
            await loadData();
            setShowModal(false);
            setEditingMissao(null);
          }}
        />
      )}

      {/* Modal de Preview de Conteúdo */}
      {contentPreviewMissao && (
        <ContentPreviewModal
          missao={contentPreviewMissao}
          hasContent={missoesComConteudo.has(contentPreviewMissao.id)}
          onClose={() => setContentPreviewMissao(null)}
          onContentGenerated={() => {
            setMissoesComConteudo(prev => new Set([...prev, contentPreviewMissao.id]));
          }}
        />
      )}

      {/* Modal de Preview de Questões */}
      {questionsPreviewMissao && (
        <QuestionsPreviewModal
          missao={questionsPreviewMissao}
          onClose={() => setQuestionsPreviewMissao(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// MODAL DE PREVIEW DE CONTEÚDO
// ============================================================================

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL
  ? import.meta.env.VITE_MASTRA_URL
  : 'http://localhost:4000';

interface ContentPreviewModalProps {
  missao: Missao;
  hasContent: boolean;
  onClose: () => void;
  onContentGenerated: () => void;
}

const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({ missao, hasContent, onClose, onContentGenerated }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<{ texto: string; audioUrl: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Estados para geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');

  // Estados para questões preview
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);

  // Carregar conteúdo existente
  useEffect(() => {
    const loadContent = async () => {
      if (!hasContent) {
        // Se não tem conteúdo, carregar as questões para mostrar na tela de geração
        setLoading(false);
        loadQuestionsPreview();
        return;
      }

      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('missao_conteudos')
          .select('texto_content, audio_url, status')
          .eq('missao_id', missao.id)
          .single();

        if (err) {
          if (err.code === 'PGRST116') {
            setLoading(false);
            loadQuestionsPreview();
            return;
          }
          throw err;
        }

        if (data.status !== 'completed') {
          setError(`Conteúdo em processamento (status: ${data.status})`);
          return;
        }

        setContent({
          texto: data.texto_content || '',
          audioUrl: data.audio_url
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar conteúdo');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [missao.id, hasContent]);

  // Carregar preview das questões
  const loadQuestionsPreview = async () => {
    try {
      setLoadingQuestions(true);
      const filtros = await missoesService.getQuestaoFiltros(missao.id);

      if (!filtros || !filtros.filtros) {
        return;
      }

      const filters: QuestionFilters = {
        materias: filtros.filtros.materias || [],
        assuntos: filtros.filtros.assuntos || [],
        bancas: filtros.filtros.bancas || [],
        banca_ids: filtros.filtros.banca_ids || [], // IDs para filtragem eficiente
        orgaos: filtros.filtros.orgaos || [],
        anos: filtros.filtros.anos || [],
        escolaridade: filtros.filtros.escolaridade || [],
        modalidade: filtros.filtros.modalidade || [],
      };

      setQuestionsCount(filtros.questoes_count || 0);

      // Carregar apenas 5 questões para preview
      const { questions: qs } = await getQuestionsForFilters(filters, {
        limit: 5,
        offset: 0,
      });

      setQuestions(qs);
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Gerar conteúdo
  const handleGenerateContent = async (instructions?: string) => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus('Iniciando geração...');
      setShowRegenerateInput(false);

      // Simular progresso inicial
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      // Buscar filtros da missão para obter as questões
      setGenerationStatus('Buscando questões da missão...');
      setGenerationProgress(20);

      const response = await fetch(`${MASTRA_URL}/api/missao/gerar-conteudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missaoId: missao.id,
          materia: missao.materia,
          assunto: missao.assunto,
          instrucoes: missao.instrucoes,
          instrucoesAdicionais: instructions,
        }),
      });

      setGenerationStatus('Gerando conteúdo com IA...');
      setGenerationProgress(50);

      const result = await response.json();

      clearInterval(progressInterval);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar conteúdo');
      }

      setGenerationStatus('Salvando conteúdo...');
      setGenerationProgress(80);

      // Se tem áudio, aguardar geração
      if (result.audioProcessing) {
        setGenerationStatus('Gerando áudio (pode levar alguns minutos)...');
      }

      setGenerationProgress(100);
      setGenerationStatus('Conteúdo gerado com sucesso!');

      // Atualizar o conteúdo localmente
      setContent({
        texto: result.texto || '',
        audioUrl: result.audioUrl || null
      });

      // Notificar que o conteúdo foi gerado
      onContentGenerated();

      // Pequeno delay para mostrar mensagem de sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsGenerating(false);

    } catch (err: any) {
      console.error('Erro ao gerar conteúdo:', err);
      setError(err.message || 'Erro ao gerar conteúdo');
      setIsGenerating(false);
    }
  };

  // Se está gerando conteúdo
  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-brand-yellow animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-2">Gerando Conteúdo</h3>
            <p className="text-gray-400 mb-6">{generationStatus}</p>

            {/* Progress bar */}
            <div className="w-full bg-brand-dark rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-yellow to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-brand-yellow font-bold">{Math.round(generationProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem conteúdo - mostrar tela de geração
  if (!content && !loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white uppercase">Gerar Conteúdo</h3>
              <p className="text-gray-500 text-sm mt-1">
                {missao.materia} {missao.assunto && `- ${missao.assunto}`}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-300 mb-2">
                Esta missão ainda não possui conteúdo gerado.
              </p>
              <p className="text-gray-500 text-sm">
                Deseja gerar o conteúdo de estudo com base nas questões filtradas?
              </p>
            </div>

            {/* Preview das questões */}
            {loadingQuestions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
              </div>
            ) : questions.length > 0 ? (
              <div className="bg-brand-dark border border-white/10 rounded-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-bold text-sm uppercase">Questões que serão usadas como base</h4>
                  <span className="text-brand-yellow text-sm font-bold">{questionsCount} questões</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex items-start gap-2 p-2 bg-white/5 rounded">
                      <span className="flex-shrink-0 w-5 h-5 bg-brand-yellow/20 text-brand-yellow rounded flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-gray-400 text-xs line-clamp-2">{q.enunciado}</p>
                    </div>
                  ))}
                  {questionsCount > 5 && (
                    <p className="text-gray-500 text-xs text-center pt-2">
                      + {questionsCount - 5} outras questões
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-sm mb-6">
                <p className="text-orange-400 text-sm">
                  Nenhum filtro de questões configurado para esta missão.
                  O conteúdo será gerado apenas com base na matéria e assunto.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-white/10 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleGenerateContent()}
              className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Conteúdo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar conteúdo existente com opção de regenerar
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-3xl rounded-sm my-8 max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">Conteúdo da Missão</h3>
            <p className="text-gray-500 text-sm mt-1">
              {missao.materia} {missao.assunto && `- ${missao.assunto}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 pb-24">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              <p className="text-gray-400">Carregando conteúdo...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {content && !loading && (
            <div className="space-y-6">
              {/* Audio Player */}
              {content.audioUrl && (
                <div className="bg-brand-dark border border-white/10 rounded-sm p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="text-white font-medium">Áudio da Aula</p>
                      <p className="text-gray-500 text-sm">Clique para ouvir o conteúdo narrado</p>
                    </div>
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  </div>
                  <audio
                    ref={audioRef}
                    src={content.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                  />
                </div>
              )}

              {/* Texto Content */}
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content.texto}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal de instruções para regenerar */}
        {showRegenerateInput && (
          <div className="absolute inset-x-0 bottom-0 bg-brand-dark border-t border-white/10 p-6 shadow-xl">
            <div className="mb-4">
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                Instruções para regeneração (opcional)
              </label>
              <textarea
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
                className="w-full bg-brand-card border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                rows={3}
                placeholder="Ex: Adicione mais exemplos práticos, foque mais em jurisprudência, etc."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRegenerateInput(false)}
                className="px-4 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleGenerateContent(regenerateInstructions)}
                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Regenerar
              </button>
            </div>
          </div>
        )}

        {/* Botão flutuante para regenerar */}
        {content && !showRegenerateInput && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setShowRegenerateInput(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 font-bold uppercase text-sm rounded-full shadow-lg transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Gerar Novo Conteúdo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MODAL DE PREVIEW DE QUESTÕES
// ============================================================================

interface QuestionsPreviewModalProps {
  missao: Missao;
  onClose: () => void;
}

const QuestionsPreviewModal: React.FC<QuestionsPreviewModalProps> = ({ missao, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar filtros da missão
        const filtros = await missoesService.getQuestaoFiltros(missao.id);

        if (!filtros || !filtros.filtros) {
          setError('Nenhum filtro de questões configurado para esta missão.');
          return;
        }

        const filters: QuestionFilters = {
          materias: filtros.filtros.materias || [],
          assuntos: filtros.filtros.assuntos || [],
          bancas: filtros.filtros.bancas || [],
          orgaos: filtros.filtros.orgaos || [],
          anos: filtros.filtros.anos || [],
          escolaridade: filtros.filtros.escolaridade || [],
          modalidade: filtros.filtros.modalidade || [],
        };

        // Buscar questões com paginação
        const { questions: qs, error: fetchError } = await getQuestionsForFilters(filters, {
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        });

        if (fetchError) {
          setError(fetchError);
          return;
        }

        setQuestions(qs);
        setTotalCount(filtros.questoes_count || 0);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar questões');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [missao.id, page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const truncateText = (text: string, maxLines: number = 3) => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      const words = text.split(' ');
      if (words.length > 50) {
        return words.slice(0, 50).join(' ') + '...';
      }
      return text;
    }
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-4xl rounded-sm my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">Questões da Missão</h3>
            <p className="text-gray-500 text-sm mt-1">
              {missao.materia} {missao.assunto && `- ${missao.assunto}`}
              {totalCount > 0 && (
                <span className="text-brand-yellow ml-2">({totalCount} questões)</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              <p className="text-gray-400">Carregando questões...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="text-center py-12">
              <ListChecks className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma questão encontrada com os filtros configurados.</p>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((q, index) => {
                const isExpanded = expandedId === q.id;
                const questionNumber = (page - 1) * ITEMS_PER_PAGE + index + 1;

                return (
                  <div
                    key={q.id}
                    className="bg-brand-dark border border-white/10 rounded-sm overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-yellow/20 text-brand-yellow rounded flex items-center justify-center font-bold text-sm">
                        {questionNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {q.banca && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold uppercase rounded">
                              {q.banca}
                            </span>
                          )}
                          {q.ano && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                              {q.ano}
                            </span>
                          )}
                          {q.materia && (
                            <span className="text-gray-500 text-xs truncate">{q.materia}</span>
                          )}
                        </div>
                        <p className={`text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {isExpanded ? q.enunciado : truncateText(q.enunciado)}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/5">
                        {/* Full enunciado */}
                        <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">
                          {q.enunciado}
                        </p>

                        {/* Alternativas */}
                        <div className="space-y-2">
                          {Object.entries(q.alternativas || {}).map(([letra, texto]) => {
                            if (!texto) return null;
                            const isCorrect = q.gabarito?.toLowerCase() === letra.toLowerCase();
                            return (
                              <div
                                key={letra}
                                className={`flex items-start gap-2 p-2 rounded ${isCorrect
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-white/5'
                                  }`}
                              >
                                <span
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-700 text-gray-300'
                                    }`}
                                >
                                  {letra.toUpperCase()}
                                </span>
                                <span className={`text-sm ${isCorrect ? 'text-green-300' : 'text-gray-400'}`}>
                                  {texto}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Comentário */}
                        {q.comentario && (
                          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                            <p className="text-blue-400 text-xs font-bold uppercase mb-1">Comentário:</p>
                            <p className="text-blue-300/80 text-sm">{q.comentario}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 flex-shrink-0">
          <div className="text-gray-500 text-sm">
            Página {page} de {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-brand-dark border border-white/10 text-gray-400 font-bold text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-brand-dark border border-white/10 text-gray-400 font-bold text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-brand-yellow text-brand-darker font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors ml-2"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de Criar/Editar Missao (Wizard de 2 etapas)
interface MissaoModalProps {
  preparatorioId: string;
  rodadaId: string;
  preparatorio: Preparatorio;
  missao: Missao | null;
  nextNumero: string;
  onClose: () => void;
  onSave: () => void;
}

interface FiltrosSugeridos {
  materias: string[];
  assuntos: string[];
  bancas: string[];
  escolaridade?: string[];
  modalidade?: string[];
}

const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

const MissaoModal: React.FC<MissaoModalProps> = ({ preparatorioId, rodadaId, preparatorio, missao, nextNumero, onClose, onSave }) => {
  // Etapa do wizard (1 = dados da missao, 2 = filtros de questoes)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedMissaoId, setSavedMissaoId] = useState<string | null>(missao?.id || null);

  const [formData, setFormData] = useState({
    numero: missao?.numero ?? nextNumero,
    tipo: missao?.tipo ?? 'estudo' as MissaoTipo,
    materia: missao?.materia || '',
    assunto: missao?.assunto || '',
    instrucoes: missao?.instrucoes || '',
    tema: missao?.tema || '',
    acao: missao?.acao || '',
    extra: missao?.extra || [],
    obs: missao?.obs || '',
    ordem: missao?.ordem ?? parseInt(nextNumero),
    gerar_imagem: missao?.gerar_imagem ?? true
  });

  // Estado para topicos do edital
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedEditalItemIds, setSelectedEditalItemIds] = useState<string[]>([]);
  const [selectedEditalItems, setSelectedEditalItems] = useState<EditalItem[]>([]);
  const [usedEditalItemIds, setUsedEditalItemIds] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Estado para dropdown de matérias do edital
  const [materiasEdital, setMateriasEdital] = useState<EditalItem[]>([]);
  const [showMateriaDropdown, setShowMateriaDropdown] = useState(false);
  const [materiaFilter, setMateriaFilter] = useState('');

  // Estado para filtros de questoes
  const [existingFiltros, setExistingFiltros] = useState<MissaoQuestaoFiltros | null>(null);
  const [questoesCount, setQuestoesCount] = useState<number>(0);

  // Estado para sugestao de filtros por IA
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  const [filtrosSugeridos, setFiltrosSugeridos] = useState<FiltrosSugeridos | null>(null);
  const [observacoesSugestao, setObservacoesSugestao] = useState<string[]>([]);
  const [questoesDisponiveisSugestao, setQuestoesDisponiveisSugestao] = useState<number>(0);

  // Estado para filtros herdados dos itens do edital
  const [filtrosHerdados, setFiltrosHerdados] = useState<FiltrosSugeridos | null>(null);

  // Estado para multi-turma
  const [multiTurmaMode, setMultiTurmaMode] = useState(false);
  const [allPreparatorios, setAllPreparatorios] = useState<PreparatorioWithRodadas[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<MultiTurmaTarget[]>([]);
  const [loadingPreparatorios, setLoadingPreparatorios] = useState(false);
  const [cloningResults, setCloningResults] = useState<{
    success: number;
    errors: string[];
    editalWarnings: { preparatorio: string; items: string[] }[];
  } | null>(null);

  // Função para agregar filtros de múltiplos itens do edital
  // Agora também herda filtro_materias do item pai (matéria) se o próprio item não tiver
  const agregarFiltrosEdital = (items: EditalItem[]): FiltrosSugeridos | null => {
    console.log('[agregarFiltrosEdital] Items recebidos:', items.length);
    if (items.length === 0) return null;

    const materias = new Set<string>();
    const assuntos = new Set<string>();

    // Criar mapa de matérias por ID para lookup rápido
    const materiasMap = new Map<string, EditalItem>();
    materiasEdital.forEach(m => materiasMap.set(m.id, m));

    items.forEach(item => {
      console.log('[agregarFiltrosEdital] Item:', item.titulo, '| filtro_materias:', item.filtro_materias, '| filtro_assuntos:', item.filtro_assuntos);

      // Adicionar filtros de matérias
      if (item.filtro_materias && item.filtro_materias.length > 0) {
        item.filtro_materias.forEach(m => materias.add(m));
      } else if (item.parent_id) {
        // Se não tem filtro_materias próprio, tentar herdar do pai (matéria)
        const parentMateria = materiasMap.get(item.parent_id);
        if (parentMateria?.filtro_materias && parentMateria.filtro_materias.length > 0) {
          console.log('[agregarFiltrosEdital] Herdando filtro_materias do pai:', parentMateria.titulo, parentMateria.filtro_materias);
          parentMateria.filtro_materias.forEach(m => materias.add(m));
        }
      }

      // Adicionar filtros de assuntos
      if (item.filtro_assuntos && item.filtro_assuntos.length > 0) {
        item.filtro_assuntos.forEach(a => assuntos.add(a));
      }
    });

    console.log('[agregarFiltrosEdital] Materias agregadas:', Array.from(materias));
    console.log('[agregarFiltrosEdital] Assuntos agregados:', Array.from(assuntos));

    // Se não há filtros configurados, retornar null
    if (materias.size === 0 && assuntos.size === 0) {
      console.log('[agregarFiltrosEdital] Retornando null - sem filtros');
      return null;
    }

    const result = {
      materias: Array.from(materias),
      assuntos: Array.from(assuntos),
      bancas: [], // Pode ser preenchido pelo preparatório depois
    };
    console.log('[agregarFiltrosEdital] Retornando filtros:', result);
    return result;
  };

  // Carregar topicos ja vinculados a esta missao e topicos ja usados
  useEffect(() => {
    const loadTopics = async () => {
      if (!preparatorioId) return;
      setLoadingTopics(true);
      try {
        // Carregar topicos ja usados em outras missoes
        const usedIds = await missoesService.getUsedEditalItemIds(preparatorioId);
        setUsedEditalItemIds(usedIds);

        // Carregar todas as matérias do edital para o dropdown
        const allItems = await editalService.getByPreparatorio(preparatorioId);
        const materias = allItems.filter(item => item.tipo === 'materia');
        setMateriasEdital(materias);

        // Se estiver editando, carregar topicos desta missao
        if (missao) {
          const itemIds = await missoesService.getEditalItems(missao.id);
          setSelectedEditalItemIds(itemIds);

          // Carregar detalhes dos itens selecionados
          if (itemIds.length > 0) {
            const items = await Promise.all(
              itemIds.map(id => editalService.getById(id))
            );
            const validItems = items.filter((i): i is EditalItem => i !== null);
            setSelectedEditalItems(validItems);

            // Calcular filtros herdados dos itens
            const filtrosHerdadosCalculados = agregarFiltrosEdital(validItems);
            setFiltrosHerdados(filtrosHerdadosCalculados);
          }

          // Carregar filtros de questoes existentes
          const filtros = await missoesService.getQuestaoFiltros(missao.id);
          if (filtros) {
            setExistingFiltros(filtros);
            setQuestoesCount(filtros.questoes_count);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar topicos:', error);
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [preparatorioId, missao]);

  // Carregar todos os preparatórios quando multi-turma é ativado
  useEffect(() => {
    const loadAllPreparatorios = async () => {
      if (!multiTurmaMode || allPreparatorios.length > 0) return;

      setLoadingPreparatorios(true);
      try {
        const preps = await missoesService.getAllPreparatoriosWithRodadas();
        setAllPreparatorios(preps);
      } catch (error) {
        console.error('Erro ao carregar preparatórios:', error);
      } finally {
        setLoadingPreparatorios(false);
      }
    };

    loadAllPreparatorios();
  }, [multiTurmaMode]);

  const handleTopicsConfirm = async (ids: string[]) => {
    setSelectedEditalItemIds(ids);
    setShowTopicSelector(false);

    // Carregar detalhes dos itens selecionados
    if (ids.length > 0) {
      const items = await Promise.all(
        ids.map(id => editalService.getById(id))
      );
      const validItems = items.filter((i): i is EditalItem => i !== null);
      setSelectedEditalItems(validItems);

      // Agregar filtros dos itens selecionados
      const filtros = agregarFiltrosEdital(validItems);
      setFiltrosHerdados(filtros);
    } else {
      setSelectedEditalItems([]);
      setFiltrosHerdados(null);
    }
  };

  const removeEditalItem = (id: string) => {
    setSelectedEditalItemIds(prev => prev.filter(i => i !== id));
    const newItems = selectedEditalItems.filter(i => i.id !== id);
    setSelectedEditalItems(newItems);

    // Recalcular filtros herdados
    const filtros = agregarFiltrosEdital(newItems);
    setFiltrosHerdados(filtros);
  };

  // Salvar dados da missao e avancar para etapa 2
  const handleSaveAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tipos que usam campos de estudo (materia, assunto, instrucoes)
      const isTipoEstudo = formData.tipo === 'padrao' || formData.tipo === 'estudo';

      const data = {
        numero: formData.numero,
        tipo: formData.tipo,
        materia: isTipoEstudo ? formData.materia || null : null,
        assunto: isTipoEstudo ? formData.assunto || null : null,
        instrucoes: isTipoEstudo ? formData.instrucoes || null : null,
        tema: formData.tipo === 'revisao' || isTipoEstudo ? formData.tema || null : null,
        acao: formData.tipo === 'acao' ? formData.acao || null : null,
        extra: formData.extra.length > 0 ? formData.extra : null,
        obs: formData.obs || null,
        ordem: formData.ordem
      };

      let missaoId = savedMissaoId;

      if (missao) {
        await missoesService.update(missao.id, data);
        missaoId = missao.id;
      } else {
        const created = await missoesService.create({
          rodada_id: rodadaId,
          ...data
        });
        missaoId = created.id;
      }

      setSavedMissaoId(missaoId);

      // Salvar vinculos com topicos do edital
      if (missaoId && isTipoEstudo) {
        await missoesService.setEditalItems(missaoId, selectedEditalItemIds);
      }

      // Se for tipo estudo, verificar filtros herdados ou buscar sugestao com IA
      if (isTipoEstudo) {
        // Recalcular filtros herdados dos itens selecionados
        const filtrosDoEdital = agregarFiltrosEdital(selectedEditalItems);
        setFiltrosHerdados(filtrosDoEdital);

        // Se há filtros herdados dos itens do edital, usar eles diretamente
        if (filtrosDoEdital && (filtrosDoEdital.materias.length > 0 || filtrosDoEdital.assuntos.length > 0)) {
          // Nota: Removido auto-add de matérias e bancas pois tornava a query muito restritiva
          // O usuário pode adicionar esses filtros manualmente se desejar

          setFiltrosSugeridos(filtrosDoEdital);
          setObservacoesSugestao(['Filtros herdados dos itens do edital selecionados']);
          setQuestoesDisponiveisSugestao(0); // Será calculado pelo QuestionFilterSelector
          setStep(2);
        } else {
          // Se não há filtros herdados, buscar sugestão via IA (apenas se tiver matéria)
          if (formData.materia && formData.materia.trim()) {
            setLoadingSugestao(true);
            try {
              const response = await fetch(`${MASTRA_SERVER_URL}/api/missao/sugerir-filtros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  materiaEdital: formData.materia,
                  assuntoEdital: formData.assunto || undefined,
                  banca: (preparatorio as any).banca || undefined,
                  cargo: (preparatorio as any).cargo || undefined,
                  escolaridade: (preparatorio as any).escolaridade || undefined,
                }),
              });

              const result = await response.json();

              if (result.success) {
                setFiltrosSugeridos(result.filtrosSugeridos);
                setObservacoesSugestao(result.observacoes || []);
                setQuestoesDisponiveisSugestao(result.questoesDisponiveis || 0);
              }
            } catch (err) {
              console.error('Erro ao buscar sugestao de filtros:', err);
              // Continua mesmo se falhar - usuario pode configurar manualmente
            } finally {
              setLoadingSugestao(false);
            }
          }

          setStep(2);
        }
      } else {
        // Se nao for tipo estudo, finalizar
        onSave();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar missao');
    } finally {
      setLoading(false);
    }
  };

  // Salvar filtros de questoes
  const handleSaveFilters = async (filters: QuestionFilters, count: number) => {
    if (!savedMissaoId) return;

    try {
      const filtrosData: QuestaoFiltrosData = {
        materias: filters.materias,
        assuntos: filters.assuntos,
        bancas: filters.bancas,
        banca_ids: filters.banca_ids, // IDs para filtragem eficiente
        orgaos: filters.orgaos,
        anos: filters.anos,
        escolaridade: filters.escolaridade,
        modalidade: filters.modalidade,
      };

      await missoesService.setQuestaoFiltros(savedMissaoId, filtrosData, count);

      // Se multi-turma estiver ativado, clonar para os targets selecionados
      if (multiTurmaMode && selectedTargets.length > 0) {
        const isTipoEstudo = formData.tipo === 'padrao' || formData.tipo === 'estudo';
        const missaoData = {
          numero: formData.numero,
          tipo: formData.tipo,
          materia: isTipoEstudo ? formData.materia || null : null,
          assunto: isTipoEstudo ? formData.assunto || null : null,
          instrucoes: isTipoEstudo ? formData.instrucoes || null : null,
          tema: formData.tipo === 'revisao' || isTipoEstudo ? formData.tema || null : null,
          acao: formData.tipo === 'acao' ? formData.acao || null : null,
          extra: formData.extra.length > 0 ? formData.extra : null,
          obs: formData.obs || null,
          ordem: formData.ordem
        };

        // Obter títulos dos itens do edital selecionados
        const editalItemTitulos = selectedEditalItems.map(item => item.titulo);

        const result = await missoesService.cloneToMultipleRodadas(
          missaoData,
          filtrosData,
          count,
          selectedTargets,
          editalItemTitulos
        );

        // Coletar avisos sobre itens do edital não encontrados
        const editalWarnings: { preparatorio: string; items: string[] }[] = [];
        for (const successResult of result.success) {
          if (successResult.unmatchedEditalItems && successResult.unmatchedEditalItems.length > 0) {
            editalWarnings.push({
              preparatorio: successResult.preparatorioNome,
              items: successResult.unmatchedEditalItems
            });
          }
        }

        // Se houver erros ou avisos, mostrar popup
        if (result.errors.length > 0 || editalWarnings.length > 0) {
          setCloningResults({
            success: result.success.length,
            errors: result.errors.map(e => `${e.preparatorioNome}: ${e.error}`),
            editalWarnings
          });
          // Mostrar resultado (não fechar modal se houver erros críticos)
          if (result.errors.length > 0) {
            return;
          }
        } else {
          // Sucesso total sem avisos
          alert(`Missão criada com sucesso em ${result.success.length + 1} preparatórios!`);
        }
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
      alert('Erro ao salvar filtros de questoes');
    }
  };

  // Pular etapa de filtros
  const handleSkipFilters = async () => {
    // Se multi-turma estiver ativado, clonar para os targets (sem filtros)
    if (multiTurmaMode && selectedTargets.length > 0) {
      const isTipoEstudo = formData.tipo === 'padrao' || formData.tipo === 'estudo';
      const missaoData = {
        numero: formData.numero,
        tipo: formData.tipo,
        materia: isTipoEstudo ? formData.materia || null : null,
        assunto: isTipoEstudo ? formData.assunto || null : null,
        instrucoes: isTipoEstudo ? formData.instrucoes || null : null,
        tema: formData.tipo === 'revisao' || isTipoEstudo ? formData.tema || null : null,
        acao: formData.tipo === 'acao' ? formData.acao || null : null,
        extra: formData.extra.length > 0 ? formData.extra : null,
        obs: formData.obs || null,
        ordem: formData.ordem
      };

      // Obter títulos dos itens do edital selecionados
      const editalItemTitulos = selectedEditalItems.map(item => item.titulo);

      try {
        const result = await missoesService.cloneToMultipleRodadas(
          missaoData,
          null,
          0,
          selectedTargets,
          editalItemTitulos
        );

        // Coletar avisos sobre itens do edital não encontrados
        const editalWarnings: { preparatorio: string; items: string[] }[] = [];
        for (const successResult of result.success) {
          if (successResult.unmatchedEditalItems && successResult.unmatchedEditalItems.length > 0) {
            editalWarnings.push({
              preparatorio: successResult.preparatorioNome,
              items: successResult.unmatchedEditalItems
            });
          }
        }

        // Se houver erros ou avisos, mostrar popup
        if (result.errors.length > 0 || editalWarnings.length > 0) {
          setCloningResults({
            success: result.success.length,
            errors: result.errors.map(e => `${e.preparatorioNome}: ${e.error}`),
            editalWarnings
          });
          if (result.errors.length > 0) {
            return;
          }
        } else {
          alert(`Missão criada com sucesso em ${result.success.length + 1} preparatórios!`);
        }
      } catch (error) {
        console.error('Erro ao clonar missões:', error);
        alert('Erro ao clonar missões');
        return;
      }
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm my-8">
        {/* Header com indicador de etapa */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">
              {missao ? 'Editar Missao' : 'Nova Missao'}
            </h3>
            {(formData.tipo === 'padrao' || formData.tipo === 'estudo') && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 text-xs ${step === 1 ? 'text-brand-yellow' : 'text-gray-500'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${step === 1 ? 'border-brand-yellow bg-brand-yellow/20' : 'border-gray-600'}`}>1</span>
                  <span>Dados</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <div className={`flex items-center gap-1 text-xs ${step === 2 ? 'text-brand-yellow' : 'text-gray-500'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${step === 2 ? 'border-brand-yellow bg-brand-yellow/20' : 'border-gray-600'}`}>2</span>
                  <span>Questoes</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Etapa 1: Dados da Missao */}
        {step === 1 && (
          <form onSubmit={handleSaveAndNext} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Numero *</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                  placeholder="Ex: 1, 10, 10,20"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as MissaoTipo })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                >
                  <option value="estudo">Estudo</option>
                  <option value="revisao">Revisao</option>
                  <option value="acao">Acao</option>
                  <option value="tecnicas">Tecnicas</option>
                  <option value="simulado">Simulado</option>
                </select>
              </div>
            </div>

            {/* Campos para tipo PADRAO ou ESTUDO */}
            {(formData.tipo === 'padrao' || formData.tipo === 'estudo') && (
              <>
                {/* Assuntos do Edital */}
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                    Assuntos do Edital
                  </label>
                  <div className="bg-brand-dark border border-white/10 p-3">
                    {loadingTopics ? (
                      <p className="text-gray-500 text-sm">Carregando...</p>
                    ) : selectedEditalItems.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-3">Nenhum assunto selecionado</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedEditalItems.map(item => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand-yellow/20 text-brand-yellow text-sm rounded border border-brand-yellow/30"
                          >
                            <FileText className="w-3 h-3" />
                            {item.titulo}
                            <button
                              type="button"
                              onClick={() => removeEditalItem(item.id)}
                              className="ml-1 text-brand-yellow/70 hover:text-brand-yellow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTopicSelector(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Selecionar Assuntos do Edital
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Materia</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.materia}
                      onChange={(e) => {
                        setFormData({ ...formData, materia: e.target.value });
                        setMateriaFilter(e.target.value);
                        setShowMateriaDropdown(true);
                      }}
                      onFocus={() => setShowMateriaDropdown(true)}
                      onBlur={() => setTimeout(() => setShowMateriaDropdown(false), 200)}
                      className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                      placeholder={materiasEdital.length > 0 ? "Selecione ou digite uma matéria..." : "Ex: Direito Constitucional"}
                    />
                    {showMateriaDropdown && materiasEdital.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-xl max-h-48 overflow-y-auto">
                        {materiasEdital
                          .filter(m =>
                            !formData.materia ||
                            m.titulo.toLowerCase().includes(formData.materia.toLowerCase())
                          )
                          .map(materia => (
                            <button
                              key={materia.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({ ...formData, materia: materia.titulo });
                                setShowMateriaDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${formData.materia === materia.titulo
                                  ? 'bg-brand-yellow/20 text-brand-yellow'
                                  : 'text-gray-300'
                                }`}
                            >
                              {materia.titulo}
                            </button>
                          ))
                        }
                        {formData.materia &&
                          !materiasEdital.some(m => m.titulo.toLowerCase() === formData.materia.toLowerCase()) && (
                            <div className="px-3 py-2 text-xs text-gray-500 border-t border-white/10">
                              Pressione Enter para usar: "{formData.materia}"
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                  {materiasEdital.length === 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Nenhuma matéria cadastrada no edital. Digite o nome da matéria.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Assunto</label>
                  <textarea
                    value={formData.assunto}
                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Ex: Direitos e deveres individuais e coletivos"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Instrucoes</label>
                  <textarea
                    value={formData.instrucoes}
                    onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                    rows={2}
                    placeholder="Ex: Estudar a teoria pontual e resolver a lista de questoes."
                  />
                </div>
              </>
            )}

            {/* Campo para tipo REVISAO ou adicional do ESTUDO */}
            {(formData.tipo === 'revisao' || formData.tipo === 'padrao' || formData.tipo === 'estudo') && (
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  {formData.tipo === 'revisao' ? 'Tema da Revisao *' : 'Tema de Revisao (opcional)'}
                </label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                  placeholder="Ex: REVISAO OUSE PASSAR"
                  required={formData.tipo === 'revisao'}
                />
              </div>
            )}

            {/* Campo para tipo ACAO */}
            {formData.tipo === 'acao' && (
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Acao *</label>
                <textarea
                  value={formData.acao}
                  onChange={(e) => setFormData({ ...formData, acao: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                  rows={2}
                  placeholder="Ex: SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
                  required
                />
              </div>
            )}

            {/* Observacao */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Observacao (opcional)</label>
              <input
                type="text"
                value={formData.obs}
                onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                placeholder="Ex: o aluno deve escolher entre Ingles ou Espanhol."
              />
            </div>

            {/* Toggle Gerar Imagem (apenas para tipos estudo/padrao) */}
            {(formData.tipo === 'padrao' || formData.tipo === 'estudo') && (
              <div className="border border-white/10 rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gerar_imagem: !formData.gerar_imagem })}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${formData.gerar_imagem ? 'bg-purple-500/10' : 'bg-brand-dark hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.gerar_imagem ? 'bg-purple-500' : 'bg-gray-600'
                      }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${formData.gerar_imagem ? 'right-0.5' : 'left-0.5'
                        }`} />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-medium">Gerar imagens com IA</span>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Inclui infográficos e ilustrações demonstrativas no conteúdo
                      </p>
                    </div>
                  </div>
                  <ImageIcon className={`w-5 h-5 ${formData.gerar_imagem ? 'text-purple-400' : 'text-gray-500'}`} />
                </button>
              </div>
            )}

            {/* Toggle Multi-Turma (apenas para novas missões) */}
            {!missao && (
              <div className="border border-white/10 rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMultiTurmaMode(!multiTurmaMode)}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${multiTurmaMode ? 'bg-[#FFB800]/10' : 'bg-brand-dark hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${multiTurmaMode ? 'bg-[#FFB800]' : 'bg-gray-600'
                      }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${multiTurmaMode ? 'right-0.5' : 'left-0.5'
                        }`} />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-medium">Criar em múltiplos preparatórios</span>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Aplica esta missão em outros preparatórios simultaneamente
                      </p>
                    </div>
                  </div>
                  <Copy className={`w-5 h-5 ${multiTurmaMode ? 'text-[#FFB800]' : 'text-gray-500'}`} />
                </button>

                {/* Multi-Turma Selector */}
                {multiTurmaMode && (
                  <div className="p-4 border-t border-white/10 bg-[#1A1A1A]">
                    <MultiTurmaSelector
                      currentPreparatorioId={preparatorioId}
                      preparatorios={allPreparatorios}
                      selectedTargets={selectedTargets}
                      onTargetsChange={setSelectedTargets}
                      loading={loadingPreparatorios}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Resultado do clonamento (se houver erros ou avisos) */}
            {cloningResults && (
              <div className="space-y-3">
                {/* Erros críticos */}
                {cloningResults.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
                    <p className="text-red-400 font-medium mb-2">
                      Erros ao criar em alguns preparatórios:
                    </p>
                    <ul className="text-red-300 text-sm space-y-1">
                      {cloningResults.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Avisos sobre edital não encontrado */}
                {cloningResults.editalWarnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-sm">
                    <p className="text-yellow-400 font-medium mb-2">
                      Assuntos do edital não encontrados:
                    </p>
                    <p className="text-yellow-300/70 text-xs mb-3">
                      Os seguintes itens do edital não foram encontrados nos preparatórios de destino e precisam ser configurados manualmente:
                    </p>
                    <div className="space-y-3">
                      {cloningResults.editalWarnings.map((warning, i) => (
                        <div key={i} className="bg-yellow-500/5 p-2 rounded">
                          <p className="text-yellow-400 text-sm font-medium mb-1">
                            {warning.preparatorio}:
                          </p>
                          <ul className="text-yellow-300/80 text-xs space-y-0.5 pl-3">
                            {warning.items.map((item, j) => (
                              <li key={j}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sucesso parcial ou total */}
                {cloningResults.success > 0 && (
                  <p className="text-green-400 text-sm">
                    ✓ Missão criada com sucesso em {cloningResults.success} preparatório(s)
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCloningResults(null);
                    onSave();
                  }}
                  className="mt-2 px-4 py-1.5 bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                >
                  {cloningResults.errors.length > 0 ? 'Fechar' : 'Continuar'}
                </button>
              </div>
            )}

            {/* Indicador de filtros existentes */}
            {existingFiltros && questoesCount > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 flex items-center gap-3">
                <Filter className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">
                    Filtros de questoes configurados
                  </p>
                  <p className="text-blue-400/70 text-xs">
                    {questoesCount} questoes vinculadas a esta missao
                  </p>
                </div>
              </div>
            )}

            {/* Observações de adaptação da IA */}
            {existingFiltros?.adaptacoes_observacoes && (
              <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 text-xs font-bold uppercase">Adaptações da IA:</span>
                </div>
                <p className="text-purple-300 text-sm mt-1 whitespace-pre-wrap">
                  {existingFiltros.adaptacoes_observacoes}
                </p>
                {existingFiltros.otimizado_por_ia && (
                  <p className="text-purple-400/60 text-xs mt-2 italic">
                    Filtros otimizados automaticamente pela IA
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  'Salvando...'
                ) : (formData.tipo === 'padrao' || formData.tipo === 'estudo') ? (
                  <>
                    Proximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {missao ? 'Salvar' : 'Criar'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Etapa 2: Filtros de Questoes */}
        {step === 2 && (
          <div className="flex flex-col">
            {/* Botao de voltar */}
            <div className="px-6 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-gray-500 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para dados da missao
              </button>
            </div>

            {/* Loading da sugestao */}
            {loadingSugestao && (
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Analisando filtros com IA...</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Buscando correspondência entre "{formData.materia}" e o banco de questões
                  </p>
                </div>
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            )}

            {/* Seletor de filtros */}
            {!loadingSugestao && (
              <QuestionFilterSelector
                initialFilters={
                  // Prioridade: filtros existentes > filtros sugeridos pela IA
                  existingFiltros?.filtros as QuestionFilters ||
                  (filtrosSugeridos ? {
                    materias: filtrosSugeridos.materias,
                    assuntos: filtrosSugeridos.assuntos,
                    bancas: filtrosSugeridos.bancas,
                    escolaridade: filtrosSugeridos.escolaridade,
                    modalidade: filtrosSugeridos.modalidade,
                  } as QuestionFilters : undefined)
                }
                onSave={handleSaveFilters}
                onCancel={handleSkipFilters}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Selecao de Topicos */}
      {showTopicSelector && (
        <EditalTopicSelector
          preparatorioId={preparatorioId}
          selectedIds={selectedEditalItemIds}
          usedIds={usedEditalItemIds}
          currentMissaoId={missao?.id}
          onClose={() => setShowTopicSelector(false)}
          onConfirm={handleTopicsConfirm}
        />
      )}
    </div>
  );
};
