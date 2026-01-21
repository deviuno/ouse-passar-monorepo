import React, { useState, useEffect } from 'react';
import {
    Zap,
    DollarSign,
    Activity,
    Clock,
    AlertCircle,
    Brain,
    TrendingUp,
    RefreshCw,
    Loader2,
    ChevronDown,
    CloudCog,
    CheckCircle2,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

interface AIStats {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    totalCostUSD?: number;
    totalCostBRL?: number;
    totalRequests: number;
    avgLatencyMs: number;
    errorRate: number;
    errorCount: number;
}

interface ModelBreakdown {
    model: string;
    count: number;
    tokens: number;
    cost?: number;
    costUSD?: number;
    costBRL?: number;
}

interface UsageData {
    date: string;
    tokens: number;
    cost: number;
    requests: number;
}

interface Trace {
    id: string;
    name: string;
    timestamp: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalCost: number;
    status: string;
    model?: string;
}

interface BillingData {
    configured: boolean;
    totals?: {
        costUSD: number;
        costBRL: number;
    };
    dateRange?: {
        from: string;
        to: string;
    };
    skuBreakdown?: Array<{
        sku: string;
        costUSD: number;
        costBRL: number;
    }>;
    instructions?: {
        message: string;
        steps: string[];
        envExample: string;
    };
    error?: string;
}

const COLORS = ['#FFB800', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AIMetricsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
    const [stats, setStats] = useState<AIStats | null>(null);
    const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdown[]>([]);
    const [usageData, setUsageData] = useState<UsageData[]>([]);
    const [traces, setTraces] = useState<Trace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState<{ configured: boolean; message: string } | null>(null);
    const [usdToBrl, setUsdToBrl] = useState<number | null>(null);
    const [billingData, setBillingData] = useState<BillingData | null>(null);
    const [loadingBilling, setLoadingBilling] = useState(true);

    // Fetch USD to BRL exchange rate
    const fetchExchangeRate = async () => {
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
            const data = await response.json();
            if (data.USDBRL?.bid) {
                setUsdToBrl(parseFloat(data.USDBRL.bid));
            }
        } catch (err) {
            console.error('Error fetching exchange rate:', err);
        }
    };

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    // Fetch real billing data from Google Cloud
    const fetchBillingData = async () => {
        setLoadingBilling(true);
        try {
            const res = await fetch(`${MASTRA_URL}/api/admin/billing/vertex-costs?period=${period}`);
            const data = await res.json();
            setBillingData(data);
        } catch (err) {
            console.error('Error fetching billing data:', err);
            setBillingData({
                configured: false,
                error: 'Erro ao conectar com o servidor de billing'
            });
        } finally {
            setLoadingBilling(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [statsRes, usageRes, tracesRes, healthRes] = await Promise.all([
                fetch(`${MASTRA_URL}/api/admin/ai-metrics/stats?period=${period}`),
                fetch(`${MASTRA_URL}/api/admin/ai-metrics/usage-over-time?period=${period}`),
                fetch(`${MASTRA_URL}/api/admin/ai-metrics/traces?limit=20`),
                fetch(`${MASTRA_URL}/api/admin/ai-metrics/health`),
            ]);

            const [statsData, usageDataRes, tracesData, healthData] = await Promise.all([
                statsRes.json(),
                usageRes.json(),
                tracesRes.json(),
                healthRes.json(),
            ]);

            if (statsData.success) {
                setStats(statsData.stats);
                setModelBreakdown(statsData.modelBreakdown || []);
            }

            if (usageDataRes.success) {
                setUsageData(usageDataRes.data || []);
            }

            if (tracesData.success) {
                setTraces(tracesData.traces || []);
            }

            setHealthStatus(healthData);

            if (!healthData.configured) {
                setError('Langfuse não configurado. Verifique as variáveis de ambiente.');
            }
        } catch (err) {
            console.error('Error fetching AI metrics:', err);
            setError('Erro ao carregar métricas. Verifique se o servidor está rodando.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchBillingData();
    }, [period]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatCurrency = (value: number): string => {
        return `$${value.toFixed(4)}`;
    };

    const formatBrl = (usdValue: number, decimals: number = 2): string => {
        if (!usdToBrl) return '-';
        const brlValue = usdValue * usdToBrl;
        // Use more decimals for very small values
        const actualDecimals = brlValue < 0.01 ? Math.max(decimals, 4) : decimals;
        return `R$ ${brlValue.toFixed(actualDecimals).replace('.', ',')}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Métricas de IA</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Monitoramento de uso de tokens e custos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <div className="relative">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                            className="appearance-none bg-brand-card border border-white/10 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:border-brand-yellow"
                        >
                            <option value="day">Últimas 24h</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Últimos 30 dias</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        className="p-2 bg-brand-card border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        title="Atualizar dados"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-400 font-medium">Erro de Configuração</p>
                        <p className="text-red-400/80 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Real Billing Card - Google Cloud */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <CloudCog className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Custo Real - Google Cloud</h2>
                            <p className="text-sm text-gray-400">Dados do BigQuery Billing Export</p>
                        </div>
                    </div>
                    {billingData?.configured && (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Configurado</span>
                        </div>
                    )}
                </div>

                {loadingBilling ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                    </div>
                ) : billingData?.configured && billingData.totals ? (
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-4">
                            <div>
                                <p className="text-4xl font-bold text-green-400">
                                    R$ {billingData.totals.costBRL.toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    ${billingData.totals.costUSD.toFixed(4)} USD
                                </p>
                            </div>
                            {billingData.dateRange && (
                                <div className="text-xs text-gray-500">
                                    <p>Período: {billingData.dateRange.from} até {billingData.dateRange.to}</p>
                                </div>
                            )}
                        </div>

                        {billingData.skuBreakdown && billingData.skuBreakdown.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-400 uppercase font-medium mb-2">Detalhamento por SKU</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {billingData.skuBreakdown.slice(0, 5).map((sku, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-400 truncate max-w-[70%]">{sku.sku}</span>
                                            <span className="text-green-400">R$ {sku.costBRL.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <XCircle className="w-5 h-5" />
                            <span className="font-medium">BigQuery Billing não configurado</span>
                        </div>

                        {billingData?.instructions ? (
                            <div className="bg-black/20 rounded-lg p-4 space-y-3">
                                <p className="text-sm text-gray-300">{billingData.instructions.message}</p>
                                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                                    {billingData.instructions.steps.map((step, idx) => (
                                        <li key={idx}>{step}</li>
                                    ))}
                                </ol>
                                <div className="mt-3 p-2 bg-black/30 rounded font-mono text-xs text-gray-500 break-all">
                                    {billingData.instructions.envExample}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Configure o BigQuery billing export para ver os custos reais da Vertex AI.
                            </p>
                        )}

                        <a
                            href="https://console.cloud.google.com/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir Google Cloud Billing Console
                        </a>
                    </div>
                )}
            </div>

            {/* Estimated Stats Cards (from Langfuse) */}
            {stats && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-medium px-1">
                        Estimativas baseadas em traces (Langfuse)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Tokens */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-gray-400 text-sm font-medium">Tokens Totais</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatNumber(stats.totalTokens)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatNumber(stats.inputTokens)} input / {formatNumber(stats.outputTokens)} output
                        </p>
                    </div>

                    {/* Total Cost */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-gray-400 text-sm font-medium">Custo Total</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.totalCostBRL !== undefined
                                ? `R$ ${stats.totalCostBRL.toFixed(2).replace('.', ',')}`
                                : formatCurrency(stats.totalCost || 0)
                            }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.totalCostUSD !== undefined ? (
                                <span className="text-gray-400">${stats.totalCostUSD.toFixed(4)} USD</span>
                            ) : usdToBrl && stats.totalCost ? (
                                <span className="text-green-400">{formatBrl(stats.totalCost)}</span>
                            ) : (
                                'Preços Vertex AI'
                            )}
                        </p>
                    </div>

                    {/* Total Requests */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-gray-400 text-sm font-medium">Requisições</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatNumber(stats.totalRequests)}</p>
                        <p className="text-xs text-gray-500 mt-1">chamadas de API</p>
                    </div>

                    {/* Avg Latency */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <span className="text-gray-400 text-sm font-medium">Latência Média</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.avgLatencyMs}ms</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.errorCount} erros ({stats.errorRate.toFixed(1)}%)
                        </p>
                    </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Over Time Chart */}
                <div className="bg-brand-card border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-brand-yellow" />
                        Uso ao Longo do Tempo
                    </h3>
                    {usageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={usageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    stroke="#666"
                                    fontSize={12}
                                />
                                <YAxis stroke="#666" fontSize={12} tickFormatter={formatNumber} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1A1A1A',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={((value: number, name: string) => [
                                        name === 'tokens' ? formatNumber(value) : formatCurrency(value),
                                        name === 'tokens' ? 'Tokens' : 'Custo',
                                    ]) as any}
                                    labelFormatter={formatDate}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="tokens"
                                    name="Tokens"
                                    stroke="#FFB800"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="requests"
                                    name="Requests"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">
                            Nenhum dado disponível para o período
                        </div>
                    )}
                </div>

                {/* Model Breakdown Chart */}
                <div className="bg-brand-card border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-brand-yellow" />
                        Uso por Modelo
                    </h3>
                    {modelBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={modelBreakdown as any}
                                    dataKey="count"
                                    nameKey="model"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(props: any) => {
                                        const { payload, percent } = props;
                                        if (!payload?.model) return '';
                                        return `${payload.model.split('/').pop()}: ${((percent || 0) * 100).toFixed(0)}%`;
                                    }}
                                    labelLine={false}
                                >
                                    {modelBreakdown.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1A1A1A',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                    }}
                                    formatter={((value: number, _name: string, props: any) => [
                                        `${value} requests (${formatNumber(props.payload?.tokens || 0)} tokens)`,
                                        props.payload?.model || '',
                                    ]) as any}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">
                            Nenhum dado disponível
                        </div>
                    )}
                </div>
            </div>

            {/* Model Breakdown Table */}
            {modelBreakdown.length > 0 && (
                <div className="bg-brand-card border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-white font-medium">Detalhamento por Modelo</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="text-left text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Modelo
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Requests
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Tokens
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Custo
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {modelBreakdown.map((item, index) => (
                                    <tr
                                        key={item.model}
                                        className="border-t border-white/5 hover:bg-white/5"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor: COLORS[index % COLORS.length],
                                                    }}
                                                />
                                                <span className="text-white text-sm">{item.model}</span>
                                            </div>
                                        </td>
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {formatNumber(item.count)}
                                        </td>
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {formatNumber(item.tokens)}
                                        </td>
                                        <td className="text-right text-sm px-4 py-3">
                                            {item.costBRL !== undefined ? (
                                                <span className="text-green-400">R$ {item.costBRL.toFixed(2).replace('.', ',')}</span>
                                            ) : item.costUSD !== undefined ? (
                                                <>
                                                    <span className="text-gray-300">${item.costUSD.toFixed(4)}</span>
                                                    {usdToBrl && (
                                                        <span className="text-green-400 ml-2">({formatBrl(item.costUSD)})</span>
                                                    )}
                                                </>
                                            ) : item.cost !== undefined ? (
                                                <>
                                                    <span className="text-gray-300">{formatCurrency(item.cost)}</span>
                                                    {usdToBrl && (
                                                        <span className="text-green-400 ml-2">({formatBrl(item.cost)})</span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Traces */}
            {traces.length > 0 && (
                <div className="bg-brand-card border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-white font-medium">Tarefas Recentes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="text-left text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Nome
                                    </th>
                                    <th className="text-left text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Modelo
                                    </th>
                                    <th className="text-left text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Data
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Latência
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Tokens
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Custo (R$)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {traces.slice(0, 10).map((trace) => {
                                    const tokens = trace.totalTokens || (trace.inputTokens + trace.outputTokens);
                                    return (
                                        <tr
                                            key={trace.id}
                                            className="border-t border-white/5 hover:bg-white/5"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="text-white text-sm">
                                                    {trace.name || 'Unnamed'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-gray-400 text-xs font-mono">
                                                    {trace.model ? trace.model.split('/').pop() : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-gray-400 text-sm">
                                                    {formatTimestamp(trace.timestamp)}
                                                </span>
                                            </td>
                                            <td className="text-right text-gray-300 text-sm px-4 py-3">
                                                {trace.latencyMs ? `${trace.latencyMs}ms` : '-'}
                                            </td>
                                            <td className="text-right text-gray-300 text-sm px-4 py-3">
                                                {tokens > 0 ? formatNumber(tokens) : '-'}
                                            </td>
                                            <td className="text-right text-sm px-4 py-3">
                                                <span className="text-green-400">
                                                    {trace.totalCost > 0 ? formatBrl(trace.totalCost, 4) : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIMetricsDashboard;
