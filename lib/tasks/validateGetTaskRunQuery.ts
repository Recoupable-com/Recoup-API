import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

const getTaskRunQuerySchema = z.object({
  runId: z
    .string({ message: "runId is required" })
    .min(1, "runId is required")
    .transform(val => val.trim()),
});

export type GetTaskRunQuery = z.infer<typeof getTaskRunQuerySchema>;

/**
 * Validates query parameters for GET /api/tasks/runs.
 *
 * @param request - The NextRequest object
 * @returns A NextResponse with an error if validation fails, or the validated query if validation passes.
 */
export function validateGetTaskRunQuery(request: NextRequest): NextResponse | GetTaskRunQuery {
  const runId = request.nextUrl.searchParams.get("runId") ?? "";

  const result = getTaskRunQuerySchema.safeParse({ runId });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
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
