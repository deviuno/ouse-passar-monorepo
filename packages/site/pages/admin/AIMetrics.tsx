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
    totalRequests: number;
    avgLatencyMs: number;
    errorRate: number;
    errorCount: number;
}

interface ModelBreakdown {
    model: string;
    count: number;
    tokens: number;
    cost: number;
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
    totalCost: number;
    status: string;
}

const COLORS = ['#FFB800', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AIMetricsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [stats, setStats] = useState<AIStats | null>(null);
    const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdown[]>([]);
    const [usageData, setUsageData] = useState<UsageData[]>([]);
    const [traces, setTraces] = useState<Trace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState<{ configured: boolean; message: string } | null>(null);

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
    }, [period]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatCurrency = (value: number): string => {
        return `$${value.toFixed(4)}`;
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

            {/* Stats Cards */}
            {stats && (
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
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalCost)}</p>
                        <p className="text-xs text-gray-500 mt-1">USD estimado</p>
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
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {formatCurrency(item.cost)}
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
                                        Data
                                    </th>
                                    <th className="text-right text-gray-400 text-xs font-medium uppercase px-4 py-3">
                                        Latência
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
                                {traces.slice(0, 10).map((trace) => (
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
                                            <span className="text-gray-400 text-sm">
                                                {formatTimestamp(trace.timestamp)}
                                            </span>
                                        </td>
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {trace.latencyMs ? `${trace.latencyMs}ms` : '-'}
                                        </td>
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {formatNumber(trace.inputTokens + trace.outputTokens)}
                                        </td>
                                        <td className="text-right text-gray-300 text-sm px-4 py-3">
                                            {formatCurrency(trace.totalCost)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIMetricsDashboard;
