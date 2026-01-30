import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { createSandbox, type SandboxResponse } from "@/lib/sandbox/createSandbox";
import { validateSandboxBody } from "@/lib/sandbox/validateSandboxBody";

/**
 * Success response for POST /api/sandboxes.
 */
export interface SandboxesResponse {
  status: "success";
  sandboxes: SandboxResponse[];
}

/**
 * Error response for POST /api/sandboxes.
 */
export interface SandboxErrorResponse {
  status: "error";
  error: string;
}

/**
 * Handler for POST /api/sandboxes.
 *
 * Creates a new ephemeral sandbox environment. Requires authentication via x-api-key header.
 *
 * @param request - The request object
 * @returns A NextResponse with sandbox data or error
 */
export async function createSandboxPostHandler(request: NextRequest): Promise<NextResponse> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }

  const body = await safeParseJson(request);
  const validated = validateSandboxBody(body);
  if (validated instanceof NextResponse) {
    return validated;
  }

  try {
    const sandbox = await createSandbox(validated.prompt);

    return NextResponse.json(
      {
        status: "success",
        sandboxes: [sandbox],
      },
      { status: 200, headers: getCorsHeaders() },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create sandbox";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 400, headers: getCorsHeaders() },
    );
  }
}
