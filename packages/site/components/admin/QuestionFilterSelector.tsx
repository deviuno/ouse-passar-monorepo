import React, { useEffect, useState, useCallback } from 'react';
import { X, Search, Check, Loader2, Filter, Hash, Building2, Calendar, BookOpen, FileText, ChevronDown, ChevronUp, Briefcase, GraduationCap, CheckCircle } from 'lucide-react';
import {
  getFilterOptions,
  getDynamicFilterOptions,
  countQuestionsForFilters,
  getAssuntosByMaterias,
  QuestionFilters,
  isExternalDbAvailable,
  OPTIONS_ESCOLARIDADE,
  OPTIONS_MODALIDADE
} from '../../services/externalQuestionsService';

interface QuestionFilterSelectorProps {
  initialFilters?: QuestionFilters;
  onSave: (filters: QuestionFilters, count: number) => void;
  onCancel: () => void;
}

export const QuestionFilterSelector: React.FC<QuestionFilterSelectorProps> = ({
  initialFilters,
  onSave,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbConfigured, setDbConfigured] = useState(false);

  // Opcoes disponiveis
  const [allMaterias, setAllMaterias] = useState<string[]>([]);
  const [allBancas, setAllBancas] = useState<string[]>([]);
  const [allAnos, setAllAnos] = useState<number[]>([]);
  const [allOrgaos, setAllOrgaos] = useState<string[]>([]);
  const [allCargos, setAllCargos] = useState<string[]>([]);

  // Opcoes dinamicas (filtradas)
  const [dynamicMaterias, setDynamicMaterias] = useState<string[]>([]);
  const [dynamicBancas, setDynamicBancas] = useState<string[]>([]);
  const [dynamicAnos, setDynamicAnos] = useState<number[]>([]);
  const [dynamicOrgaos, setDynamicOrgaos] = useState<string[]>([]);
  const [dynamicCargos, setDynamicCargos] = useState<string[]>([]);

  // Assuntos (dinamico, baseado em materias)
  const [availableAssuntos, setAvailableAssuntos] = useState<string[]>([]);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);

  // Filtros selecionados
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>(initialFilters?.materias || []);
  const [selectedBancas, setSelectedBancas] = useState<string[]>(initialFilters?.bancas || []);
  const [selectedAnos, setSelectedAnos] = useState<number[]>(initialFilters?.anos || []);
  const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>(initialFilters?.orgaos || []);
  const [selectedCargos, setSelectedCargos] = useState<string[]>(initialFilters?.cargos || []);
  const [selectedAssuntos, setSelectedAssuntos] = useState<string[]>(initialFilters?.assuntos || []);
  const [selectedEscolaridade, setSelectedEscolaridade] = useState<string[]>(initialFilters?.escolaridade || []);
  const [selectedModalidade, setSelectedModalidade] = useState<string[]>(initialFilters?.modalidade || []);

  // Contagem de questoes
  const [questionsCount, setQuestionsCount] = useState<number>(0);

  // Secoes expandidas
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['materias', 'assuntos', 'bancas', 'anos', 'orgaos', 'cargos', 'escolaridade', 'modalidade']));

  // Busca por secao
  const [searchMaterias, setSearchMaterias] = useState('');
  const [searchAssuntos, setSearchAssuntos] = useState('');
  const [searchBancas, setSearchBancas] = useState('');
  const [searchOrgaos, setSearchOrgaos] = useState('');
  const [searchCargos, setSearchCargos] = useState('');

  // Carregar opcoes iniciais
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const configured = isExternalDbAvailable();
        setDbConfigured(configured);

        if (!configured) {
          setLoading(false);
          return;
        }

        const options = await getFilterOptions();
        if (options.error) {
          console.error('Erro ao carregar opcoes:', options.error);
        }

        setAllMaterias(options.materias);
        setAllBancas(options.bancas);
        setAllAnos(options.anos);
        setAllOrgaos(options.orgaos);
        setAllCargos(options.cargos);

        setDynamicMaterias(options.materias);
        setDynamicBancas(options.bancas);
        setDynamicCargos(options.cargos);
        setDynamicAnos(options.anos);
        setDynamicOrgaos(options.orgaos);
      } catch (error) {
        console.error('Erro ao carregar opcoes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Atualizar opcoes dinamicas quando filtros mudam
  const updateDynamicOptions = useCallback(async () => {
    if (!dbConfigured) return;

    const currentFilters: QuestionFilters = {
      materias: selectedMaterias.length > 0 ? selectedMaterias : undefined,
      bancas: selectedBancas.length > 0 ? selectedBancas : undefined,
      anos: selectedAnos.length > 0 ? selectedAnos : undefined,
      orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
      cargos: selectedCargos.length > 0 ? selectedCargos : undefined,
      assuntos: selectedAssuntos.length > 0 ? selectedAssuntos : undefined,
      escolaridade: selectedEscolaridade.length > 0 ? selectedEscolaridade : undefined,
      modalidade: selectedModalidade.length > 0 ? selectedModalidade : undefined,
    };

    try {
      const options = await getDynamicFilterOptions(currentFilters);
      setDynamicMaterias(options.materias);
      setDynamicBancas(options.bancas);
      setDynamicAnos(options.anos);
      setDynamicOrgaos(options.orgaos);
      setDynamicCargos(options.cargos);
    } catch (error) {
      console.error('Erro ao atualizar opcoes dinamicas:', error);
    }
  }, [dbConfigured, selectedMaterias, selectedBancas, selectedAnos, selectedOrgaos, selectedCargos, selectedAssuntos, selectedEscolaridade, selectedModalidade]);

  // Referência para saber se os assuntos iniciais já foram preservados
  const [initialAssuntosPreserved, setInitialAssuntosPreserved] = useState(false);

  // Carregar assuntos quando materias mudam
  useEffect(() => {
    const loadAssuntos = async () => {
      if (selectedMaterias.length === 0) {
        // Se há assuntos iniciais e ainda não foram preservados, manter eles
        if (initialFilters?.assuntos && initialFilters.assuntos.length > 0 && !initialAssuntosPreserved) {
          setAvailableAssuntos(initialFilters.assuntos);
          setInitialAssuntosPreserved(true);
          return;
        }
        // Se já foram preservados uma vez, agora pode limpar se necessário
        if (initialAssuntosPreserved) {
          setAvailableAssuntos([]);
        }
        return;
      }

      setLoadingAssuntos(true);
      try {
        const result = await getAssuntosByMaterias(selectedMaterias);
        // Combinar assuntos do banco com assuntos iniciais (se houver)
        const combinedAssuntos = new Set([
          ...result.assuntos,
          ...(initialFilters?.assuntos || [])
        ]);
        setAvailableAssuntos(Array.from(combinedAssuntos));
        setInitialAssuntosPreserved(true);
      } catch (error) {
        console.error('Erro ao carregar assuntos:', error);
        // Em caso de erro, manter os assuntos iniciais se houver
        if (initialFilters?.assuntos) {
          setAvailableAssuntos(initialFilters.assuntos);
        } else {
          setAvailableAssuntos([]);
        }
      } finally {
        setLoadingAssuntos(false);
      }
    };

    if (dbConfigured && !loading) {
      loadAssuntos();
    }
  }, [selectedMaterias, dbConfigured, loading, initialFilters, initialAssuntosPreserved]);

  // Atualizar contagem quando filtros mudam
  const updateCount = useCallback(async () => {
    if (!dbConfigured) return;

    setLoadingCount(true);
    try {
      const filters: QuestionFilters = {
        materias: selectedMaterias.length > 0 ? selectedMaterias : undefined,
        bancas: selectedBancas.length > 0 ? selectedBancas : undefined,
        anos: selectedAnos.length > 0 ? selectedAnos : undefined,
        orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
        cargos: selectedCargos.length > 0 ? selectedCargos : undefined,
        assuntos: selectedAssuntos.length > 0 ? selectedAssuntos : undefined,
        escolaridade: selectedEscolaridade.length > 0 ? selectedEscolaridade : undefined,
        modalidade: selectedModalidade.length > 0 ? selectedModalidade : undefined,
      };

      const result = await countQuestionsForFilters(filters);
      setQuestionsCount(result.count);
    } catch (error) {
      console.error('Erro ao contar questoes:', error);
    } finally {
      setLoadingCount(false);
    }
  }, [dbConfigured, selectedMaterias, selectedBancas, selectedAnos, selectedOrgaos, selectedCargos, selectedAssuntos, selectedEscolaridade, selectedModalidade]);

  useEffect(() => {
    if (!loading) {
      updateDynamicOptions();
      updateCount();
    }
  }, [loading, updateDynamicOptions, updateCount]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleMateria = (materia: string) => {
    setSelectedMaterias(prev =>
      prev.includes(materia)
        ? prev.filter(m => m !== materia)
        : [...prev, materia]
    );
  };

  const toggleBanca = (banca: string) => {
    setSelectedBancas(prev =>
      prev.includes(banca)
        ? prev.filter(b => b !== banca)
        : [...prev, banca]
    );
  };

  const toggleAno = (ano: number) => {
    setSelectedAnos(prev =>
      prev.includes(ano)
        ? prev.filter(a => a !== ano)
        : [...prev, ano]
    );
  };

  const toggleOrgao = (orgao: string) => {
    setSelectedOrgaos(prev =>
      prev.includes(orgao)
        ? prev.filter(o => o !== orgao)
        : [...prev, orgao]
    );
  };

  const toggleCargo = (cargo: string) => {
    setSelectedCargos(prev =>
      prev.includes(cargo)
        ? prev.filter(c => c !== cargo)
        : [...prev, cargo]
    );
  };

  const toggleAssunto = (assunto: string) => {
    setSelectedAssuntos(prev =>
      prev.includes(assunto)
        ? prev.filter(a => a !== assunto)
        : [...prev, assunto]
    );
  };

  const toggleEscolaridade = (escolaridade: string) => {
    setSelectedEscolaridade(prev =>
      prev.includes(escolaridade)
        ? prev.filter(e => e !== escolaridade)
        : [...prev, escolaridade]
    );
  };

  const toggleModalidade = (modalidade: string) => {
    setSelectedModalidade(prev =>
      prev.includes(modalidade)
        ? prev.filter(m => m !== modalidade)
        : [...prev, modalidade]
    );
  };

  const clearAllFilters = () => {
    setSelectedMaterias([]);
    setSelectedAssuntos([]);
    setSelectedBancas([]);
    setSelectedAnos([]);
    setSelectedOrgaos([]);
    setSelectedCargos([]);
    setSelectedEscolaridade([]);
    setSelectedModalidade([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const filters: QuestionFilters = {
        materias: selectedMaterias.length > 0 ? selectedMaterias : undefined,
        assuntos: selectedAssuntos.length > 0 ? selectedAssuntos : undefined,
        bancas: selectedBancas.length > 0 ? selectedBancas : undefined,
        anos: selectedAnos.length > 0 ? selectedAnos : undefined,
        orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
        cargos: selectedCargos.length > 0 ? selectedCargos : undefined,
        escolaridade: selectedEscolaridade.length > 0 ? selectedEscolaridade : undefined,
        modalidade: selectedModalidade.length > 0 ? selectedModalidade : undefined,
      };

      onSave(filters, questionsCount);
    } finally {
      setSaving(false);
    }
  };

  const hasAnyFilter = selectedMaterias.length > 0 || selectedAssuntos.length > 0 || selectedBancas.length > 0 || selectedAnos.length > 0 || selectedOrgaos.length > 0 || selectedCargos.length > 0 || selectedEscolaridade.length > 0 || selectedModalidade.length > 0;

  // Função para ordenar itens com selecionados no topo
  const sortWithSelectedFirst = <T,>(items: T[], selected: T[]): T[] => {
    const selectedSet = new Set(selected);
    const selectedItems = items.filter(item => selectedSet.has(item));
    const unselectedItems = items.filter(item => !selectedSet.has(item));
    return [...selectedItems, ...unselectedItems];
  };

  // Mapeamento de bancas: sigla → nome completo (para exibição)
  const BANCA_DISPLAY_MAP: Record<string, string> = {
    // Siglas conhecidas
    'CEBRASPE': 'CEBRASPE - Centro Brasileiro de Pesquisa em Avaliação e Seleção',
    'CESPE': 'CESPE - Centro de Seleção e de Promoção de Eventos',
    'CESPE/CEBRASPE': 'CESPE/CEBRASPE',
    'FGV': 'FGV - Fundação Getúlio Vargas',
    'FCC': 'FCC - Fundação Carlos Chagas',
    'CESGRANRIO': 'CESGRANRIO - Fundação Cesgranrio',
    'VUNESP': 'VUNESP - Fundação para o Vestibular da UNESP',
    'IBFC': 'IBFC - Instituto Brasileiro de Formação e Capacitação',
    'QUADRIX': 'QUADRIX - Instituto Quadrix',
    'IADES': 'IADES - Instituto Americano de Desenvolvimento',
    'IDECAN': 'IDECAN - Instituto de Desenvolvimento Educacional',
    'FUNCAB': 'FUNCAB - Fundação Prof. Carlos Augusto Bittencourt',
    'AOCP': 'AOCP - Assessoria em Organização de Concursos',
    'CONSULPLAN': 'CONSULPLAN',
    'INSTITUTO ACESSO': 'Instituto Acesso',
    // Nomes por extenso mapeados para sigla primeiro
    'Fundação Getúlio Vargas': 'FGV - Fundação Getúlio Vargas',
    'Fundação Getulio Vargas': 'FGV - Fundação Getúlio Vargas',
    'Fundação Carlos Chagas': 'FCC - Fundação Carlos Chagas',
    'Fundação Cesgranrio': 'CESGRANRIO - Fundação Cesgranrio',
    'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos': 'CEBRASPE',
  };

  // Função para formatar nome da banca (sigla primeiro)
  const formatBancaDisplay = (banca: string): string => {
    // Se já está no mapeamento, usar o formato definido
    if (BANCA_DISPLAY_MAP[banca]) {
      return BANCA_DISPLAY_MAP[banca];
    }
    // Verificar se o nome contém alguma sigla conhecida
    const upperBanca = banca.toUpperCase();
    for (const sigla of ['CEBRASPE', 'CESPE', 'FGV', 'FCC', 'CESGRANRIO', 'VUNESP', 'IBFC', 'QUADRIX', 'IADES', 'IDECAN', 'FUNCAB', 'AOCP']) {
      if (upperBanca.includes(sigla)) {
        return banca; // Já contém sigla, manter como está
      }
    }
    return banca;
  };

  // Função para normalizar texto removendo acentos e convertendo para minúsculo
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Função para verificar se banca corresponde à busca (sigla ou nome)
  const bancaMatchesSearch = (banca: string, search: string): boolean => {
    const searchNormalized = normalizeText(search);
    const bancaNormalized = normalizeText(banca);
    const displayNormalized = normalizeText(formatBancaDisplay(banca));

    return bancaNormalized.includes(searchNormalized) || displayNormalized.includes(searchNormalized);
  };

  // Filtrar opcoes por busca e ordenar com selecionados primeiro
  // Para matérias, combinar as disponíveis com as selecionadas (para mostrar herdadas que podem não estar na lista)
  const allMateriasToShow = [...new Set([...selectedMaterias, ...dynamicMaterias])];
  const filteredMaterias = sortWithSelectedFirst(
    allMateriasToShow.filter(m => normalizeText(m).includes(normalizeText(searchMaterias))),
    selectedMaterias
  );
  // Para bancas, combinar as disponíveis com as selecionadas (para mostrar herdadas)
  // Usar busca que funciona com sigla ou nome completo
  const allBancasToShow = [...new Set([...selectedBancas, ...dynamicBancas])];
  const filteredBancas = sortWithSelectedFirst(
    allBancasToShow.filter(b => bancaMatchesSearch(b, searchBancas)),
    selectedBancas
  );
  // Para órgãos, combinar os disponíveis com os selecionados
  const allOrgaosToShow = [...new Set([...selectedOrgaos, ...dynamicOrgaos])];
  const filteredOrgaos = sortWithSelectedFirst(
    allOrgaosToShow.filter(o => normalizeText(o).includes(normalizeText(searchOrgaos))),
    selectedOrgaos
  );
  // Para cargos, combinar os disponíveis com os selecionados
  const allCargosToShow = [...new Set([...selectedCargos, ...dynamicCargos])];
  const filteredCargos = sortWithSelectedFirst(
    allCargosToShow.filter(c => normalizeText(c).includes(normalizeText(searchCargos))),
    selectedCargos
  );
  // Para assuntos, combinar os disponíveis com os selecionados (para mostrar herdados que podem não estar na lista)
  const allAssuntosToShow = [...new Set([...selectedAssuntos, ...availableAssuntos])];
  const filteredAssuntos = sortWithSelectedFirst(
    allAssuntosToShow.filter(a => normalizeText(a).includes(normalizeText(searchAssuntos))),
    selectedAssuntos
  );
  // Para anos, combinar os disponíveis com os selecionados
  const allAnosToShow = [...new Set([...selectedAnos, ...dynamicAnos])];
  const filteredAnos = sortWithSelectedFirst(allAnosToShow, selectedAnos);
  // Para escolaridade e modalidade, ordenar com selecionados primeiro
  const sortedEscolaridade = sortWithSelectedFirst(
    OPTIONS_ESCOLARIDADE.map(o => o.value),
    selectedEscolaridade
  );
  const sortedModalidade = sortWithSelectedFirst(
    OPTIONS_MODALIDADE.map(o => o.value),
    selectedModalidade
  );

  if (!dbConfigured) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Banco de Questoes nao Configurado</h3>
          <p className="text-gray-500 mb-4">
            Configure as variaveis de ambiente VITE_QUESTIONS_DB_URL e VITE_QUESTIONS_DB_ANON_KEY para usar este recurso.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header com contagem */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-brand-dark/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand-yellow" />
            <span className="text-white font-bold">Filtros de Questoes</span>
          </div>
          {hasAnyFilter && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Limpar todos
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loadingCount ? (
            <Loader2 className="w-4 h-4 text-brand-yellow animate-spin" />
          ) : (
            <span className="bg-brand-yellow text-brand-darker px-3 py-1 text-sm font-bold">
              {questionsCount.toLocaleString()} questoes
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            <span className="ml-2 text-gray-400">Carregando opcoes...</span>
          </div>
        ) : (
          <>
            {/* Materias */}
            <FilterSection
              title="Materias"
              icon={<BookOpen className="w-4 h-4" />}
              expanded={expandedSections.has('materias')}
              onToggle={() => toggleSection('materias')}
              selectedCount={selectedMaterias.length}
              totalCount={allMaterias.length}
            >
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchMaterias}
                    onChange={(e) => setSearchMaterias(e.target.value)}
                    placeholder="Buscar materia..."
                    className="w-full bg-brand-dark border border-white/10 pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-yellow/50 outline-none"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredMaterias.map(materia => (
                  <FilterOption
                    key={materia}
                    label={materia}
                    selected={selectedMaterias.includes(materia)}
                    available={dynamicMaterias.includes(materia)}
                    onClick={() => toggleMateria(materia)}
                  />
                ))}
                {filteredMaterias.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">Nenhuma materia encontrada</p>
                )}
              </div>
            </FilterSection>

            {/* Assuntos (dinamico, baseado em materias) */}
            <FilterSection
              title="Assuntos"
              icon={<FileText className="w-4 h-4" />}
              expanded={expandedSections.has('assuntos')}
              onToggle={() => toggleSection('assuntos')}
              selectedCount={selectedAssuntos.length}
              totalCount={availableAssuntos.length}
            >
              {selectedMaterias.length === 0 && availableAssuntos.length === 0 && selectedAssuntos.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">
                  Selecione uma ou mais materias primeiro
                </div>
              ) : loadingAssuntos ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-brand-yellow animate-spin" />
                  <span className="ml-2 text-gray-400 text-sm">Carregando assuntos...</span>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={searchAssuntos}
                        onChange={(e) => setSearchAssuntos(e.target.value)}
                        placeholder="Buscar assunto..."
                        className="w-full bg-brand-dark border border-white/10 pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-yellow/50 outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredAssuntos.map(assunto => (
                      <FilterOption
                        key={assunto}
                        label={assunto}
                        selected={selectedAssuntos.includes(assunto)}
                        available={true}
                        onClick={() => toggleAssunto(assunto)}
                      />
                    ))}
                    {filteredAssuntos.length === 0 && availableAssuntos.length > 0 && (
                      <p className="text-gray-500 text-sm text-center py-2">Nenhum assunto encontrado</p>
                    )}
                    {availableAssuntos.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-2">Nenhum assunto disponivel para as materias selecionadas</p>
                    )}
                  </div>
                </>
              )}
            </FilterSection>

            {/* Bancas */}
            <FilterSection
              title="Bancas"
              icon={<Building2 className="w-4 h-4" />}
              expanded={expandedSections.has('bancas')}
              onToggle={() => toggleSection('bancas')}
              selectedCount={selectedBancas.length}
              totalCount={allBancas.length}
            >
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchBancas}
                    onChange={(e) => setSearchBancas(e.target.value)}
                    placeholder="Buscar banca..."
                    className="w-full bg-brand-dark border border-white/10 pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-yellow/50 outline-none"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredBancas.map(banca => (
                  <FilterOption
                    key={banca}
                    label={formatBancaDisplay(banca)}
                    selected={selectedBancas.includes(banca)}
                    available={dynamicBancas.includes(banca)}
                    onClick={() => toggleBanca(banca)}
                  />
                ))}
                {filteredBancas.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">Nenhuma banca encontrada</p>
                )}
              </div>
            </FilterSection>

            {/* Anos */}
            <FilterSection
              title="Anos"
              icon={<Calendar className="w-4 h-4" />}
              expanded={expandedSections.has('anos')}
              onToggle={() => toggleSection('anos')}
              selectedCount={selectedAnos.length}
              totalCount={allAnos.length}
            >
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {filteredAnos.map(ano => (
                  <button
                    key={ano}
                    onClick={() => toggleAno(ano)}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      selectedAnos.includes(ano)
                        ? 'bg-brand-yellow text-brand-darker'
                        : 'bg-brand-dark border border-white/10 text-gray-300 hover:border-white/30'
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Orgaos */}
            <FilterSection
              title="Orgaos"
              icon={<FileText className="w-4 h-4" />}
              expanded={expandedSections.has('orgaos')}
              onToggle={() => toggleSection('orgaos')}
              selectedCount={selectedOrgaos.length}
              totalCount={allOrgaos.length}
            >
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchOrgaos}
                    onChange={(e) => setSearchOrgaos(e.target.value)}
                    placeholder="Buscar orgao..."
                    className="w-full bg-brand-dark border border-white/10 pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-yellow/50 outline-none"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredOrgaos.map(orgao => (
                  <FilterOption
                    key={orgao}
                    label={orgao}
                    selected={selectedOrgaos.includes(orgao)}
                    available={dynamicOrgaos.includes(orgao)}
                    onClick={() => toggleOrgao(orgao)}
                  />
                ))}
                {filteredOrgaos.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">Nenhum orgao encontrado</p>
                )}
              </div>
            </FilterSection>

            {/* Cargos */}
            <FilterSection
              title="Cargos"
              icon={<Briefcase className="w-4 h-4" />}
              expanded={expandedSections.has('cargos')}
              onToggle={() => toggleSection('cargos')}
              selectedCount={selectedCargos.length}
              totalCount={allCargos.length}
            >
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchCargos}
                    onChange={(e) => setSearchCargos(e.target.value)}
                    placeholder="Buscar cargo..."
                    className="w-full bg-brand-dark border border-white/10 pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-yellow/50 outline-none"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCargos.map(cargo => (
                  <FilterOption
                    key={cargo}
                    label={cargo}
                    selected={selectedCargos.includes(cargo)}
                    available={dynamicCargos.includes(cargo)}
                    onClick={() => toggleCargo(cargo)}
                  />
                ))}
                {filteredCargos.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">Nenhum cargo encontrado</p>
                )}
              </div>
            </FilterSection>

            {/* Escolaridade */}
            <FilterSection
              title="Escolaridade"
              icon={<GraduationCap className="w-4 h-4" />}
              expanded={expandedSections.has('escolaridade')}
              onToggle={() => toggleSection('escolaridade')}
              selectedCount={selectedEscolaridade.length}
              totalCount={OPTIONS_ESCOLARIDADE.length}
            >
              <div className="flex flex-wrap gap-2">
                {sortedEscolaridade.map(value => {
                  const opt = OPTIONS_ESCOLARIDADE.find(o => o.value === value);
                  return opt ? (
                    <button
                      key={opt.value}
                      onClick={() => toggleEscolaridade(opt.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedEscolaridade.includes(opt.value)
                          ? 'bg-brand-yellow text-brand-darker'
                          : 'bg-brand-dark border border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ) : null;
                })}
              </div>
            </FilterSection>

            {/* Modalidade (Tipo de Questao) */}
            <FilterSection
              title="Tipo de Questao"
              icon={<CheckCircle className="w-4 h-4" />}
              expanded={expandedSections.has('modalidade')}
              onToggle={() => toggleSection('modalidade')}
              selectedCount={selectedModalidade.length}
              totalCount={OPTIONS_MODALIDADE.length}
            >
              <div className="flex flex-wrap gap-2">
                {sortedModalidade.map(value => {
                  const opt = OPTIONS_MODALIDADE.find(o => o.value === value);
                  return opt ? (
                    <button
                      key={opt.value}
                      onClick={() => toggleModalidade(opt.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedModalidade.includes(opt.value)
                          ? 'bg-brand-yellow text-brand-darker'
                          : 'bg-brand-dark border border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ) : null;
                })}
              </div>
            </FilterSection>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-4 border-t border-white/10 bg-brand-dark/30">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loadingCount}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Salvar Filtros ({questionsCount})
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Componente de secao de filtro
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  selectedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  expanded,
  onToggle,
  selectedCount,
  totalCount,
  children
}) => (
  <div className="bg-brand-dark/50 border border-white/10 rounded-sm overflow-hidden">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-3 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-yellow">{icon}</span>
        <span className="text-white font-medium">{title}</span>
        {selectedCount > 0 && (
          <span className="bg-brand-yellow text-brand-darker text-xs px-2 py-0.5 font-bold">
            {selectedCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">{totalCount} opcoes</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>
    </button>
    {expanded && (
      <div className="p-3 pt-0 border-t border-white/5">
        {children}
      </div>
    )}
  </div>
);

// Componente de opcao de filtro
interface FilterOptionProps {
  label: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}

const FilterOption: React.FC<FilterOptionProps> = ({
  label,
  selected,
  available,
  onClick
}) => (
  <button
    onClick={onClick}
    disabled={!available && !selected}
    className={`flex items-center gap-2 w-full p-2 text-left text-sm transition-colors ${
      selected
        ? 'bg-brand-yellow/10 text-brand-yellow'
        : available
        ? 'text-gray-300 hover:bg-white/5 hover:text-white'
        : 'text-gray-600 cursor-not-allowed'
    }`}
  >
    <div className={`w-4 h-4 border flex items-center justify-center ${
      selected
        ? 'bg-brand-yellow border-brand-yellow'
        : 'border-gray-600'
    }`}>
      {selected && <Check className="w-3 h-3 text-brand-darker" />}
    </div>
    <span className="truncate">{label}</span>
  </button>
);

export default QuestionFilterSelector;
