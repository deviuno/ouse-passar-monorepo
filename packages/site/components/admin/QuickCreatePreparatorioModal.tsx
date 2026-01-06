import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Clock,
  ImageIcon,
  ArrowRight,
  Layers,
  Settings,
} from 'lucide-react';

interface QuickCreatePreparatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (preparatorioId: string) => void;
}

interface EtapaProgresso {
  etapa: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  detalhes?: string;
  progress?: number; // 0-100 para barra de progresso
  hidden?: boolean; // Etapas ocultas que ainda executam no backend
  serverProgress?: { current: number; total: number }; // Progresso real do servidor
}

interface ResultadoCriacao {
  success: boolean;
  preparatorio?: {
    id: string;
    slug: string;
    nome: string;
    banca?: string;
    orgao?: string;
    cargo?: string;
  };
  estatisticas?: {
    blocos: number;
    materias: number;
    topicos: number;
    subtopicos: number;
    rodadas?: number;
    missoes?: number;
    tempo_processamento_ms: number;
  };
  error?: string;
}

const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

export const QuickCreatePreparatorioModal: React.FC<QuickCreatePreparatorioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null);
  const [etapas, setEtapas] = useState<EtapaProgresso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Apenas arquivos PDF são permitidos');
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Apenas arquivos PDF são permitidos');
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setResultado(null);
    setEtapas([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTempo = (ms: number): string => {
    const segundos = Math.round(ms / 1000);
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${minutos}m ${seg}s`;
  };

  // Ref para controlar animação de progresso
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpar intervals ao desmontar
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Animar progresso da etapa atual
  const animateProgress = useCallback((etapaIndex: number, durationMs: number = 30000) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const startTime = Date.now();
    const updateInterval = 100; // Atualiza a cada 100ms

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Progresso vai de 0 a 95% (nunca chega a 100% até completar de verdade)
      const progress = Math.min(95, (elapsed / durationMs) * 100);

      setEtapas(prev => prev.map((e, idx) =>
        idx === etapaIndex ? { ...e, progress } : e
      ));

      if (progress >= 95) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, updateInterval);
  }, []);

  const handleProcessar = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResultado(null);

    // Inicializar 5 etapas visíveis (as ocultas são gerenciadas pelo servidor)
    const etapasBase: EtapaProgresso[] = [
      { etapa: 'Analisando PDF do edital', status: 'in_progress', progress: 0 },
      { etapa: 'Criando preparatório', status: 'pending', progress: 0 },
      { etapa: 'Gerando imagem de capa', status: 'pending', progress: 0 },
      { etapa: 'Criando edital verticalizado', status: 'pending', progress: 0 },
      { etapa: 'Configurando filtros', status: 'pending', progress: 0 },
    ];

    setEtapas(etapasBase);

    // Iniciar animação da primeira etapa (análise demora mais)
    animateProgress(0, 60000);

    // Tempos estimados para cada etapa (em ms) - filtros usa progresso real do servidor
    const temposEstimados = [60000, 5000, 10000, 15000, 120000];

    try {
      // Usar SSE para progresso em tempo real
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      abortControllerRef.current = new AbortController();

      const response = await fetch(`${MASTRA_SERVER_URL}/api/preparatorio/from-pdf-stream`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar com o servidor');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        throw new Error('Não foi possível ler a resposta do servidor');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());

              // Atualizar etapas com dados do servidor
              if (data.etapas) {
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                }

                // Filtrar etapas ocultas e mapear com progresso real
                const etapasVisiveis = data.etapas
                  .filter((e: any) => !e.hidden)
                  .map((e: any) => {
                    // Usar progresso real do servidor se disponível
                    let progressValue = 0;
                    if (e.status === 'completed') {
                      progressValue = 100;
                    } else if (e.status === 'in_progress') {
                      if (e.progress?.current && e.progress?.total) {
                        progressValue = Math.round((e.progress.current / e.progress.total) * 100);
                      } else {
                        progressValue = 50;
                      }
                    }

                    return {
                      etapa: e.etapa,
                      status: e.status,
                      detalhes: e.detalhes,
                      progress: progressValue,
                      serverProgress: e.progress,
                    };
                  });

                setEtapas(etapasVisiveis);

                // Encontrar etapa atual - só animar se não tiver progresso real do servidor
                const etapaAtualIdx = etapasVisiveis.findIndex((e: EtapaProgresso) => e.status === 'in_progress');
                if (etapaAtualIdx >= 0) {
                  const etapaAtual = etapasVisiveis[etapaAtualIdx];
                  // Só usar animação fake se não tiver progresso real
                  if (!etapaAtual.serverProgress) {
                    animateProgress(etapaAtualIdx, temposEstimados[etapaAtualIdx] || 15000);
                  }
                }
              }

              // Processar evento de conclusão
              if (data.success && data.preparatorio) {
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                }

                // Marcar todas como completas
                setEtapas(prev => prev.map(e => ({ ...e, status: 'completed', progress: 100 })));

                setResultado({
                  success: true,
                  preparatorio: {
                    id: data.preparatorio.id,
                    slug: data.preparatorio.slug,
                    nome: data.preparatorio.nome,
                    banca: data.preparatorio.banca,
                    orgao: data.preparatorio.orgao,
                    cargo: data.preparatorio.cargo,
                  },
                  estatisticas: {
                    blocos: data.estatisticas?.blocos || 0,
                    materias: data.estatisticas?.materias || 0,
                    topicos: data.estatisticas?.topicos || 0,
                    subtopicos: data.estatisticas?.subtopicos || 0,
                    tempo_processamento_ms: data.estatisticas?.tempo_total_ms || 0,
                  },
                });

                setIsProcessing(false);
                return;
              }

              // Processar erro
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignorar erros de parse de eventos intermediários
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }

    } catch (err: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      if (err.name === 'AbortError') {
        console.log('Requisição cancelada');
        return;
      }

      console.error('Erro ao processar PDF:', err);

      // Marcar etapa atual como erro
      setEtapas(prev => prev.map((e) => ({
        ...e,
        status: e.status === 'in_progress' ? 'error' : e.status === 'pending' ? 'pending' : e.status,
        detalhes: e.status === 'in_progress' ? err.message : undefined,
        progress: e.status === 'in_progress' ? 0 : e.progress,
      })));

      setError(err.message || 'Erro de conexão com o servidor');
      setIsProcessing(false);
    }
  };

  const handleIrParaEdital = () => {
    if (resultado?.preparatorio?.id) {
      onSuccess(resultado.preparatorio.id);
      navigate(`/admin/preparatorios/${resultado.preparatorio.id}/edital`);
    }
    onClose();
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const getEtapaIcon = (etapa: EtapaProgresso, index: number) => {
    // 5 ícones para as 5 etapas visíveis
    const icons = [FileText, GraduationCap, ImageIcon, Layers, Settings];
    const Icon = icons[index] || CheckCircle;

    if (etapa.status === 'in_progress') {
      return <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />;
    }
    if (etapa.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (etapa.status === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Icon className="w-5 h-5 text-gray-600" />;
  };

  // Componente de barra de progresso
  const ProgressBar: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
    const getBarColor = () => {
      if (status === 'completed') return 'bg-green-500';
      if (status === 'error') return 'bg-red-500';
      if (status === 'in_progress') return 'bg-brand-yellow';
      return 'bg-gray-600';
    };

    return (
      <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full ${getBarColor()} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-brand-card border border-white/10 rounded-sm w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Criar com IA</h2>
              <p className="text-gray-500 text-sm">Upload do edital em PDF</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Resultado de Sucesso */}
          {resultado?.success && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Preparatório Criado com Sucesso!
                </h3>
                <p className="text-gray-400">{resultado.preparatorio?.nome}</p>
              </div>

              {resultado.estatisticas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-brand-dark/50 rounded-sm p-3 text-center">
                    <p className="text-2xl font-bold text-brand-yellow">
                      {resultado.estatisticas.materias}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Matérias</p>
                  </div>
                  <div className="bg-brand-dark/50 rounded-sm p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {resultado.estatisticas.topicos}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Tópicos</p>
                  </div>
                  <div className="bg-brand-dark/50 rounded-sm p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {resultado.estatisticas.subtopicos}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Subtópicos</p>
                  </div>
                  <div className="bg-brand-dark/50 rounded-sm p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.estatisticas.blocos}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Blocos</p>
                  </div>
                </div>
              )}

              {resultado.estatisticas?.tempo_processamento_ms && (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Processado em {formatTempo(resultado.estatisticas.tempo_processamento_ms)}
                  </span>
                </div>
              )}

              <div className="bg-brand-dark/50 rounded-sm p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Banca:</span>
                  <span className="text-white">{resultado.preparatorio?.banca || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Órgão:</span>
                  <span className="text-white">{resultado.preparatorio?.orgao || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cargo:</span>
                  <span className="text-white">{resultado.preparatorio?.cargo || '-'}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
                <p className="text-blue-400 text-sm font-medium mb-1">
                  Próximo passo
                </p>
                <p className="text-blue-300/80 text-sm">
                  O edital verticalizado foi criado com sucesso. Agora você pode criar as rodadas e missões do preparatório.
                </p>
              </div>
            </div>
          )}

          {/* Upload e Processamento */}
          {!resultado?.success && (
            <div className="space-y-6">
              {/* Upload do Edital */}
              {!isProcessing && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    PDF do Edital <span className="text-red-400">*</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-sm transition-all cursor-pointer
                      p-8 flex flex-col items-center justify-center
                      ${isDragOver ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/10 hover:border-brand-yellow/50'}
                      ${selectedFile ? 'border-green-500/50 bg-green-500/5' : ''}
                      ${error ? 'border-red-500/50' : ''}
                      bg-brand-dark/30
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 bg-green-500/20 rounded-sm flex items-center justify-center">
                          <FileText className="w-7 h-7 text-green-500" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedFile.name}</p>
                          <p className="text-gray-500 text-sm">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSelection();
                          }}
                          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload
                          className={`w-12 h-12 ${
                            isDragOver ? 'text-brand-yellow' : 'text-gray-500'
                          }`}
                        />
                        <div className="text-center">
                          <p className="text-gray-400">
                            {isDragOver ? (
                              <span className="text-brand-yellow font-medium">Solte o arquivo aqui</span>
                            ) : (
                              <>
                                Arraste o PDF do edital ou{' '}
                                <span className="text-brand-yellow">clique para selecionar</span>
                              </>
                            )}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">PDF até 50MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progresso */}
              {(isProcessing || etapas.some(e => e.status !== 'pending')) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />}
                      Progresso
                    </h4>
                    <span className="text-xs text-gray-500">
                      {etapas.filter(e => e.status === 'completed').length}/{etapas.length} etapas
                    </span>
                  </div>

                  {/* Barra de progresso geral */}
                  <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-yellow to-green-500 transition-all duration-500 ease-out rounded-full"
                      style={{
                        width: `${
                          (etapas.filter(e => e.status === 'completed').length / etapas.length) * 100 +
                          (etapas.find(e => e.status === 'in_progress')?.progress || 0) / etapas.length
                        }%`
                      }}
                    />
                  </div>

                  {/* Lista de etapas com barras individuais */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {etapas.map((etapa, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-sm transition-all duration-300 ${
                          etapa.status === 'in_progress'
                            ? 'bg-brand-yellow/10 border border-brand-yellow/30'
                            : etapa.status === 'completed'
                            ? 'bg-green-500/10'
                            : etapa.status === 'error'
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-brand-dark/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getEtapaIcon(etapa, index)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium truncate ${
                                  etapa.status === 'in_progress'
                                    ? 'text-brand-yellow'
                                    : etapa.status === 'completed'
                                    ? 'text-green-500'
                                    : etapa.status === 'error'
                                    ? 'text-red-500'
                                    : 'text-gray-500'
                                }`}
                              >
                                {etapa.etapa}
                              </p>
                              {etapa.status === 'in_progress' && (
                                <span className="text-xs text-brand-yellow/70 ml-2">
                                  {Math.round(etapa.progress || 0)}%
                                </span>
                              )}
                            </div>
                            {etapa.detalhes && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{etapa.detalhes}</p>
                            )}
                            {/* Barra de progresso individual */}
                            {(etapa.status === 'in_progress' || etapa.status === 'completed') && (
                              <ProgressBar progress={etapa.progress || 0} status={etapa.status} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dica durante processamento */}
                  {isProcessing && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-3">
                      <p className="text-blue-400/80 text-xs">
                        <span className="font-medium">Dica:</span> Este processo pode levar alguns minutos.
                        Não feche esta janela enquanto o preparatório está sendo criado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-500 font-medium">Erro ao processar</p>
                    <p className="text-red-400/80 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Descrição */}
              {!isProcessing && !error && !selectedFile && (
                <div className="bg-brand-dark/30 rounded-sm p-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-yellow" />
                    Como funciona
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">1.</span>
                      Faça upload do PDF do edital do concurso
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">2.</span>
                      A IA analisa e extrai todas as matérias e tópicos
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">3.</span>
                      O edital verticalizado é criado automaticamente
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">4.</span>
                      Você configura as rodadas e missões do preparatório
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
          {resultado?.success ? (
            <>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Criar outro
              </button>
              <button
                onClick={handleIrParaEdital}
                className="bg-brand-yellow text-brand-darker px-6 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2"
              >
                Configurar Edital
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessar}
                disabled={!selectedFile || isProcessing}
                className="bg-brand-yellow text-brand-darker px-6 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Criar Preparatório
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
