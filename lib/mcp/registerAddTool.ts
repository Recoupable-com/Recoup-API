import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the "add" tool on the MCP server.
 * Adds two numbers together.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerAddTool(server: McpServer): void {
  server.registerTool(
    "add",
    {
      inputSchema: {
        a: z.number().int() as z.ZodType<number>,
        b: z.number().int() as z.ZodType<number>,
      },
    },
    async (args: { a: number; b: number }) => {
      const result = args.a + args.b;
      return { content: [{ type: "text", text: result.toString() }] };
    },
  );
}
