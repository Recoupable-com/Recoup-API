import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/auth/getApiKeyAccountId", () => ({
  getApiKeyAccountId: vi.fn(),
}));

vi.mock("@/lib/accounts/validateOverrideAccountId", () => ({
  validateOverrideAccountId: vi.fn(),
}));

vi.mock("@/lib/networking/safeParseJson", () => ({
  safeParseJson: vi.fn(),
}));

import { getApiKeyAccountId } from "@/lib/auth/getApiKeyAccountId";
import { validateOverrideAccountId } from "@/lib/accounts/validateOverrideAccountId";
import { safeParseJson } from "@/lib/networking/safeParseJson";
import { validateUpdatePulseRequest } from "../validateUpdatePulseRequest";

/**
 * Creates a mock NextRequest for testing.
 *
 * @param url - The request URL
 * @param headers - Optional headers object
 * @returns A mock NextRequest
 */
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, { method: "PATCH", headers });
}

describe("validateUpdatePulseRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when API key is missing", async () => {
      vi.mocked(getApiKeyAccountId).mockResolvedValue(
        NextResponse.json({ status: "error", message: "x-api-key header required" }, { status: 401 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse");
      const result = await validateUpdatePulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(401);
      }
    });
  });

  describe("body validation", () => {
    it("returns 400 when active field is missing", async () => {
      const accountId = "account-123";
      vi.mocked(getApiKeyAccountId).mockResolvedValue(accountId);
      vi.mocked(safeParseJson).mockResolvedValue({});

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });

    it("returns 400 when active is not a boolean", async () => {
      const accountId = "account-123";
      vi.mocked(getApiKeyAccountId).mockResolvedValue(accountId);
      vi.mocked(safeParseJson).mockResolvedValue({ active: "true" });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });
  });

  describe("successful validation", () => {
    it("returns accountId and active when valid", async () => {
      const accountId = "account-123";
      vi.mocked(getApiKeyAccountId).mockResolvedValue(accountId);
      vi.mocked(safeParseJson).mockResolvedValue({ active: true });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({ accountId, active: true });
    });

    it("returns active: false when specified", async () => {
      const accountId = "account-123";
      vi.mocked(getApiKeyAccountId).mockResolvedValue(accountId);
      vi.mocked(safeParseJson).mockResolvedValue({ active: false });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({ accountId, active: false });
    });
  });

  describe("account_id override", () => {
    it("returns overridden accountId when authorized", async () => {
      const orgAccountId = "org-123";
      const targetAccountId = "11111111-1111-4111-a111-111111111111";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(orgAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({ active: true, account_id: targetAccountId });
      vi.mocked(validateOverrideAccountId).mockResolvedValue({ accountId: targetAccountId });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "org-api-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(validateOverrideAccountId).toHaveBeenCalledWith({
        apiKey: "org-api-key",
        targetAccountId,
      });
      expect(result).toEqual({ accountId: targetAccountId, active: true });
    });

    it("returns 403 when not authorized for account_id", async () => {
      const orgAccountId = "org-123";
      const targetAccountId = "11111111-1111-4111-a111-111111111111";

      vi.mocked(getApiKeyAccountId).mockResolvedValue(orgAccountId);
      vi.mocked(safeParseJson).mockResolvedValue({ active: true, account_id: targetAccountId });
      vi.mocked(validateOverrideAccountId).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Access denied to specified accountId" },
          { status: 403 },
        ),
      );

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "org-api-key",
      });
      const result = await validateUpdatePulseRequest(request);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(403);
      }
    });
  });
});
