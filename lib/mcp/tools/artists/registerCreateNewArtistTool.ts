import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createArtistInDb,
  type CreateArtistResult,
} from "@/lib/artists/createArtistInDb";
import { copyRoom } from "@/lib/rooms/copyRoom";
import { getToolResultSuccess } from "@/lib/mcp/getToolResultSuccess";
import { getToolResultError } from "@/lib/mcp/getToolResultError";
import { getApiKeyDetails } from "@/lib/keys/getApiKeyDetails";
import { canAccessAccount } from "@/lib/organizations/canAccessAccount";

const createNewArtistSchema = z.object({
  name: z.string().describe("The name of the artist to be created"),
  api_key: z
    .string()
    .optional()
    .describe(
      "The API key to authenticate the request. Use this to automatically resolve the account_id.",
    ),
  account_id: z
    .string()
    .optional()
    .describe(
      "The account ID to create the artist for. Only required for organization API keys creating artists on behalf of other accounts. " +
        "If api_key is provided, this can be omitted and will be resolved from the API key.",
    ),
  active_conversation_id: z
    .string()
    .optional()
    .describe(
      "The ID of the room/conversation to copy for this artist's first conversation. " +
        "If not provided, use the active_conversation_id from the system prompt.",
    ),
  organization_id: z
    .string()
    .optional()
    .nullable()
    .describe(
      "The organization ID to link the new artist to. " +
        "Use the organization_id from the system prompt context. Pass null or omit for personal artists.",
    ),
});

export type CreateNewArtistArgs = z.infer<typeof createNewArtistSchema>;

export type CreateNewArtistResult = {
  artist?: Pick<CreateArtistResult, "account_id" | "name"> & {
    image?: string | null;
  };
  artistAccountId?: string;
  message: string;
  error?: string;
  newRoomId?: string | null;
};

/**
 * Registers the "create_new_artist" tool on the MCP server.
 * Creates a new artist account in the system.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerCreateNewArtistTool(server: McpServer): void {
  server.registerTool(
    "create_new_artist",
    {
      description:
        "Create a new artist account in the system. " +
        "Requires either api_key (to authenticate and resolve account) or account_id from the system prompt. " +
        "The account_id parameter is optional — only provide it when using an organization API key to create artists on behalf of other accounts. " +
        "The active_conversation_id parameter is optional — when omitted, use the active_conversation_id from the system prompt " +
        "to copy the conversation. Never ask the user to provide a room ID. " +
        "The organization_id parameter is optional — use the organization_id from the system prompt context to link the artist to the user's selected organization.",
      inputSchema: createNewArtistSchema,
    },
    async (args: CreateNewArtistArgs) => {
      try {
        const { name, api_key, account_id, active_conversation_id, organization_id } = args;

        // Resolve accountId from api_key or use provided account_id
        let resolvedAccountId: string | null = null;
        let keyDetails: { accountId: string; orgId: string | null } | null = null;

        if (api_key) {
          keyDetails = await getApiKeyDetails(api_key);
          if (!keyDetails) {
            return getToolResultError("Invalid API key");
          }
          resolvedAccountId = keyDetails.accountId;

          // If account_id override is provided, validate access (for org API keys)
          if (account_id && account_id !== keyDetails.accountId) {
            const hasAccess = await canAccessAccount({
              orgId: keyDetails.orgId,
              targetAccountId: account_id,
            });
            if (!hasAccess) {
              return getToolResultError("Access denied to specified account_id");
            }
            resolvedAccountId = account_id;
          }
        } else if (account_id) {
          resolvedAccountId = account_id;
        }

        if (!resolvedAccountId) {
          return getToolResultError(
            "Either api_key or account_id is required. Provide api_key or account_id from the system prompt context.",
          );
        }

        // Create the artist account (with optional org linking)
        const artist = await createArtistInDb(
          name,
          resolvedAccountId,
          organization_id ?? undefined,
        );

        if (!artist) {
          return getToolResultError("Failed to create artist");
        }

        // Copy the conversation to the new artist if requested
        let newRoomId: string | null = null;
        if (active_conversation_id) {
          newRoomId = await copyRoom(active_conversation_id, artist.account_id);
        }

        const result: CreateNewArtistResult = {
          artist: {
            account_id: artist.account_id,
            name: artist.name,
            image: artist.account_info[0]?.image ?? null,
          },
          artistAccountId: artist.account_id,
          message: `Successfully created artist "${name}". Now searching Spotify for this artist to connect their profile...`,
          newRoomId,
        };

        return getToolResultSuccess(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create artist for unknown reason";
        return getToolResultError(errorMessage);
      }
    },
  );
}
