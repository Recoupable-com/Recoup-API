import { PaymentMcpServer } from "x402-mcp";
import { z } from "zod";

/**
 * Registers the "add" tool on the MCP server.
 * Adds two numbers together.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerAddTool(server: PaymentMcpServer): void {
  server.registerTool(
    "add",
    {
      inputSchema: {
        // @ts-expect-error - Zod version mismatch with x402-mcp types
        a: z.number().int() as z.ZodType<number>,
        // @ts-expect-error - Zod version mismatch with x402-mcp types
        b: z.number().int() as z.ZodType<number>,
      },
    },
    async (args: { a: number; b: number }) => {
      const result = args.a + args.b;
      return { content: [{ type: "text", text: result.toString() }] };
    },
  );
}
