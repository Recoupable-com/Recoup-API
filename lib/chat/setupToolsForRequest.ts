import { ToolSet } from "ai";
import { filterExcludedTools } from "./filterExcludedTools";
import { ChatRequestBody } from "./validateChatRequest";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerAllTools } from "@/lib/mcp/tools";
import { getComposioTools } from "@/lib/composio/toolRouter";

/**
 * Sets up and filters tools for a chat request.
 * Aggregates tools from:
 * - MCP server (in-process via in-memory transport)
 * - Composio Tool Router (Google Sheets and other connectors)
 *
 * @param body - The chat request body
 * @returns Filtered tool set ready for use
 */
export async function setupToolsForRequest(body: ChatRequestBody): Promise<ToolSet> {
  const { accountId, roomId, excludeTools } = body;

  // Create in-memory MCP server and client (no HTTP call needed)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = new McpServer({
    name: "recoup-mcp",
    version: "0.0.1",
  });
  registerAllTools(server);
  await server.connect(serverTransport);

  const mcpClient = await createMCPClient({ transport: clientTransport });
  const mcpTools = (await mcpClient.tools()) as ToolSet;

  // Get Composio Tool Router tools (COMPOSIO_MANAGE_CONNECTIONS, etc.)
  const composioTools = await getComposioTools(accountId, roomId);

  // Merge all tools
  const allTools: ToolSet = {
    ...mcpTools,
    ...composioTools,
  };

  const tools = filterExcludedTools(allTools, excludeTools);
  return tools;
}
