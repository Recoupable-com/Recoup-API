import { getComposioClient } from "../client";
import { getCallbackUrl } from "../getCallbackUrl";

/**
 * Result of authorizing a connector.
 */
export interface AuthorizeResult {
  connector: string;
  redirectUrl: string;
}

/**
 * Options for authorizing a connector.
 */
export interface AuthorizeConnectorOptions {
  /**
   * Entity type determines how the callback URL is built.
   * - "user": Redirects to /settings/connectors
   * - "artist": Redirects to /chat with artist_connected param
   */
  entityType?: "user" | "artist";
  /**
   * For artist entities, the toolkit being connected (for callback URL).
   */
  toolkit?: string;
  /**
   * Custom auth configs for toolkits that require user-provided OAuth credentials.
   * e.g., { tiktok: "ac_xxxxx" }
   */
  authConfigs?: Record<string, string>;
  /**
   * Custom callback URL (overrides default based on entityType).
   */
  customCallbackUrl?: string;
}

/**
 * Generate an OAuth authorization URL for a connector.
 *
 * Works for both user-level and artist-level connections.
 * The entityId can be either a userId or artistId - Composio treats them the same.
 *
 * @param entityId - The entity ID (userId or artistId)
 * @param connector - The connector slug (e.g., "googlesheets", "tiktok")
 * @param options - Authorization options
 * @returns The redirect URL for OAuth
 */
export async function authorizeConnector(
  entityId: string,
  connector: string,
  options: AuthorizeConnectorOptions = {},
): Promise<AuthorizeResult> {
  const { entityType = "user", toolkit, authConfigs, customCallbackUrl } = options;
  const composio = await getComposioClient();

  // Build callback URL based on entity type
  let callbackUrl: string;
  if (customCallbackUrl) {
    callbackUrl = customCallbackUrl;
  } else if (entityType === "artist") {
    callbackUrl = getCallbackUrl({
      destination: "artist-connectors",
      artistId: entityId,
      toolkit: toolkit || connector,
    });
  } else {
    callbackUrl = getCallbackUrl({ destination: "connectors" });
  }

  // Create session with optional auth configs
  const session = await composio.create(entityId, {
    ...(authConfigs && Object.keys(authConfigs).length > 0 && { authConfigs }),
    manageConnections: {
      callbackUrl,
    },
  });

  const connectionRequest = await session.authorize(connector);

  return {
    connector,
    redirectUrl: connectionRequest.redirectUrl,
  };
}
