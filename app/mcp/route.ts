import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerAllTools } from "@/lib/mcp/tools";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { getApiKeyDetails } from "@/lib/keys/getApiKeyDetails";

/**
 * Verifies an API key and returns auth info with account details.
 *
 * @param req - The request object.
 * @param bearerToken - The bearer token from the Authorization header.
 * @returns AuthInfo with accountId and orgId, or undefined if invalid.
 */
async function verifyApiKey(req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  // Try Authorization header first, then x-api-key header
  const apiKey = bearerToken || req.headers.get("x-api-key");

  if (!apiKey) {
    return undefined;
  }

  const keyDetails = await getApiKeyDetails(apiKey);

  if (!keyDetails) {
    return undefined;
  }

  return {
    token: apiKey,
    scopes: ["mcp:tools"],
    clientId: keyDetails.accountId,
    extra: {
      accountId: keyDetails.accountId,
      orgId: keyDetails.orgId,
    },
  };
}

const baseHandler = createMcpHandler(
  server => {
    registerAllTools(server);
  },
  {
    serverInfo: {
      name: "recoup-mcp",
      version: "0.0.1",
    },
  },
);

// Wrap with auth - API key is required for all MCP requests
const handler = withMcpAuth(baseHandler, verifyApiKey, {
  required: true,
});

/**
 * GET handler for the MCP API.
 *
 * @param req - The request object.
 * @returns The response from the MCP handler.
 */
export async function GET(req: Request) {
  return handler(req);
}

/**
 * POST handler for the MCP API.
 *
 * @param req - The request object.
 * @returns The response from the MCP handler.
 */
export async function POST(req: Request) {
  return handler(req);
}
