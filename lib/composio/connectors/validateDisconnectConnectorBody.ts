import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const disconnectConnectorBodySchema = z
  .object({
    connected_account_id: z.string().min(1, "connected_account_id is required"),
    entity_type: z.enum(["user", "artist"]).optional().default("user"),
    entity_id: z.string().optional(),
  })
  .refine(
    (data) => {
      // entity_id is required when entity_type is "artist"
      if (data.entity_type === "artist" && !data.entity_id) {
        return false;
      }
      return true;
    },
    {
      message: "entity_id is required when entity_type is 'artist'",
      path: ["entity_id"],
    },
  );

export type DisconnectConnectorBody = z.infer<typeof disconnectConnectorBodySchema>;

/**
 * Validates request body for DELETE /api/connectors.
 *
 * Supports both user and artist connectors:
 * - User: { connected_account_id: "ca_xxx" }
 * - Artist: { connected_account_id: "ca_xxx", entity_type: "artist", entity_id: "artist-uuid" }
 *
 * @param body - The request body
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateDisconnectConnectorBody(
  body: unknown,
): NextResponse | DisconnectConnectorBody {
  const result = disconnectConnectorBodySchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      {
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
