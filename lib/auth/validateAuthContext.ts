import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { getAuthenticatedAccountId } from "@/lib/auth/getAuthenticatedAccountId";
import { getApiKeyDetails } from "@/lib/keys/getApiKeyDetails";
import { validateOrganizationAccess } from "@/lib/organizations/validateOrganizationAccess";
import { canAccessAccount } from "@/lib/organizations/canAccessAccount";

/**
 * Input parameters for auth context validation.
 * These typically come from the request body after schema validation.
 */
export interface AuthContextInput {
  /** Optional account_id override from request body */
  accountId?: string;
  /** Optional organization_id from request body */
  organizationId?: string | null;
}

/**
 * Validated auth context result.
 * Contains the resolved accountId, orgId, and auth token.
 */
export interface AuthContext {
  /** The resolved account ID (from API key or override) */
  accountId: string;
  /** The organization context (from API key or request body) */
  orgId: string | null;
  /** The auth token for forwarding to downstream services */
  authToken: string;
}

/**
 * Validates authentication headers and authorization context for API requests.
 *
 * This is the single source of truth for:
 * 1. Authenticating via x-api-key or Authorization bearer token
 * 2. Resolving the accountId (from auth or body override)
 * 3. Validating account_id override access (org keys can access member accounts, personal keys can access own account)
 * 4. Validating organization_id access (account must be a member of the org)
 *
 * @param request - The NextRequest object
 * @param input - Optional overrides from the request body
 * @returns A NextResponse with an error or the validated AuthContext
 */
export async function validateAuthContext(
  request: NextRequest,
  input: AuthContextInput = {},
): Promise<NextResponse | AuthContext> {
  const apiKey = request.headers.get("x-api-key");
  const authHeader = request.headers.get("authorization");
  const hasApiKey = !!apiKey;
  const hasAuth = !!authHeader;

  // Enforce exactly one auth mechanism
  if ((hasApiKey && hasAuth) || (!hasApiKey && !hasAuth)) {
    return NextResponse.json(
      { status: "error", error: "Exactly one of x-api-key or Authorization must be provided" },
      { status: 401, headers: getCorsHeaders() },
    );
  }

  let accountId: string;
  let orgId: string | null = null;
  let authToken: string;

  if (hasApiKey) {
    // Validate API key authentication
    const accountIdOrError = await getApiKeyAccountId(request);
    if (accountIdOrError instanceof NextResponse) {
      return accountIdOrError;
    }
    accountId = accountIdOrError;
    authToken = apiKey!;

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
    authToken = authHeader!.replace(/^Bearer\s+/i, "");
  }

  // Handle account_id override from request body
  if (input.accountId) {
    const overrideResult = await validateAccountIdOverride({
      currentAccountId: accountId,
      targetAccountId: input.accountId,
      orgId,
    });

    if (overrideResult instanceof NextResponse) {
      return overrideResult;
    }

    accountId = overrideResult.accountId;
  }

  // Handle organization_id from request body
  if (input.organizationId) {
    const hasOrgAccess = await validateOrganizationAccess({
      accountId,
      organizationId: input.organizationId,
    });

    if (!hasOrgAccess) {
      return NextResponse.json(
        { status: "error", error: "Access denied to specified organization_id" },
        { status: 403, headers: getCorsHeaders() },
      );
    }

    // Use the provided organizationId as the org context
    orgId = input.organizationId;
  }

  return {
    accountId,
    orgId,
    authToken,
  };
}

/**
 * Parameters for account ID override validation.
 */
interface ValidateAccountIdOverrideParams {
  /** The account ID from the authenticated API key/token */
  currentAccountId: string;
  /** The target account ID to override to */
  targetAccountId: string;
  /** The organization ID from the API key (null for personal keys) */
  orgId: string | null;
}

/**
 * Result of successful account ID override validation.
 */
interface ValidateAccountIdOverrideResult {
  accountId: string;
}

/**
 * Validates if an account_id override is allowed.
 *
 * Access rules:
 * 1. If targetAccountId equals currentAccountId, always allowed (self-access)
 * 2. If orgId is present, checks if targetAccountId is a member of the org
 * 3. If orgId is null and targetAccountId !== currentAccountId, denied
 *
 * @param params - The validation parameters
 * @returns NextResponse with error or the validated result
 */
async function validateAccountIdOverride(
  params: ValidateAccountIdOverrideParams,
): Promise<NextResponse | ValidateAccountIdOverrideResult> {
  const { currentAccountId, targetAccountId, orgId } = params;

  // Self-access is always allowed (personal API key accessing own account)
  if (targetAccountId === currentAccountId) {
    return { accountId: targetAccountId };
  }

  // For org API keys, check if target account is a member of the org
  if (orgId) {
    const hasAccess = await canAccessAccount({
      orgId,
      targetAccountId,
    });

    if (hasAccess) {
      return { accountId: targetAccountId };
    }
  }

  // No access - either personal key trying to access another account,
  // or org key trying to access a non-member account
  return NextResponse.json(
    { status: "error", error: "Access denied to specified account_id" },
    { status: 403, headers: getCorsHeaders() },
  );
}
