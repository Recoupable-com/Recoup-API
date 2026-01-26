import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";

export type GetPulseRequestResult = {
  accountId: string;
};

/**
 * Validates GET /api/pulse request.
 * Handles authentication via x-api-key and optional account_id query parameter.
 *
 * @param request - The NextRequest object
 * @returns A NextResponse with an error if validation fails, or the validated result
 */
export async function validateGetPulseRequest(
  request: NextRequest,
): Promise<NextResponse | GetPulseRequestResult> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }
  let accountId = accountIdOrError;

  const { searchParams } = new URL(request.url);
  const targetAccountId = searchParams.get("account_id");

  if (targetAccountId) {
    const apiKey = request.headers.get("x-api-key");
    const overrideResult = await validateOverrideAccountId({
      apiKey,
      targetAccountId,
    });
    if (overrideResult instanceof NextResponse) {
      return overrideResult;
    }
    accountId = overrideResult.accountId;
  }

  return { accountId };
}
