/**
 * Routes for AI Metrics Dashboard
 *
 * Fetches data from Langfuse API to display token usage,
 * costs, and performance metrics in the admin panel.
 *
 * IMPORTANT: Costs are calculated using Vertex AI pricing, not Langfuse's calculatedTotalCost
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Langfuse API configuration
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;

// Vertex AI Pricing (USD per 1M tokens) - Updated January 2025
// Source: https://cloud.google.com/vertex-ai/generative-ai/pricing
const VERTEX_PRICING: Record<string, { input: number; output: number }> = {
    // Gemini 2.5 Flash-Lite (most economical)
    'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
    // Gemini 2.5 Flash
    'gemini-2.5-flash': { input: 0.15, output: 0.60 },
    'gemini-2.5-flash-preview-tts': { input: 0.15, output: 0.60 },
    // Gemini 2.5 Pro
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
    // Gemini 2.0 Flash (legacy)
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
    // Gemini 1.5 (legacy)
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    // Default fallback
    'default': { input: 0.15, output: 0.60 },
};

// USD to BRL exchange rate (updated periodically)
const USD_TO_BRL = 6.0;

// Calculate cost in USD based on Vertex AI pricing
function calculateCostUSD(model: string, inputTokens: number, outputTokens: number): number {
    // Normalize model name
    const normalizedModel = model.toLowerCase().replace(/^models\//, '');

    // Find matching pricing
    let pricing = VERTEX_PRICING['default'];
    for (const [key, value] of Object.entries(VERTEX_PRICING)) {
        if (normalizedModel.includes(key)) {
            pricing = value;
            break;
        }
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
}

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

// Fetch ALL observations with pagination
async function fetchAllObservations(from: Date, to: Date, maxPages: number = 100): Promise<any[]> {
    const allData: any[] = [];
    let page = 1;
    const limit = 100; // Langfuse max per page

    while (page <= maxPages) {
        try {
            const result = await langfuseRequest(
                `/observations?type=GENERATION&fromTimestamp=${from.toISOString()}&toTimestamp=${to.toISOString()}&limit=${limit}&page=${page}`
            );

            const data = result.data || [];
            allData.push(...data);

            // Check if there are more pages
            const totalItems = result.meta?.totalItems || 0;
            const fetchedSoFar = page * limit;

            if (data.length < limit || fetchedSoFar >= totalItems) {
                break; // No more data
            }

            page++;
        } catch (error) {
            console.error(`[AI Metrics] Error fetching page ${page}:`, error);
            break;
        }
    }

    console.log(`[AI Metrics] Fetched ${allData.length} observations from ${page} pages`);
    return allData;
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

        // Fetch ALL observations with pagination
        const data = await fetchAllObservations(from, to);

        // Calculate aggregated stats
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCostUSD = 0;
        let totalRequests = data.length;
        let totalLatency = 0;
        let errorCount = 0;
        const modelUsage: Record<string, { count: number; inputTokens: number; outputTokens: number; costUSD: number }> = {};

        for (const obs of data) {
            // Token usage
            const inputTokens = obs.usage?.input || obs.usage?.promptTokens || 0;
            const outputTokens = obs.usage?.output || obs.usage?.completionTokens || 0;
            totalInputTokens += inputTokens;
            totalOutputTokens += outputTokens;

            // Get model name
            const model = obs.model || obs.modelId || 'unknown';

            // Calculate cost using Vertex AI pricing
            const costUSD = calculateCostUSD(model, inputTokens, outputTokens);
            totalCostUSD += costUSD;

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
            if (!modelUsage[model]) {
                modelUsage[model] = { count: 0, inputTokens: 0, outputTokens: 0, costUSD: 0 };
            }
            modelUsage[model].count++;
            modelUsage[model].inputTokens += inputTokens;
            modelUsage[model].outputTokens += outputTokens;
            modelUsage[model].costUSD += costUSD;
        }

        const avgLatency = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;
        const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

        // Sort models by usage
        const modelBreakdown = Object.entries(modelUsage)
            .map(([model, stats]) => ({
                model,
                count: stats.count,
                tokens: stats.inputTokens + stats.outputTokens,
                inputTokens: stats.inputTokens,
                outputTokens: stats.outputTokens,
                costUSD: Math.round(stats.costUSD * 10000) / 10000,
                costBRL: Math.round(stats.costUSD * USD_TO_BRL * 100) / 100,
            }))
            .sort((a, b) => b.count - a.count);

        // Convert to BRL
        const totalCostBRL = totalCostUSD * USD_TO_BRL;

        res.json({
            success: true,
            period,
            stats: {
                totalTokens: totalInputTokens + totalOutputTokens,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalCostUSD: Math.round(totalCostUSD * 10000) / 10000,
                totalCostBRL: Math.round(totalCostBRL * 100) / 100,
                totalCost: Math.round(totalCostBRL * 100) / 100, // BRL for backward compatibility
                totalRequests,
                avgLatencyMs: avgLatency,
                errorRate: Math.round(errorRate * 100) / 100,
                errorCount,
            },
            modelBreakdown,
            pricing: {
                source: 'Vertex AI',
                currency: 'BRL',
                exchangeRate: USD_TO_BRL,
            },
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
 * Returns recent observations (generations) with details
 */
router.get('/traces', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const page = parseInt(req.query.page as string) || 1;

        // Fetch observations from Langfuse
        const observations = await langfuseRequest(`/observations?type=GENERATION&limit=${limit}&page=${page}`);

        const formattedTraces = (observations.data || []).map((obs: any) => {
            // Calculate latency from start/end time
            let latencyMs = 0;
            if (obs.startTime && obs.endTime) {
                const start = new Date(obs.startTime).getTime();
                const end = new Date(obs.endTime).getTime();
                latencyMs = end - start;
            } else if (obs.latency) {
                latencyMs = obs.latency;
            }

            // Get token usage
            const inputTokens = obs.usage?.input || obs.usage?.promptTokens || obs.promptTokens || 0;
            const outputTokens = obs.usage?.output || obs.usage?.completionTokens || obs.completionTokens || 0;
            const totalTokens = obs.usage?.total || obs.totalTokens || (inputTokens + outputTokens);

            // Get model and calculate cost
            const model = obs.model || obs.modelId || 'unknown';
            const costUSD = calculateCostUSD(model, inputTokens, outputTokens);
            const costBRL = costUSD * USD_TO_BRL;

            return {
                id: obs.id,
                name: obs.name || obs.model || 'generation',
                timestamp: obs.startTime || obs.createdAt,
                latencyMs,
                inputTokens,
                outputTokens,
                totalTokens,
                totalCostUSD: Math.round(costUSD * 1000000) / 1000000,
                totalCostBRL: Math.round(costBRL * 10000) / 10000,
                totalCost: Math.round(costBRL * 10000) / 10000, // BRL for backward compatibility
                status: obs.level || 'DEFAULT',
                model,
                metadata: obs.metadata,
            };
        });

        res.json({
            success: true,
            traces: formattedTraces,
            pagination: {
                page,
                limit,
                totalItems: observations.meta?.totalItems || formattedTraces.length,
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

        // Fetch ALL observations with pagination
        const data = await fetchAllObservations(from, to);

        // Aggregate by day
        const dailyStats: Record<string, {
            date: string;
            tokens: number;
            inputTokens: number;
            outputTokens: number;
            costUSD: number;
            costBRL: number;
            requests: number;
        }> = {};

        for (const obs of data) {
            const date = new Date(obs.startTime || obs.createdAt).toISOString().split('T')[0];

            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    tokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    costUSD: 0,
                    costBRL: 0,
                    requests: 0,
                };
            }

            const inputTokens = obs.usage?.input || obs.usage?.promptTokens || 0;
            const outputTokens = obs.usage?.output || obs.usage?.completionTokens || 0;
            const model = obs.model || obs.modelId || 'unknown';
            const costUSD = calculateCostUSD(model, inputTokens, outputTokens);

            dailyStats[date].tokens += inputTokens + outputTokens;
            dailyStats[date].inputTokens += inputTokens;
            dailyStats[date].outputTokens += outputTokens;
            dailyStats[date].costUSD += costUSD;
            dailyStats[date].costBRL += costUSD * USD_TO_BRL;
            dailyStats[date].requests++;
        }

        // Convert to sorted array
        const usageData = Object.values(dailyStats)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(day => ({
                ...day,
                costUSD: Math.round(day.costUSD * 10000) / 10000,
                costBRL: Math.round(day.costBRL * 100) / 100,
                cost: Math.round(day.costBRL * 100) / 100, // BRL for backward compatibility
            }));

        res.json({
            success: true,
            period,
            data: usageData,
            pricing: {
                source: 'Vertex AI',
                currency: 'BRL',
                exchangeRate: USD_TO_BRL,
            },
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
            pricing: {
                source: 'Vertex AI',
                currency: 'BRL',
                exchangeRate: USD_TO_BRL,
            },
        });
    } catch (error) {
        res.json({
            success: false,
            configured: true,
            message: error instanceof Error ? error.message : 'Failed to connect to Langfuse',
        });
    }
});

/**
 * GET /api/admin/ai-metrics/pricing
 * Returns current pricing configuration
 */
router.get('/pricing', async (_req: Request, res: Response) => {
    res.json({
        success: true,
        pricing: VERTEX_PRICING,
        exchangeRate: {
            USD_TO_BRL,
            lastUpdated: '2025-01-20',
        },
    });
});

export function createAIMetricsRoutes() {
    return router;
}

export default router;
