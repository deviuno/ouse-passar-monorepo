import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { tutorAgent } from "./agents/tutorAgent.js";
import { editalParserAgent } from "./agents/editalParserAgent.js";
import { materiaPriorityAgent } from "./agents/materiaPriorityAgent.js";
import { ousePassarMcpServer } from "./mcp/mcpServer.js";

export const mastra = new Mastra({
    agents: {
        tutorAgent,
        editalParserAgent,
        materiaPriorityAgent,
    },
    storage: new LibSQLStore({
        url: "file:./data/mastra.db",
    }),
    mcpServers: {
        ousePassarMcpServer,
    },
});
