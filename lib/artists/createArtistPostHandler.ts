import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateCreateArtistBody } from "@/lib/artists/validateCreateArtistBody";
import { createArtistInDb } from "@/lib/artists/createArtistInDb";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";

/**
 * Handler for POST /api/artists.
 *
 * Creates a new artist account. Requires authentication via x-api-key header.
 * The account ID is inferred from the API key, unless an account_id is provided
 * in the request body by an organization API key with access to that account.
 *
 * Request body:
 * - name (required): The name of the artist to create
 * - account_id (optional): The ID of the account to create the artist for (UUID).
 *   Only used by organization API keys creating artists on behalf of other accounts.
 * - organization_id (optional): The organization ID to link the new artist to (UUID)
 *
 * @param request - The request object containing JSON body
 * @returns A NextResponse with artist data or error
 */
export async function createArtistPostHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }

  let accountId = accountIdOrError;

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

  // Handle account_id override for org API keys
  if (validated.account_id) {
    const overrideResult = await validateOverrideAccountId({
      apiKey: request.headers.get("x-api-key"),
      targetAccountId: validated.account_id,
    });
    if (overrideResult instanceof NextResponse) {
      return overrideResult;
    }
    accountId = overrideResult.accountId;
  }

  try {
    const artist = await createArtistInDb(
      validated.name,
      accountId,
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
