import React, { useState, useEffect } from 'react';
import {
    X,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Check,
    AlertTriangle,
    BookOpen,
    Target,
    RotateCcw,
    Zap,
    ChevronDown,
    ChevronRight,
    Loader2,
    Settings,
} from 'lucide-react';
import { MateriaPriorityList } from './MateriaPriorityList';
import {
    rodadasGeneratorService,
    MateriaOrdenada,
    ResultadoPriorizacao,
    ResultadoGeracao,
    RodadaGerada,
    ConfiguracaoGeracao,
} from '../../services/rodadasGeneratorService';

interface GerarRodadasModalProps {
    preparatorioId: string;
    preparatorioNome: string;
    banca?: string;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'prioridade' | 'config' | 'preview';

export const GerarRodadasModal: React.FC<GerarRodadasModalProps> = ({
    preparatorioId,
    preparatorioNome,
    banca,
    onClose,
    onSuccess,
}) => {
    const [step, setStep] = useState<Step>('prioridade');
    const [loading, setLoading] = useState(true);
    const [analisandoIA, setAnalisandoIA] = useState(false);
    const [gerando, setGerando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dados
    const [materias, setMaterias] = useState<MateriaOrdenada[]>([]);
    const [priorizacaoIA, setPriorizacaoIA] = useState<ResultadoPriorizacao | null>(null);
    const [preview, setPreview] = useState<ResultadoGeracao | null>(null);

    // Configuracao
    const [config, setConfig] = useState<ConfiguracaoGeracao>({
        missoes_por_rodada: 5,
        max_topicos_por_missao: 3,
        incluir_revisoes: true,
        incluir_simulado: true,
        gerar_filtros_questoes: true,
    });

    // Rodadas expandidas no preview
    const [expandedRodadas, setExpandedRodadas] = useState<Set<number>>(new Set([1]));

    // Carregar materias ao abrir
    useEffect(() => {
        loadMaterias();
    }, [preparatorioId]);

    const loadMaterias = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await rodadasGeneratorService.buscarMaterias(preparatorioId);
            setMaterias(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar materias');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalisarIA = async () => {
        try {
            setAnalisandoIA(true);
            setError(null);
            const resultado = await rodadasGeneratorService.analisarPrioridade(preparatorioId);
            setPriorizacaoIA(resultado);

            // Aplicar priorizacao automaticamente
            const materiasOrdenadas = rodadasGeneratorService.aplicarPriorizacao(materias, resultado);
            setMaterias(materiasOrdenadas);
        } catch (err: any) {
            setError(err.message || 'Erro ao analisar prioridade');
        } finally {
            setAnalisandoIA(false);
        }
    };

    const handleGerarPreview = async () => {
        try {
            setLoading(true);
            setError(null);
            const resultado = await rodadasGeneratorService.gerarPreview(
                preparatorioId,
                materias,
                config
            );
            setPreview(resultado);
            setStep('preview');
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar preview');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = async () => {
        try {
            setGerando(true);
            setError(null);
            await rodadasGeneratorService.gerarRodadas(
                preparatorioId,
                materias,
                config,
                banca,
                true
            );
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar rodadas');
            setGerando(false);
        }
    };

    const toggleRodada = (numero: number) => {
        const newExpanded = new Set(expandedRodadas);
        if (newExpanded.has(numero)) {
            newExpanded.delete(numero);
        } else {
            newExpanded.add(numero);
        }
        setExpandedRodadas(newExpanded);
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'padrao': return <BookOpen className="w-4 h-4" />;
            case 'revisao': return <RotateCcw className="w-4 h-4" />;
            case 'acao': return <Zap className="w-4 h-4" />;
            default: return <Target className="w-4 h-4" />;
        }
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'padrao': return 'text-blue-400 bg-blue-500/20';
            case 'revisao': return 'text-purple-400 bg-purple-500/20';
            case 'acao': return 'text-orange-400 bg-orange-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-brand-card border border-white/10 w-full max-w-3xl rounded-sm my-8">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <h3 className="text-xl font-bold text-white uppercase">
                                Gerar Rodadas com IA
                            </h3>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{preparatorioNome}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-white/10 bg-brand-dark/30">
                    <div className="flex items-center justify-center gap-4">
                        {[
                            { id: 'prioridade', label: 'Prioridade', num: 1 },
                            { id: 'config', label: 'Config', num: 2 },
                            { id: 'preview', label: 'Preview', num: 3 },
                        ].map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-2 ${step === s.id ? 'text-brand-yellow' : 'text-gray-500'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                        step === s.id
                                            ? 'border-brand-yellow bg-brand-yellow/20'
                                            : 'border-gray-600'
                                    }`}>
                                        {s.num}
                                    </span>
                                    <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                                </div>
                                {idx < 2 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Prioridade */}
                    {step === 'prioridade' && (
                        <div>
                            <div className="mb-4">
                                <h4 className="text-white font-bold mb-2">Ordenar Materias por Prioridade</h4>
                                <p className="text-gray-500 text-sm">
                                    Arraste as materias ou use os botoes para definir a ordem de estudo.
                                    As materias no topo terao mais peso no planejamento.
                                </p>
                            </div>

                            {/* Botao IA */}
                            <div className="mb-4">
                                <button
                                    onClick={handleAnalisarIA}
                                    disabled={analisandoIA || loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm rounded-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
                                >
                                    {analisandoIA ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Sugerir Ordem com IA
                                        </>
                                    )}
                                </button>
                                {priorizacaoIA && (
                                    <p className="text-purple-400 text-xs mt-2">
                                        {priorizacaoIA.analise_geral}
                                    </p>
                                )}
                            </div>

                            {/* Lista de Materias */}
                            <MateriaPriorityList
                                materias={materias}
                                priorizacaoIA={priorizacaoIA?.materias}
                                onChange={setMaterias}
                                loading={loading}
                            />

                            {materias.length === 0 && !loading && (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhuma materia com topicos encontrada no edital.</p>
                                    <p className="text-sm mt-2">Adicione materias e topicos ao edital primeiro.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Configuracao */}
                    {step === 'config' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5 text-gray-500" />
                                <h4 className="text-white font-bold">Configuracoes da Geracao</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                        Missoes por Rodada
                                    </label>
                                    <select
                                        value={config.missoes_por_rodada}
                                        onChange={(e) => setConfig({ ...config, missoes_por_rodada: Number(e.target.value) })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none"
                                    >
                                        {[3, 4, 5, 6, 7, 8, 10].map(n => (
                                            <option key={n} value={n}>{n} missoes</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                        Max Topicos por Missao
                                    </label>
                                    <select
                                        value={config.max_topicos_por_missao}
                                        onChange={(e) => setConfig({ ...config, max_topicos_por_missao: Number(e.target.value) })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none"
                                    >
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>{n} topico{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-brand-dark/50 border border-white/10 rounded-sm hover:border-white/20">
                                    <input
                                        type="checkbox"
                                        checked={config.incluir_revisoes}
                                        onChange={(e) => setConfig({ ...config, incluir_revisoes: e.target.checked })}
                                        className="w-4 h-4 accent-brand-yellow"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Incluir Missoes de Revisao</span>
                                        <p className="text-gray-500 text-xs">Adiciona revisao apos concluir cada materia</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-brand-dark/50 border border-white/10 rounded-sm hover:border-white/20">
                                    <input
                                        type="checkbox"
                                        checked={config.incluir_simulado}
                                        onChange={(e) => setConfig({ ...config, incluir_simulado: e.target.checked })}
                                        className="w-4 h-4 accent-brand-yellow"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Incluir Simulado por Rodada</span>
                                        <p className="text-gray-500 text-xs">Adiciona simulado ao final de cada rodada</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-brand-dark/50 border border-white/10 rounded-sm hover:border-white/20">
                                    <input
                                        type="checkbox"
                                        checked={config.gerar_filtros_questoes}
                                        onChange={(e) => setConfig({ ...config, gerar_filtros_questoes: e.target.checked })}
                                        className="w-4 h-4 accent-brand-yellow"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Gerar Filtros de Questoes</span>
                                        <p className="text-gray-500 text-xs">Vincula filtros para buscar questoes automaticamente</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 'preview' && preview && (
                        <div>
                            {/* Estatisticas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm text-center">
                                    <p className="text-2xl font-black text-brand-yellow">{preview.estatisticas.total_rodadas}</p>
                                    <p className="text-gray-500 text-xs uppercase">Rodadas</p>
                                </div>
                                <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm text-center">
                                    <p className="text-2xl font-black text-blue-400">{preview.estatisticas.missoes_estudo}</p>
                                    <p className="text-gray-500 text-xs uppercase">Estudo</p>
                                </div>
                                <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm text-center">
                                    <p className="text-2xl font-black text-purple-400">{preview.estatisticas.missoes_revisao}</p>
                                    <p className="text-gray-500 text-xs uppercase">Revisao</p>
                                </div>
                                <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm text-center">
                                    <p className="text-2xl font-black text-orange-400">{preview.estatisticas.missoes_simulado}</p>
                                    <p className="text-gray-500 text-xs uppercase">Simulado</p>
                                </div>
                            </div>

                            {/* Lista de Rodadas */}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {preview.rodadas.map((rodada) => (
                                    <div key={rodada.numero} className="border border-white/10 rounded-sm overflow-hidden">
                                        <button
                                            onClick={() => toggleRodada(rodada.numero)}
                                            className="w-full flex items-center justify-between p-3 bg-brand-dark/50 hover:bg-brand-dark/70 transition-colors"
                                        >
                                            <span className="text-white font-bold">{rodada.titulo}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-sm">{rodada.missoes.length} missoes</span>
                                                {expandedRodadas.has(rodada.numero) ? (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                )}
                                            </div>
                                        </button>

                                        {expandedRodadas.has(rodada.numero) && (
                                            <div className="divide-y divide-white/5">
                                                {rodada.missoes.map((missao, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-brand-card">
                                                        <span className="w-6 h-6 bg-brand-dark border border-white/10 rounded flex items-center justify-center text-xs text-white font-bold">
                                                            {missao.numero}
                                                        </span>
                                                        <span className={`p-1.5 rounded ${getTipoColor(missao.tipo)}`}>
                                                            {getTipoIcon(missao.tipo)}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm truncate">
                                                                {missao.tipo === 'acao'
                                                                    ? missao.acao?.split('\n')[0]
                                                                    : missao.tipo === 'revisao'
                                                                        ? missao.tema
                                                                        : missao.materia}
                                                            </p>
                                                            {missao.tipo === 'padrao' && missao.topico_ids.length > 0 && (
                                                                <p className="text-gray-500 text-xs">
                                                                    {missao.topico_ids.length} topico{missao.topico_ids.length > 1 ? 's' : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Aviso */}
                            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-3 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                <p className="text-yellow-500 text-sm">
                                    As rodadas existentes serao SUBSTITUIDAS ao confirmar.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-white/10">
                    <div>
                        {step !== 'prioridade' && (
                            <button
                                onClick={() => setStep(step === 'preview' ? 'config' : 'prioridade')}
                                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 font-bold uppercase text-sm hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>

                        {step === 'prioridade' && (
                            <button
                                onClick={() => setStep('config')}
                                disabled={materias.length === 0}
                                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                            >
                                Proximo
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 'config' && (
                            <button
                                onClick={handleGerarPreview}
                                disabled={loading}
                                className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-2 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        Ver Preview
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}

                        {step === 'preview' && (
                            <button
                                onClick={handleConfirmar}
                                disabled={gerando}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 font-bold uppercase text-sm hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
                            >
                                {gerando ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
