import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateAuthContext } from "@/lib/auth/validateAuthContext";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";
import { getArtistConnectors } from "@/lib/composio/artistConnectors/getArtistConnectors";

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

    // Get connectors with status
    const connectors = await getArtistConnectors(artistId);

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
