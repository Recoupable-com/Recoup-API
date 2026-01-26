import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updatePulseHandler } from "../updatePulseHandler";

vi.mock("../validateUpdatePulseRequest", () => ({
  validateUpdatePulseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/pulse_accounts/upsertPulseAccount", () => ({
  upsertPulseAccount: vi.fn(),
}));

import { validateUpdatePulseRequest } from "../validateUpdatePulseRequest";
import { upsertPulseAccount } from "@/lib/supabase/pulse_accounts/upsertPulseAccount";

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

describe("updatePulseHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation failure", () => {
    it("returns 401 when authentication fails", async () => {
      vi.mocked(validateUpdatePulseRequest).mockResolvedValue(
        NextResponse.json({ status: "error", message: "x-api-key header required" }, { status: 401 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse");
      const response = await updatePulseHandler(request);

      expect(response.status).toBe(401);
    });

    it("returns 400 when body validation fails", async () => {
      vi.mocked(validateUpdatePulseRequest).mockResolvedValue(
        NextResponse.json({ status: "error", error: "active must be a boolean" }, { status: 400 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await updatePulseHandler(request);

      expect(response.status).toBe(400);
    });

    it("returns 403 when account_id override is denied", async () => {
      vi.mocked(validateUpdatePulseRequest).mockResolvedValue(
        NextResponse.json(
          { status: "error", message: "Access denied to specified accountId" },
          { status: 403 },
        ),
      );

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "org-api-key",
      });
      const response = await updatePulseHandler(request);

      expect(response.status).toBe(403);
    });
  });

  describe("successful upsert", () => {
    it("upserts record with active: true", async () => {
      const accountId = "account-123";
      const pulseId = "pulse-456";

      vi.mocked(validateUpdatePulseRequest).mockResolvedValue({ accountId, active: true });
      vi.mocked(upsertPulseAccount).mockResolvedValue({
        id: pulseId,
        account_id: accountId,
        active: true,
      });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await updatePulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(upsertPulseAccount).toHaveBeenCalledWith({ account_id: accountId, active: true });
      expect(body).toEqual({
        status: "success",
        pulse: {
          id: pulseId,
          account_id: accountId,
          active: true,
        },
      });
    });

    it("upserts record with active: false", async () => {
      const accountId = "account-123";
      const pulseId = "pulse-456";

      vi.mocked(validateUpdatePulseRequest).mockResolvedValue({ accountId, active: false });
      vi.mocked(upsertPulseAccount).mockResolvedValue({
        id: pulseId,
        account_id: accountId,
        active: false,
      });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await updatePulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.pulse.active).toBe(false);
    });

    it("uses accountId from validation result", async () => {
      const accountId = "validated-account-123";
      const pulseId = "pulse-456";

      vi.mocked(validateUpdatePulseRequest).mockResolvedValue({ accountId, active: true });
      vi.mocked(upsertPulseAccount).mockResolvedValue({
        id: pulseId,
        account_id: accountId,
        active: true,
      });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await updatePulseHandler(request);
      const body = await response.json();

      expect(upsertPulseAccount).toHaveBeenCalledWith({ account_id: accountId, active: true });
      expect(body.pulse.account_id).toBe(accountId);
    });
  });

  describe("error handling", () => {
    it("returns 500 when upsert fails", async () => {
      const accountId = "account-123";

      vi.mocked(validateUpdatePulseRequest).mockResolvedValue({ accountId, active: true });
      vi.mocked(upsertPulseAccount).mockResolvedValue(null);

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await updatePulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.status).toBe("error");
    });
  });
});
