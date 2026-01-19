import { createToolRouterSession } from "./createSession";

/**
 * Tool returned by Composio Tool Router.
 * Uses inputSchema (not parameters) which is MCP-compatible.
 */
export interface ComposioTool {
  description: string;
  inputSchema: unknown;
  execute: (args: unknown) => Promise<unknown>;
}

/**
 * Tools we want to expose from Composio Tool Router.
 * Once we're ready to add all tools, remove this filter.
 */
const ALLOWED_TOOLS = [
  "COMPOSIO_MANAGE_CONNECTIONS",
  "COMPOSIO_SEARCH_TOOLS",
  "COMPOSIO_GET_TOOL_SCHEMAS",
  "COMPOSIO_MULTI_EXECUTE_TOOL",
];

/**
 * Runtime validation to check if an object conforms to ComposioTool interface.
 *
 * Why: The Composio SDK returns a Tools class instance from session.tools(),
 * not a plain object. We validate each tool at runtime to ensure type safety.
 *
 * @param tool - The object to validate
 * @returns true if the object has required ComposioTool properties
 */
function isComposioTool(tool: unknown): tool is ComposioTool {
  if (typeof tool !== "object" || tool === null) {
    return false;
  }

  const obj = tool as Record<string, unknown>;
  return (
    typeof obj.description === "string" &&
    "inputSchema" in obj &&
    typeof obj.execute === "function"
  );
}

/**
 * Get Composio Tool Router tools for a user.
 *
 * Returns a filtered subset of meta-tools:
 * - COMPOSIO_MANAGE_CONNECTIONS - OAuth/auth management
 * - COMPOSIO_SEARCH_TOOLS - Find available connectors
 * - COMPOSIO_GET_TOOL_SCHEMAS - Get parameter schemas
 * - COMPOSIO_MULTI_EXECUTE_TOOL - Execute actions
 *
 * @param userId - Unique identifier for the user (accountId)
 * @param roomId - Optional chat room ID for OAuth redirect
 * @returns Record of tool name to tool definition
 */
export async function getComposioTools(
  userId: string,
  roomId?: string
): Promise<Record<string, ComposioTool>> {
  const session = await createToolRouterSession(userId, roomId);
  const allTools = await session.tools();

  // Filter to only allowed tools with runtime validation
  const filteredTools: Record<string, ComposioTool> = {};

  for (const toolName of ALLOWED_TOOLS) {
    // Use Object.prototype.hasOwnProperty to safely check for property existence
    // This handles both plain objects and class instances safely
    if (Object.prototype.hasOwnProperty.call(allTools, toolName)) {
      const tool = (allTools as Record<string, unknown>)[toolName];

      if (isComposioTool(tool)) {
        filteredTools[toolName] = tool;
      }
    }
  }

  return filteredTools;
}
