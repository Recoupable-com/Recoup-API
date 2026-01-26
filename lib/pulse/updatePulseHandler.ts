import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { validateUpdatePulseBody, type UpdatePulseBody } from "./validateUpdatePulseBody";
import { selectPulseAccount } from "@/lib/supabase/pulse_accounts/selectPulseAccount";
import { insertPulseAccount } from "@/lib/supabase/pulse_accounts/insertPulseAccount";
import { updatePulseAccount } from "@/lib/supabase/pulse_accounts/updatePulseAccount";

/**
 * Handler for updating pulse status for an account.
 * Requires authentication via x-api-key header.
 *
 * Creates a new pulse_accounts record if one doesn't exist,
 * otherwise updates the existing record.
 *
 * @param request - The request object.
 * @returns A NextResponse with the updated pulse account status.
 */
export async function updatePulseHandler(request: NextRequest): Promise<NextResponse> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }
  const accountId = accountIdOrError;

  const body = await safeParseJson(request);
  const validated = validateUpdatePulseBody(body);
  if (validated instanceof NextResponse) {
    return validated;
  }
  const { active } = validated as UpdatePulseBody;

  const existingPulseAccount = await selectPulseAccount(accountId);

  let pulseAccount;
  if (existingPulseAccount) {
    pulseAccount = await updatePulseAccount(accountId, { active });
  } else {
    pulseAccount = await insertPulseAccount({ account_id: accountId, active });
  }

  if (!pulseAccount) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to update pulse status",
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }

  return NextResponse.json(
    {
      active: pulseAccount.active,
    },
    {
      status: 200,
      headers: getCorsHeaders(),
    },
  );
}
