import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateUpdateChatBody } from "./validateUpdateChatBody";
import { updateRoom } from "@/lib/supabase/rooms/updateRoom";
import { buildGetChatsParams } from "./buildGetChatsParams";

/**
 * Handles PATCH /api/chats - Update a chat room's topic.
 *
 * @param request - The NextRequest object
 * @returns NextResponse with updated chat data or error
 */
export async function updateChatHandler(request: NextRequest): Promise<NextResponse> {
  const validated = await validateUpdateChatBody(request);
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { chatId, topic, room, accountId, orgId } = validated;

  try {
    // Get the list of account_ids this user has access to
    const { params } = await buildGetChatsParams({
      account_id: accountId,
      org_id: orgId,
    });

    // Check if the room's account_id is in the allowed account_ids
    // If params.account_ids is undefined, it means admin access (all records)
    if (params.account_ids && room.account_id) {
      if (!params.account_ids.includes(room.account_id)) {
        return NextResponse.json(
          { status: "error", error: "Access denied to this chat" },
          { status: 403, headers: getCorsHeaders() },
        );
      }
    }

    // Update the room
    const updated = await updateRoom(chatId, { topic });
    if (!updated) {
      return NextResponse.json(
        { status: "error", error: "Failed to update chat" },
        { status: 500, headers: getCorsHeaders() },
      );
    }

    return NextResponse.json(
      {
        status: "success",
        chat: {
          id: updated.id,
          account_id: updated.account_id,
          topic: updated.topic,
          updated_at: updated.updated_at,
          artist_id: updated.artist_id,
        },
      },
      { status: 200, headers: getCorsHeaders() },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500, headers: getCorsHeaders() },
    );
  }
}
