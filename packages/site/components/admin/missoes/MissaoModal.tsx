import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, Copy, FileText, X, Filter, ArrowRight, ArrowLeft, Check, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { missoesService, QuestaoFiltrosData, MissaoQuestaoFiltros, PreparatorioWithRodadas, MultiTurmaTarget } from '../../../services/preparatoriosService';
import { MultiTurmaSelector } from '../MultiTurmaSelector';
import { editalService, EditalItem } from '../../../services/editalService';
import { Tables, Enums } from '../../../lib/database.types';
import { EditalTopicSelector } from '../EditalTopicSelector';
import { QuestionFilterSelector } from '../QuestionFilterSelector';
import { QuestionFilters } from '../../../services/externalQuestionsService';

type Preparatorio = Tables<'preparatorios'>;
type Missao = Tables<'missoes'>;
type MissaoTipo = Enums<'missao_tipo'>;

export interface MissaoModalProps {
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

export const MissaoModal: React.FC<MissaoModalProps> = ({ preparatorioId, rodadaId, preparatorio, missao, nextNumero, onClose, onSave }) => {
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
  const [allEditalItems, setAllEditalItems] = useState<EditalItem[]>([]); // Todos os itens para lookup de parent_id
  const [showMateriaDropdown, setShowMateriaDropdown] = useState(false);

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
  // Percorre a árvore de parents até encontrar um item com filtro_materias
  // Aceita allItemsLookup opcional para evitar problemas de estado assíncrono
  const agregarFiltrosEdital = (items: EditalItem[], allItemsLookup?: EditalItem[]): FiltrosSugeridos | null => {
    console.log('[agregarFiltrosEdital] Items recebidos:', items.length);
    if (items.length === 0) return null;

    const materias = new Set<string>();
    const assuntos = new Set<string>();

    // Criar mapa de TODOS os itens por ID para poder percorrer a árvore de parents
    const allItemsMap = new Map<string, EditalItem>();
    const itemsSource = allItemsLookup || allEditalItems;
    console.log('[agregarFiltrosEdital] ItemsSource length:', itemsSource.length);
    itemsSource.forEach(i => allItemsMap.set(i.id, i));

    // Função auxiliar para encontrar filtro_materias percorrendo a árvore
    const findFiltroMaterias = (item: EditalItem, visited = new Set<string>()): string[] => {
      // Evitar loops infinitos
      if (visited.has(item.id)) return [];
      visited.add(item.id);

      // Se o item tem filtro_materias, retornar
      if (item.filtro_materias && item.filtro_materias.length > 0) {
        console.log('[findFiltroMaterias] Encontrado em:', item.titulo, item.filtro_materias);
        return item.filtro_materias;
      }

      // Se tem parent, continuar buscando
      if (item.parent_id) {
        const parent = allItemsMap.get(item.parent_id);
        if (parent) {
          console.log('[findFiltroMaterias] Subindo para parent:', parent.titulo);
          return findFiltroMaterias(parent, visited);
        }
      }

      // Não encontrou
      return [];
    };

    items.forEach(item => {
      console.log('[agregarFiltrosEdital] Item:', item.titulo, '| filtro_materias:', item.filtro_materias, '| filtro_assuntos:', item.filtro_assuntos, '| parent_id:', item.parent_id);

      // Buscar filtros de matérias (do próprio item ou subindo na árvore)
      const filtroMaterias = findFiltroMaterias(item);
      filtroMaterias.forEach(m => materias.add(m));

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

        // Carregar todos os itens do edital (para lookup) e matérias (para dropdown)
        const allItems = await editalService.getByPreparatorio(preparatorioId);
        setAllEditalItems(allItems); // Guardar todos para poder percorrer a árvore de parents
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
            // Passa allItems diretamente pois o state ainda não foi atualizado
            const filtrosHerdadosCalculados = agregarFiltrosEdital(validItems, allItems);
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
      const filtros = agregarFiltrosEdital(validItems, allEditalItems);
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
    const filtros = agregarFiltrosEdital(newItems, allEditalItems);
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
        const filtrosDoEdital = agregarFiltrosEdital(selectedEditalItems, allEditalItems);
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
