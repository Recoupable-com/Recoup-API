import { registerGetRandomNumberTool } from "@/lib/mcp/registerGetRandomNumberTool";
import { registerAddTool } from "@/lib/mcp/registerAddTool";
import { registerHelloRemoteTool } from "@/lib/mcp/registerHelloRemoteTool";
import { createMcpHandler } from "mcp-handler";

let handler: ReturnType<typeof createMcpHandler> | null = null;

/**
 * Gets the MCP handler for the API.
 *
 * @returns The MCP handler.
 */
async function getHandler(): Promise<ReturnType<typeof createMcpHandler>> {
  if (!handler) {
    handler = createMcpHandler(
      server => {
        registerGetRandomNumberTool(server);
        registerAddTool(server);
        registerHelloRemoteTool(server);
      },
      {
        serverInfo: {
          name: "recoup-mcp",
          version: "0.0.1",
        },
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
