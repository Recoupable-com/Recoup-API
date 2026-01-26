import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { validateUpdatePulseBody } from "./validateUpdatePulseBody";

export type UpdatePulseRequestResult = {
  accountId: string;
  active: boolean;
};

/**
 * Validates PATCH /api/pulse request.
 * Handles authentication via x-api-key, body validation, and optional account_id override.
 *
 * @param request - The NextRequest object
 * @returns A NextResponse with an error if validation fails, or the validated result
 */
export async function validateUpdatePulseRequest(
  request: NextRequest,
): Promise<NextResponse | UpdatePulseRequestResult> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }
  let accountId = accountIdOrError;

  const body = await safeParseJson(request);
  const validated = validateUpdatePulseBody(body);
  if (validated instanceof NextResponse) {
    return validated;
  }
  const { active, account_id: targetAccountId } = validated;

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

  return { accountId, active };
}
