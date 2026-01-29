import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const compactChatsBodySchema = z.object({
  chatId: z
    .array(z.string().uuid("Each chatId must be a valid UUID"))
    .min(1, "chatId array must contain at least one ID"),
  prompt: z.string().optional(),
});

export type CompactChatsBody = z.infer<typeof compactChatsBodySchema>;

/**
 * Validates request body for POST /api/chats/compact.
 *
 * @param body - The request body
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateCompactChatsBody(body: unknown): NextResponse | CompactChatsBody {
  const result = compactChatsBodySchema.safeParse(body);

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
