import { NextResponse } from "next/server";
import type { ResendEmailData } from "@/lib/emails/validateInboundEmailEvent";
import { shouldReplyToCcEmail } from "@/lib/emails/inbound/shouldReplyToCcEmail";

const RECOUP_DOMAIN = "@mail.recoupable.com";

/**
 * Validates whether a reply should be sent based on Recoup's position in TO/CC.
 *
 * - If Recoup is in TO → always reply (no LLM call)
 * - If Recoup is only in CC → use LLM to determine if reply expected
 * - If Recoup is not in TO or CC → no reply
 *
 * @param original - The original email data from the Resend webhook
 * @param emailText - The parsed email body text
 * @returns Either a NextResponse to early return (no reply needed) or null to continue
 */
export async function validateCcReplyExpected(
  original: ResendEmailData,
  emailText: string,
): Promise<{ response: NextResponse } | null> {
  const isInTo = original.to.some(email => email.toLowerCase().endsWith(RECOUP_DOMAIN));
  const isInCc = original.cc.some(email => email.toLowerCase().endsWith(RECOUP_DOMAIN));

  // Recoup is in TO → always reply
  if (isInTo) {
    return null;
  }

  // Recoup is in CC (but not TO) → use LLM to determine if reply expected
  if (isInCc) {
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

  // Recoup is not in TO or CC → no reply
  console.log("[validateCcReplyExpected] Recoup not found in TO or CC, skipping");
  return {
    response: NextResponse.json(
      { message: "Recoup not addressed, no reply sent" },
      { status: 200 },
    ),
  };
}
