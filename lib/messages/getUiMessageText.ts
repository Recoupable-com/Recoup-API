import { UIMessage } from "ai";

/**
 * Extracts text content from a UIMessage.
 *
 * @param message - The UIMessage to extract text from
 * @returns The text content of the first text part, or empty string if none found
 */
export default function getUiMessageText(message: UIMessage): string {
  return message.parts?.find((part) => part.type === "text")?.text || "";
}
