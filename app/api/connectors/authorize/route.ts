import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { authorizeConnector, isAllowedArtistConnector } from "@/lib/composio/connectors";
import { validateAccountIdHeaders } from "@/lib/accounts/validateAccountIdHeaders";
import { validateAuthorizeConnectorBody } from "@/lib/composio/connectors/validateAuthorizeConnectorBody";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";

/**
 * OPTIONS handler for CORS preflight requests.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

/**
 * POST /api/connectors/authorize
 *
 * Generate an OAuth authorization URL for a specific connector.
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 * The account ID is inferred from the auth header.
 *
 * Request body:
 * - connector: The connector slug, e.g., "googlesheets" or "tiktok" (required)
 * - callback_url: Optional custom callback URL after OAuth
 * - entity_type: "user" (default) or "artist"
 * - entity_id: Required when entity_type is "artist"
 *
 * @returns The redirect URL for OAuth authorization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    const authResult = await validateAccountIdHeaders(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { accountId } = authResult;
    const body = await request.json();

    const validated = validateAuthorizeConnectorBody(body);
    if (validated instanceof NextResponse) {
      return validated;
    }

    const { connector, callback_url, entity_type, entity_id } = validated;

    // Determine entity and options based on type
    let composioEntityId: string;
    let authConfigs: Record<string, string> = {};

    if (entity_type === "artist") {
      // Verify connector is allowed for artists
      if (!isAllowedArtistConnector(connector)) {
        return NextResponse.json(
          { error: `Connector '${connector}' is not allowed for artist connections` },
          { status: 400, headers },
        );
      }

      // Verify user has access to this artist
      const hasAccess = await checkAccountArtistAccess(accountId, entity_id!);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to this artist" }, { status: 403, headers });
      }

      composioEntityId = entity_id!;

      // Build auth configs for toolkits that need custom OAuth
      if (connector === "tiktok" && process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID) {
        authConfigs.tiktok = process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID;
      }
    } else {
      composioEntityId = accountId;
    }

    const result = await authorizeConnector(composioEntityId, connector, {
      customCallbackUrl: callback_url,
      entityType: entity_type,
      authConfigs: Object.keys(authConfigs).length > 0 ? authConfigs : undefined,
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
    console.error("Connector authorize error:", error);
    const message = error instanceof Error ? error.message : "Failed to authorize connector";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
