import type { ModelMessage } from "ai";
import selectMemories from "@/lib/supabase/memories/selectMemories";

interface UIPart {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
}

interface MemoryContent {
  role: string;
  parts: UIPart[];
}

/**
 * Extracts text content from UI parts for user messages.
 *
 * @param parts - UI parts from stored memory
 * @returns Combined text string from all text parts
 */
function extractUserText(parts: UIPart[]): string {
  return parts
    .filter(p => p.type === "text" && p.text)
    .map(p => p.text!)
    .join("\n");
}

/**
 * Extracts text content from UI parts for assistant messages.
 * Only includes actual text responses, skipping tool calls and reasoning.
 *
 * @param parts - UI parts from stored memory
 * @returns Combined text string from text parts
 */
function extractAssistantText(parts: UIPart[]): string {
  return parts
    .filter(p => p.type === "text" && p.text)
    .map(p => p.text!)
    .join("\n");
}

/**
 * Builds a messages array for agent.generate, including conversation history if roomId exists.
 * Converts UI parts to simple text-based ModelMessages for compatibility.
 *
 * @param roomId - Optional room ID to fetch existing conversation history
 * @returns Array of ModelMessage objects with conversation history
 */
export async function getEmailRoomMessages(roomId: string): Promise<ModelMessage[]> {
  const existingMemories = await selectMemories(roomId, { ascending: true });
  if (!existingMemories) return [];

  const messages: ModelMessage[] = [];

  for (const memory of existingMemories) {
    const content = memory.content as unknown as MemoryContent;
    if (!content?.role || !content?.parts) continue;

    const role = content.role;
    let text = "";

    if (role === "user") {
      text = extractUserText(content.parts);
      if (text) {
        messages.push({ role: "user", content: text });
      }
    } else if (role === "assistant") {
      text = extractAssistantText(content.parts);
      if (text) {
        messages.push({ role: "assistant", content: text });
      }
    }
  }

  return messages;
}
