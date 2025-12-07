import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  generateAndProcessImage,
  type GenerateAndProcessImageResult,
} from "@/lib/image/generateAndProcessImage";
import {
  generateImageQuerySchema,
  type GenerateImageQuery,
} from "@/lib/image/validateGenerateImageQuery";

/**
 * Registers the "generate_image" tool on the MCP server.
 * Generates an image based on a text prompt.
 *
 * @param server - The MCP server instance to register the tool on.
 */
export function registerGenerateImageTool(server: McpServer): void {
  server.registerTool(
    "generate_image",
    {
      description: "Generate an image based on a text prompt.",
      inputSchema: generateImageQuerySchema,
    },
    async (
      args: GenerateImageQuery,
    ): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
      const result: GenerateAndProcessImageResult = await generateAndProcessImage(
        args.prompt,
        args.account_id,
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    },
  );
}
