import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Plus, Eye, Trash2, CheckCircle2, BookOpen, Target,
  ClipboardList, GraduationCap, Loader2, AlertCircle, X, AlertTriangle, RotateCcw
} from 'lucide-react';

// Types
interface Materia {
  id: string;
  materia: string;
  ordem: number;
  total_topicos: number;
  topicos_disponiveis: number;
}

interface Topico {
  id: string;
  nome: string;
  ordem: number;
  nivel_dificuldade: string | null;
}

interface Missao {
  id: string;
  rodada_id: string;
  numero: string;
  tipo: string;
  materia: string | null;
  materia_id: string | null;
  assunto: string | null;
  tema: string | null;
  acao: string | null;
  assuntos_ids: string[];
  revisao_parte: number | null;
  ordem: number;
  revisao_criterios?: string[]; // ['erradas', 'dificil', 'medio', 'facil']
}

// Tipos de critérios para revisão
type RevisaoCriterio = 'erradas' | 'dificil' | 'medio' | 'facil';

const REVISAO_CRITERIOS_OPTIONS: { value: RevisaoCriterio; label: string; description: string }[] = [
  { value: 'erradas', label: 'Questões erradas', description: 'Questões que o aluno errou' },
  { value: 'dificil', label: 'Marcadas como difícil', description: 'Acertou, mas marcou como difícil' },
  { value: 'medio', label: 'Marcadas como médio', description: 'Acertou e marcou como médio' },
  { value: 'facil', label: 'Marcadas como fácil', description: 'Acertou e marcou como fácil' },
];

interface Rodada {
  id: string;
  preparatorio_id: string;
  numero: number;
  titulo: string;
  ordem: number;
  missoes: Missao[];
}

interface BuilderState {
  preparatorio: {
    id: string;
    nome: string;
    cargo: string | null;
    montagem_status: string;
  };
  rodadas: Rodada[];
  materias: Materia[];
  topicos_usados: string[];
}

const API_BASE = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:4000';

export const MissionBuilder: React.FC = () => {
  const { preparatorioId } = useParams<{ preparatorioId: string }>();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [builderState, setBuilderState] = useState<BuilderState | null>(null);

  // UI State
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | null>(null);
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [selectedTopicos, setSelectedTopicos] = useState<Set<string>>(new Set());
  const [topicosDisponiveis, setTopicosDisponiveis] = useState<Topico[]>([]);
  const [loadingTopicos, setLoadingTopicos] = useState(false);
  const [creatingMissao, setCreatingMissao] = useState(false);
  const [creatingRodada, setCreatingRodada] = useState(false);
  const [viewingMateriaId, setViewingMateriaId] = useState<string | null>(null);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Revisão State
  const [showRevisaoRodadaModal, setShowRevisaoRodadaModal] = useState(false);
  const [showRevisaoMateriaModal, setShowRevisaoMateriaModal] = useState(false);
  const [revisaoMissoesSelecionadas, setRevisaoMissoesSelecionadas] = useState<Set<string>>(new Set());
  const [revisaoMateriasSelecionadas, setRevisaoMateriasSelecionadas] = useState<Set<string>>(new Set());
  const [salvandoRevisao, setSalvandoRevisao] = useState(false);
  const [revisaoRodadaConfigurada, setRevisaoRodadaConfigurada] = useState<Set<string>>(new Set());
  const [revisaoCriterios, setRevisaoCriterios] = useState<Set<RevisaoCriterio>>(new Set(['erradas']));

  // Confirmação de exclusão State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'missao' | 'rodada'>('missao');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback de sucesso
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  // Modal de revisões
  const [showRevisoesModal, setShowRevisoesModal] = useState(false);

  // Load builder state
  const loadBuilderState = useCallback(async () => {
    if (!preparatorioId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/preparatorio/${preparatorioId}/builder-state`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar dados');
      }

      setBuilderState(result.data);

      // Selecionar primeira rodada se existir
      if (result.data.rodadas.length > 0 && !selectedRodadaId) {
        setSelectedRodadaId(result.data.rodadas[0].id);
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preparatorioId, selectedRodadaId]);

  useEffect(() => {
    loadBuilderState();
  }, [loadBuilderState]);

  // Load topicos when materia is selected
  const loadTopicos = useCallback(async (materiaId: string) => {
    if (!preparatorioId) return;

    try {
      setLoadingTopicos(true);
      const response = await fetch(
        `${API_BASE}/api/preparatorio/${preparatorioId}/materias/${materiaId}/topicos`
      );
      const result = await response.json();

      if (result.success) {
        setTopicosDisponiveis(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar tópicos:', err);
    } finally {
      setLoadingTopicos(false);
    }
  }, [preparatorioId]);

  useEffect(() => {
    if (selectedMateriaId) {
      loadTopicos(selectedMateriaId);
      setSelectedTopicos(new Set());
    }
  }, [selectedMateriaId, loadTopicos]);

  // Create new rodada - com optimistic update
  const handleCreateRodada = async () => {
    if (!preparatorioId || !builderState) return;

    const tempId = `temp-rodada-${Date.now()}`;
    const proximoNumero = builderState.rodadas.length + 1;

    // Optimistic update
    const novaRodada: Rodada = {
      id: tempId,
      preparatorio_id: preparatorioId,
      numero: proximoNumero,
      titulo: `${proximoNumero}ª RODADA`,
      ordem: proximoNumero,
      missoes: [
        { id: `${tempId}-rev`, rodada_id: tempId, numero: '8', tipo: 'revisao', materia: null, materia_id: null, assunto: null, tema: 'REVISÃO OUSE PASSAR', acao: null, assuntos_ids: [], revisao_parte: null, ordem: 8 },
        { id: `${tempId}-tec`, rodada_id: tempId, numero: '9', tipo: 'acao', materia: null, materia_id: null, assunto: null, tema: null, acao: 'APLICAR AS TÉCNICAS OUSE PASSAR', assuntos_ids: [], revisao_parte: null, ordem: 9 },
        { id: `${tempId}-sim`, rodada_id: tempId, numero: '10', tipo: 'acao', materia: null, materia_id: null, assunto: null, tema: null, acao: 'SIMULADO COM ASSUNTOS DA RODADA e CORREÇÃO DO SIMULADO', assuntos_ids: [], revisao_parte: null, ordem: 10 },
      ],
    };

    setBuilderState(prev => {
      if (!prev) return prev;
      return { ...prev, rodadas: [...prev.rodadas, novaRodada] };
    });
    setSelectedRodadaId(tempId);

    try {
      setCreatingRodada(true);
      const response = await fetch(`${API_BASE}/api/preparatorio/${preparatorioId}/rodadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();

      if (result.success) {
        // Atualizar IDs temporários com IDs reais
        setBuilderState(prev => {
          if (!prev) return prev;
          const newRodadas = prev.rodadas.map(r => {
            if (r.id === tempId) {
              return {
                ...result.data,
                missoes: result.data.missoes || r.missoes,
              };
            }
            return r;
          });
          return { ...prev, rodadas: newRodadas };
        });
        setSelectedRodadaId(result.data.id);
      } else {
        loadBuilderState();
        alert(result.error || 'Erro ao criar rodada');
      }
    } catch (err: any) {
      loadBuilderState();
      alert(err.message);
    } finally {
      setCreatingRodada(false);
    }
  };

  // Create new missao - com optimistic update
  const handleCreateMissao = async () => {
    if (!preparatorioId || !selectedRodadaId || !selectedMateriaId || selectedTopicos.size === 0 || !builderState) {
      return;
    }

    const topicosArray = Array.from(selectedTopicos);
    const materiaNome = builderState.materias.find(m => m.id === selectedMateriaId)?.materia || '';
    const topicosNomes = topicosDisponiveis
      .filter(t => selectedTopicos.has(t.id))
      .map(t => t.nome);

    try {
      setCreatingMissao(true);

      // Optimistic update - atualiza UI imediatamente
      const tempId = `temp-${Date.now()}`;
      const rodadaIndex = builderState.rodadas.findIndex(r => r.id === selectedRodadaId);
      const missoesEstudoCount = builderState.rodadas[rodadaIndex]?.missoes.filter(
        m => m.tipo === 'estudo' || m.tipo === 'padrao'
      ).length || 0;

      const novaMissao: Missao = {
        id: tempId,
        rodada_id: selectedRodadaId,
        numero: String(missoesEstudoCount + 1),
        tipo: 'estudo',
        materia: materiaNome,
        materia_id: selectedMateriaId,
        assunto: topicosNomes.join('\n'),
        tema: null,
        acao: null,
        assuntos_ids: topicosArray,
        revisao_parte: null,
        ordem: missoesEstudoCount + 1,
      };

      // Atualizar estado local imediatamente
      setBuilderState(prev => {
        if (!prev) return prev;
        const newRodadas = prev.rodadas.map(r => {
          if (r.id === selectedRodadaId) {
            return { ...r, missoes: [...r.missoes, novaMissao] };
          }
          return r;
        });
        const newMaterias = prev.materias.map(m => {
          if (m.id === selectedMateriaId) {
            return { ...m, topicos_disponiveis: m.topicos_disponiveis - topicosArray.length };
          }
          return m;
        });
        return {
          ...prev,
          rodadas: newRodadas,
          materias: newMaterias,
          topicos_usados: [...prev.topicos_usados, ...topicosArray],
        };
      });

      // Limpar seleção imediatamente
      setSelectedMateriaId(null);
      setSelectedTopicos(new Set());
      setTopicosDisponiveis([]);

      // Fazer request em background
      const response = await fetch(`${API_BASE}/api/preparatorio/${preparatorioId}/missoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rodada_id: selectedRodadaId,
          materia_id: selectedMateriaId,
          assuntos_ids: topicosArray,
          tipo: 'estudo',
        }),
      });
      const result = await response.json();

      if (result.success) {
        // Atualizar o ID temporário com o ID real
        setBuilderState(prev => {
          if (!prev) return prev;
          const newRodadas = prev.rodadas.map(r => {
            if (r.id === selectedRodadaId) {
              return {
                ...r,
                missoes: r.missoes.map(m => m.id === tempId ? { ...m, id: result.data.id } : m)
              };
            }
            return r;
          });
          return { ...prev, rodadas: newRodadas };
        });

        // Verificar se atingiu 7 missões de estudo - abrir modal de revisão
        const novoCountMissoes = missoesEstudoCount + 1;
        if (novoCountMissoes === 7 && !revisaoRodadaConfigurada.has(selectedRodadaId)) {
          // Pré-selecionar todas as missões de estudo da rodada atual
          const rodadaAtual = builderState.rodadas.find(r => r.id === selectedRodadaId);
          const missoesDaRodada = rodadaAtual?.missoes
            .filter(m => m.tipo === 'estudo' || m.tipo === 'padrao')
            .map(m => m.id) || [];
          // Adicionar a nova missão também
          missoesDaRodada.push(result.data.id);
          setRevisaoMissoesSelecionadas(new Set(missoesDaRodada));
          setShowRevisaoRodadaModal(true);
        }
      } else {
        // Rollback em caso de erro
        loadBuilderState();
        alert(result.error || 'Erro ao criar missão');
      }
    } catch (err: any) {
      loadBuilderState();
      alert(err.message);
    } finally {
      setCreatingMissao(false);
    }
  };

  // Abrir modal de confirmação de exclusão de missão
  const handleDeleteMissaoClick = (missaoId: string) => {
    if (!builderState) return;

    // Encontrar a missão
    for (const rodada of builderState.rodadas) {
      const missao = rodada.missoes.find(m => m.id === missaoId);
      if (missao) {
        setDeleteType('missao');
        setDeleteTargetId(missaoId);
        setDeleteTargetName(missao.materia ? `Missão ${missao.numero} - ${missao.materia}` : `Missão ${missao.numero}`);
        setShowDeleteModal(true);
        break;
      }
    }
  };

  // Abrir modal de confirmação de exclusão de rodada
  const handleDeleteRodadaClick = (rodadaId: string) => {
    if (!builderState) return;

    const rodada = builderState.rodadas.find(r => r.id === rodadaId);
    if (rodada) {
      setDeleteType('rodada');
      setDeleteTargetId(rodadaId);
      setDeleteTargetName(`Rodada ${rodada.numero}`);
      setShowDeleteModal(true);
    }
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    if (deleteType === 'missao') {
      await executeDeleteMissao(deleteTargetId);
    } else {
      await executeDeleteRodada(deleteTargetId);
    }

    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  };

  // Delete missao - com optimistic update
  const executeDeleteMissao = async (missaoId: string) => {
    if (!preparatorioId || !builderState) return;

    // Encontrar a missão para fazer rollback se necessário
    let missaoRemovida: Missao | null = null;
    let rodadaId: string | null = null;

    for (const rodada of builderState.rodadas) {
      const missao = rodada.missoes.find(m => m.id === missaoId);
      if (missao) {
        missaoRemovida = missao;
        rodadaId = rodada.id;
        break;
      }
    }

    if (!missaoRemovida || !rodadaId) return;

    setIsDeleting(true);

    // Optimistic update - remover da UI imediatamente
    setBuilderState(prev => {
      if (!prev) return prev;
      const newRodadas = prev.rodadas.map(r => {
        if (r.id === rodadaId) {
          return { ...r, missoes: r.missoes.filter(m => m.id !== missaoId) };
        }
        return r;
      });
      // Liberar os tópicos da missão
      const topicosLiberados = missaoRemovida?.assuntos_ids || [];
      const newMaterias = prev.materias.map(m => {
        if (m.id === missaoRemovida?.materia_id) {
          return { ...m, topicos_disponiveis: m.topicos_disponiveis + topicosLiberados.length };
        }
        return m;
      });
      return {
        ...prev,
        rodadas: newRodadas,
        materias: newMaterias,
        topicos_usados: prev.topicos_usados.filter(id => !topicosLiberados.includes(id)),
      };
    });

    // Fechar modal se estava visualizando
    setViewingMateriaId(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/preparatorio/${preparatorioId}/missoes/${missaoId}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (!result.success) {
        // Rollback em caso de erro
        loadBuilderState();
        alert(result.error || 'Erro ao excluir missão');
      }
    } catch (err: any) {
      loadBuilderState();
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete rodada - com optimistic update
  const executeDeleteRodada = async (rodadaId: string) => {
    if (!preparatorioId || !builderState) return;

    // Encontrar rodada para fazer rollback
    const rodadaRemovida = builderState.rodadas.find(r => r.id === rodadaId);
    if (!rodadaRemovida) return;

    setIsDeleting(true);

    // Coletar todos os tópicos que serão liberados
    const topicosLiberados: string[] = [];
    const materiasAfetadas: Record<string, number> = {};

    rodadaRemovida.missoes.forEach(m => {
      if (m.assuntos_ids && m.assuntos_ids.length > 0) {
        topicosLiberados.push(...m.assuntos_ids);
        if (m.materia_id) {
          materiasAfetadas[m.materia_id] = (materiasAfetadas[m.materia_id] || 0) + m.assuntos_ids.length;
        }
      }
    });

    // Optimistic update
    setBuilderState(prev => {
      if (!prev) return prev;
      const newRodadas = prev.rodadas.filter(r => r.id !== rodadaId);
      const newMaterias = prev.materias.map(m => {
        if (materiasAfetadas[m.id]) {
          return { ...m, topicos_disponiveis: m.topicos_disponiveis + materiasAfetadas[m.id] };
        }
        return m;
      });
      return {
        ...prev,
        rodadas: newRodadas,
        materias: newMaterias,
        topicos_usados: prev.topicos_usados.filter(id => !topicosLiberados.includes(id)),
      };
    });

    // Atualizar seleção
    if (selectedRodadaId === rodadaId) {
      const outrasRodadas = builderState.rodadas.filter(r => r.id !== rodadaId);
      setSelectedRodadaId(outrasRodadas.length > 0 ? outrasRodadas[0].id : null);
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/preparatorio/${preparatorioId}/rodadas/${rodadaId}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (!result.success) {
        loadBuilderState();
        alert(result.error || 'Erro ao excluir rodada');
      }
    } catch (err: any) {
      loadBuilderState();
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calcular total de tópicos pendentes
  const totalTopicosPendentes = builderState?.materias.reduce(
    (acc, m) => acc + m.topicos_disponiveis, 0
  ) || 0;

  // Verificar antes de finalizar
  const handleClickFinalizar = () => {
    if (totalTopicosPendentes > 0) {
      setShowFinalizarModal(true);
    } else {
      confirmarFinalizacao();
    }
  };

  // Finalize montagem
  const confirmarFinalizacao = async () => {
    if (!preparatorioId) return;

    try {
      setFinalizando(true);
      const response = await fetch(
        `${API_BASE}/api/preparatorio/${preparatorioId}/finalizar-montagem`,
        { method: 'POST' }
      );
      const result = await response.json();

      if (result.success) {
        navigate('/admin/preparatorios');
      } else {
        alert(result.message || 'Erro ao finalizar');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFinalizando(false);
      setShowFinalizarModal(false);
    }
  };

  // Criar nova rodada e fechar modal
  const handleNovaRodadaDoModal = () => {
    setShowFinalizarModal(false);
    handleCreateRodada();
  };

  // Toggle topico selection
  const toggleTopico = (topicoId: string) => {
    setSelectedTopicos(prev => {
      const next = new Set(prev);
      if (next.has(topicoId)) {
        next.delete(topicoId);
      } else {
        next.add(topicoId);
      }
      return next;
    });
  };

  // Calcular matérias finalizadas (todos os tópicos designados)
  const materiasFinalizadas = builderState?.materias.filter(m => m.topicos_disponiveis === 0) || [];

  // Identificar em qual rodada cada matéria foi finalizada
  const getRodadaFinalizacao = (materiaId: string): number | null => {
    if (!builderState) return null;

    // Encontrar a rodada de maior número onde há uma missão desta matéria
    let rodadaFinalizacao: number | null = null;

    builderState.rodadas.forEach(rodada => {
      const temMissaoDaMateria = rodada.missoes.some(m => m.materia_id === materiaId);
      if (temMissaoDaMateria) {
        if (rodadaFinalizacao === null || rodada.numero > rodadaFinalizacao) {
          rodadaFinalizacao = rodada.numero;
        }
      }
    });

    return rodadaFinalizacao;
  };

  // Get current rodada (declared early for use in filtering)
  const selectedRodada = builderState?.rodadas.find(r => r.id === selectedRodadaId);

  // Filtrar matérias finalizadas que podem ser revisadas na rodada atual
  // Regra: só aparece para revisão se foi finalizada em rodada anterior (não na atual)
  const rodadaAtualNumero = selectedRodada?.numero || 0;
  const materiasFinalizadasParaRevisao = materiasFinalizadas
    .filter(m => {
      const rodadaFinalizacao = getRodadaFinalizacao(m.id);
      // Só pode ser revisada se foi finalizada em uma rodada anterior
      return rodadaFinalizacao !== null && rodadaFinalizacao < rodadaAtualNumero;
    })
    .sort((a, b) => a.ordem - b.ordem);

  // Salvar revisão da rodada
  const handleSalvarRevisaoRodada = async () => {
    if (!preparatorioId || !selectedRodadaId || !builderState) return;

    try {
      setSalvandoRevisao(true);

      // Encontrar a missão de revisão da rodada (tipo 'revisao')
      const rodada = builderState.rodadas.find(r => r.id === selectedRodadaId);
      const missaoRevisao = rodada?.missoes.find(m => m.tipo === 'revisao');

      if (missaoRevisao) {
        // Buscar os assuntos das missões selecionadas
        const missoesSelecionadas = rodada?.missoes.filter(m => revisaoMissoesSelecionadas.has(m.id)) || [];
        const assuntosRevisao = missoesSelecionadas.map(m => `${m.materia}: ${m.assunto}`).join('\n\n');

        // Montar tema com cargo se disponível
        const cargo = builderState.preparatorio.cargo;
        const temaRevisao = cargo
          ? `REVISÃO ${cargo.toUpperCase()}`
          : 'REVISÃO OUSE PASSAR';

        // Atualizar a missão de revisão existente
        const response = await fetch(`${API_BASE}/api/preparatorio/${preparatorioId}/missoes/${missaoRevisao.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tema: temaRevisao,
            assunto: assuntosRevisao,
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Marcar esta rodada como já configurada
          setRevisaoRodadaConfigurada(prev => new Set([...prev, selectedRodadaId]));
          setShowRevisaoRodadaModal(false);

          // Se há matérias finalizadas em rodadas anteriores disponíveis para revisão, abrir modal
          // Recalcular aqui pois o estado pode ter mudado
          const rodadaAtual = builderState.rodadas.find(r => r.id === selectedRodadaId);
          const numRodadaAtual = rodadaAtual?.numero || 0;

          const materiasParaRevisaoAgora = builderState.materias
            .filter(m => m.topicos_disponiveis === 0)
            .filter(m => {
              const rodadaFin = getRodadaFinalizacao(m.id);
              return rodadaFin !== null && rodadaFin < numRodadaAtual;
            })
            .filter(m => !materiasRevisadasNaRodadaAtual.has(m.id))
            .sort((a, b) => a.ordem - b.ordem);

          if (materiasParaRevisaoAgora.length > 0) {
            // Pré-selecionar todas as matérias disponíveis
            setRevisaoMateriasSelecionadas(new Set(materiasParaRevisaoAgora.map(m => m.id)));
            // Resetar critérios para o padrão
            setRevisaoCriterios(new Set(['erradas']));
            setShowRevisaoMateriaModal(true);
          }
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoRevisao(false);
    }
  };

  // Pular revisão da rodada
  const handlePularRevisaoRodada = () => {
    if (selectedRodadaId) {
      setRevisaoRodadaConfigurada(prev => new Set([...prev, selectedRodadaId]));
    }
    setShowRevisaoRodadaModal(false);

    // Se há matérias finalizadas em rodadas anteriores disponíveis para revisão, abrir modal
    if (builderState && selectedRodadaId) {
      const rodadaAtual = builderState.rodadas.find(r => r.id === selectedRodadaId);
      const numRodadaAtual = rodadaAtual?.numero || 0;

      const materiasParaRevisaoAgora = builderState.materias
        .filter(m => m.topicos_disponiveis === 0)
        .filter(m => {
          const rodadaFin = getRodadaFinalizacao(m.id);
          return rodadaFin !== null && rodadaFin < numRodadaAtual;
        })
        .filter(m => !materiasRevisadasNaRodadaAtual.has(m.id))
        .sort((a, b) => a.ordem - b.ordem);

      if (materiasParaRevisaoAgora.length > 0) {
        // Pré-selecionar todas as matérias disponíveis
        setRevisaoMateriasSelecionadas(new Set(materiasParaRevisaoAgora.map(m => m.id)));
        // Resetar critérios para o padrão
        setRevisaoCriterios(new Set(['erradas']));
        setShowRevisaoMateriaModal(true);
      }
    }
  };

  // Salvar revisão de matéria finalizada
  const handleSalvarRevisaoMateria = async (criarNova: boolean = false) => {
    if (!preparatorioId || !selectedRodadaId || !builderState || revisaoMateriasSelecionadas.size === 0) return;

    try {
      setSalvandoRevisao(true);

      // Buscar nomes das matérias selecionadas
      const materiasSelecionadas = builderState.materias.filter(m => revisaoMateriasSelecionadas.has(m.id));
      const nomesMaterias = materiasSelecionadas.map(m => m.materia).join(' + ');

      // Montar tema com cargo se disponível
      const cargo = builderState.preparatorio.cargo;
      const temaRevisao = cargo
        ? `Revisão ${cargo}: ${nomesMaterias}`
        : `Revisão: ${nomesMaterias}`;

      // Converter critérios para array
      const criteriosArray = Array.from(revisaoCriterios);

      // Criar nova missão de revisão
      const response = await fetch(`${API_BASE}/api/preparatorio/${preparatorioId}/missoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rodada_id: selectedRodadaId,
          tipo: 'revisao',
          tema: temaRevisao,
          assunto: `Revisão completa de: ${nomesMaterias}`,
          revisao_criterios: criteriosArray,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Atualizar estado local
        setBuilderState(prev => {
          if (!prev) return prev;
          const novaRevisao: Missao = {
            id: result.data.id,
            rodada_id: selectedRodadaId,
            numero: '8',
            tipo: 'revisao',
            materia: null,
            materia_id: null,
            assunto: `Revisão completa de: ${nomesMaterias}`,
            tema: temaRevisao,
            acao: null,
            assuntos_ids: [],
            revisao_parte: null,
            ordem: 8,
            revisao_criterios: criteriosArray,
          };
          const newRodadas = prev.rodadas.map(r => {
            if (r.id === selectedRodadaId) {
              return { ...r, missoes: [...r.missoes, novaRevisao] };
            }
            return r;
          });
          return { ...prev, rodadas: newRodadas };
        });

        if (criarNova) {
          // Mostrar flash de sucesso
          setShowSuccessFlash(true);
          setTimeout(() => setShowSuccessFlash(false), 800);
          // Limpar seleção para criar nova
          setRevisaoMateriasSelecionadas(new Set());
          // Resetar critérios para o padrão
          setRevisaoCriterios(new Set(['erradas']));
        } else {
          setShowRevisaoMateriaModal(false);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoRevisao(false);
    }
  };

  // Missões de estudo da rodada selecionada
  const missoesEstudo = selectedRodada?.missoes.filter(m =>
    m.tipo === 'estudo' || m.tipo === 'padrao'
  ) || [];

  // Count missoes per materia
  const getMissoesCountByMateria = (materiaId: string): number => {
    return selectedRodada?.missoes.filter(m => m.materia_id === materiaId).length || 0;
  };

  // Get revisões da rodada atual
  const revisoesRodada = selectedRodada?.missoes.filter(m => m.tipo === 'revisao') || [];

  // Filtrar matérias com tópicos disponíveis (ordenadas por ordem)
  const materiasDisponiveis = (builderState?.materias || [])
    .filter(m => m.topicos_disponiveis > 0)
    .sort((a, b) => a.ordem - b.ordem);

  // Identificar matérias já revisadas na rodada atual (pelo tema da revisão)
  const materiasRevisadasNaRodadaAtual = new Set<string>();
  revisoesRodada.forEach(revisao => {
    if (revisao.tema) {
      // Verificar se o tema contém o nome de alguma matéria
      builderState?.materias.forEach(materia => {
        if (revisao.tema?.toLowerCase().includes(materia.materia.toLowerCase())) {
          materiasRevisadasNaRodadaAtual.add(materia.id);
        }
      });
    }
  });

  // Obter histórico de revisões por matéria (em quais rodadas foi revisada)
  const getHistoricoRevisoesPorMateria = (materiaId: string): { count: number; rodadas: number[] } => {
    const materia = builderState?.materias.find(m => m.id === materiaId);
    if (!materia || !builderState) return { count: 0, rodadas: [] };

    const rodadasRevisadas: number[] = [];

    builderState.rodadas.forEach(rodada => {
      const revisoesDaRodada = rodada.missoes.filter(m => m.tipo === 'revisao');
      const foiRevisadaNessaRodada = revisoesDaRodada.some(revisao =>
        revisao.tema?.toLowerCase().includes(materia.materia.toLowerCase())
      );

      if (foiRevisadaNessaRodada) {
        rodadasRevisadas.push(rodada.numero);
      }
    });

    return { count: rodadasRevisadas.length, rodadas: rodadasRevisadas };
  };

  // Filtrar matérias finalizadas que ainda não foram revisadas na rodada atual
  // Usando materiasFinalizadasParaRevisao (que já filtra pela rodada de finalização)
  // Ordenadas por ordem
  const materiasDisponiveisParaRevisao = materiasFinalizadasParaRevisao
    .filter(m => !materiasRevisadasNaRodadaAtual.has(m.id))
    .sort((a, b) => a.ordem - b.ordem);

  // Get selected materia name
  const selectedMateria = builderState?.materias.find(m => m.id === selectedMateriaId);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/preparatorios')}
            className="text-brand-yellow hover:underline"
          >
            Voltar para preparatórios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Header */}
      <div className="bg-brand-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/preparatorios"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Montagem de Missões
                </h1>
                <p className="text-sm text-gray-400">
                  {builderState?.preparatorio.nome}
                  <span className="ml-2 text-xs">
                    ({builderState?.materias.length || 0} matérias, {builderState?.rodadas.length || 0} rodadas)
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateRodada}
              disabled={creatingRodada}
              className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {creatingRodada ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Nova Rodada
            </button>
          </div>
        </div>
      </div>

      {/* Rodada Tabs */}
      {builderState && builderState.rodadas.length > 0 && (
        <div className="bg-brand-card border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-2">
              {builderState.rodadas.map(rodada => (
                <button
                  key={rodada.id}
                  onClick={() => setSelectedRodadaId(rodada.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedRodadaId === rodada.id
                      ? 'bg-brand-yellow text-brand-darker'
                      : 'bg-brand-darker text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Rodada {rodada.numero}
                  <span className="ml-2 text-xs opacity-70">
                    ({rodada.missoes.filter(m => m.tipo === 'estudo' || m.tipo === 'padrao').length}/7)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {builderState?.rodadas.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Nenhuma rodada criada
            </h2>
            <p className="text-gray-400 mb-6">
              Clique em "Nova Rodada" para começar a montar as missões.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Materia Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-yellow" />
                Matérias
              </h2>

              {/* Mensagem se não houver matérias disponíveis */}
              {materiasDisponiveis.length === 0 && revisoesRodada.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  Todos os tópicos já foram designados.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Card de Revisão */}
                <div
                  onClick={() => setShowRevisoesModal(true)}
                  className="bg-brand-card rounded-xl p-4 border border-purple-500/30 transition-all flex flex-col h-36 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-purple-400 text-sm">
                      Revisão
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 flex-grow">
                    <span>{revisoesRodada.length} {revisoesRodada.length === 1 ? 'revisão' : 'revisões'}</span>
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    {revisoesRodada.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRevisoesModal(true);
                        }}
                        className="w-1/4 flex items-center justify-center py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRevisaoMateriaModal(true);
                      }}
                      className={`${revisoesRodada.length > 0 ? 'w-3/4' : 'w-full'} flex items-center justify-center gap-1 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Cards de Matérias */}
                {materiasDisponiveis.map(materia => {
                  const missoesCount = getMissoesCountByMateria(materia.id);
                  const isSelected = selectedMateriaId === materia.id;

                  return (
                    <div
                      key={materia.id}
                      onClick={() => setSelectedMateriaId(isSelected ? null : materia.id)}
                      className={`bg-brand-card rounded-xl p-4 border transition-all flex flex-col h-36 cursor-pointer ${
                        isSelected
                          ? 'border-brand-yellow ring-2 ring-brand-yellow/30'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <h3 className="font-semibold text-white mb-2 text-sm line-clamp-2">
                        {materia.materia}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-gray-400 flex-grow">
                        <span>{missoesCount} missões</span>
                        <span>{materia.topicos_disponiveis} tópicos</span>
                      </div>

                      <div className="flex gap-2 mt-auto pt-2">
                        {missoesCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingMateriaId(materia.id);
                            }}
                            className="w-1/4 flex items-center justify-center py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-sm"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMateriaId(isSelected ? null : materia.id);
                          }}
                          className={`${missoesCount > 0 ? 'w-3/4' : 'w-full'} flex items-center justify-center gap-1 py-1.5 rounded-lg transition-colors text-sm ${
                            isSelected
                              ? 'bg-brand-yellow text-brand-darker'
                              : 'bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/30'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column - Topic Selector */}
            <div>
              {!selectedMateriaId ? (
                <div className="bg-brand-card rounded-xl p-8 border border-white/10 text-center">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Selecione uma matéria
                  </h3>
                  <p className="text-gray-400">
                    Clique no botão + em uma matéria para adicionar tópicos a uma missão.
                  </p>
                </div>
              ) : (
                <div className="bg-brand-card rounded-xl p-4 border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-2">
                    {selectedMateria?.materia}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    {topicosDisponiveis.length} tópicos disponíveis
                  </p>

                  {loadingTopicos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
                    </div>
                  ) : topicosDisponiveis.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Todos os tópicos desta matéria já foram usados.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                        {topicosDisponiveis.map(topico => (
                          <button
                            key={topico.id}
                            onClick={() => toggleTopico(topico.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedTopicos.has(topico.id)
                                ? 'border-brand-yellow bg-brand-yellow/10 text-white'
                                : 'border-white/10 bg-brand-darker text-gray-300 hover:border-white/20 hover:bg-brand-darker/80'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 min-w-5 min-h-5 shrink-0 rounded border-2 flex items-center justify-center mt-0.5 ${
                                  selectedTopicos.has(topico.id)
                                    ? 'border-brand-yellow bg-brand-yellow'
                                    : 'border-gray-500'
                                }`}
                              >
                                {selectedTopicos.has(topico.id) && (
                                  <CheckCircle2 className="w-3 h-3 text-brand-darker" />
                                )}
                              </div>
                              <span className="text-sm">{topico.nome}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleCreateMissao}
                        disabled={selectedTopicos.size === 0 || creatingMissao}
                        className="w-full py-3 rounded-lg bg-brand-yellow text-brand-darker font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {creatingMissao ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Adicionar {selectedTopicos.size} {selectedTopicos.size === 1 ? 'tópico' : 'tópicos'}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Current Rodada Summary */}
              {selectedRodada && (
                <div className="mt-4 bg-brand-card rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">
                      Rodada {selectedRodada.numero}
                    </h3>
                    <button
                      onClick={() => handleDeleteRodadaClick(selectedRodada.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Missões de estudo:</span>
                      <span className="text-white">{missoesEstudo.length}/7</span>
                    </div>
                    <div className="w-full bg-brand-darker rounded-full h-2">
                      <div
                        className="bg-brand-yellow h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((missoesEstudo.length / 7) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Fixed missions */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Missões obrigatórias (auto):</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>8. Revisão Ouse Passar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>9. Aplicar Técnicas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>10. Simulado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {builderState && builderState.rodadas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-card border-t border-white/10 py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {builderState.rodadas.length} rodadas criadas
            </div>
            <button
              onClick={handleClickFinalizar}
              disabled={finalizando}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {finalizando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Finalizar Montagem
            </button>
          </div>
        </div>
      )}

      {/* Modal - Missões da Matéria */}
      {viewingMateriaId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingMateriaId(null)}
        >
          <div
            className="bg-brand-card rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-yellow" />
                {builderState?.materias.find(m => m.id === viewingMateriaId)?.materia}
              </h3>
              <button
                onClick={() => setViewingMateriaId(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                const missoesMateria = builderState?.rodadas
                  .flatMap(r => r.missoes.filter(m => m.materia_id === viewingMateriaId).map(m => ({ ...m, rodadaNumero: r.numero }))) || [];

                if (missoesMateria.length === 0) {
                  return (
                    <p className="text-gray-400 text-center py-8">
                      Nenhuma missão criada para esta matéria.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {missoesMateria.map(missao => (
                      <div
                        key={missao.id}
                        className="flex items-start justify-between p-3 bg-brand-darker rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-brand-yellow/20 text-brand-yellow rounded">
                              Rodada {missao.rodadaNumero}
                            </span>
                            <span className="text-sm text-white font-medium">
                              Missão {missao.numero}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 whitespace-pre-wrap">
                            {missao.assunto}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMissaoClick(missao.id)}
                          className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Finalização com Tópicos Pendentes */}
      {showFinalizarModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFinalizarModal(false)}
        >
          <div
            className="bg-brand-card rounded-xl border border-white/10 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Tópicos Pendentes
              </h3>
              <p className="text-gray-400">
                Você ainda tem <span className="text-brand-yellow font-bold">{totalTopicosPendentes}</span> {totalTopicosPendentes === 1 ? 'tópico' : 'tópicos'} para designar.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Deseja finalizar mesmo assim ou criar uma nova rodada?
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
              <button
                onClick={handleNovaRodadaDoModal}
                disabled={finalizando}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-yellow text-brand-darker font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Rodada
              </button>
              <button
                onClick={confirmarFinalizacao}
                disabled={finalizando}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {finalizando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Configurar Revisão da Rodada */}
      {showRevisaoRodadaModal && selectedRodada && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            className="bg-brand-card rounded-xl border border-white/10 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Configurar Revisão</h3>
                  <p className="text-sm text-gray-400">Rodada {selectedRodada.numero} - Selecione as missões para revisar</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Lista de missões */}
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {selectedRodada.missoes
                  .filter(m => m.tipo === 'estudo' || m.tipo === 'padrao')
                  .map(missao => (
                    <button
                      key={missao.id}
                      onClick={() => {
                        setRevisaoMissoesSelecionadas(prev => {
                          const next = new Set(prev);
                          if (next.has(missao.id)) {
                            next.delete(missao.id);
                          } else {
                            next.add(missao.id);
                          }
                          return next;
                        });
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        revisaoMissoesSelecionadas.has(missao.id)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-brand-darker hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 min-w-5 min-h-5 shrink-0 rounded border-2 flex items-center justify-center mt-0.5 ${
                            revisaoMissoesSelecionadas.has(missao.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-500'
                          }`}
                        >
                          {revisaoMissoesSelecionadas.has(missao.id) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            Missão {missao.numero} - {missao.materia}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {missao.assunto}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
              <button
                onClick={handlePularRevisaoRodada}
                disabled={salvandoRevisao}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-gray-400 font-semibold hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                Não obrigado
              </button>
              <button
                onClick={handleSalvarRevisaoRodada}
                disabled={salvandoRevisao || revisaoMissoesSelecionadas.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors disabled:opacity-50"
              >
                {salvandoRevisao ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Revisão de Matéria Finalizada */}
      {showRevisaoMateriaModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            className={`relative bg-brand-card rounded-xl border w-full max-w-lg overflow-hidden transition-all duration-300 ${
              showSuccessFlash
                ? 'border-green-500 ring-4 ring-green-500/50 scale-[1.02]'
                : 'border-white/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flash de sucesso */}
            {showSuccessFlash && (
              <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse z-10" />
            )}
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Revisão de Matéria Finalizada</h3>
                  <p className="text-sm text-gray-400">Selecione matérias 100% concluídas para revisar</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Lista de matérias finalizadas */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {materiasDisponiveisParaRevisao.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Todas as matérias finalizadas já foram revisadas nesta rodada.
                </p>
              ) : (
                <div className="space-y-2">
                  {materiasDisponiveisParaRevisao.map(materia => {
                    const historico = getHistoricoRevisoesPorMateria(materia.id);

                    return (
                      <button
                        key={materia.id}
                        onClick={() => {
                          setRevisaoMateriasSelecionadas(prev => {
                            const next = new Set(prev);
                            if (next.has(materia.id)) {
                              next.delete(materia.id);
                            } else {
                              next.add(materia.id);
                            }
                            return next;
                          });
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          revisaoMateriasSelecionadas.has(materia.id)
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-white/10 bg-brand-darker hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 min-w-5 min-h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                              revisaoMateriasSelecionadas.has(materia.id)
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-500'
                            }`}
                          >
                            {revisaoMateriasSelecionadas.has(materia.id) && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {materia.materia}
                              </p>
                              {historico.count > 0 && (
                                <div className="group relative">
                                  <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                                    {historico.count}x revisada
                                  </span>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-white/10">
                                      Revisada nas rodadas: {historico.rodadas.join(', ')}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-green-400">
                              {materia.total_topicos} tópicos concluídos
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção de Critérios de Revisão */}
            <div className="p-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">
                Quais questões entrarão na revisão?
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {REVISAO_CRITERIOS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setRevisaoCriterios(prev => {
                        const next = new Set(prev);
                        if (next.has(option.value)) {
                          // Não permite desmarcar se for o único selecionado
                          if (next.size > 1) {
                            next.delete(option.value);
                          }
                        } else {
                          next.add(option.value);
                        }
                        return next;
                      });
                    }}
                    className={`text-left p-2 rounded-lg border transition-all ${
                      revisaoCriterios.has(option.value)
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 bg-brand-darker hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          revisaoCriterios.has(option.value)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-500'
                        }`}
                      >
                        {revisaoCriterios.has(option.value) && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{option.label}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowRevisaoMateriaModal(false)}
                disabled={salvandoRevisao}
                className="px-4 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-gray-400 font-semibold hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                Não obrigado
              </button>
              <button
                onClick={() => handleSalvarRevisaoMateria(true)}
                disabled={salvandoRevisao || revisaoMateriasSelecionadas.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600/20 text-green-400 font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50 border border-green-500/30"
              >
                {salvandoRevisao ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Salvar e Nova
              </button>
              <button
                onClick={() => handleSalvarRevisaoMateria(false)}
                disabled={salvandoRevisao || revisaoMateriasSelecionadas.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {salvandoRevisao ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Confirmação de Exclusão */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-brand-card rounded-xl border border-white/10 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-400">
                Tem certeza que deseja excluir{' '}
                <span className="text-white font-semibold">{deleteTargetName}</span>?
              </p>
              {deleteType === 'rodada' && (
                <p className="text-red-400 text-sm mt-2">
                  Todas as missões desta rodada também serão excluídas.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-brand-darker/50 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 text-gray-400 font-semibold hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Revisões da Rodada */}
      {showRevisoesModal && selectedRodada && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowRevisoesModal(false)}
        >
          <div
            className="bg-brand-card rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Revisões</h3>
                  <p className="text-xs text-gray-400">Rodada {selectedRodada.numero}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRevisoesModal(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {revisoesRodada.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhuma revisão criada para esta rodada.
                </p>
              ) : (
                <div className="space-y-3">
                  {revisoesRodada.map(revisao => (
                    <div
                      key={revisao.id}
                      className="flex items-start justify-between p-3 bg-brand-darker rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-400">
                          {revisao.tema || 'Revisão'}
                        </p>
                        {revisao.assunto && (
                          <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap line-clamp-3">
                            {revisao.assunto}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMissaoClick(revisao.id)}
                        className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-brand-darker/50 border-t border-white/10">
              <button
                onClick={() => {
                  setShowRevisoesModal(false);
                  setShowRevisaoMateriaModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Revisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
