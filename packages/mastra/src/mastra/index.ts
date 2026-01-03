import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { tutorAgent } from "./agents/tutorAgent.js";
import { editalParserAgent } from "./agents/editalParserAgent.js";
import { editalFullAnalyzerAgent } from "./agents/editalFullAnalyzerAgent.js";
import { materiaPriorityAgent } from "./agents/materiaPriorityAgent.js";
import { contentGeneratorAgent, audioScriptAgent } from "./agents/contentGeneratorAgent.js";
import { contentSummaryAgent, audioSummaryAgent } from "./agents/contentSummaryAgent.js";
import { provaAnalyzerAgent } from "./agents/provaAnalyzerAgent.js";
import { filtrosAdapterAgent } from "./agents/filtrosAdapterAgent.js";
import { gabaritoExtractorAgent } from "./agents/gabaritoExtractorAgent.js";
import { comentarioFormatterAgent } from "./agents/comentarioFormatterAgent.js";
import { ousePassarMcpServer } from "./mcp/mcpServer.js";

export const mastra = new Mastra({
    agents: {
        tutorAgent,
        editalParserAgent,
        editalFullAnalyzerAgent,
        materiaPriorityAgent,
        contentGeneratorAgent,
        audioScriptAgent,
        contentSummaryAgent,
        audioSummaryAgent,
        provaAnalyzerAgent,
        filtrosAdapterAgent,
        gabaritoExtractorAgent,
        comentarioFormatterAgent,
    },
    storage: new LibSQLStore({
        url: "file:./data/mastra.db",
    }),
    mcpServers: {
        ousePassarMcpServer,
    },
});
