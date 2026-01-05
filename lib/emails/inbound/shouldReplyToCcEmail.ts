import { Output, ToolLoopAgent, stepCountIs } from "ai";
import { z } from "zod";
import { LIGHTWEIGHT_MODEL } from "@/lib/const";
import type { ResendEmailData } from "@/lib/emails/validateInboundEmailEvent";

type EmailContext = Pick<ResendEmailData, "from" | "to" | "cc" | "subject"> & { body: string };

const replyDecisionSchema = z.object({
  shouldReply: z.boolean().describe("Whether the Recoup AI assistant should reply to this email"),
});

/**
 * Uses an agent to determine if a reply is expected from the Recoup AI assistant.
 *
 * @param context - The email context including from, to, cc, subject, and body
 * @returns true if a reply is expected, false otherwise
 */
export async function shouldReplyToCcEmail(context: EmailContext): Promise<boolean> {
  const { from, to, cc, subject, body } = context;

  const instructions = `You analyze emails to determine if a Recoup AI assistant (@mail.recoupable.com) should reply.

Rules (check in this order):
1. FIRST check the body/subject: If the sender explicitly asks NOT to reply (e.g., "don't reply", "do not reply", "stop replying", "no response needed") → return false
2. If Recoup is in TO and the email asks a question or requests help → return true
3. If Recoup is ONLY in CC: return true only if directly addressed, otherwise return false
4. When in doubt, return false`;

  const agent = new ToolLoopAgent({
    model: LIGHTWEIGHT_MODEL,
    instructions,
    output: Output.object({ schema: replyDecisionSchema }),
    stopWhen: stepCountIs(1),
  });

  const prompt = `Analyze this email:
- From: ${from}
- To: ${to.join(", ")}
- CC: ${cc.join(", ")}
- Subject: ${subject}
- Body: ${body}`;

  const { output } = await agent.generate({ prompt });

  return output.shouldReply;
}
