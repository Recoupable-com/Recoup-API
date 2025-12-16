import generateUUID from "@/lib/uuid/generateUUID";
import { MAX_MESSAGES } from "./const";
import { type ChatConfig } from "./types";
import { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { convertToModelMessages } from "ai";
import getGeneralAgent from "@/lib/agents/generalAgent/getGeneralAgent";
import { ChatRequestBody } from "./validateChatRequest";

/**
 * Sets up a chat request configuration
 *
 * @param body - The chat request body
 * @returns The chat request configuration
 */
export async function setupChatRequest(body: ChatRequestBody): Promise<ChatConfig> {
  const decision = await getGeneralAgent(body);

  const system = decision.instructions;
  const tools = decision.agent.tools;

  const convertedMessages = convertToModelMessages(body.messages, {
    tools,
    ignoreIncompleteToolCalls: true,
  }).slice(-MAX_MESSAGES);

  const config: ChatConfig = {
    ...decision,
    system,
    messages: convertedMessages,
    experimental_generateMessageId: generateUUID,
    tools,
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
      google: {
        thinkingConfig: {
          thinkingBudget: 8192,
          includeThoughts: true,
        },
      },
      openai: {
        reasoningEffort: "medium",
        reasoningSummary: "detailed",
      },
    },
  };

  return config;
}
