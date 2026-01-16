import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createChatHandler } from "../createChatHandler";

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { getAuthenticatedAccountId } from "@/lib/auth/getAuthenticatedAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { insertRoom } from "@/lib/supabase/rooms/insertRoom";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { generateChatTitle } from "../generateChatTitle";

// Mock dependencies
vi.mock("@/lib/auth/getApiKeyAccountId", () => ({
  getApiKeyAccountId: vi.fn(),
}));

vi.mock("@/lib/auth/getAuthenticatedAccountId", () => ({
  getAuthenticatedAccountId: vi.fn(),
}));

vi.mock("@/lib/accounts/validateOverrideAccountId", () => ({
  validateOverrideAccountId: vi.fn(),
}));

vi.mock("@/lib/supabase/rooms/insertRoom", () => ({
  insertRoom: vi.fn(),
}));

vi.mock("@/lib/uuid/generateUUID", () => ({
  generateUUID: vi.fn(() => "generated-uuid-123"),
}));

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

vi.mock("@/lib/networking/safeParseJson", () => ({
  safeParseJson: vi.fn(),
}));

vi.mock("../generateChatTitle", () => ({
  generateChatTitle: vi.fn(),
}));

/**
 * Creates a mock request with API key auth
 */
function createMockRequest(apiKey = "test-api-key"): NextRequest {
  return {
    headers: {
      get: (name: string) => (name === "x-api-key" ? apiKey : null),
    },
  } as unknown as NextRequest;
}

/**
 * Creates a mock request with Bearer token auth
 */
function createMockBearerRequest(token = "test-bearer-token"): NextRequest {
  return {
    headers: {
      get: (name: string) => (name === "authorization" ? `Bearer ${token}` : null),
    },
  } as unknown as NextRequest;
}

/**
 * Creates a mock request with no auth
 */
function createMockNoAuthRequest(): NextRequest {
  return {
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

/**
 * Creates a mock request with both auth mechanisms
 */
function createMockBothAuthRequest(
  apiKey = "test-api-key",
  token = "test-bearer-token",
): NextRequest {
  return {
    headers: {
      get: (name: string) => {
        if (name === "x-api-key") return apiKey;
        if (name === "authorization") return `Bearer ${token}`;
        return null;
      },
    },
  } as unknown as NextRequest;
}

describe("createChatHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("without accountId override", () => {
    it("uses API key's accountId when no accountId in body", async () => {
      const apiKeyAccountId = "api-key-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({ artistId });
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(validateOverrideAccountId).not.toHaveBeenCalled();
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });
    });
  });

  describe("with accountId override", () => {
    it("uses body accountId when validation succeeds", async () => {
      const apiKeyAccountId = "recoup-org-account";
      const targetAccountId = "123e4567-e89b-12d3-a456-426614174001";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        artistId,
        accountId: targetAccountId,
      });
      vi.mocked(validateOverrideAccountId).mockResolvedValue({
        accountId: targetAccountId,
      });
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: targetAccountId,
        artist_id: artistId,
        topic: null,
      });

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(validateOverrideAccountId).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        targetAccountId,
      });
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: targetAccountId,
        artist_id: artistId,
        topic: null,
      });
    });

    it("returns 403 when validation returns access denied", async () => {
      const apiKeyAccountId = "org-account";
      const targetAccountId = "123e4567-e89b-12d3-a456-426614174001";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        accountId: targetAccountId,
      });
      vi.mocked(validateOverrideAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Access denied to specified accountId" },
          { status: 403 },
        ),
      );

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.status).toBe("error");
      expect(json.message).toBe("Access denied to specified accountId");
      expect(insertRoom).not.toHaveBeenCalled();
    });

    it("returns 500 when validation returns API key error", async () => {
      const apiKeyAccountId = "org-account";
      const targetAccountId = "123e4567-e89b-12d3-a456-426614174001";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        accountId: targetAccountId,
      });
      vi.mocked(validateOverrideAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Failed to validate API key" },
          { status: 500 },
        ),
      );

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.status).toBe("error");
      expect(json.message).toBe("Failed to validate API key");
      expect(insertRoom).not.toHaveBeenCalled();
    });
  });

  describe("with firstMessage (title generation)", () => {
    it("generates a title from firstMessage when provided", async () => {
      const apiKeyAccountId = "api-key-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";
      const firstMessage = "What marketing strategies should I use?";
      const generatedTitle = "Marketing Plan";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        artistId,
        firstMessage,
      });
      vi.mocked(generateChatTitle).mockResolvedValue(generatedTitle);
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: generatedTitle,
      });

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(generateChatTitle).toHaveBeenCalledWith(firstMessage);
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: generatedTitle,
      });
    });

    it("uses null topic when firstMessage is not provided", async () => {
      const apiKeyAccountId = "api-key-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        artistId,
      });
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });

      const request = createMockRequest();
      const response = await createChatHandler(request);

      expect(response.status).toBe(200);
      expect(generateChatTitle).not.toHaveBeenCalled();
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });
    });

    it("handles title generation failure gracefully (uses null)", async () => {
      const apiKeyAccountId = "api-key-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";
      const firstMessage = "What marketing strategies should I use?";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(apiKeyAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        artistId,
        firstMessage,
      });
      vi.mocked(generateChatTitle).mockRejectedValue(new Error("AI generation failed"));
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });

      const request = createMockRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(generateChatTitle).toHaveBeenCalledWith(firstMessage);
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: apiKeyAccountId,
        artist_id: artistId,
        topic: null,
      });
    });
  });

  describe("with Bearer token authentication", () => {
    it("uses Bearer token's accountId when no API key provided", async () => {
      const bearerAccountId = "bearer-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";

      vi.mocked(getAuthenticatedAccountId).mockResolvedValue(bearerAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({ artistId });
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: bearerAccountId,
        artist_id: artistId,
        topic: null,
      });

      const request = createMockBearerRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(getApiKeyAccountId).not.toHaveBeenCalled();
      expect(getAuthenticatedAccountId).toHaveBeenCalledWith(request);
      expect(insertRoom).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        account_id: bearerAccountId,
        artist_id: artistId,
        topic: null,
      });
    });

    it("returns 401 when Bearer token validation fails", async () => {
      vi.mocked(getAuthenticatedAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Invalid token" },
          { status: 401 },
        ),
      );

      const request = createMockBearerRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.status).toBe("error");
      expect(json.message).toBe("Invalid token");
      expect(insertRoom).not.toHaveBeenCalled();
    });

    it("generates title from firstMessage with Bearer auth", async () => {
      const bearerAccountId = "bearer-account-123";
      const artistId = "123e4567-e89b-12d3-a456-426614174000";
      const firstMessage = "Help me with my marketing";
      const generatedTitle = "Marketing Help";

      vi.mocked(getAuthenticatedAccountId).mockResolvedValue(bearerAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({
        artistId,
        firstMessage,
      });
      vi.mocked(generateChatTitle).mockResolvedValue(generatedTitle);
      vi.mocked(insertRoom).mockResolvedValue({
        id: "generated-uuid-123",
        account_id: bearerAccountId,
        artist_id: artistId,
        topic: generatedTitle,
      });

      const request = createMockBearerRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe("success");
      expect(generateChatTitle).toHaveBeenCalledWith(firstMessage);
    });
  });

  describe("auth mechanism enforcement", () => {
    it("returns 401 when no auth is provided", async () => {
      const request = createMockNoAuthRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.status).toBe("error");
      expect(json.message).toBe(
        "Exactly one of x-api-key or Authorization must be provided",
      );
      expect(insertRoom).not.toHaveBeenCalled();
    });

    it("returns 401 when both auth mechanisms are provided", async () => {
      const request = createMockBothAuthRequest();
      const response = await createChatHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.status).toBe("error");
      expect(json.message).toBe(
        "Exactly one of x-api-key or Authorization must be provided",
      );
      expect(insertRoom).not.toHaveBeenCalled();
    });
  });
});
