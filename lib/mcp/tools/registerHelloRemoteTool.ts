import { PaymentMcpServer } from "x402-mcp";
import { z } from "zod";

/**
 * Registers the "hello-remote" tool on the MCP server.
 * Receives a greeting with a name.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerHelloRemoteTool(server: PaymentMcpServer): void {
  server.registerTool(
    "hello-remote",
    {
      description: "Receive a greeting",
      inputSchema: {
        // @ts-expect-error - Zod version mismatch with x402-mcp types
        name: z.string() as z.ZodType<string>,
      },
    },
    async (args: { name: string }) => {
      return { content: [{ type: "text" as const, text: `Hello ${args.name}` }] };
    },
  );
}
