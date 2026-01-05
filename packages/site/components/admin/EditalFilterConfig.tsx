import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Check, Loader2, Filter, AlertCircle } from 'lucide-react';
import { editalService, EditalItem } from '../../services/editalService';

interface EditalFilterConfigProps {
  item: EditalItem;
  banca?: string;
  onClose: () => void;
  onSave: () => void;
}

export const EditalFilterConfig: React.FC<EditalFilterConfigProps> = ({
  item,
  banca,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados das opções
  const [allMaterias, setAllMaterias] = useState<string[]>([]);
  const [allAssuntos, setAllAssuntos] = useState<{ assunto: string; materia: string }[]>([]);

  // Seleções
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>(item.filtro_materias || []);
  const [selectedAssuntos, setSelectedAssuntos] = useState<string[]>(item.filtro_assuntos || []);

  // Filtros de busca
  const [materiaSearch, setMateriaSearch] = useState('');
  const [assuntoSearch, setAssuntoSearch] = useState('');

  // Preview de questões
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [materias, assuntos] = await Promise.all([
          editalService.getDistinctMaterias(),
          editalService.getDistinctAssuntos()
        ]);
        setAllMaterias(materias);
        setAllAssuntos(assuntos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Atualizar contagem quando mudar seleção
  useEffect(() => {
    const updateCount = async () => {
      if (selectedMaterias.length === 0 && selectedAssuntos.length === 0) {
        setQuestionCount(null);
        return;
      }

      try {
        setCountLoading(true);
        const count = await editalService.countQuestoesByFilter(
          selectedMaterias.length > 0 ? selectedMaterias : undefined,
          selectedAssuntos.length > 0 ? selectedAssuntos : undefined,
          banca
        );
        setQuestionCount(count);
      } catch (error) {
        console.error('Erro ao contar questões:', error);
      } finally {
        setCountLoading(false);
      }
    };

    const timer = setTimeout(updateCount, 300);
    return () => clearTimeout(timer);
  }, [selectedMaterias, selectedAssuntos, banca]);

  // Filtrar matérias por busca
  const filteredMaterias = useMemo(() => {
    if (!materiaSearch) return allMaterias;
    const search = materiaSearch.toLowerCase();
    return allMaterias.filter(m => m.toLowerCase().includes(search));
  }, [allMaterias, materiaSearch]);

  // Filtrar assuntos por matérias selecionadas e busca
  const filteredAssuntos = useMemo(() => {
    let filtered = allAssuntos;

    // Se há matérias selecionadas, filtrar por elas
    if (selectedMaterias.length > 0) {
      filtered = filtered.filter(a => selectedMaterias.includes(a.materia));
    }

    // Aplicar busca
    if (assuntoSearch) {
      const search = assuntoSearch.toLowerCase();
      filtered = filtered.filter(a => a.assunto.toLowerCase().includes(search));
    }

    return filtered;
  }, [allAssuntos, selectedMaterias, assuntoSearch]);

  // Toggle matéria
  const toggleMateria = (materia: string) => {
    setSelectedMaterias(prev => {
      if (prev.includes(materia)) {
        return prev.filter(m => m !== materia);
      }
      return [...prev, materia];
    });
  };

  // Toggle assunto
  const toggleAssunto = (assunto: string) => {
    setSelectedAssuntos(prev => {
      if (prev.includes(assunto)) {
        return prev.filter(a => a !== assunto);
      }
      return [...prev, assunto];
    });
  };

  // Salvar
  const handleSave = async () => {
    try {
      setSaving(true);
      await editalService.updateFilters(item.id, {
        materias: selectedMaterias,
        assuntos: selectedAssuntos
      });
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  // Limpar seleções
  const clearAll = () => {
    setSelectedMaterias([]);
    setSelectedAssuntos([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-brand-card border border-white/10 p-8 rounded-sm">
          <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-sm flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2">
              <Filter className="w-5 h-5 text-brand-yellow" />
              Configurar Filtros
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Item: <span className="text-white">{item.titulo}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Matérias */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Matérias do Banco de Questões
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={materiaSearch}
                  onChange={(e) => setMateriaSearch(e.target.value)}
                  placeholder="Buscar matérias..."
                  className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedMaterias.length} selecionada(s)
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredMaterias.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Nenhuma matéria encontrada</p>
              ) : (
                filteredMaterias.map(materia => (
                  <button
                    key={materia}
                    onClick={() => toggleMateria(materia)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                      selectedMaterias.includes(materia)
                        ? 'bg-brand-yellow/20 text-brand-yellow'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selectedMaterias.includes(materia)
                        ? 'bg-brand-yellow border-brand-yellow'
                        : 'border-gray-600'
                    }`}>
                      {selectedMaterias.includes(materia) && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </div>
                    {materia}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Assuntos */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Assuntos (Filtrados pelas Matérias)
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={assuntoSearch}
                  onChange={(e) => setAssuntoSearch(e.target.value)}
                  placeholder="Buscar assuntos..."
                  className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedAssuntos.length} selecionado(s) de {filteredAssuntos.length} disponíveis
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {selectedMaterias.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">
                    Selecione pelo menos uma matéria para ver os assuntos disponíveis
                  </p>
                </div>
              ) : filteredAssuntos.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Nenhum assunto encontrado</p>
              ) : (
                filteredAssuntos.map(({ assunto, materia }) => (
                  <button
                    key={`${materia}-${assunto}`}
                    onClick={() => toggleAssunto(assunto)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                      selectedAssuntos.includes(assunto)
                        ? 'bg-brand-yellow/20 text-brand-yellow'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                      selectedAssuntos.includes(assunto)
                        ? 'bg-brand-yellow border-brand-yellow'
                        : 'border-gray-600'
                    }`}>
                      {selectedAssuntos.includes(assunto) && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </div>
                    <span className="truncate">{assunto}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="bg-brand-dark border border-white/10 px-4 py-2 rounded">
              {countLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Contando...</span>
                </div>
              ) : questionCount !== null ? (
                <p className="text-sm">
                  <span className="text-brand-yellow font-bold">{questionCount.toLocaleString()}</span>
                  <span className="text-gray-400"> questões disponíveis</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">Selecione filtros para ver o total</p>
              )}
            </div>

            {/* Limpar */}
            {(selectedMaterias.length > 0 || selectedAssuntos.length > 0) && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
