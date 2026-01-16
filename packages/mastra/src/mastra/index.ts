import dotenv from "dotenv";
dotenv.config();

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
import { enunciadoFormatterAgent } from "./agents/enunciadoFormatterAgent.js";
import { assuntosTaxonomiaAgent } from "./agents/assuntosTaxonomiaAgent.js";
import { editalFilterAutoConfigAgent } from "./agents/editalFilterAutoConfigAgent.js";
import { questionGeneratorAgent } from "./agents/questionGeneratorAgent.js";
import { materiaClassifierAgent } from "./agents/materiaClassifierAgent.js";
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
        enunciadoFormatterAgent,
        assuntosTaxonomiaAgent,
        editalFilterAutoConfigAgent,
        questionGeneratorAgent,
        materiaClassifierAgent,
    },
    storage: new LibSQLStore({
        url: ":memory:",
    }),
    mcpServers: {
        ousePassarMcpServer,
    },
    server: {
        port: 4111,
        host: "0.0.0.0",
    },
});
