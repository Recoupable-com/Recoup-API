import { getComposioClient } from "../client";
import { getCallbackUrl } from "../getCallbackUrl";

/**
 * Toolkits available in Tool Router sessions.
 * Add more toolkits here as we expand Composio integration.
 */
const ENABLED_TOOLKITS = ["googlesheets", "googledrive", "googledocs", "tiktok"];

/**
 * Create a Composio Tool Router session for an account.
 *
 * @param accountId - Unique identifier for the account
 * @param roomId - Optional chat room ID for OAuth redirect
 * @param artistConnections - Optional mapping of toolkit slug to connected account ID for artist-specific connections
 */
export async function createToolRouterSession(
  accountId: string,
  roomId?: string,
  artistConnections?: Record<string, string>,
) {
  const composio = await getComposioClient();

  const callbackUrl = getCallbackUrl({
    destination: "chat",
    roomId,
  });

  const session = await composio.create(accountId, {
    toolkits: ENABLED_TOOLKITS,
    manageConnections: {
      callbackUrl,
    },
    connectedAccounts: artistConnections,
  });

  return session;
}
