import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getArtistSocials } from "@/lib/artist/getArtistSocials";
import { ArtistSocialsQuery } from "@/lib/artist/validateArtistSocialsQuery";

/**
 * Registers the "get_artist_socials" tool on the MCP server.
 * Retrieves all social profiles associated with an artist account.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerGetArtistSocialsTool(server: McpServer): void {
  server.registerTool(
    "get_artist_socials",
    {
      description:
        "Retrieve all socials associated with an artist. This endpoint should be called before using the Social Posts endpoint to obtain the necessary social IDs.",
      inputSchema: {
        artist_account_id: z.string().min(1, "Artist account ID is required") as z.ZodType<string>,
        page: z.number().int().positive().optional().default(1) as z.ZodType<number | undefined>,
        limit: z.number().int().min(1).max(100).optional().default(20) as z.ZodType<
          number | undefined
        >,
      },
    },
    async (args: ArtistSocialsQuery) => {
      const result = await getArtistSocials(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
