import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getConnectors, disconnectConnector, ALLOWED_ARTIST_CONNECTORS } from "@/lib/composio/connectors";
import { validateDisconnectConnectorBody } from "@/lib/composio/connectors/validateDisconnectConnectorBody";
import { verifyConnectorOwnership } from "@/lib/composio/connectors/verifyConnectorOwnership";
import { validateAccountIdHeaders } from "@/lib/accounts/validateAccountIdHeaders";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";

/**
 * Display names for connectors.
 */
const CONNECTOR_DISPLAY_NAMES: Record<string, string> = {
  tiktok: "TikTok",
  googlesheets: "Google Sheets",
  googledrive: "Google Drive",
  googledocs: "Google Docs",
};

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
 * GET /api/connectors
 *
 * List all available connectors and their connection status.
 *
 * Query params:
 *   - entity_type (optional): "user" (default) or "artist"
 *   - entity_id (required when entity_type=artist): The artist ID
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 *
 * @returns List of connectors with connection status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    const authResult = await validateAccountIdHeaders(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { accountId } = authResult;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const entityType = (searchParams.get("entity_type") || "user") as "user" | "artist";
    const entityId = searchParams.get("entity_id");

    // Determine the Composio entity to query
    let composioEntityId: string;
    let allowedToolkits: readonly string[] | undefined;

    if (entityType === "artist") {
      if (!entityId) {
        return NextResponse.json(
          { error: "entity_id is required when entity_type is 'artist'" },
          { status: 400, headers },
        );
      }

      // Verify user has access to this artist
      const hasAccess = await checkAccountArtistAccess(accountId, entityId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to this artist" }, { status: 403, headers });
      }

      composioEntityId = entityId;
      allowedToolkits = ALLOWED_ARTIST_CONNECTORS;
    } else {
      composioEntityId = accountId;
    }

    const connectors = await getConnectors(composioEntityId, {
      allowedToolkits,
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
    const message = error instanceof Error ? error.message : "Failed to fetch connectors";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}

/**
 * DELETE /api/connectors
 *
 * Disconnect a connected account from Composio.
 *
 * Body:
 *   - connected_account_id (required): The connected account ID to disconnect
 *   - entity_type (optional): "user" (default) or "artist"
 *   - entity_id (required when entity_type=artist): The artist ID
 *
 * Authentication: x-api-key OR Authorization Bearer token required.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    const authResult = await validateAccountIdHeaders(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { accountId } = authResult;
    const body = await request.json();

    const validated = validateDisconnectConnectorBody(body);
    if (validated instanceof NextResponse) {
      return validated;
    }

    const { connected_account_id, entity_type, entity_id } = validated;

    if (entity_type === "artist") {
      // Verify user has access to this artist
      const hasAccess = await checkAccountArtistAccess(accountId, entity_id!);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to this artist" }, { status: 403, headers });
      }

      // Disconnect with ownership verification against artist
      await disconnectConnector(connected_account_id, {
        verifyOwnershipFor: entity_id!,
      });
    } else {
      // Verify the connected account belongs to the authenticated user
      const isOwner = await verifyConnectorOwnership(accountId, connected_account_id);
      if (!isOwner) {
        return NextResponse.json(
          { error: "Connected account not found or does not belong to this user" },
          { status: 403, headers },
        );
      }

      await disconnectConnector(connected_account_id);
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect connector";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
