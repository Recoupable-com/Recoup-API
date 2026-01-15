import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createArtistInDb } from "@/lib/artists/createArtistInDb";
import { copyRoom } from "@/lib/rooms/copyRoom";
import { getToolResultSuccess } from "@/lib/mcp/getToolResultSuccess";
import { getToolResultError } from "@/lib/mcp/getToolResultError";

const createNewArtistSchema = z.object({
  name: z.string().describe("The name of the artist to be created"),
  account_id: z
    .string()
    .describe("The account ID of the human with admin access to the new artist account"),
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

export interface CreateNewArtistResult {
  artist?: {
    account_id: string;
    name: string;
    image?: string | null;
  };
  artistAccountId?: string;
  message: string;
  error?: string;
  newRoomId?: string | null;
}

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
        "Requires the artist name and the account ID of the user with admin access to the new artist account. " +
        "The active_conversation_id parameter is optional — when omitted, use the active_conversation_id from the system prompt " +
        "to copy the conversation. Never ask the user to provide a room ID. " +
        "The organization_id parameter is optional — use the organization_id from the system prompt context to link the artist to the user's selected organization.",
      inputSchema: createNewArtistSchema,
    },
    async (args: CreateNewArtistArgs) => {
      try {
        const { name, account_id, active_conversation_id, organization_id } = args;

        // Create the artist account (with optional org linking)
        const artist = await createArtistInDb(
          name,
          account_id,
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
            image: artist.image,
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
