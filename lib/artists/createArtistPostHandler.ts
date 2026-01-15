import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateCreateArtistBody } from "@/lib/artists/validateCreateArtistBody";
import { createArtistInDb } from "@/lib/artists/createArtistInDb";

/**
 * Handler for POST /api/artists.
 *
 * Creates a new artist account.
 *
 * Request body:
 * - name (required): The name of the artist to create
 * - account_id (optional): The ID of the account to create the artist for (UUID).
 *   Only required for organization API keys creating artists on behalf of other accounts.
 * - organization_id (optional): The organization ID to link the new artist to (UUID)
 *
 * @param request - The request object containing JSON body
 * @param accountId - The account ID from API key context (used if account_id not in body)
 * @returns A NextResponse with artist data or error
 */
export async function createArtistPostHandler(
  request: NextRequest,
  accountId?: string,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", error: "Invalid JSON body" },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  const validated = validateCreateArtistBody(body);
  if (validated instanceof NextResponse) {
    return validated;
  }

  // Use account_id from body, or fall back to API key context
  const ownerAccountId = validated.account_id ?? accountId;
  if (!ownerAccountId) {
    return NextResponse.json(
      {
        status: "error",
        error: "account_id is required",
      },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  try {
    const artist = await createArtistInDb(
      validated.name,
      ownerAccountId,
      validated.organization_id,
    );

    if (!artist) {
      return NextResponse.json(
        { status: "error", error: "Failed to create artist" },
        { status: 500, headers: getCorsHeaders() },
      );
    }

    return NextResponse.json(
      { artist },
      { status: 201, headers: getCorsHeaders() },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create artist";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500, headers: getCorsHeaders() },
    );
  }
}
