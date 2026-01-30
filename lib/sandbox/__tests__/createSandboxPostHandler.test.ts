import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createSandboxPostHandler } from "../createSandboxPostHandler";

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { createSandbox } from "../createSandbox";

vi.mock("@/lib/auth/getApiKeyAccountId", () => ({
  getApiKeyAccountId: vi.fn(),
}));

vi.mock("../createSandbox", () => ({
  createSandbox: vi.fn(),
}));

/**
 * Creates a mock NextRequest for testing.
 *
 * @param body - The request body object
 * @param headers - Additional headers to include
 * @returns A NextRequest instance
 */
function createMockRequest(body: object | null, headers: Record<string, string> = {}): NextRequest {
  const url = "https://example.com/api/sandboxes";
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });
}

describe("createSandboxPostHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when authentication fails", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", error: "x-api-key header required" },
          { status: 401 },
        ) as never,
      );

      const request = createMockRequest({ prompt: "test prompt" });
      const response = await createSandboxPostHandler(request);

      expect(response.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 when prompt is missing", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue("account-123");

      const request = createMockRequest({});
      const response = await createSandboxPostHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.status).toBe("error");
      expect(data.error).toContain("prompt");
    });

    it("returns 400 when prompt is empty", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue("account-123");

      const request = createMockRequest({ prompt: "" });
      const response = await createSandboxPostHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.status).toBe("error");
    });
  });

  describe("success response format", () => {
    it("returns status success with sandboxes array", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue("account-123");
      vi.mocked(createSandbox).mockResolvedValue({
        sandboxId: "sbx_abc123",
        sandboxStatus: "running",
        timeout: 600000,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const request = createMockRequest({ prompt: "tell me hello" });
      const response = await createSandboxPostHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        status: "success",
        sandboxes: [
          {
            sandboxId: "sbx_abc123",
            sandboxStatus: "running",
            timeout: 600000,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });
    });

    it("passes prompt to createSandbox", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue("account-123");
      vi.mocked(createSandbox).mockResolvedValue({
        sandboxId: "sbx_abc123",
        sandboxStatus: "running",
        timeout: 600000,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const request = createMockRequest({ prompt: "Create a new file" });
      await createSandboxPostHandler(request);

      expect(createSandbox).toHaveBeenCalledWith("Create a new file");
    });
  });

  describe("error response format", () => {
    it("returns status error with error message", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue("account-123");
      vi.mocked(createSandbox).mockRejectedValue(new Error("Sandbox creation failed"));

      const request = createMockRequest({ prompt: "test prompt" });
      const response = await createSandboxPostHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data).toEqual({
        status: "error",
        error: "Sandbox creation failed",
      });
    });
  });
});
