import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateCreateArtistQuery } from "@/lib/artists/validateCreateArtistQuery";
import { createArtistInDb } from "@/lib/artists/createArtistInDb";

/**
 * Handler for creating a new artist.
 *
 * Query parameters:
 * - name (required): The name of the artist to create
 * - account_id (required): The ID of the owner account (UUID)
 *
 * @param request - The request object containing query parameters
 * @returns A NextResponse with artist data or error
 */
export async function createArtistHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const validatedQuery = validateCreateArtistQuery(searchParams);
  if (validatedQuery instanceof NextResponse) {
    return validatedQuery;
  }

  try {
    const artist = await createArtistInDb(
      validatedQuery.name,
      validatedQuery.account_id,
    );

    if (!artist) {
      return NextResponse.json(
        { message: "Failed to create artist" },
        {
          status: 500,
          headers: getCorsHeaders(),
        },
      );
    }

    return NextResponse.json(
      { artist },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json(
      { message },
      {
        status: 400,
        headers: getCorsHeaders(),
      },
    );
  }
}
