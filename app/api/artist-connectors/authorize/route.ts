import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateAuthContext } from "@/lib/auth/validateAuthContext";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";
import { validateAuthorizeArtistConnectorBody } from "@/lib/composio/artistConnectors/validateAuthorizeArtistConnectorBody";
import {
  authorizeConnector,
  isAllowedArtistConnector,
} from "@/lib/composio/connectors";

/**
 * OPTIONS handler for CORS preflight requests.
 *
 * @returns Empty response with CORS headers
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

/**
 * POST /api/artist-connectors/authorize
 *
 * Generate an OAuth authorization URL for an artist connector.
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 *
 * Request body:
 * - artist_id: The artist ID to connect the service for (required)
 * - connector: The connector slug, e.g., "tiktok" (required)
 *
 * @param request - The incoming request
 * @returns The redirect URL for OAuth authorization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    // Validate auth
    const authResult = await validateAuthContext(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { accountId } = authResult;

    // Parse and validate body
    const body = await request.json();
    const validated = validateAuthorizeArtistConnectorBody(body);
    if (validated instanceof NextResponse) {
      return validated;
    }

    const { artist_id, connector } = validated;

    // Verify connector is allowed
    if (!isAllowedArtistConnector(connector)) {
      return NextResponse.json(
        { error: `Connector '${connector}' is not allowed for artist connections` },
        { status: 400, headers },
      );
    }

    // Verify user has access to this artist
    const hasAccess = await checkAccountArtistAccess(accountId, artist_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this artist" },
        { status: 403, headers },
      );
    }

    // Build auth configs for toolkits that need custom OAuth
    const authConfigs: Record<string, string> = {};
    if (connector === "tiktok" && process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID) {
      authConfigs.tiktok = process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID;
    }

    // Generate OAuth URL using unified authorizeConnector with artist options
    const result = await authorizeConnector(artist_id, connector, {
      entityType: "artist",
      authConfigs,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          connector: result.connector,
          redirectUrl: result.redirectUrl,
        },
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error("Artist connector authorize error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to authorize artist connector";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
