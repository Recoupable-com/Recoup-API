import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { validateAuthorizeConnectorRequest } from "../validateAuthorizeConnectorRequest";

import { validateAccountIdHeaders } from "@/lib/accounts/validateAccountIdHeaders";
import { checkAccountArtistAccess } from "@/lib/supabase/account_artist_ids/checkAccountArtistAccess";

vi.mock("@/lib/accounts/validateAccountIdHeaders", () => ({
  validateAccountIdHeaders: vi.fn(),
}));

vi.mock("@/lib/supabase/account_artist_ids/checkAccountArtistAccess", () => ({
  checkAccountArtistAccess: vi.fn(),
}));

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

describe("validateAuthorizeConnectorRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error if auth fails", async () => {
    vi.mocked(validateAccountIdHeaders).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
      body: JSON.stringify({ connector: "googlesheets" }),
    });
    const result = await validateAuthorizeConnectorRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
  });

  it("should return accountId as composioEntityId with isEntityConnection=false when no entity_id", async () => {
    const mockAccountId = "account-123";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
      body: JSON.stringify({ connector: "googlesheets" }),
    });
    const result = await validateAuthorizeConnectorRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      composioEntityId: mockAccountId,
      connector: "googlesheets",
      callbackUrl: undefined,
      isEntityConnection: false,
    });
  });

  it("should return entity_id as composioEntityId with isEntityConnection=true when entity_id provided", async () => {
    const mockAccountId = "account-123";
    const mockEntityId = "550e8400-e29b-41d4-a716-446655440000";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });
    vi.mocked(checkAccountArtistAccess).mockResolvedValue(true);

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
      body: JSON.stringify({ connector: "tiktok", entity_id: mockEntityId }),
    });
    const result = await validateAuthorizeConnectorRequest(request);

    expect(checkAccountArtistAccess).toHaveBeenCalledWith(mockAccountId, mockEntityId);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      composioEntityId: mockEntityId,
      connector: "tiktok",
      callbackUrl: undefined,
      authConfigs: undefined,
      isEntityConnection: true,
    });
  });

  it("should return 403 when entity_id provided but no access", async () => {
    const mockAccountId = "account-123";
    const mockEntityId = "550e8400-e29b-41d4-a716-446655440000";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });
    vi.mocked(checkAccountArtistAccess).mockResolvedValue(false);

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
      body: JSON.stringify({ connector: "tiktok", entity_id: mockEntityId }),
    });
    const result = await validateAuthorizeConnectorRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
  });

  it("should include TikTok auth config when connector is tiktok and env var is set", async () => {
    const mockAccountId = "account-123";
    const mockEntityId = "550e8400-e29b-41d4-a716-446655440000";
    const originalEnv = process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID;
    process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID = "ac_test123";

    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });
    vi.mocked(checkAccountArtistAccess).mockResolvedValue(true);

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
      body: JSON.stringify({ connector: "tiktok", entity_id: mockEntityId }),
    });
    const result = await validateAuthorizeConnectorRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { authConfigs?: Record<string, string> }).authConfigs).toEqual({
      tiktok: "ac_test123",
    });

    process.env.COMPOSIO_TIKTOK_AUTH_CONFIG_ID = originalEnv;
  });
});
