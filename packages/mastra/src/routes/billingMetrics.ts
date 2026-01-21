/**
 * Routes for Google Cloud Billing Metrics
 *
 * Fetches REAL billing data from BigQuery billing export
 * to display accurate Vertex AI costs in the admin panel.
 *
 * Prerequisites:
 * 1. Enable BigQuery billing export in Google Cloud Console
 * 2. Set GOOGLE_CLOUD_PROJECT and BIGQUERY_BILLING_TABLE environment variables
 * 3. Service account must have BigQuery Data Viewer role
 */

import { Router, Request, Response } from 'express';
import { BigQuery } from '@google-cloud/bigquery';

const router = Router();

// Configuration from environment
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT;
const BIGQUERY_BILLING_TABLE = process.env.BIGQUERY_BILLING_TABLE; // Format: project.dataset.table

// Initialize BigQuery client
let bigquery: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
    if (!bigquery) {
        bigquery = new BigQuery({
            projectId: GOOGLE_CLOUD_PROJECT,
        });
    }
    return bigquery;
}

// USD to BRL exchange rate
const USD_TO_BRL = 6.0;

/**
 * GET /api/admin/billing/vertex-costs
 * Returns real Vertex AI costs from BigQuery billing export
 */
router.get('/vertex-costs', async (req: Request, res: Response) => {
    try {
        if (!BIGQUERY_BILLING_TABLE) {
            return res.status(400).json({
                success: false,
                configured: false,
                error: 'BigQuery billing table not configured',
                instructions: {
                    message: 'Para obter os custos reais da Vertex AI, configure o BigQuery billing export.',
                    steps: [
                        '1. No Google Cloud Console, vá em Billing > Billing export',
                        '2. Habilite "Standard usage cost" export para BigQuery',
                        '3. Anote o nome da tabela (formato: project.dataset.gcp_billing_export_v1_XXXXXX)',
                        '4. Adicione BIGQUERY_BILLING_TABLE ao arquivo .env do Mastra',
                        '5. Certifique-se que o service account tem a role "BigQuery Data Viewer"'
                    ],
                    envExample: 'BIGQUERY_BILLING_TABLE=seu-projeto.billing_dataset.gcp_billing_export_v1_XXXXXX'
                }
            });
        }

        const period = (req.query.period as string) || 'month';

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = new Date('2024-01-01'); // From beginning of 2024
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = now.toISOString().split('T')[0];

        const client = getBigQueryClient();

        // Query to get Vertex AI costs
        // Filters by service.description containing 'Vertex AI'
        const query = `
            SELECT
                DATE(usage_start_time) as date,
                service.description as service_name,
                sku.description as sku_name,
                SUM(cost) as cost_usd,
                SUM(usage.amount) as usage_amount,
                usage.unit as usage_unit
            FROM \`${BIGQUERY_BILLING_TABLE}\`
            WHERE
                DATE(usage_start_time) >= '${startDateStr}'
                AND DATE(usage_start_time) <= '${endDateStr}'
                AND (
                    service.description LIKE '%Vertex AI%'
                    OR service.description LIKE '%Generative AI%'
                    OR service.description LIKE '%Cloud AI%'
                )
            GROUP BY
                DATE(usage_start_time),
                service.description,
                sku.description,
                usage.unit
            ORDER BY date DESC, cost_usd DESC
        `;

        console.log('[Billing] Executing BigQuery query for Vertex AI costs...');

        const [rows] = await client.query({ query });

        // Aggregate totals
        let totalCostUSD = 0;
        const dailyCosts: Record<string, number> = {};
        const skuBreakdown: Record<string, { cost: number; usage: number; unit: string }> = {};

        for (const row of rows as any[]) {
            const cost = parseFloat(row.cost_usd) || 0;
            totalCostUSD += cost;

            // Daily aggregation
            const date = row.date?.value || row.date;
            if (date) {
                dailyCosts[date] = (dailyCosts[date] || 0) + cost;
            }

            // SKU breakdown
            const skuName = row.sku_name || 'Unknown';
            if (!skuBreakdown[skuName]) {
                skuBreakdown[skuName] = { cost: 0, usage: 0, unit: row.usage_unit || '' };
            }
            skuBreakdown[skuName].cost += cost;
            skuBreakdown[skuName].usage += parseFloat(row.usage_amount) || 0;
        }

        const totalCostBRL = totalCostUSD * USD_TO_BRL;

        // Format daily data for chart
        const dailyData = Object.entries(dailyCosts)
            .map(([date, cost]) => ({
                date,
                costUSD: Math.round(cost * 10000) / 10000,
                costBRL: Math.round(cost * USD_TO_BRL * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Format SKU breakdown
        const skuData = Object.entries(skuBreakdown)
            .map(([sku, data]) => ({
                sku,
                costUSD: Math.round(data.cost * 10000) / 10000,
                costBRL: Math.round(data.cost * USD_TO_BRL * 100) / 100,
                usage: data.usage,
                unit: data.unit,
            }))
            .sort((a, b) => b.costUSD - a.costUSD);

        res.json({
            success: true,
            configured: true,
            period,
            dateRange: {
                from: startDateStr,
                to: endDateStr,
            },
            totals: {
                costUSD: Math.round(totalCostUSD * 10000) / 10000,
                costBRL: Math.round(totalCostBRL * 100) / 100,
            },
            dailyData,
            skuBreakdown: skuData,
            exchangeRate: USD_TO_BRL,
            source: 'Google Cloud Billing (BigQuery)',
        });

    } catch (error) {
        console.error('[Billing] Error fetching Vertex AI costs:', error);

        // Check if it's a permission error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isPermissionError = errorMessage.includes('permission') ||
            errorMessage.includes('Access Denied') ||
            errorMessage.includes('403');

        res.status(500).json({
            success: false,
            error: isPermissionError
                ? 'Sem permissão para acessar o BigQuery billing. Verifique as permissões do service account.'
                : errorMessage,
            configured: !!BIGQUERY_BILLING_TABLE,
        });
    }
});

/**
 * GET /api/admin/billing/monthly-summary
 * Returns monthly cost summary for the current billing period
 */
router.get('/monthly-summary', async (req: Request, res: Response) => {
    try {
        if (!BIGQUERY_BILLING_TABLE) {
            return res.status(400).json({
                success: false,
                configured: false,
                error: 'BigQuery billing table not configured',
            });
        }

        const client = getBigQueryClient();

        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDateStr = monthStart.toISOString().split('T')[0];
        const endDateStr = monthEnd.toISOString().split('T')[0];

        // Query for monthly summary
        const query = `
            SELECT
                FORMAT_DATE('%Y-%m', usage_start_time) as month,
                service.description as service_name,
                SUM(cost) as cost_usd
            FROM \`${BIGQUERY_BILLING_TABLE}\`
            WHERE
                DATE(usage_start_time) >= '${startDateStr}'
                AND DATE(usage_start_time) <= '${endDateStr}'
                AND (
                    service.description LIKE '%Vertex AI%'
                    OR service.description LIKE '%Generative AI%'
                    OR service.description LIKE '%Cloud AI%'
                )
            GROUP BY
                FORMAT_DATE('%Y-%m', usage_start_time),
                service.description
            ORDER BY cost_usd DESC
        `;

        const [rows] = await client.query({ query });

        let totalCostUSD = 0;
        const services: { name: string; costUSD: number; costBRL: number }[] = [];

        for (const row of rows as any[]) {
            const cost = parseFloat(row.cost_usd) || 0;
            totalCostUSD += cost;
            services.push({
                name: row.service_name,
                costUSD: Math.round(cost * 10000) / 10000,
                costBRL: Math.round(cost * USD_TO_BRL * 100) / 100,
            });
        }

        res.json({
            success: true,
            configured: true,
            month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
            dateRange: {
                from: startDateStr,
                to: endDateStr,
            },
            totals: {
                costUSD: Math.round(totalCostUSD * 10000) / 10000,
                costBRL: Math.round(totalCostUSD * USD_TO_BRL * 100) / 100,
            },
            services,
            exchangeRate: USD_TO_BRL,
            source: 'Google Cloud Billing (BigQuery)',
        });

    } catch (error) {
        console.error('[Billing] Error fetching monthly summary:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/admin/billing/health
 * Check if BigQuery billing is properly configured
 */
router.get('/health', async (_req: Request, res: Response) => {
    try {
        const configured = !!BIGQUERY_BILLING_TABLE;

        if (!configured) {
            return res.json({
                success: true,
                configured: false,
                message: 'BigQuery billing export não configurado',
                instructions: {
                    steps: [
                        '1. Vá em Google Cloud Console > Billing > Billing export',
                        '2. Habilite "Standard usage cost" para BigQuery',
                        '3. Configure BIGQUERY_BILLING_TABLE no .env',
                    ],
                },
            });
        }

        // Try a simple query to verify access
        const client = getBigQueryClient();
        const testQuery = `
            SELECT 1 as test
            FROM \`${BIGQUERY_BILLING_TABLE}\`
            LIMIT 1
        `;

        await client.query({ query: testQuery });

        res.json({
            success: true,
            configured: true,
            message: 'BigQuery billing export configurado e acessível',
            table: BIGQUERY_BILLING_TABLE,
            project: GOOGLE_CLOUD_PROJECT,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.json({
            success: false,
            configured: !!BIGQUERY_BILLING_TABLE,
            message: `Erro ao acessar BigQuery: ${errorMessage}`,
            table: BIGQUERY_BILLING_TABLE,
        });
    }
});

export function createBillingMetricsRoutes() {
    return router;
}

export default router;
