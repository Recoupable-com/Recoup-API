import { PaymentMcpServer } from "x402-mcp";
import { z } from "zod";

/**
 * Registers the "get_random_number" tool on the MCP server.
 * Generates a random number between min and max (inclusive).
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerGetRandomNumberTool(server: PaymentMcpServer): void {
  server.registerTool(
    "get_random_number",
    {
      inputSchema: {
        // @ts-expect-error - Zod version mismatch with x402-mcp types
        min: z.number().int() as z.ZodType<number>,
        // @ts-expect-error - Zod version mismatch with x402-mcp types
        max: z.number().int() as z.ZodType<number>,
      },
    },
    async (args: { min: number; max: number }) => {
      const randomNumber = Math.floor(Math.random() * (args.max - args.min + 1)) + args.min;
      return {
        content: [{ type: "text", text: randomNumber.toString() }],
      };
    },
  );
}
