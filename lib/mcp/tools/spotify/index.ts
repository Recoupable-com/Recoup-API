import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetSpotifySearchTool } from "./registerGetSpotifySearchTool";

/**
 * Registers all Spotify-related MCP tools on the server.
 *
 * @param server - The MCP server instance to register tools on.
 */
export const registerAllSpotifyTools = (server: McpServer): void => {
  registerGetSpotifySearchTool(server);
};
