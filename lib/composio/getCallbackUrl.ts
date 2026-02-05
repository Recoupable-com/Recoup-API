import { getFrontendBaseUrl } from "./getFrontendBaseUrl";

/**
 * Build OAuth callback URL based on environment and destination.
 *
 * Why: Composio redirects back after OAuth. We need different
 * destinations depending on context (chat for entity connections,
 * settings page for account connections).
 */

type CallbackDestination = "chat" | "connectors" | "entity-connectors";

type CallbackOptions =
  | { destination: "chat"; roomId?: string }
  | { destination: "connectors" }
  | { destination: "entity-connectors"; entityId: string; toolkit: string };

/**
 * Build callback URL for OAuth redirects.
 *
 * @param options - Callback configuration
 * @returns Full callback URL with success indicator
 */
export function getCallbackUrl(options: CallbackOptions): string {
  const baseUrl = getFrontendBaseUrl();

  if (options.destination === "connectors") {
    return `${baseUrl}/settings/connectors?connected=true`;
  }

  if (options.destination === "entity-connectors") {
    return `${baseUrl}/chat?artist_connected=${options.entityId}&toolkit=${options.toolkit}`;
  }

  // Chat destination
  const path = options.roomId ? `/chat/${options.roomId}` : "/chat";
  return `${baseUrl}${path}?connected=true`;
}
