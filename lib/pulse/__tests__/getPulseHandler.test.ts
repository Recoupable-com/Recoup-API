import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { getPulseHandler } from "../getPulseHandler";

vi.mock("../validateGetPulseRequest", () => ({
  validateGetPulseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/pulse_accounts/selectPulseAccount", () => ({
  selectPulseAccount: vi.fn(),
}));

import { validateGetPulseRequest } from "../validateGetPulseRequest";
import { selectPulseAccount } from "@/lib/supabase/pulse_accounts/selectPulseAccount";

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

describe("getPulseHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation failure", () => {
    it("returns validation error response when validation fails", async () => {
      vi.mocked(validateGetPulseRequest).mockResolvedValue(
        NextResponse.json({ status: "error", message: "x-api-key header required" }, { status: 401 }),
      );

      const request = createMockRequest("https://api.example.com/api/pulse");
      const response = await getPulseHandler(request);

      expect(response.status).toBe(401);
    });
  });

  describe("successful responses", () => {
    it("returns pulse with active: false when no record exists", async () => {
      const accountId = "account-123";
      vi.mocked(validateGetPulseRequest).mockResolvedValue({ accountId });
      vi.mocked(selectPulseAccount).mockResolvedValue(null);

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await getPulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        status: "success",
        pulse: {
          id: null,
          account_id: accountId,
          active: false,
        },
      });
    });

    it("returns pulse with active: true when record exists", async () => {
      const accountId = "account-123";
      const pulseId = "pulse-456";
      vi.mocked(validateGetPulseRequest).mockResolvedValue({ accountId });
      vi.mocked(selectPulseAccount).mockResolvedValue({
        id: pulseId,
        account_id: accountId,
        active: true,
      });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await getPulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        status: "success",
        pulse: {
          id: pulseId,
          account_id: accountId,
          active: true,
        },
      });
    });

    it("returns pulse with active: false when record has active: false", async () => {
      const accountId = "account-123";
      const pulseId = "pulse-456";
      vi.mocked(validateGetPulseRequest).mockResolvedValue({ accountId });
      vi.mocked(selectPulseAccount).mockResolvedValue({
        id: pulseId,
        account_id: accountId,
        active: false,
      });

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await getPulseHandler(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.pulse.active).toBe(false);
    });

    it("uses accountId from validation result", async () => {
      const accountId = "validated-account-123";
      vi.mocked(validateGetPulseRequest).mockResolvedValue({ accountId });
      vi.mocked(selectPulseAccount).mockResolvedValue(null);

      const request = createMockRequest("https://api.example.com/api/pulse", {
        "x-api-key": "valid-key",
      });
      const response = await getPulseHandler(request);
      const body = await response.json();

      expect(selectPulseAccount).toHaveBeenCalledWith(accountId);
      expect(body.pulse.account_id).toBe(accountId);
    });
  });
});
