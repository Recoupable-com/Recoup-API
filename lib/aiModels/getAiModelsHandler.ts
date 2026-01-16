import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getAvailableModels } from "@/lib/ai/getAvailableModels";

/**
 * Handler for fetching available AI models.
 *
 * This is a public endpoint that returns the list of available LLMs
 * from the Vercel AI Gateway. It filters out embed models that are
 * not suitable for chat.
 *
 * @returns A NextResponse with the models array or an error
 */
export async function getAiModelsHandler(): Promise<NextResponse> {
  try {
    const models = await getAvailableModels();
    return NextResponse.json(
      { models },
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
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }
}
