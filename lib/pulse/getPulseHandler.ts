import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { selectPulseAccount } from "@/lib/supabase/pulse_accounts/selectPulseAccount";

/**
 * Handler for retrieving pulse status for an account.
 * Requires authentication via x-api-key header.
 *
 * @param request - The request object.
 * @returns A NextResponse with the pulse account status.
 */
export async function getPulseHandler(request: NextRequest): Promise<NextResponse> {
  const accountIdOrError = await getApiKeyAccountId(request);
  if (accountIdOrError instanceof NextResponse) {
    return accountIdOrError;
  }
  const accountId = accountIdOrError;

  const pulseAccount = await selectPulseAccount(accountId);

  return NextResponse.json(
    {
      active: pulseAccount?.active ?? false,
    },
    {
      status: 200,
      headers: getCorsHeaders(),
    },
  );
}
