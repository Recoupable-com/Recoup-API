import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateAuthContext } from "@/lib/auth/validateAuthContext";
import type { SelectAccountSandboxesParams } from "@/lib/supabase/account_sandboxes/selectAccountSandboxes";
import { buildGetSandboxesParams } from "./buildGetSandboxesParams";
import { canAccessAccount } from "@/lib/organizations/canAccessAccount";
import { z } from "zod";

const getSandboxesQuerySchema = z.object({
  sandbox_id: z.string().optional(),
  account_id: z.string().uuid("account_id must be a valid UUID").optional(),
});

/**
 * Validates GET /api/sandboxes request.
 * Handles authentication via x-api-key or Authorization bearer token.
 *
 * Query parameters:
 * - sandbox_id: Filter to a specific sandbox (must belong to account/org)
 * - account_id: Filter to a specific account (org API keys only)
 *
 * @param request - The NextRequest object
 * @returns A NextResponse with an error if validation fails, or SelectAccountSandboxesParams
 */
export async function validateGetSandboxesRequest(
  request: NextRequest,
): Promise<NextResponse | SelectAccountSandboxesParams> {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    sandbox_id: searchParams.get("sandbox_id") ?? undefined,
    account_id: searchParams.get("account_id") ?? undefined,
  };

  const queryResult = getSandboxesQuerySchema.safeParse(queryParams);
  if (!queryResult.success) {
    const firstError = queryResult.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        error: firstError.message,
      },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  const { sandbox_id: sandboxId, account_id: targetAccountId } = queryResult.data;

  // Use validateAuthContext for authentication
  const authResult = await validateAuthContext(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { accountId, orgId } = authResult;

  // Check access when account_id filter is provided
  if (targetAccountId) {
    const hasAccess = await canAccessAccount({ orgId, targetAccountId });
    if (!hasAccess) {
      return NextResponse.json(
        {
          status: "error",
          error: orgId
            ? "account_id is not a member of this organization"
            : "Personal API keys cannot filter by account_id",
        },
        { status: 403, headers: getCorsHeaders() },
      );
    }
  }

  // Build params using buildGetSandboxesParams
  const buildResult = await buildGetSandboxesParams({
    account_id: accountId,
    org_id: orgId,
    target_account_id: targetAccountId,
    sandbox_id: sandboxId,
  });

  if (buildResult.error) {
    return NextResponse.json(
      {
        status: "error",
        error: buildResult.error,
      },
      { status: 403, headers: getCorsHeaders() },
    );
  }

  return buildResult.params;
}
