import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const artistSocialsQuerySchema = z.object({
  artist_account_id: z.string().min(1, "artist_account_id parameter is required"),
  page: z
    .string()
    .optional()
    .default("1")
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

export type ArtistSocialsQuery = z.infer<typeof artistSocialsQuerySchema>;

export const artistSocialsResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
  socials: z.array(
    z.object({
      id: z.string(),
      social_id: z.string(),
      username: z.string().nullable(),
      profile_url: z.string().nullable(),
      avatar: z.string().nullable(),
      bio: z.string().nullable(),
      follower_count: z.number().nullable(),
      following_count: z.number().nullable(),
      region: z.string().nullable(),
      updated_at: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    total_count: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
  }),
});

export type GetArtistSocialsResponse = z.infer<typeof artistSocialsResponseSchema>;

/**
 * Validates artist socials query parameters.
 *
 * @param searchParams - The URL search parameters to validate.
 * @returns A NextResponse with an error if validation fails, or the validated query parameters if validation passes.
 */
export function validateArtistSocialsQuery(
  searchParams: URLSearchParams,
): NextResponse | ArtistSocialsQuery {
  const params = Object.fromEntries(searchParams.entries());

  const validationResult = artistSocialsQuerySchema.safeParse(params);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        missing_fields: firstError.path,
        error: firstError.message,
        socials: [],
        pagination: {
          total_count: 0,
          page: 1,
          limit: 20,
          total_pages: 0,
        },
      },
      {
        status: 400,
        headers: getCorsHeaders(),
      },
    );
  }

  return validationResult.data;
}
