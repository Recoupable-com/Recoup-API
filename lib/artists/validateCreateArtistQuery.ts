import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const createArtistQuerySchema = z.object({
  name: z
    .string({ message: "name is required" })
    .min(1, "name cannot be empty"),
  account_id: z
    .string({ message: "account_id is required" })
    .uuid("account_id must be a valid UUID"),
});

export type CreateArtistQuery = z.infer<typeof createArtistQuerySchema>;

/**
 * Validates query parameters for GET /api/artist/create.
 *
 * @param searchParams - The URL search parameters
 * @returns A NextResponse with an error if validation fails, or the validated query if validation passes.
 */
export function validateCreateArtistQuery(
  searchParams: URLSearchParams,
): NextResponse | CreateArtistQuery {
  const params = Object.fromEntries(searchParams.entries());
  const result = createArtistQuerySchema.safeParse(params);

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
