/**
 * Routes for AI Metrics Dashboard
 *
 * Fetches data from Langfuse API to display token usage,
 * costs, and performance metrics in the admin panel.
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Langfuse API configuration
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;

// Helper to make authenticated requests to Langfuse API
async function langfuseRequest(endpoint: string, options: RequestInit = {}) {
    if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
        throw new Error('Langfuse credentials not configured');
    }

    const auth = Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64');

    const response = await fetch(`${LANGFUSE_BASE_URL}/api/public${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Langfuse API error: ${response.status} - ${error}`);
    }

    return response.json();
}

// Helper to get date range based on period
function getDateRange(period: string): { from: Date; to: Date } {
    const now = new Date();
    const to = now;
    let from: Date;

    switch (period) {
        case 'day':
            from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { from, to };
}

/**
 * GET /api/admin/ai-metrics/stats
 * Returns aggregated statistics for the dashboard
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'week';
        const { from, to } = getDateRange(period);

        // Fetch observations (generations) from Langfuse
        const observations = await langfuseRequest(
            `/observations?type=GENERATION&fromTimestamp=${from.toISOString()}&toTimestamp=${to.toISOString()}&limit=1000`
        );

        const data = observations.data || [];

        // Calculate aggregated stats
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;
        let totalRequests = data.length;
        let totalLatency = 0;
        let errorCount = 0;
        const modelUsage: Record<string, { count: number; tokens: number; cost: number }> = {};

        for (const obs of data) {
            // Token usage
            const inputTokens = obs.usage?.input || obs.usage?.promptTokens || 0;
            const outputTokens = obs.usage?.output || obs.usage?.completionTokens || 0;
            totalInputTokens += inputTokens;
            totalOutputTokens += outputTokens;

            // Cost
            const cost = obs.calculatedTotalCost || 0;
            totalCost += cost;

            // Latency
            if (obs.startTime && obs.endTime) {
                const start = new Date(obs.startTime).getTime();
                const end = new Date(obs.endTime).getTime();
                totalLatency += (end - start);
            }

            // Errors
            if (obs.level === 'ERROR' || obs.statusMessage?.toLowerCase().includes('error')) {
                errorCount++;
            }

            // Model usage breakdown
            const model = obs.model || obs.modelId || 'unknown';
            if (!modelUsage[model]) {
                modelUsage[model] = { count: 0, tokens: 0, cost: 0 };
            }
            modelUsage[model].count++;
            modelUsage[model].tokens += inputTokens + outputTokens;
            modelUsage[model].cost += cost;
        }

        const avgLatency = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;
        const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

        // Sort models by usage
        const modelBreakdown = Object.entries(modelUsage)
            .map(([model, stats]) => ({
                model,
                ...stats,
            }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            period,
            stats: {
                totalTokens: totalInputTokens + totalOutputTokens,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
                totalRequests,
                avgLatencyMs: avgLatency,
                errorRate: Math.round(errorRate * 100) / 100,
                errorCount,
            },
            modelBreakdown,
        });
    } catch (error) {
        console.error('[AI Metrics] Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch AI metrics',
        });
    }
});

/**
 * GET /api/admin/ai-metrics/traces
 * Returns recent traces with details
 */
router.get('/traces', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const page = parseInt(req.query.page as string) || 1;

        // Fetch traces from Langfuse
        const traces = await langfuseRequest(`/traces?limit=${limit}&page=${page}`);

        const formattedTraces = (traces.data || []).map((trace: any) => ({
            id: trace.id,
            name: trace.name,
            timestamp: trace.timestamp,
            latencyMs: trace.latency,
            inputTokens: trace.usage?.input || trace.usage?.promptTokens || 0,
            outputTokens: trace.usage?.output || trace.usage?.completionTokens || 0,
            totalCost: trace.calculatedTotalCost || 0,
            status: trace.level || 'DEFAULT',
            metadata: trace.metadata,
        }));

        res.json({
            success: true,
            traces: formattedTraces,
            pagination: {
                page,
                limit,
                totalItems: traces.meta?.totalItems || formattedTraces.length,
            },
        });
    } catch (error) {
        console.error('[AI Metrics] Error fetching traces:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch traces',
        });
    }
});

/**
 * GET /api/admin/ai-metrics/usage-over-time
 * Returns usage data aggregated by day for charts
 */
router.get('/usage-over-time', async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'week';
        const { from, to } = getDateRange(period);

        // Fetch observations from Langfuse
        const observations = await langfuseRequest(
            `/observations?type=GENERATION&fromTimestamp=${from.toISOString()}&toTimestamp=${to.toISOString()}&limit=1000`
        );

        const data = observations.data || [];

        // Aggregate by day
        const dailyStats: Record<string, {
            date: string;
            tokens: number;
            cost: number;
            requests: number;
        }> = {};

        for (const obs of data) {
            const date = new Date(obs.startTime || obs.createdAt).toISOString().split('T')[0];

            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    tokens: 0,
                    cost: 0,
                    requests: 0,
                };
            }

            const inputTokens = obs.usage?.input || obs.usage?.promptTokens || 0;
            const outputTokens = obs.usage?.output || obs.usage?.completionTokens || 0;

            dailyStats[date].tokens += inputTokens + outputTokens;
            dailyStats[date].cost += obs.calculatedTotalCost || 0;
            dailyStats[date].requests++;
        }

        // Convert to sorted array
        const usageData = Object.values(dailyStats)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(day => ({
                ...day,
                cost: Math.round(day.cost * 10000) / 10000,
            }));

        res.json({
            success: true,
            period,
            data: usageData,
        });
    } catch (error) {
        console.error('[AI Metrics] Error fetching usage over time:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch usage data',
        });
    }
});

/**
 * GET /api/admin/ai-metrics/health
 * Check if Langfuse is properly configured
 */
router.get('/health', async (_req: Request, res: Response) => {
    try {
        if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
            return res.json({
                success: false,
                configured: false,
                message: 'Langfuse credentials not configured',
            });
        }

        // Try to fetch a single trace to verify connection
        await langfuseRequest('/traces?limit=1');

        res.json({
            success: true,
            configured: true,
            message: 'Langfuse connection successful',
        });
    } catch (error) {
        res.json({
            success: false,
            configured: true,
            message: error instanceof Error ? error.message : 'Failed to connect to Langfuse',
        });
    }
});

export function createAIMetricsRoutes() {
    return router;
}

export default router;
