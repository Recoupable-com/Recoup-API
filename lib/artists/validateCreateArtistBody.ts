import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const createArtistBodySchema = z.object({
  name: z
    .string({ message: "name is required" })
    .min(1, "name cannot be empty"),
  account_id: z
    .string()
    .uuid("account_id must be a valid UUID")
    .optional(),
  organization_id: z
    .string()
    .uuid("organization_id must be a valid UUID")
    .optional(),
});

export type CreateArtistBody = z.infer<typeof createArtistBodySchema>;

/**
 * Validates request body for POST /api/artists.
 *
 * @param body - The request body
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateCreateArtistBody(
  body: unknown,
): NextResponse | CreateArtistBody {
  const result = createArtistBodySchema.safeParse(body);

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
