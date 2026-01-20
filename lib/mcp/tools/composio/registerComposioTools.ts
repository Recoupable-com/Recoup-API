import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerRequest, ServerNotification } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { McpAuthInfo } from "@/lib/mcp/verifyApiKey";
import { resolveAccountId } from "@/lib/mcp/resolveAccountId";
import { getComposioTools } from "@/lib/composio/toolRouter";
import { getCallToolResult } from "@/lib/mcp/getCallToolResult";

const composioSchema = z.object({
  room_id: z.string().optional().describe("Chat room ID for OAuth redirect"),
});

type ComposioArgs = z.infer<typeof composioSchema>;

/**
 *
 * @param server
 */
export function registerComposioTools(server: McpServer): void {
  server.registerTool(
    "composio",
    {
      description: "Get Composio tools for Google Sheets integration.",
      inputSchema: composioSchema,
    },
    async (args: ComposioArgs, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
      const authInfo = extra.authInfo as McpAuthInfo | undefined;
      const { accountId, error } = await resolveAccountId({
        authInfo,
        accountIdOverride: undefined,
      });

      if (error || !accountId) {
        return getCallToolResult(JSON.stringify({ error: error || "Authentication required" }));
      }

      const tools = await getComposioTools(accountId, args.room_id);
      return getCallToolResult(JSON.stringify(tools));
    },
  );
}
