import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getAiModelsHandler } from "@/lib/aiModels/getAiModelsHandler";

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
 * GET /api/ai/models
 *
 * Fetch the list of available AI models from the Vercel AI Gateway.
 *
 * This is a public endpoint that does not require authentication.
 * It returns models suitable for chat, filtering out embed models.
 *
 * @returns A NextResponse with { models: GatewayLanguageModelEntry[] } or an error
 */
export async function GET(): Promise<NextResponse> {
  return getAiModelsHandler();
}

// Disable caching to always serve the latest model list.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
