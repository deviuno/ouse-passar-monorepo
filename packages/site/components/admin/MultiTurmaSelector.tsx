import { useState, useEffect } from 'react';
import { Check, ChevronDown, AlertCircle, Loader2, Plus } from 'lucide-react';
import {
  missoesService,
  PreparatorioWithRodadas,
  MultiTurmaTarget
} from '../../services/preparatoriosService';

interface MultiTurmaSelectorProps {
  currentPreparatorioId: string;
  preparatorios: PreparatorioWithRodadas[];
  selectedTargets: MultiTurmaTarget[];
  onTargetsChange: (targets: MultiTurmaTarget[]) => void;
  loading?: boolean;
}

export function MultiTurmaSelector({
  currentPreparatorioId,
  preparatorios,
  selectedTargets,
  onTargetsChange,
  loading = false
}: MultiTurmaSelectorProps) {
  const [nextMissaoNumbers, setNextMissaoNumbers] = useState<Record<string, string>>({});
  const [loadingNumbers, setLoadingNumbers] = useState<Record<string, boolean>>({});

  // Filtrar o preparatório atual da lista
  const availablePreparatorios = preparatorios.filter(p => p.id !== currentPreparatorioId);

  // Buscar próximo número de missão quando rodada é selecionada
  const fetchNextMissaoNumber = async (rodadaId: string) => {
    if (rodadaId === 'new') return '1'; // Nova rodada sempre começa com missão 1
    if (nextMissaoNumbers[rodadaId]) return nextMissaoNumbers[rodadaId];

    setLoadingNumbers(prev => ({ ...prev, [rodadaId]: true }));
    try {
      const nextNum = await missoesService.getNextMissaoNumero(rodadaId);
      setNextMissaoNumbers(prev => ({ ...prev, [rodadaId]: nextNum }));
      return nextNum;
    } catch (err) {
      console.error('Erro ao buscar próximo número:', err);
      return '1';
    } finally {
      setLoadingNumbers(prev => ({ ...prev, [rodadaId]: false }));
    }
  };

  // Calcular próximo número de rodada para um preparatório
  const getNextRodadaNumero = (prep: PreparatorioWithRodadas): number => {
    if (prep.rodadas.length === 0) return 1;
    return Math.max(...prep.rodadas.map(r => r.numero)) + 1;
  };

  // Toggle seleção de preparatório
  const togglePreparatorio = async (prep: PreparatorioWithRodadas) => {
    const isSelected = selectedTargets.some(t => t.preparatorioId === prep.id);

    if (isSelected) {
      // Remover
      onTargetsChange(selectedTargets.filter(t => t.preparatorioId !== prep.id));
    } else {
      // Adicionar
      if (prep.rodadas.length > 0) {
        // Tem rodadas: usar a primeira
        const firstRodada = prep.rodadas[0];
        const nextNum = await fetchNextMissaoNumber(firstRodada.id);

        onTargetsChange([
          ...selectedTargets,
          {
            preparatorioId: prep.id,
            preparatorioNome: prep.nome,
            rodadaId: firstRodada.id,
            rodadaNumero: firstRodada.numero,
            missaoNumero: nextNum
          }
        ]);
      } else {
        // Sem rodadas: criar nova
        const nextRodadaNum = getNextRodadaNumero(prep);
        onTargetsChange([
          ...selectedTargets,
          {
            preparatorioId: prep.id,
            preparatorioNome: prep.nome,
            rodadaId: 'new',
            rodadaNumero: nextRodadaNum,
            missaoNumero: '1',
            novaRodada: {
              numero: nextRodadaNum,
              titulo: ''
            }
          }
        ]);
      }
    }
  };

  // Atualizar rodada de um target
  const updateTargetRodada = async (prepId: string, rodadaId: string, rodadaNumero: number, prep: PreparatorioWithRodadas) => {
    if (rodadaId === 'new') {
      // Criar nova rodada
      const nextRodadaNum = getNextRodadaNumero(prep);
      onTargetsChange(
        selectedTargets.map(t =>
          t.preparatorioId === prepId
            ? {
                ...t,
                rodadaId: 'new',
                rodadaNumero: nextRodadaNum,
                missaoNumero: '1',
                novaRodada: {
                  numero: nextRodadaNum,
                  titulo: ''
                }
              }
            : t
        )
      );
    } else {
      const nextNum = await fetchNextMissaoNumber(rodadaId);
      onTargetsChange(
        selectedTargets.map(t =>
          t.preparatorioId === prepId
            ? { ...t, rodadaId, rodadaNumero, missaoNumero: nextNum, novaRodada: undefined }
            : t
        )
      );
    }
  };

  // Atualizar número da missão de um target
  const updateTargetMissaoNumero = (prepId: string, missaoNumero: string) => {
    onTargetsChange(
      selectedTargets.map(t =>
        t.preparatorioId === prepId
          ? { ...t, missaoNumero }
          : t
      )
    );
  };

  // Atualizar dados da nova rodada
  const updateNovaRodada = (prepId: string, field: 'numero' | 'titulo', value: string | number) => {
    onTargetsChange(
      selectedTargets.map(t =>
        t.preparatorioId === prepId && t.novaRodada
          ? {
              ...t,
              rodadaNumero: field === 'numero' ? Number(value) : t.rodadaNumero,
              novaRodada: {
                ...t.novaRodada,
                [field]: field === 'numero' ? Number(value) : value
              }
            }
          : t
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando turmas...
      </div>
    );
  }

  if (availablePreparatorios.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Não há outros preparatórios disponíveis</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-2">
        Selecione os preparatórios onde esta missão será criada:
      </div>

      {availablePreparatorios.map(prep => {
        const isSelected = selectedTargets.some(t => t.preparatorioId === prep.id);
        const target = selectedTargets.find(t => t.preparatorioId === prep.id);
        const hasRodadas = prep.rodadas.length > 0;
        const isCreatingNewRodada = target?.rodadaId === 'new';

        return (
          <div
            key={prep.id}
            className={`border rounded-lg p-3 transition-colors ${
              isSelected
                ? 'border-[#FFB800] bg-[#FFB800]/5'
                : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
            }`}
          >
            {/* Header com checkbox */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => togglePreparatorio(prep)}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-[#FFB800] border-[#FFB800]'
                    : 'border-[#4A4A4A]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </div>

              <span className="font-medium text-white flex-1">
                {prep.nome}
              </span>

              {hasRodadas ? (
                <span className="text-xs text-gray-500">
                  {prep.rodadas.length} rodada{prep.rodadas.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Criar rodada
                </span>
              )}
            </div>

            {/* Opções de rodada e missão (se selecionado) */}
            {isSelected && target && (
              <div className="mt-3 pl-8 space-y-3">
                <div className="flex flex-wrap gap-3">
                  {/* Select de rodada */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Rodada:</label>
                    <div className="relative">
                      <select
                        value={isCreatingNewRodada ? 'new' : target.rodadaId}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'new') {
                            updateTargetRodada(prep.id, 'new', getNextRodadaNumero(prep), prep);
                          } else {
                            const rodada = prep.rodadas.find(r => r.id === value);
                            if (rodada) {
                              updateTargetRodada(prep.id, rodada.id, rodada.numero, prep);
                            }
                          }
                        }}
                        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded px-3 py-1.5 pr-8 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#FFB800]"
                      >
                        {prep.rodadas.map(rodada => (
                          <option key={rodada.id} value={rodada.id}>
                            {rodada.numero}ª ({rodada.titulo || `Rodada ${rodada.numero}`})
                          </option>
                        ))}
                        <option value="new">+ Criar nova rodada</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Input de número da missão (se não estiver criando nova rodada) */}
                  {!isCreatingNewRodada && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Missão:</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={target.missaoNumero}
                          onChange={(e) => updateTargetMissaoNumero(prep.id, e.target.value)}
                          className="bg-[#2A2A2A] border border-[#3A3A3A] rounded px-3 py-1.5 w-20 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                          placeholder="Nº"
                        />
                        {loadingNumbers[target.rodadaId] && (
                          <Loader2 className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campos para nova rodada */}
                {isCreatingNewRodada && target.novaRodada && (
                  <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#FFB800]">
                      <Plus className="w-3 h-3" />
                      Nova rodada será criada
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Número da rodada</label>
                        <input
                          type="number"
                          min="1"
                          value={target.novaRodada.numero}
                          onChange={(e) => updateNovaRodada(prep.id, 'numero', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Título (opcional)</label>
                        <input
                          type="text"
                          value={target.novaRodada.titulo || ''}
                          onChange={(e) => updateNovaRodada(prep.id, 'titulo', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                          placeholder={`Rodada ${target.novaRodada.numero}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Missão:</label>
                      <input
                        type="text"
                        value={target.missaoNumero}
                        onChange={(e) => updateTargetMissaoNumero(prep.id, e.target.value)}
                        className="bg-[#1A1A1A] border border-[#3A3A3A] rounded px-3 py-1.5 w-20 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                        placeholder="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Resumo */}
      {selectedTargets.length > 0 && (
        <div className="mt-4 p-3 bg-[#1A1A1A] rounded-lg border border-[#3A3A3A]">
          <div className="text-sm text-gray-400">
            A missão será criada em <span className="text-[#FFB800] font-medium">{selectedTargets.length + 1}</span> preparatórios:
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="text-gray-300">• Preparatório atual (missão original)</li>
            {selectedTargets.map(t => (
              <li key={t.preparatorioId} className="text-gray-300">
                • {t.preparatorioNome} → {t.rodadaId === 'new' ? (
                  <span className="text-[#FFB800]">Nova Rodada {t.novaRodada?.numero}</span>
                ) : (
                  <>Rodada {t.rodadaNumero}</>
                )}, Missão {t.missaoNumero}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MultiTurmaSelector;
