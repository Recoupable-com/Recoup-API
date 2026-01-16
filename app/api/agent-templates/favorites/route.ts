import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { toggleAgentTemplateFavoriteHandler } from "@/lib/agentTemplates/toggleAgentTemplateFavoriteHandler";

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
 * POST /api/agent-templates/favorites
 *
 * Toggle a template's favorite status for the authenticated user.
 *
 * Authentication: Authorization Bearer token required.
 *
 * Request body:
 * - templateId: string - The template ID to favorite/unfavorite
 * - isFavourite: boolean - true to add, false to remove
 *
 * @param request - The request object
 * @returns A NextResponse with success or an error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return toggleAgentTemplateFavoriteHandler(request);
}
