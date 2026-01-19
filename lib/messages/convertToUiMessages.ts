import { UIMessage } from "ai";
import generateUUID from "@/lib/uuid/generateUUID";
import isUiMessage from "@/lib/messages/isUiMessage";

/**
 * Message in simple { role, content } format.
 */
interface SimpleMessage {
  id?: string;
  role: string;
  content: string;
}

/**
 * Input message that can be either UIMessage or simple format.
 */
type InputMessage = UIMessage | SimpleMessage;

/**
 * Converts messages to UIMessage format.
 *
 * Similar to AI SDK's convertToModelMessages, this utility normalizes
 * messages from various formats into the standard UIMessage format.
 *
 * Handles:
 * - UIMessage format (with parts array) - passed through unchanged
 * - Simple format ({ role, content }) - converted to UIMessage
 * - Mixed arrays of both formats
 *
 * @param messages - Array of messages in any supported format
 * @returns Array of messages in UIMessage format
 */
export default function convertToUiMessages(messages: InputMessage[]): UIMessage[] {
  return messages.map((message) => {
    if (isUiMessage(message)) {
      return message;
    }

    // Convert simple { role, content } format to UIMessage
    return {
      id: message.id || generateUUID(),
      role: message.role as "user" | "assistant" | "system",
      parts: [{ type: "text" as const, text: message.content }],
    };
  });
}
