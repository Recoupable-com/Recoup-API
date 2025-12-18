import insertMemories from "@/lib/supabase/memories/insertMemories";
import { validateMessages } from "@/lib/messages/validateMessages";
import selectRoom from "@/lib/supabase/rooms/selectRoom";
import { insertRoom } from "@/lib/supabase/rooms/insertRoom";
import { generateChatTitle } from "@/lib/chat/generateChatTitle";
import { sendNewConversationNotification } from "@/lib/telegram/sendNewConversationNotification";
import filterMessageContentForMemories from "@/lib/messages/filterMessageContentForMemories";
import { serializeError } from "@/lib/errors/serializeError";
import { sendErrorNotification } from "@/lib/telegram/errors/sendErrorNotification";
import selectAccountEmails from "@/lib/supabase/account_emails/selectAccountEmails";
import { ChatRequestBody } from "./validateChatRequest";
import { UIMessage } from "ai";

/**
 * Handles the chat completion and saves the messages to the database.
 *
 * @param body - The chat request body
 * @param responseMessages - The response messages
 * @returns void
 */
export async function handleChatCompletion(
  body: ChatRequestBody,
  responseMessages: UIMessage[],
): Promise<void> {
  try {
    const { messages, roomId = "", accountId, artistId } = body;

    let email = "";
    const accountEmails = await selectAccountEmails({ accountIds: accountId });
    if (accountEmails.length > 0 && accountEmails[0].email) {
      email = accountEmails[0].email;
    }

    const { lastMessage } = validateMessages(messages);

    const room = await selectRoom(roomId);

    // Create room and send notification if this is a new conversation
    if (!room) {
      const latestMessageText = lastMessage.parts.find(part => part.type === "text")?.text || "";
      const conversationName = await generateChatTitle(latestMessageText);

      await Promise.all([
        insertRoom({
          account_id: accountId,
          topic: conversationName,
          artist_id: artistId || undefined,
        }),
        sendNewConversationNotification({
          accountId,
          email,
          conversationId: roomId,
          topic: conversationName,
          firstMessage: latestMessageText,
        }),
      ]);
    }

    // Store messages sequentially to maintain correct order
    // First store the user message, then the assistant message
    await insertMemories({
      id: lastMessage.id,
      room_id: roomId,
      content: filterMessageContentForMemories(lastMessage),
    });

    await insertMemories({
      id: responseMessages[responseMessages.length - 1].id,
      room_id: roomId,
      content: filterMessageContentForMemories(responseMessages[responseMessages.length - 1]),
    });
  } catch (error) {
    sendErrorNotification({
      ...body,
      path: "/api/chat",
      error: serializeError(error),
    });
    console.error("Failed to save chat", error);
  }
}
