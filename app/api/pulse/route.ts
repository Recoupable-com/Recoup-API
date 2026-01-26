import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getPulseHandler } from "@/lib/pulse/getPulseHandler";
import { updatePulseHandler } from "@/lib/pulse/updatePulseHandler";

/**
 * OPTIONS handler for CORS preflight requests.
 *
 * @returns A NextResponse with CORS headers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * GET /api/pulse
 *
 * Retrieves the pulse status for the authenticated account.
 * Requires authentication via x-api-key header.
 *
 * @param request - The request object.
 * @returns A NextResponse with the pulse status (active: boolean).
 */
export async function GET(request: NextRequest) {
  return getPulseHandler(request);
}

/**
 * PATCH /api/pulse
 *
 * Updates the pulse status for the authenticated account.
 * Creates a new pulse_accounts record if one doesn't exist.
 * Requires authentication via x-api-key header.
 *
 * Body parameters:
 * - active (required): boolean - Whether pulse is active for this account
 *
 * @param request - The request object containing the body with active boolean.
 * @returns A NextResponse with the updated pulse status.
 */
export async function PATCH(request: NextRequest) {
  return updatePulseHandler(request);
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
