import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the "hello-remote" tool on the MCP server.
 * Receives a greeting with a name.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerHelloRemoteTool(server: McpServer): void {
  server.registerTool(
    "hello-remote",
    {
      description: "Receive a greeting",
      inputSchema: {
        name: z.string() as z.ZodType<string>,
      },
    },
    async (args: { name: string }) => {
      return { content: [{ type: "text" as const, text: `Hello ${args.name}` }] };
    },
  );
}
