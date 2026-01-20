/**
 * Langfuse OpenTelemetry Instrumentation
 *
 * This file initializes OpenTelemetry with Langfuse span processor
 * to capture AI SDK traces and send them to Langfuse for monitoring.
 *
 * IMPORTANT: This must be imported BEFORE any AI SDK usage.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

// Only initialize if Langfuse credentials are available
const isLangfuseConfigured =
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_PUBLIC_KEY;

let sdk: NodeSDK | null = null;

if (isLangfuseConfigured) {
    console.log("[Instrumentation] Initializing Langfuse OpenTelemetry...");

    sdk = new NodeSDK({
        spanProcessors: [new LangfuseSpanProcessor()],
    });

    sdk.start();

    console.log("[Instrumentation] Langfuse OpenTelemetry initialized successfully");
} else {
    console.log("[Instrumentation] Langfuse not configured - skipping OpenTelemetry initialization");
}

// Graceful shutdown
process.on("SIGTERM", async () => {
    if (sdk) {
        await sdk.shutdown();
    }
});

export { sdk };
