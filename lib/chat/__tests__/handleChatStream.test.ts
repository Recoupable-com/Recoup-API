import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { setupChatRequest } from "@/lib/chat/setupChatRequest";
import { handleChatCompletion } from "@/lib/chat/handleChatCompletion";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { handleChatStream } from "../handleChatStream";

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
  createUIMessageStream: vi.fn(),
  createUIMessageStreamResponse: vi.fn(),
}));

const mockGetApiKeyAccountId = vi.mocked(getApiKeyAccountId);
const mockValidateOverrideAccountId = vi.mocked(validateOverrideAccountId);
const mockSetupChatRequest = vi.mocked(setupChatRequest);
const mockHandleChatCompletion = vi.mocked(handleChatCompletion);
const mockCreateUIMessageStream = vi.mocked(createUIMessageStream);
const mockCreateUIMessageStreamResponse = vi.mocked(createUIMessageStreamResponse);

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

describe("handleChatStream", () => {
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

      const result = await handleChatStream(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(400);
      const json = await result.json();
      expect(json.status).toBe("error");
    });

    it("returns 401 error when no auth header is provided", async () => {
      const request = createMockRequest({ prompt: "Hello" }, {});

      const result = await handleChatStream(request as any);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(401);
      const json = await result.json();
      expect(json.message).toBe("Exactly one of x-api-key or Authorization must be provided");
    });
  });

  describe("streaming", () => {
    it("creates a streaming response for valid requests", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "You are a helpful assistant",
        system: "You are a helpful assistant",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      const mockStream = new ReadableStream();
      mockCreateUIMessageStream.mockReturnValue(mockStream);

      const mockResponse = new Response(mockStream);
      mockCreateUIMessageStreamResponse.mockReturnValue(mockResponse);

      const request = createMockRequest({ prompt: "Hello, world!" }, { "x-api-key": "valid-key" });

      const result = await handleChatStream(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalled();
      expect(mockCreateUIMessageStream).toHaveBeenCalled();
      expect(mockCreateUIMessageStreamResponse).toHaveBeenCalledWith({
        stream: mockStream,
      });
      expect(result).toBe(mockResponse);
    });

    it("uses messages array when provided", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "You are a helpful assistant",
        system: "You are a helpful assistant",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      const mockStream = new ReadableStream();
      mockCreateUIMessageStream.mockReturnValue(mockStream);
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(mockStream));

      const messages = [{ role: "user", content: "Hello" }];
      const request = createMockRequest({ messages }, { "x-api-key": "valid-key" });

      await handleChatStream(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          messages,
          accountId: "account-123",
        }),
      );
    });

    it("passes through optional parameters", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "claude-3-opus",
        instructions: "You are a helpful assistant",
        system: "You are a helpful assistant",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      const mockStream = new ReadableStream();
      mockCreateUIMessageStream.mockReturnValue(mockStream);
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(mockStream));

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

      await handleChatStream(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: "room-xyz",
          artistId: "artist-abc",
          model: "claude-3-opus",
          excludeTools: ["tool1"],
        }),
      );
    });
  });

  describe("error handling", () => {
    it("returns 500 error when setupChatRequest fails", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");
      mockSetupChatRequest.mockRejectedValue(new Error("Setup failed"));

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      const result = await handleChatStream(request as any);

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

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      const mockStream = new ReadableStream();
      mockCreateUIMessageStream.mockReturnValue(mockStream);
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(mockStream));

      const request = createMockRequest(
        { prompt: "Hello", accountId: "target-account-456" },
        { "x-api-key": "org-api-key" },
      );

      await handleChatStream(request as any);

      expect(mockSetupChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: "target-account-456",
        }),
      );
    });
  });

  describe("chat completion handling", () => {
    it("calls handleChatCompletion after streaming completes", async () => {
      mockGetApiKeyAccountId.mockResolvedValue("account-123");

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
          text: Promise.resolve("Hello!"),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      // Capture the execute callback and run it
      let capturedExecute: ((options: { writer: { merge: () => void } }) => Promise<void>) | null =
        null;
      mockCreateUIMessageStream.mockImplementation(
        (options: { execute: typeof capturedExecute }) => {
          capturedExecute = options.execute;
          return new ReadableStream();
        },
      );
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(new ReadableStream()));
      mockHandleChatCompletion.mockResolvedValue();

      const messages = [{ id: "msg-1", role: "user", parts: [{ type: "text", text: "Hi" }] }];
      const request = createMockRequest(
        { messages, roomId: "room-123" },
        { "x-api-key": "valid-key" },
      );

      await handleChatStream(request as any);

      // Execute the captured callback to simulate stream completion
      if (capturedExecute) {
        await capturedExecute({ writer: { merge: vi.fn() } });
      }

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

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
          text: Promise.resolve("Hello!"),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      let capturedExecute: ((options: { writer: { merge: () => void } }) => Promise<void>) | null =
        null;
      mockCreateUIMessageStream.mockImplementation(
        (options: { execute: typeof capturedExecute }) => {
          capturedExecute = options.execute;
          return new ReadableStream();
        },
      );
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(new ReadableStream()));
      mockHandleChatCompletion.mockResolvedValue();

      const messages = [{ id: "msg-1", role: "user", parts: [{ type: "text", text: "Hi" }] }];
      const request = createMockRequest(
        { messages, roomId: "room-123", artistId: "artist-456" },
        { "x-api-key": "valid-key" },
      );

      await handleChatStream(request as any);

      if (capturedExecute) {
        await capturedExecute({ writer: { merge: vi.fn() } });
      }

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

      const mockAgent = {
        stream: vi.fn().mockResolvedValue({
          toUIMessageStream: vi.fn().mockReturnValue(new ReadableStream()),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
          text: Promise.resolve("Hello!"),
        }),
        tools: {},
      };

      mockSetupChatRequest.mockResolvedValue({
        agent: mockAgent,
        model: "gpt-4",
        instructions: "test",
        system: "test",
        messages: [],
        experimental_generateMessageId: vi.fn(),
        tools: {},
        providerOptions: {},
      } as any);

      let capturedExecute: ((options: { writer: { merge: () => void } }) => Promise<void>) | null =
        null;
      mockCreateUIMessageStream.mockImplementation(
        (options: { execute: typeof capturedExecute }) => {
          capturedExecute = options.execute;
          return new ReadableStream();
        },
      );
      mockCreateUIMessageStreamResponse.mockReturnValue(new Response(new ReadableStream()));

      // Make handleChatCompletion throw an error
      mockHandleChatCompletion.mockRejectedValue(new Error("Completion handling failed"));

      const request = createMockRequest({ prompt: "Hello" }, { "x-api-key": "valid-key" });

      // Should not throw
      const result = await handleChatStream(request as any);
      expect(result).toBeInstanceOf(Response);

      // Execute callback should not throw either
      if (capturedExecute) {
        await expect(capturedExecute({ writer: { merge: vi.fn() } })).resolves.toBeUndefined();
      }
    });
  });
});
