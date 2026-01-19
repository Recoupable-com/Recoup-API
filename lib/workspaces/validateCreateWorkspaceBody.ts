import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getApiKeyDetails } from "@/lib/keys/getApiKeyDetails";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { getAuthenticatedAccountId } from "@/lib/auth/getAuthenticatedAccountId";
import { canAccessAccount } from "@/lib/organizations/canAccessAccount";
import { validateOrganizationAccess } from "@/lib/organizations/validateOrganizationAccess";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { z } from "zod";

export const createWorkspaceBodySchema = z.object({
  name: z.string().optional(),
  account_id: z.uuid({ message: "account_id must be a valid UUID" }).optional(),
  organization_id: z.uuid({ message: "organization_id must be a valid UUID" }).optional().nullable(),
});

export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;

export type ValidatedCreateWorkspaceRequest = {
  name: string;
  accountId: string;
  organizationId?: string;
};

/**
 * Validates POST /api/workspaces request including auth headers, body parsing, schema validation,
 * organization access authorization, and account access authorization.
 *
 * Supports both:
 * - x-api-key header
 * - Authorization: Bearer <token> header
 *
 * @param request - The NextRequest object
 * @returns A NextResponse with an error if validation fails, or the validated request data if validation passes.
 */
export async function validateCreateWorkspaceBody(
  request: NextRequest,
): Promise<NextResponse | ValidatedCreateWorkspaceRequest> {
  const apiKey = request.headers.get("x-api-key");
  const authHeader = request.headers.get("authorization");

  const hasApiKey = !!apiKey;
  const hasAuth = !!authHeader;

  // Require exactly one auth mechanism
  if ((hasApiKey && hasAuth) || (!hasApiKey && !hasAuth)) {
    return NextResponse.json(
      { status: "error", error: "Exactly one of x-api-key or Authorization must be provided" },
      { status: 401, headers: getCorsHeaders() },
    );
  }

  let accountId: string;
  let orgId: string | null = null;

  if (hasApiKey) {
    // Validate API key authentication
    const accountIdOrError = await getApiKeyAccountId(request);
    if (accountIdOrError instanceof NextResponse) {
      return accountIdOrError;
    }
    accountId = accountIdOrError;

    // Get org context from API key details
    const keyDetails = await getApiKeyDetails(apiKey!);
    if (keyDetails) {
      orgId = keyDetails.orgId;
    }
  } else {
    // Validate bearer token authentication
    const accountIdOrError = await getAuthenticatedAccountId(request);
    if (accountIdOrError instanceof NextResponse) {
      return accountIdOrError;
    }
    accountId = accountIdOrError;
  }

  const body = await safeParseJson(request);
  const result = createWorkspaceBodySchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        missing_fields: firstError.path,
        error: firstError.message,
      },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  // Handle account_id override for org API keys
  if (result.data.account_id) {
    const hasAccess = await canAccessAccount({
      orgId,
      targetAccountId: result.data.account_id,
    });
    if (!hasAccess) {
      return NextResponse.json(
        { status: "error", error: "Access denied to specified account_id" },
        { status: 403, headers: getCorsHeaders() },
      );
    }
    accountId = result.data.account_id;
  }

  // Validate organization access if organization_id is provided
  // This prevents users from linking workspaces to orgs they don't belong to
  if (result.data.organization_id) {
    const hasOrgAccess = await validateOrganizationAccess({
      accountId,
      organizationId: result.data.organization_id,
    });

    if (!hasOrgAccess) {
      return NextResponse.json(
        { status: "error", error: "Access denied to specified organization_id" },
        { status: 403, headers: getCorsHeaders() },
      );
    }
  }

  // Default name to "Untitled" if not provided
  const workspaceName = result.data.name?.trim() || "Untitled";

  return {
    name: workspaceName,
    accountId,
    organizationId: result.data.organization_id ?? undefined,
  };
}
