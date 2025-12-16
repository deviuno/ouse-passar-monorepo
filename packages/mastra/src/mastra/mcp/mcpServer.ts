import { MCPServer } from "@mastra/mcp";
import { tutorAgent } from "../agents/tutorAgent.js";

// MCP Server exposes the tutorAgent to MCP-compatible clients
// (Cursor, Windsurf, Claude Desktop, etc.)
export const ousePassarMcpServer = new MCPServer({
  name: "Ouse Passar Tutor Server",
  version: "1.0.0",
  tools: {}, // Required property - agents are auto-converted to tools
  agents: {
    tutorAgent,
  },
});
