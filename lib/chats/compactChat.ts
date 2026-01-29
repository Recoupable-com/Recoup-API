import selectMemories from "@/lib/supabase/memories/selectMemories";
import generateText from "@/lib/ai/generateText";
import { LIGHTWEIGHT_MODEL } from "@/lib/const";

export interface CompactChatResult {
  chatId: string;
  compacted: string;
}

const DEFAULT_COMPACT_PROMPT = `You are a conversation summarizer. Create a concise summary of the following chat conversation that:
- Preserves key information, decisions, and action items
- Maintains the essential context of the discussion
- Is significantly shorter than the original conversation
- Uses clear, professional language

Respond with only the summary text, no additional commentary.`;

/**
 * Compacts a single chat by summarizing its messages.
 *
 * @param chatId - The ID of the chat to compact.
 * @param customPrompt - Optional custom prompt to guide the summarization.
 * @returns The compacted result or null if chat has no messages.
 */
export async function compactChat(
  chatId: string,
  customPrompt?: string,
): Promise<CompactChatResult | null> {
  // Get all messages for the chat in chronological order
  const memories = await selectMemories(chatId, { ascending: true });

  if (!memories || memories.length === 0) {
    return {
      chatId,
      compacted: "",
    };
  }

  // Format messages for summarization
  const formattedMessages = memories
    .map(memory => {
      const content = memory.content as { role?: string; content?: string };
      const role = content?.role || "unknown";
      const text = content?.content || JSON.stringify(content);
      return `${role}: ${text}`;
    })
    .join("\n\n");

  // Build the prompt
  const systemPrompt = customPrompt || DEFAULT_COMPACT_PROMPT;
  const prompt = `Conversation to summarize:\n\n${formattedMessages}`;

  // Generate summary using lightweight model for cost efficiency
  const result = await generateText({
    system: systemPrompt,
    prompt,
    model: LIGHTWEIGHT_MODEL,
  });

  return {
    chatId,
    compacted: result.text,
  };
}
