import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/auth/getApiKeyAccountId", () => ({
  getApiKeyAccountId: vi.fn(),
}));

vi.mock("@/lib/accounts/validateOverrideAccountId", () => ({
  validateOverrideAccountId: vi.fn(),
}));

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { validateGetPulseRequest } from "../validateGetPulseRequest";

/**
 * Creates a mock NextRequest for testing.
 *
 * @param url - The request URL
 * @param headers - Optional headers object
 * @returns A mock NextRequest
 */
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, { headers });
}

describe("validateGetPulseRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when API key is missing", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue(
        NextResponse.json({ status: "error", message: "x-api-key header required" }, { status: 401 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse");
      const result = await validateGetPulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(401);
      }
    });

    it("returns 401 when API key is invalid", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue(
        NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "invalid-key",
      });
      const result = await validateGetPulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(401);
      }
    });
  });

  describe("successful validation", () => {
    it("returns accountId when authenticated without account_id param", async () => {
      const accountId = "account-123";
      vi.mocked(getApiKeyAccountId).mockResolvedValue(accountId);

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const result = await validateGetPulseRequest(request);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({ accountId });
    });
  });

  describe("account_id override", () => {
    it("returns overridden accountId when authorized", async () => {
      const orgAccountId = "org-123";
      const targetAccountId = "11111111-1111-4111-a111-111111111111";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(orgAccountId);
      vi.mocked(validateOverrideAccountId).mockResolvedValue({ accountId: targetAccountId });

      const request = createMockRequest(
        `https://api.example.com/api/pulse?account_id=${targetAccountId}`,
        { "x-api-key": "org-api-key" },
      );
      const result = await validateGetPulseRequest(request);

      expect(validateOverrideAccountId).toHaveBeenCalledWith({
        apiKey: "org-api-key",
        targetAccountId,
      });
      expect(result).toEqual({ accountId: targetAccountId });
    });

    it("returns 403 when not authorized for account_id", async () => {
      const orgAccountId = "org-123";
      const targetAccountId = "11111111-1111-4111-a111-111111111111";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(orgAccountId);
      vi.mocked(validateOverrideAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Access denied to specified accountId" },
          { status: 403 },
        ),
      );

      const request = createMockRequest(
        `https://api.example.com/api/pulse?account_id=${targetAccountId}`,
        { "x-api-key": "org-api-key" },
      );
      const result = await validateGetPulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(403);
      }
    });
  });
});
