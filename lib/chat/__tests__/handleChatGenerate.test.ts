import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { setupChatRequest } from "@/lib/chat/setupChatRequest";
import { handleChatCompletion } from "@/lib/chat/handleChatCompletion";
import { generateText } from "ai";
import { handleChatGenerate } from "../handleChatGenerate";

// Mock all dependencies before importing the module under test
vi.mock("@/lib/auth/getApiKeyAccountId", () => ({
  getApiKeyAccountId: vi.fn(),
}));

vi.mock("@/lib/auth/getAuthenticatedAccountId", () => ({
  getAuthenticatedAccountId: vi.fn(),
}));

vi.mock("@/lib/accounts/validateOverrideAccountId", () => ({
  validateOverrideAccountId: vi.fn(),
}));

vi.mock("@/lib/keys/getApiKeyDetails", () => ({
  getApiKeyDetails: vi.fn(),
}));

vi.mock("@/lib/organizations/validateOrganizationAccess", () => ({
  validateOrganizationAccess: vi.fn(),
}));

vi.mock("@/lib/chat/setupChatRequest", () => ({
  setupChatRequest: vi.fn(),
}));

vi.mock("@/lib/chat/handleChatCompletion", () => ({
  handleChatCompletion: vi.fn(),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

const mockGetApiKeyAccountId = vi.mocked(getApiKeyAccountId);
const mockValidateOverrideAccountId = vi.mocked(validateOverrideAccountId);
const mockSetupChatRequest = vi.mocked(setupChatRequest);
const mockHandleChatCompletion = vi.mocked(handleChatCompletion);
const mockGenerateText = vi.mocked(generateText);

// Helper to create mock NextRequest
/**
 *
 * @param body
 * @param headers
 */
function createMockRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
      has: (key: string) => key.toLowerCase() in headers,
    },
  } as unknown as Request;
}

describe("handleChatGenerate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for handleChatCompletion to return a resolved Promise
    mockHandleChatCompletion.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validation", () => {
    it("returns 400 error when neither messages nor prompt is provided", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const request = createMockRequest({ roomId: "room-123" }, { "x-api-key": "test-key" });

      const result = await handleChatGenerate(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(400);
      const json = await result.json();
      expect(json.status).toBe("error");
    });

    it("returns 401 error when no auth header is provided", async () => {
      const request = createMockRequest({ prompt: "Hello" }, {});

      const result = await handleChatGenerate(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(401);
      const json = await result.json();
      expect(json.message).toBe("Exactly one of x-api-key or Authorization must be provided");
    });
  });

  describe("text generation", () => {
    it("returns generated text for valid requests", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockChatConfig = {
        model: "gpt-4",
        instructions: "You are a helpful assistant",
        system: "You are a helpful assistant",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      };

      mockSetupChatRequest.mockResolvedValue(mockChatConfig as any);

      mockGenerateText.mockResolvedValue({
        text: "Hello! How can I help you?",
        reasoningText: undefined,
        sources: [],
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: {
          messages: [],
          headers: {},
          body: null,
        },
      } as any);

      const request = createMockRequest({ prompt: "Hello, world!" }, { "x-api-key": "valid-key" });

      const result = await handleChatGenerate(request as any);

      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json.text).toBe("Hello! How can I help you?");
      expect(json.finishReason).toBe("stop");
      expect(json.usage).toEqual({ promptTokens: 10, completionTokens: 20 });
    });

    it("uses messages array when provided", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Response",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      const messages = [{ role: "user", content: "Hello" }];
      const request = createMockRequest({ messages }, { "x-api-key": "valid-key" });

      await handleChatGenerate(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          messages,
          accountId: "account-123",
        }),
      );
    });

    it("passes through optional parameters", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "claude-3-opus",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Response",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      const request = createMockRequest(
        {
          prompt: "Hello",
          roomId: "room-xyz",
          artistId: "artist-abc",
          model: "claude-3-opus",
          excludeTools: ["tool1"],
        },
        { "x-api-key": "valid-key" },
      );

      await handleChatGenerate(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: "room-xyz",
          artistId: "artist-abc",
          model: "claude-3-opus",
          excludeTools: ["tool1"],
        }),
      );
    });

    it("includes reasoningText when present", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Response",
        reasoningText: "Let me think about this...",
        sources: [{ url: "https://example.com" }],
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      const result = await handleChatGenerate(request as any);

      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json.reasoningText).toBe("Let me think about this...");
      expect(json.sources).toEqual([{ url: "https://example.com" }]);
    });
  });

  describe("error handling", () => {
    it("returns 500 error when setupChatRequest fails", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");
      mockSetupChatRequest.mockRejectedValue(new Error("Setup failed"));

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      const result = await handleChatGenerate(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(500);
      const json = await result.json();
      expect(json.status).toBe("error");
    });

    it("returns 500 error when generateText fails", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockRejectedValue(new Error("Generation failed"));

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      const result = await handleChatGenerate(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(500);
      const json = await result.json();
      expect(json.status).toBe("error");
    });
  });

  describe("accountId override", () => {
    it("allows org API key to override accountId", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("org-account-123");
      mockValidateOverrideAccountId.mockResolvedValue({
        accountId: "target-account-456",
      });

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Response",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      const request = createMockRequest(
        { prompt: "Hello", accountId: "target-account-456" },
        { "x-api-key": "org-api-key" },
      );

      await handleChatGenerate(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: "target-account-456",
        }),
      );
    });
  });

  describe("chat completion handling", () => {
    it("calls handleChatCompletion after text generation", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Hello!",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      mockHandleChatCompletion.mockResolvedValue();

      const messages = [{ id: "msg-1", role: "user", parts: [{ type: "text", text: "Hi" }] }];
      const request = createMockRequest(
        { messages, roomId: "room-123" },
        { "x-api-key": "valid-key" },
      );

      await handleChatGenerate(request as any);

      expect(mockHandleChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          messages,
          roomId: "room-123",
          accountId: "account-123",
        }),
        expect.arrayContaining([
          expect.objectContaining({
            role: "assistant",
            parts: [{ type: "text", text: "Hello!" }],
          }),
        ]),
      );
    });

    it("passes artistId to handleChatCompletion when provided", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Hello!",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: [], headers: {}, body: null },
      } as any);

      mockHandleChatCompletion.mockResolvedValue();

      const messages = [{ id: "msg-1", role: "user", parts: [{ type: "text", text: "Hi" }] }];
      const request = createMockRequest(
        { messages, roomId: "room-123", artistId: "artist-456" },
        { "x-api-key": "valid-key" },
      );

      await handleChatGenerate(request as any);

      expect(mockHandleChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          artistId: "artist-456",
        }),
        expect.arrayContaining([
          expect.objectContaining({
            role: "assistant",
            parts: [{ type: "text", text: "Hello!" }],
          }),
        ]),
      );
    });

    it("does not throw when handleChatCompletion fails (graceful handling)", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Hello!",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: {
          messages: [{ id: "resp-1", role: "assistant", parts: [] }],
          headers: {},
          body: null,
        },
      } as any);

      // Make handleChatCompletion throw an error
      mockHandleChatCompletion.mockRejectedValue(new Error("Completion handling failed"));

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      // Should still return 200 - completion handling failure should not affect response
      const result = await handleChatGenerate(request as any);
      expect(result.status).toBe(200);
    });

    it("calls handleChatCompletion even when validation skips it for missing roomId", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockResponseMessages = [
        {
          id: "resp-1",
          role: "assistant",
          parts: [{ type: "text", text: "Hello!" }],
        },
      ];

      mockSetupChatRequest.mockResolvedValue({
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      mockGenerateText.mockResolvedValue({
        text: "Hello!",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        response: { messages: mockResponseMessages, headers: {}, body: null },
      } as any);

      mockHandleChatCompletion.mockResolvedValue();

      // No roomId provided
      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      await handleChatGenerate(request as any);

      // handleChatCompletion should still be called (it handles room creation internally)
      expect(mockHandleChatCompletion).toHaveBeenCalled();
    });
  });
});
