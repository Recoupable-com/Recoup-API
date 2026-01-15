import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { createArtistHandler } from "@/lib/artists/createArtistHandler";

/**
 * OPTIONS handler for CORS preflight requests.
 *
 * @returns A NextResponse with CORS headers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

/**
 * GET /api/artist/create
 *
 * Creates a new artist account and associates it with an owner account.
 *
 * Query parameters:
 * - name (required): The name of the artist to create
 * - account_id (required): The ID of the owner account (UUID)
 *
 * @param request - The request object containing query parameters
 * @returns A NextResponse with the created artist data
 */
export async function GET(request: NextRequest) {
  return createArtistHandler(request);
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
