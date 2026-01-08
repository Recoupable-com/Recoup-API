import { getConnectedAccount } from "./getConnectedAccount";
import { getComposioApiKey } from "./getComposioApiKey";
import { ComposioToolkitKey, getToolkitConfig } from "./toolkits";

export interface ConnectedAccountRefreshResponse {
  id: string;
  redirect_url: string | null;
  status:
    | "INITIALIZING"
    | "INITIATED"
    | "ACTIVE"
    | "FAILED"
    | "EXPIRED"
    | "INACTIVE";
}

const COMPOSIO_API_BASE_URL = "https://backend.composio.dev";

/**
 * Refresh a connected account for a Composio toolkit.
 *
 * @param toolkitKey - The toolkit to refresh (e.g., "GOOGLE_SHEETS", "GOOGLE_DRIVE")
 * @param accountId - The user's account ID
 * @param redirectUrl - The URL to redirect to after OAuth
 * @returns The refresh response with OAuth redirect URL
 */
export async function refreshConnectedAccount(
  toolkitKey: ComposioToolkitKey,
  accountId: string,
  redirectUrl?: string,
): Promise<ConnectedAccountRefreshResponse | null> {
  const apiKey = getComposioApiKey();
  const config = getToolkitConfig(toolkitKey);
  const accounts = await getConnectedAccount(toolkitKey, accountId);

  if (!accounts.items || accounts.items.length === 0) {
    throw new Error(`${config.name} connected account not found`);
  }

  const connectedAccountId = accounts.items[0].id;

  if (!connectedAccountId) {
    throw new Error(`${config.name} connected account ID not found`);
  }

  const url = new URL(
    `${COMPOSIO_API_BASE_URL}/api/v3/connected_accounts/${connectedAccountId}/refresh`,
  );

  const body: { redirect_url?: string } = {};
  if (redirectUrl) {
    body.redirect_url = redirectUrl;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to refresh ${config.name} connected account: ${response.status} ${errorText}`,
    );
  }

  return await response.json();
}
