import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Sparkles, Loader2, Volume2, Play, Pause, RotateCcw } from 'lucide-react';
import { Tables } from '../../../lib/database.types';
import { missoesService } from '../../../services/preparatoriosService';
import { QuestionFilters, getQuestionsForFilters, ExternalQuestion } from '../../../services/externalQuestionsService';
import { supabase } from '../../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Missao = Tables<'missoes'>;

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL
  ? import.meta.env.VITE_MASTRA_URL
  : 'http://localhost:4000';

interface ContentPreviewModalProps {
  missao: Missao;
  hasContent: boolean;
  onClose: () => void;
  onContentGenerated: () => void;
}

export const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({ missao, hasContent, onClose, onContentGenerated }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<{ texto: string; audioUrl: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Estados para geracao
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');

  // Estados para questoes preview
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);

  // Carregar conteudo existente
  useEffect(() => {
    const loadContent = async () => {
      if (!hasContent) {
        // Se nao tem conteudo, carregar as questoes para mostrar na tela de geracao
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
          setError(`Conteudo em processamento (status: ${data.status})`);
          return;
        }

        setContent({
          texto: data.texto_content || '',
          audioUrl: data.audio_url
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar conteudo');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [missao.id, hasContent]);

  // Carregar preview das questoes
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
        banca_ids: filtros.filtros.banca_ids || [],
        orgaos: filtros.filtros.orgaos || [],
        anos: filtros.filtros.anos || [],
        escolaridade: filtros.filtros.escolaridade || [],
        modalidade: filtros.filtros.modalidade || [],
      };

      setQuestionsCount(filtros.questoes_count || 0);

      // Carregar apenas 5 questoes para preview
      const { questions: qs } = await getQuestionsForFilters(filters, {
        limit: 5,
        offset: 0,
      });

      setQuestions(qs);
    } catch (err) {
      console.error('Erro ao carregar questoes:', err);
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

  // Gerar conteudo
  const handleGenerateContent = async (instructions?: string) => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus('Iniciando geracao...');
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

      // Buscar filtros da missao para obter as questoes
      setGenerationStatus('Buscando questoes da missao...');
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
          gerarImagem: missao.gerar_imagem ?? false,
        }),
      });

      setGenerationStatus('Gerando conteudo com IA...');
      setGenerationProgress(50);

      const result = await response.json();

      clearInterval(progressInterval);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar conteudo');
      }

      setGenerationStatus('Salvando conteudo...');
      setGenerationProgress(80);

      // Se tem audio, aguardar geracao
      if (result.audioProcessing) {
        setGenerationStatus('Gerando audio (pode levar alguns minutos)...');
      }

      setGenerationProgress(100);
      setGenerationStatus('Conteudo gerado com sucesso!');

      // Atualizar o conteudo localmente com o texto
      setContent({
        texto: result.texto || '',
        audioUrl: result.audioUrl || null
      });

      // Notificar que o conteudo foi gerado
      onContentGenerated();

      // Pequeno delay para mostrar mensagem de sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsGenerating(false);

      // Se o audio esta sendo processado em background, fazer polling para atualizar
      if (result.audioProcessing) {
        let pollCount = 0;
        const maxPolls = 30; // Max 1.5 minutos (30 * 3s)

        const pollForAudio = async () => {
          try {
            const { data } = await supabase
              .from('missao_conteudos')
              .select('texto_content, audio_url')
              .eq('missao_id', missao.id)
              .single();

            if (data?.audio_url) {
              setContent({
                texto: data.texto_content || result.texto || '',
                audioUrl: data.audio_url
              });
              console.log('[ContentPreview] Audio carregado:', data.audio_url);
              return; // Stop polling
            }

            pollCount++;
            if (pollCount < maxPolls) {
              setTimeout(pollForAudio, 3000);
            }
          } catch (err) {
            console.warn('[ContentPreview] Erro ao fazer polling de audio:', err);
          }
        };

        // Iniciar polling apos 5 segundos
        setTimeout(pollForAudio, 5000);
      }

    } catch (err: any) {
      console.error('Erro ao gerar conteudo:', err);
      setError(err.message || 'Erro ao gerar conteudo');
      setIsGenerating(false);
    }
  };

  // Se esta gerando conteudo
  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-brand-card border border-white/10 w-full max-w-lg rounded-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-brand-yellow animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-2">Gerando Conteudo</h3>
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

  // Se nao tem conteudo - mostrar tela de geracao
  if (!content && !loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white uppercase">Gerar Conteudo</h3>
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
                Esta missao ainda nao possui conteudo gerado.
              </p>
              <p className="text-gray-500 text-sm">
                Deseja gerar o conteudo de estudo com base nas questoes filtradas?
              </p>
            </div>

            {/* Preview das questoes */}
            {loadingQuestions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
              </div>
            ) : questions.length > 0 ? (
              <div className="bg-brand-dark border border-white/10 rounded-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-bold text-sm uppercase">Questoes que serao usadas como base</h4>
                  <span className="text-brand-yellow text-sm font-bold">{questionsCount} questoes</span>
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
                      + {questionsCount - 5} outras questoes
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-sm mb-6">
                <p className="text-orange-400 text-sm">
                  Nenhum filtro de questoes configurado para esta missao.
                  O conteudo sera gerado apenas com base na materia e assunto.
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
              Gerar Conteudo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar conteudo existente com opcao de regenerar
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-4xl rounded-sm my-8 max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">Conteudo da Missao</h3>
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
              <p className="text-gray-400">Carregando conteudo...</p>
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
                      <p className="text-white font-medium">Audio da Aula</p>
                      <p className="text-gray-500 text-sm">Clique para ouvir o conteudo narrado</p>
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

              {/* Texto Content - Formatacao completa */}
              <div className="mission-content-preview">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: (props: any) => (
                      <h1 className="text-2xl font-bold text-brand-yellow mt-6 mb-4">{props.children}</h1>
                    ),
                    h2: (props: any) => (
                      <h2 className="text-xl font-bold text-brand-yellow mt-5 mb-3">{props.children}</h2>
                    ),
                    h3: (props: any) => (
                      <h3 className="text-lg font-semibold text-brand-yellow mt-4 mb-2">{props.children}</h3>
                    ),
                    h4: (props: any) => (
                      <h4 className="text-base font-semibold text-white mt-3 mb-2">{props.children}</h4>
                    ),
                    p: (props: any) => (
                      <p className="text-gray-300 mb-4 leading-relaxed">{props.children}</p>
                    ),
                    ul: (props: any) => (
                      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300 ml-4">{props.children}</ul>
                    ),
                    ol: (props: any) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300 ml-4">{props.children}</ol>
                    ),
                    li: (props: any) => (
                      <li className="text-gray-300">{props.children}</li>
                    ),
                    blockquote: (props: any) => (
                      <blockquote className="border-l-4 border-brand-yellow pl-4 py-2 my-4 bg-brand-dark rounded-r-lg text-gray-400 italic">
                        {props.children}
                      </blockquote>
                    ),
                    strong: (props: any) => (
                      <strong className="font-semibold text-brand-yellow">{props.children}</strong>
                    ),
                    em: (props: any) => (
                      <em className="italic text-gray-400">{props.children}</em>
                    ),
                    a: (props: any) => (
                      <a href={props.href} className="text-brand-yellow hover:underline" target="_blank" rel="noopener noreferrer">
                        {props.children}
                      </a>
                    ),
                    hr: () => (
                      <hr className="border-white/10 my-6" />
                    ),
                    img: (props: any) => (
                      <figure className="my-6">
                        <img
                          src={props.src}
                          alt={props.alt || 'Imagem educacional'}
                          className="max-w-full h-auto rounded-lg border border-white/10 mx-auto"
                          style={{ maxHeight: '500px' }}
                        />
                        {props.alt && props.alt !== 'Imagem' && (
                          <figcaption className="text-center text-gray-500 text-sm mt-2 italic">
                            {props.alt}
                          </figcaption>
                        )}
                      </figure>
                    ),
                    code: (props: any) => {
                      const { className, children } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      const codeContent = String(children).replace(/\n$/, '');

                      if (language) {
                        return (
                          <pre className="bg-brand-dark rounded-lg p-4 overflow-x-auto my-4 border border-white/10">
                            <code className={`language-${language} text-sm text-gray-300`}>
                              {codeContent}
                            </code>
                          </pre>
                        );
                      }

                      return (
                        <code className="bg-brand-dark px-1.5 py-0.5 rounded text-brand-yellow text-sm font-mono">
                          {children}
                        </code>
                      );
                    },
                    table: (props: any) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                          {props.children}
                        </table>
                      </div>
                    ),
                    thead: (props: any) => (
                      <thead className="bg-brand-dark">{props.children}</thead>
                    ),
                    tbody: (props: any) => (
                      <tbody className="divide-y divide-white/10">{props.children}</tbody>
                    ),
                    tr: (props: any) => (
                      <tr className="hover:bg-white/5">{props.children}</tr>
                    ),
                    th: (props: any) => (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-brand-yellow border-b border-white/10">
                        {props.children}
                      </th>
                    ),
                    td: (props: any) => (
                      <td className="px-4 py-3 text-sm text-gray-300">{props.children}</td>
                    ),
                  }}
                >
                  {content.texto}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal de instrucoes para regenerar */}
        {showRegenerateInput && (
          <div className="absolute inset-x-0 bottom-0 bg-brand-dark border-t border-white/10 p-6 shadow-xl">
            <div className="mb-4">
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                Instrucoes para regeneracao (opcional)
              </label>
              <textarea
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
                className="w-full bg-brand-card border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors resize-none"
                rows={3}
                placeholder="Ex: Adicione mais exemplos praticos, foque mais em jurisprudencia, etc."
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

        {/* Botao flutuante para regenerar */}
        {content && !showRegenerateInput && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setShowRegenerateInput(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 font-bold uppercase text-sm rounded-full shadow-lg transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Gerar Novo Conteudo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
