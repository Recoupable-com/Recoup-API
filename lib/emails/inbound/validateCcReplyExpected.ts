import { NextResponse } from "next/server";
import type { ResendEmailData } from "@/lib/emails/validateInboundEmailEvent";
import { isRecoupOnlyInCC } from "@/lib/emails/inbound/isRecoupOnlyInCC";
import { shouldReplyToCcEmail } from "@/lib/emails/inbound/shouldReplyToCcEmail";

/**
 * Validates whether a reply should be sent when Recoup is CC'd on an email.
 *
 * When Recoup is only in the CC array (not in TO), this function uses an LLM
 * to determine if a reply is expected or if Recoup is just being kept in the loop.
 *
 * @param original - The original email data from the Resend webhook
 * @param emailText - The parsed email body text
 * @returns Either a NextResponse to early return (no reply needed) or null to continue
 */
export async function validateCcReplyExpected(
  original: ResendEmailData,
  emailText: string,
): Promise<{ response: NextResponse } | null> {
  // If Recoup is in the TO array, no CC validation needed - continue with reply
  if (!isRecoupOnlyInCC(original.to, original.cc)) {
    return null;
  }

  // Recoup is only CC'd - use LLM to determine if reply is expected
  const shouldReply = await shouldReplyToCcEmail({
    from: original.from,
    to: original.to,
    cc: original.cc,
    subject: original.subject,
    body: emailText,
  });

  if (!shouldReply) {
    console.log("[validateCcReplyExpected] Recoup is only CC'd and no reply expected, skipping");
    return {
      response: NextResponse.json(
        { message: "CC'd for visibility only, no reply sent" },
        { status: 200 },
      ),
    };
  }

  console.log("[validateCcReplyExpected] Recoup is only CC'd but reply is expected, continuing");
  return null;
}
