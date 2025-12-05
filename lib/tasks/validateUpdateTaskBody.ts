import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const updateTaskBodySchema = z.object({
  id: z.string().min(1, "id body parameter is required"),
  title: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  schedule: z.string().min(1).optional(),
  account_id: z.string().min(1).optional(),
  artist_account_id: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

/**
 * Validates update task request body.
 *
 * @param body - The request body to validate.
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateUpdateTaskBody(body: unknown): NextResponse | UpdateTaskBody {
  const validationResult = updateTaskBodySchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
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

  return validationResult.data;
}

