import { createPaidMcpHandler } from "x402-mcp";
import { z } from "zod";
import { facilitator } from "@coinbase/x402";
import { SMART_ACCOUNT_ADDRESS } from "@/lib/const";

let handler: ReturnType<typeof createPaidMcpHandler> | null = null;

/**
 * Gets the MCP handler for the API.
 *
 * @returns The MCP handler.
 */
async function getHandler(): Promise<ReturnType<typeof createPaidMcpHandler>> {
  if (!handler) {
    handler = createPaidMcpHandler(
      server => {
        server.registerTool(
          "get_random_number",
          {
            inputSchema: {
              // @ts-expect-error - Zod version mismatch with x402-mcp types
              min: z.number().int(),
              // @ts-expect-error - Zod version mismatch with x402-mcp types
              max: z.number().int(),
            },
          },
          async args => {
            const randomNumber = Math.floor(Math.random() * (args.max - args.min + 1)) + args.min;
            return {
              content: [{ type: "text", text: randomNumber.toString() }],
            };
          },
        );
        server.registerTool(
          "add",
          {
            inputSchema: {
              // @ts-expect-error - Zod version mismatch with x402-mcp types
              a: z.number().int(),
              // @ts-expect-error - Zod version mismatch with x402-mcp types
              b: z.number().int(),
            },
          },
          async args => {
            const result = args?.a + args?.b;
            return { content: [{ type: "text", text: result?.toString() }] };
          },
        );
        server.registerTool(
          "hello-remote",
          {
            description: "Receive a greeting",
            inputSchema: {
              // @ts-expect-error - Zod version mismatch with x402-mcp types
              name: z.string(),
            },
          },
          async args => {
            return { content: [{ type: "text" as const, text: `Hello ${args.name}` }] };
          },
        );
      },
      {
        serverInfo: {
          name: "test-mcp",
          version: "0.0.1",
        },
      },
      {
        recipient: SMART_ACCOUNT_ADDRESS,
        facilitator,
        network: "base",
      },
    );
  }
  return handler;
}

/**
 * GET handler for the MCP API.
 *
 * @param req - The request object.
 * @returns The response from the MCP handler.
 */
export async function GET(req: Request) {
  const handler = await getHandler();
  return handler(req);
}

/**
 * POST handler for the MCP API.
 *
 * @param req - The request object.
 * @returns The response from the MCP handler.
 */
export async function POST(req: Request) {
  const handler = await getHandler();
  return handler(req);
}
