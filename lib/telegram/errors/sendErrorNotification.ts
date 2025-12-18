import { sendMessage } from "@/lib/telegram/sendMessage";
import { formatErrorMessage, ErrorContext } from "./formatErrorMessage";

/**
 * Sends error notification to Telegram
 *
 * @param params - The parameters for the error notification
 * @param params.email - The email of the account
 * @param params.roomId - The ID of the room
 * @param params.messages - The messages to include in the notification
 * @param params.path - The path of the API call
 * @param params.error - The error to include in the notification
 * @returns void
 */
export async function sendErrorNotification(params: ErrorContext): Promise<void> {
  try {
    const message = formatErrorMessage(params);
    await sendMessage(message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error in sendErrorNotification:", err);
  }
}
