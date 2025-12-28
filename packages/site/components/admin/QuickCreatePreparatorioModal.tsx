import React, { useState, useRef, useCallback } from 'react';
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
  Target,
  Book,
  MessageSquare,
  ImageIcon,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
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
}

interface MateriaPreview {
  id: string;
  titulo: string;
  prioridade: number;
  topicosCount: number;
}

interface MissaoPreview {
  numero: string;
  tipo: 'padrao' | 'revisao' | 'acao';
  materia: string | null;
  assunto: string | null;
  tema: string | null;
  acao: string | null;
  ordem: number;
}

interface RodadaPreview {
  numero: number;
  titulo: string;
  missoes: MissaoPreview[];
}

interface RaioXDistribuicao {
  materia: string;
  quantidade: number;
  percentual: number;
}

interface RaioXData {
  total_questoes: number;
  tipo_predominante: 'multipla_escolha' | 'certo_errado';
  banca_identificada: string | null;
  distribuicao: RaioXDistribuicao[];
  analisado_em: string;
}

interface PreviewData {
  preparatorioId: string;
  preparatorioInfo: {
    slug: string;
    nome: string;
    banca?: string;
    orgao?: string;
    cargo?: string;
  };
  materias: MateriaPreview[];
  rodadasPreview: RodadaPreview[];
  estatisticas: {
    blocos: number;
    materias: number;
    topicos: number;
    subtopicos: number;
    rodadas: number;
    missoes: number;
    tempo_analise_ms: number;
  };
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
    rodadas: number;
    missoes: number;
    mensagens_incentivo: number;
    tempo_processamento_ms: number;
  };
  etapas?: EtapaProgresso[];
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null);
  const [etapas, setEtapas] = useState<EtapaProgresso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [materiasOrdenadas, setMateriasOrdenadas] = useState<MateriaPreview[]>([]);
  const [rodadasExpandidas, setRodadasExpandidas] = useState<Set<number>>(new Set([1]));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Raio-X (prova anterior)
  const [provaAnteriorFile, setProvaAnteriorFile] = useState<File | null>(null);
  const [isDragOverProva, setIsDragOverProva] = useState(false);
  const [raioXData, setRaioXData] = useState<RaioXData | null>(null);
  const [isAnalyzingRaioX, setIsAnalyzingRaioX] = useState(false);
  const provaInputRef = useRef<HTMLInputElement>(null);

  // Estado para tipo de montagem
  const [tipoMontagem, setTipoMontagem] = useState<'ia' | 'manual' | null>(null);

  // Drag and drop state for materias
  const [draggedMateriaIndex, setDraggedMateriaIndex] = useState<number | null>(null);
  const [dragOverMateriaIndex, setDragOverMateriaIndex] = useState<number | null>(null);

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

  // Handlers para prova anterior (Raio-X)
  const handleDragOverProva = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverProva(true);
  }, []);

  const handleDragLeaveProva = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverProva(false);
  }, []);

  const handleDropProva = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverProva(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setProvaAnteriorFile(file);
      } else {
        setError('Apenas arquivos PDF são permitidos');
      }
    }
  }, []);

  const handleProvaFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setProvaAnteriorFile(file);
      } else {
        setError('Apenas arquivos PDF são permitidos');
      }
    }
  }, []);

  const clearProvaSelection = useCallback(() => {
    setProvaAnteriorFile(null);
    setRaioXData(null);
    if (provaInputRef.current) {
      provaInputRef.current.value = '';
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setResultado(null);
    setEtapas([]);
    setPreviewData(null);
    setMateriasOrdenadas([]);
    setProvaAnteriorFile(null);
    setRaioXData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (provaInputRef.current) {
      provaInputRef.current.value = '';
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

  const handleProcessar = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResultado(null);
    setPreviewData(null);
    setRaioXData(null);

    // Inicializar etapas (incluir Raio-X se tiver prova anterior)
    const etapasBase: EtapaProgresso[] = [
      { etapa: 'Analisando PDF do edital', status: 'in_progress' },
      { etapa: 'Criando preparatório', status: 'pending' },
      { etapa: 'Gerando imagem de capa', status: 'pending' },
      { etapa: 'Criando edital verticalizado', status: 'pending' },
      { etapa: 'Gerando prévia das rodadas', status: 'pending' },
    ];

    // Adicionar etapa de Raio-X se tiver prova anterior
    if (provaAnteriorFile) {
      etapasBase.push({ etapa: 'Analisando prova anterior (Raio-X)', status: 'pending' });
    }

    setEtapas(etapasBase);

    // Simular progresso fake enquanto aguarda a resposta
    const temposEtapas = [8000, 3000, 5000, 4000, 3000, 5000];
    let etapaAtual = 0;
    const maxEtapas = provaAnteriorFile ? 5 : 4;

    const progressInterval = setInterval(() => {
      if (etapaAtual < maxEtapas) {
        etapaAtual++;
        setEtapas(prev => prev.map((e, idx) => ({
          ...e,
          status: idx < etapaAtual ? 'completed' : idx === etapaAtual ? 'in_progress' : 'pending',
        })));
      }
    }, temposEtapas[etapaAtual] || 4000);

    try {
      // 1. Processar edital
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch(`${MASTRA_SERVER_URL}/api/preparatorio/from-pdf-preview`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar o PDF');
      }

      let materias = data.materias as MateriaPreview[];
      let raioX: RaioXData | null = null;

      // 2. Se tem prova anterior, analisar Raio-X
      if (provaAnteriorFile) {
        setEtapas(prev => prev.map((e, idx) => ({
          ...e,
          status: idx < prev.length - 1 ? 'completed' : 'in_progress',
        })));

        const provaFormData = new FormData();
        provaFormData.append('pdf', provaAnteriorFile);
        // Enviar lista de matérias para match
        provaFormData.append('materias', JSON.stringify(materias.map(m => m.titulo)));

        const raioXResponse = await fetch(`${MASTRA_SERVER_URL}/api/preparatorio/analyze-prova`, {
          method: 'POST',
          body: provaFormData,
        });

        const raioXResult = await raioXResponse.json();

        if (raioXResponse.ok && raioXResult.success) {
          raioX = raioXResult.raioX;
          setRaioXData(raioX);

          // Reordenar matérias pela quantidade de questões do Raio-X (maior primeiro)
          materias = [...materias].sort((a, b) => {
            const qtyA = raioX!.distribuicao.find(d =>
              d.materia.toLowerCase().includes(a.titulo.toLowerCase()) ||
              a.titulo.toLowerCase().includes(d.materia.toLowerCase())
            )?.quantidade || 0;
            const qtyB = raioX!.distribuicao.find(d =>
              d.materia.toLowerCase().includes(b.titulo.toLowerCase()) ||
              b.titulo.toLowerCase().includes(d.materia.toLowerCase())
            )?.quantidade || 0;
            return qtyB - qtyA;
          });
        } else {
          console.warn('Não foi possível analisar Raio-X:', raioXResult.error);
          // Continua sem Raio-X
        }
      }

      clearInterval(progressInterval);

      // Marcar todas as etapas como completas
      setEtapas(prev => prev.map(e => ({ ...e, status: 'completed' })));

      // Configurar preview
      setPreviewData(data);
      setMateriasOrdenadas(materias);
      setIsProcessing(false);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Erro ao processar PDF:', err);

      // Marcar etapa atual como erro
      setEtapas(prev => prev.map((e, idx) => ({
        ...e,
        status: e.status === 'in_progress' ? 'error' : e.status === 'pending' ? 'pending' : e.status,
        detalhes: e.status === 'in_progress' ? err.message : undefined,
      })));

      setError(err.message || 'Erro de conexão com o servidor');
      setIsProcessing(false);
    }
  };

  const handleConfirmarRodadas = async () => {
    if (!previewData || !tipoMontagem) return;

    setIsConfirming(true);
    setError(null);

    try {
      // Salvar a ordem das matérias e o Raio-X - a geração das missões acontece em background
      const response = await fetch(`${MASTRA_SERVER_URL}/api/preparatorio/confirm-rodadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparatorioId: previewData.preparatorioId,
          materiasOrdenadas: materiasOrdenadas.map((m, idx) => ({
            id: m.id,
            prioridade: idx + 1,
          })),
          banca: previewData.preparatorioInfo.banca,
          sistemaHibrido: tipoMontagem === 'manual', // Manual = sistema híbrido
          // Enviar Raio-X se disponível
          raioX: raioXData || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Mostrar resultado de sucesso com a informação de que a geração está em background
        setResultado({
          success: true,
          preparatorio: {
            id: previewData.preparatorioId,
            slug: previewData.preparatorioInfo.slug,
            nome: previewData.preparatorioInfo.nome,
            banca: previewData.preparatorioInfo.banca,
            orgao: previewData.preparatorioInfo.orgao,
            cargo: previewData.preparatorioInfo.cargo,
          },
          estatisticas: {
            blocos: previewData.estatisticas.blocos,
            materias: previewData.estatisticas.materias,
            topicos: previewData.estatisticas.topicos,
            rodadas: data.estatisticas?.rodadas || previewData.estatisticas.rodadas,
            missoes: data.estatisticas?.missoes || previewData.estatisticas.missoes,
            mensagens_incentivo: data.estatisticas?.mensagens_incentivo || 0,
            tempo_processamento_ms: previewData.estatisticas.tempo_analise_ms,
          },
        });
        // Limpar preview para mostrar tela de sucesso
        setPreviewData(null);
      } else {
        setError(data.error || 'Erro ao confirmar rodadas');
      }
    } catch (err: any) {
      console.error('Erro ao confirmar rodadas:', err);
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelarCriacao = async () => {
    if (!previewData) return;

    try {
      await fetch(`${MASTRA_SERVER_URL}/api/preparatorio/cancel-creation/${previewData.preparatorioId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Erro ao cancelar criação:', err);
    }

    clearSelection();
  };

  const handleMoverMateria = (index: number, direcao: 'up' | 'down') => {
    const newOrdem = [...materiasOrdenadas];
    const novoIndex = direcao === 'up' ? index - 1 : index + 1;

    if (novoIndex < 0 || novoIndex >= newOrdem.length) return;

    [newOrdem[index], newOrdem[novoIndex]] = [newOrdem[novoIndex], newOrdem[index]];
    setMateriasOrdenadas(newOrdem);
  };

  // Drag and drop handlers for materias list
  const handleMateriaDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));

    // Create transparent drag image
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    setDraggedMateriaIndex(index);
  };

  const handleMateriaDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedMateriaIndex !== null && index !== draggedMateriaIndex) {
      setDragOverMateriaIndex(index);
    }
  };

  const handleMateriaDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedMateriaIndex !== null && index !== draggedMateriaIndex) {
      setDragOverMateriaIndex(index);
    }
  };

  const handleMateriaDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverMateriaIndex(null);
    }
  };

  const handleMateriaDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedMateriaIndex !== null && draggedMateriaIndex !== toIndex) {
      const newOrdem = [...materiasOrdenadas];
      const [removed] = newOrdem.splice(draggedMateriaIndex, 1);
      newOrdem.splice(toIndex, 0, removed);
      setMateriasOrdenadas(newOrdem);
    }

    setDraggedMateriaIndex(null);
    setDragOverMateriaIndex(null);
  };

  const handleMateriaDragEnd = () => {
    setDraggedMateriaIndex(null);
    setDragOverMateriaIndex(null);
  };

  const toggleRodadaExpandida = (numero: number) => {
    const newSet = new Set(rodadasExpandidas);
    if (newSet.has(numero)) {
      newSet.delete(numero);
    } else {
      newSet.add(numero);
    }
    setRodadasExpandidas(newSet);
  };

  const handleConcluir = () => {
    if (resultado?.preparatorio?.id) {
      onSuccess(resultado.preparatorio.id);
    }
    onClose();
  };

  const handleClose = () => {
    if (previewData && !isConfirming) {
      // Perguntar se quer cancelar
      if (confirm('Tem certeza que deseja cancelar? O preparatório criado será excluído.')) {
        handleCancelarCriacao();
        onClose();
      }
    } else if (!isProcessing && !isConfirming) {
      onClose();
    }
  };

  const getEtapaIcon = (etapa: EtapaProgresso, index: number) => {
    const icons = [FileText, GraduationCap, ImageIcon, Book, Target];
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

  const getMissaoLabel = (missao: MissaoPreview) => {
    if (missao.tipo === 'padrao') {
      return `${missao.materia}: ${missao.assunto?.split('\n')[0] || 'Estudo'}`;
    }
    if (missao.tipo === 'revisao') {
      return missao.tema || `Revisão: ${missao.materia}`;
    }
    return missao.acao || missao.materia || 'Ação';
  };

  const getMissaoColor = (tipo: string) => {
    switch (tipo) {
      case 'padrao': return 'text-blue-400';
      case 'revisao': return 'text-purple-400';
      case 'acao': return 'text-amber-400';
      default: return 'text-gray-400';
    }
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
      <div className="relative bg-brand-card border border-white/10 rounded-sm w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {previewData ? 'Validar Ordem das Matérias' : 'Criar com IA'}
              </h2>
              <p className="text-gray-500 text-sm">
                {previewData
                  ? 'Reordene as matérias conforme a prioridade de estudo'
                  : 'Upload do edital em PDF'}
              </p>
            </div>
          </div>
          {!isProcessing && !isConfirming && (
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
                      {resultado.estatisticas.rodadas}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Rodadas</p>
                  </div>
                  <div className="bg-brand-dark/50 rounded-sm p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.estatisticas.missoes}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Missões</p>
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
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <p className="text-blue-400 text-sm font-medium">
                    Gerando conteúdo das missões em background...
                  </p>
                </div>
                <p className="text-blue-300/80 text-sm">
                  O conteúdo das primeiras missões está sendo gerado automaticamente com IA. 
                  O preparatório será publicado automaticamente quando a geração terminar.
                  Você pode acompanhar o status na lista de preparatórios.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4">
                <p className="text-amber-400 text-sm font-medium mb-1">
                  Próximo passo importante!
                </p>
                <p className="text-amber-300/80 text-sm">
                  Configure as informações de venda do preparatório (preço, descrição comercial, imagens) para disponibilizá-lo aos alunos.
                </p>
              </div>
            </div>
          )}

          {/* Tela de Preview/Validação */}
          {previewData && !resultado?.success && (
            <div className="space-y-6">
              {/* Info do Preparatório */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <h4 className="text-white font-bold mb-2">{previewData.preparatorioInfo.nome}</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Banca: </span>
                    <span className="text-white">{previewData.preparatorioInfo.banca || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Órgão: </span>
                    <span className="text-white">{previewData.preparatorioInfo.orgao || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cargo: </span>
                    <span className="text-white">{previewData.preparatorioInfo.cargo || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card do Raio-X (se disponível) */}
              {raioXData && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h4 className="text-purple-400 font-bold">Raio-X da Prova Anterior</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total de questões</p>
                      <p className="text-white font-bold text-lg">{raioXData.total_questoes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tipo predominante</p>
                      <p className="text-white font-medium">
                        {raioXData.tipo_predominante === 'certo_errado' ? 'Certo/Errado' : 'Múltipla Escolha'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Banca identificada</p>
                      <p className="text-white font-medium">{raioXData.banca_identificada || '-'}</p>
                    </div>
                  </div>
                  <p className="text-purple-300/80 text-xs mt-3">
                    Matérias ordenadas automaticamente pela quantidade de questões (maior importância primeiro)
                  </p>
                </div>
              )}

              {/* Escolha do Tipo de Montagem */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-yellow" />
                  Como deseja montar as missões?
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipoMontagem('ia')}
                    className={`p-4 rounded-sm border-2 text-left transition-all ${
                      tipoMontagem === 'ia'
                        ? 'border-brand-yellow bg-brand-yellow/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-5 h-5 ${tipoMontagem === 'ia' ? 'text-brand-yellow' : 'text-gray-400'}`} />
                      <span className={`font-bold ${tipoMontagem === 'ia' ? 'text-brand-yellow' : 'text-white'}`}>
                        Montagem com IA
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      A IA distribui automaticamente as matérias nas rodadas seguindo a ordem de prioridade.
                      {raioXData && ' Usará o Raio-X para definir relevância.'}
                    </p>
                  </button>
                  <button
                    onClick={() => setTipoMontagem('manual')}
                    className={`p-4 rounded-sm border-2 text-left transition-all ${
                      tipoMontagem === 'manual'
                        ? 'border-brand-yellow bg-brand-yellow/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className={`w-5 h-5 ${tipoMontagem === 'manual' ? 'text-brand-yellow' : 'text-gray-400'}`} />
                      <span className={`font-bold ${tipoMontagem === 'manual' ? 'text-brand-yellow' : 'text-white'}`}>
                        Montagem Manual
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Você monta as missões manualmente no Builder, escolhendo quais tópicos vão em cada missão.
                    </p>
                  </button>
                </div>
              </div>

              {/* Ordem das Matérias */}
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-yellow" />
                  Ordem de Estudo das Matérias
                  {raioXData && (
                    <span className="text-xs font-normal text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                      Ordenado por Raio-X
                    </span>
                  )}
                </h4>
                <p className="text-gray-500 text-sm mb-3">
                  {raioXData
                    ? 'Ordenação baseada na quantidade de questões da prova anterior. Arraste ou use as setas para ajustar.'
                    : 'Arraste ou use as setas para reordenar. Português está configurado como primeira matéria por padrão.'}
                </p>
                <div className="space-y-2">
                  {materiasOrdenadas.map((materia, index) => {
                    const isDragging = draggedMateriaIndex === index;
                    const isDragOver = dragOverMateriaIndex === index;
                    // Buscar dados do Raio-X para esta matéria
                    const raioXMateria = raioXData?.distribuicao.find(d =>
                      d.materia.toLowerCase().includes(materia.titulo.toLowerCase()) ||
                      materia.titulo.toLowerCase().includes(d.materia.toLowerCase())
                    );

                    return (
                      <div
                        key={materia.id}
                        data-index={index}
                        draggable="true"
                        onDragStart={(e) => handleMateriaDragStart(e, index)}
                        onDragOver={(e) => handleMateriaDragOver(e, index)}
                        onDragEnter={(e) => handleMateriaDragEnter(e, index)}
                        onDragLeave={handleMateriaDragLeave}
                        onDrop={(e) => handleMateriaDrop(e, index)}
                        onDragEnd={handleMateriaDragEnd}
                        style={{
                          transform: isDragOver && draggedMateriaIndex !== null
                            ? draggedMateriaIndex < index
                              ? 'translateY(-4px)'
                              : 'translateY(4px)'
                            : 'none',
                          transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease',
                        }}
                        className={`
                          flex items-center gap-3 bg-brand-dark/50 rounded-sm p-3 select-none
                          ${isDragging
                            ? 'opacity-50 border-brand-yellow border shadow-lg scale-[1.02] z-10'
                            : 'border border-white/5'
                          }
                          ${isDragOver && !isDragging
                            ? 'border-brand-yellow border-2 bg-brand-yellow/5'
                            : ''
                          }
                          hover:border-white/20
                        `}
                      >
                        <span className="text-brand-yellow font-bold text-sm w-6">{index + 1}.</span>
                        <div className="cursor-grab active:cursor-grabbing p-1 -m-1" title="Arraste para reordenar">
                          <GripVertical className="w-4 h-4 text-gray-600 hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white">{materia.titulo}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            ({materia.topicosCount} tópicos)
                          </span>
                        </div>
                        {/* Mostrar info do Raio-X se disponível */}
                        {raioXMateria && (
                          <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded text-xs">
                            <span className="text-purple-300 font-medium">{raioXMateria.quantidade}</span>
                            <span className="text-purple-400/70">questões</span>
                            <span className="text-purple-400/50">({raioXMateria.percentual}%)</span>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoverMateria(index, 'up');
                            }}
                            disabled={index === 0}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoverMateria(index, 'down');
                            }}
                            disabled={index === materiasOrdenadas.length - 1}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview das Rodadas */}
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Book className="w-4 h-4 text-brand-yellow" />
                  Prévia das Rodadas ({previewData.estatisticas.rodadas} rodadas, {previewData.estatisticas.missoes} missões)
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewData.rodadasPreview.slice(0, 5).map((rodada) => (
                    <div
                      key={rodada.numero}
                      className="bg-brand-dark/30 rounded-sm border border-white/5"
                    >
                      <button
                        onClick={() => toggleRodadaExpandida(rodada.numero)}
                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors"
                      >
                        {rodadasExpandidas.has(rodada.numero) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-brand-yellow font-bold text-sm">{rodada.titulo}</span>
                        <span className="text-gray-500 text-xs">({rodada.missoes.length} missões)</span>
                      </button>
                      {rodadasExpandidas.has(rodada.numero) && (
                        <div className="px-3 pb-3 space-y-1">
                          {rodada.missoes.map((missao, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 py-1.5 px-2 bg-white/5 rounded text-xs"
                            >
                              <span className="text-gray-500 w-5">{missao.numero}.</span>
                              <span className={getMissaoColor(missao.tipo)}>
                                {getMissaoLabel(missao)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {previewData.rodadasPreview.length > 5 && (
                    <p className="text-gray-500 text-sm text-center py-2">
                      ... e mais {previewData.rodadasPreview.length - 5} rodadas
                    </p>
                  )}
                </div>
              </div>

              {/* Aviso sobre ordem */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Dica:</strong> A ordem das matérias afeta a sequência de estudo nas rodadas.
                  Matérias no topo serão estudadas primeiro e terão suas revisões mais cedo.
                </p>
              </div>

              {/* Aviso sobre tempo de processamento */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4">
                <p className="text-amber-400 text-sm">
                  <strong>⏱️ Importante:</strong> Ao confirmar, o sistema irá gerar o conteúdo das primeiras missões com IA.
                  Isso pode levar de 2 a 5 minutos. O preparatório só ficará disponível para os alunos após a conclusão.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-500 font-medium">Erro</p>
                    <p className="text-red-400/80 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload e Processamento */}
          {!resultado?.success && !previewData && (
            <div className="space-y-6">
              {/* Upload de PDFs - Edital e Prova lado a lado */}
              {!isProcessing && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Upload do Edital (obrigatório) */}
                  <div className="flex flex-col">
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
                        aspect-square flex flex-col items-center justify-center
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
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
                            <FileText className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="text-white font-medium text-sm truncate max-w-full px-2">
                            {selectedFile.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="mt-1 p-1.5 hover:bg-white/10 rounded-sm transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4">
                          <Upload
                            className={`w-10 h-10 ${
                              isDragOver ? 'text-brand-yellow' : 'text-gray-500'
                            }`}
                          />
                          <p className="text-gray-400 text-sm text-center">
                            {isDragOver ? (
                              <span className="text-brand-yellow font-medium">Solte aqui</span>
                            ) : (
                              <>
                                Arraste o PDF ou{' '}
                                <span className="text-brand-yellow">clique</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload da Prova Anterior (opcional - Raio-X) */}
                  <div className="flex flex-col">
                    <label className="block text-white font-medium mb-2">
                      Prova Anterior <span className="text-gray-500 font-normal text-xs">(opcional)</span>
                    </label>
                    <div
                      onDragOver={handleDragOverProva}
                      onDragLeave={handleDragLeaveProva}
                      onDrop={handleDropProva}
                      onClick={() => !provaAnteriorFile && provaInputRef.current?.click()}
                      className={`
                        relative border-2 border-dashed rounded-sm transition-all cursor-pointer
                        aspect-square flex flex-col items-center justify-center
                        ${isDragOverProva ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50'}
                        ${provaAnteriorFile ? 'border-purple-500/50 bg-purple-500/5' : ''}
                        bg-brand-dark/30
                      `}
                    >
                      <input
                        ref={provaInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleProvaFileChange}
                        className="hidden"
                      />

                      {provaAnteriorFile ? (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-sm flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-400" />
                          </div>
                          <p className="text-white font-medium text-sm truncate max-w-full px-2">
                            {provaAnteriorFile.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatFileSize(provaAnteriorFile.size)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearProvaSelection();
                            }}
                            className="mt-1 p-1.5 hover:bg-white/10 rounded-sm transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4">
                          <BarChart3
                            className={`w-10 h-10 ${
                              isDragOverProva ? 'text-purple-400' : 'text-gray-500'
                            }`}
                          />
                          <p className="text-gray-400 text-sm text-center">
                            {isDragOverProva ? (
                              <span className="text-purple-400 font-medium">Solte aqui</span>
                            ) : (
                              <>
                                Raio-X da prova{' '}
                                <span className="text-purple-400">clique</span>
                              </>
                            )}
                          </p>
                          <p className="text-gray-600 text-xs text-center">
                            Análise automática de distribuição
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progresso */}
              {(isProcessing || etapas.some(e => e.status !== 'pending')) && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />}
                    Progresso
                  </h4>
                  <div className="space-y-2">
                    {etapas.map((etapa, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-sm transition-colors ${
                          etapa.status === 'in_progress'
                            ? 'bg-brand-yellow/10'
                            : etapa.status === 'completed'
                            ? 'bg-green-500/10'
                            : etapa.status === 'error'
                            ? 'bg-red-500/10'
                            : 'bg-brand-dark/30'
                        }`}
                      >
                        {getEtapaIcon(etapa, index)}
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
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
                          {etapa.detalhes && (
                            <p className="text-xs text-gray-500">{etapa.detalhes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                      A IA analisa e extrai todas as informações automaticamente
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">3.</span>
                      Você valida e reordena as matérias conforme prioridade
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-yellow">4.</span>
                      Criamos o preparatório completo com rodadas e missões
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
                onClick={() => {
                  onClose();
                  navigate('/admin/preparatorios');
                }}
                className="bg-brand-yellow text-brand-darker px-6 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2"
              >
                Ver Preparatórios
              </button>
            </>
          ) : previewData ? (
            <>
              <button
                onClick={handleCancelarCriacao}
                disabled={isConfirming}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRodadas}
                disabled={isConfirming || !tipoMontagem}
                className="bg-brand-yellow text-brand-darker px-6 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!tipoMontagem ? 'Selecione o tipo de montagem acima' : undefined}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tipoMontagem === 'ia' ? 'Gerando com IA... (2-5 min)' : 'Configurando...'}
                  </>
                ) : (
                  <>
                    {tipoMontagem === 'ia' ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    {tipoMontagem === 'ia' ? 'Montar com IA' : tipoMontagem === 'manual' ? 'Iniciar Montagem Manual' : 'Selecione o tipo de montagem'}
                  </>
                )}
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
                    Analisar Edital
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
