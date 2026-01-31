import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateAuthContext } from "@/lib/auth/validateAuthContext";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";
import { validateDisconnectArtistConnectorBody } from "@/lib/composio/artistConnectors/validateDisconnectArtistConnectorBody";
import {
  getConnectors,
  disconnectConnector,
  ALLOWED_ARTIST_CONNECTORS,
} from "@/lib/composio/connectors";

/**
 * Display names for artist connectors.
 */
const CONNECTOR_DISPLAY_NAMES: Record<string, string> = {
  tiktok: "TikTok",
};

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
 * GET /api/artist-connectors
 *
 * List all available connectors and their connection status for an artist.
 *
 * Query params:
 *   - artist_id (required): The artist ID to get connectors for
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 *
 * @param request - The incoming request
 * @returns List of connectors with connection status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    // Validate auth
    const authResult = await validateAuthContext(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { accountId } = authResult;

    // Get artist_id from query params
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artist_id");

    if (!artistId) {
      return NextResponse.json(
        { error: "artist_id query parameter is required" },
        { status: 400, headers },
      );
    }

    // Verify user has access to this artist
    const hasAccess = await checkAccountArtistAccess(accountId, artistId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this artist" }, { status: 403, headers });
    }

    // Get connectors with status using unified function
    const connectors = await getConnectors(artistId, {
      allowedToolkits: ALLOWED_ARTIST_CONNECTORS,
      displayNames: CONNECTOR_DISPLAY_NAMES,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          connectors,
        },
      },
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch artist connectors";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}

/**
 * DELETE /api/artist-connectors
 *
 * Disconnect an artist's connector from Composio.
 *
 * Body:
 *   - artist_id (required): The artist ID
 *   - connected_account_id (required): The connected account ID to disconnect
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 *
 * @param request - The incoming request
 * @returns Success status
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
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
    const validated = validateDisconnectArtistConnectorBody(body);
    if (validated instanceof NextResponse) {
      return validated;
    }

    const { artist_id, connected_account_id } = validated;

    // Verify user has access to this artist
    const hasAccess = await checkAccountArtistAccess(accountId, artist_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this artist" },
        { status: 403, headers },
      );
    }

    // Disconnect using unified function with ownership verification
    await disconnectConnector(connected_account_id, {
      verifyOwnershipFor: artist_id,
    });

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect artist connector";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
