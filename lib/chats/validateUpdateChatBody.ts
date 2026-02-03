import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

/**
 * Zod schema for PATCH /api/chats request body.
 */
export const updateChatBodySchema = z.object({
  chatId: z.string().uuid("chatId must be a valid UUID"),
  topic: z
    .string({ message: "topic is required" })
    .min(3, "topic must be between 3 and 50 characters")
    .max(50, "topic must be between 3 and 50 characters"),
});

export type UpdateChatBody = z.infer<typeof updateChatBodySchema>;

/**
 * Validates request body for PATCH /api/chats.
 *
 * @param body - The request body
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateUpdateChatBody(body: unknown): NextResponse | UpdateChatBody {
  const result = updateChatBodySchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        missing_fields: firstError.path,
        error: firstError.message,
      },
      {
        status: 400,
        headers: getCorsHeaders(),
      },
    );
  }

  return result.data;
}
