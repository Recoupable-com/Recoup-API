import { selectArtistComposioConnections } from "@/lib/supabase/artist_composio_connections/selectArtistComposioConnections";
import { ALLOWED_ARTIST_CONNECTORS } from "./ALLOWED_ARTIST_CONNECTORS";

/**
 * Artist connector info with connection status.
 */
export interface ArtistConnectorInfo {
  slug: string;
  name: string;
  isConnected: boolean;
  connectedAccountId?: string;
}

/**
 * Human-readable names for allowed artist connectors.
 */
const CONNECTOR_NAMES: Record<string, string> = {
  tiktok: "TikTok",
};

/**
 * Get all allowed artist connectors with their connection status.
 *
 * Returns the list of ALLOWED_ARTIST_CONNECTORS with isConnected status
 * based on existing connections in artist_composio_connections table.
 *
 * @param artistId - The artist ID to get connectors for
 * @returns Array of connector info with connection status
 */
export async function getArtistConnectors(artistId: string): Promise<ArtistConnectorInfo[]> {
  // Fetch existing connections for this artist
  const existingConnections = await selectArtistComposioConnections(artistId);

  // Create a map of toolkit_slug -> connected_account_id for quick lookup
  const connectionMap = new Map<string, string>();
  for (const conn of existingConnections) {
    connectionMap.set(conn.toolkit_slug, conn.connected_account_id);
  }

  // Build connector list with status
  return ALLOWED_ARTIST_CONNECTORS.map(slug => {
    const connectedAccountId = connectionMap.get(slug);
    return {
      slug,
      name: CONNECTOR_NAMES[slug] || slug,
      isConnected: !!connectedAccountId,
      connectedAccountId,
    };
  });
}
