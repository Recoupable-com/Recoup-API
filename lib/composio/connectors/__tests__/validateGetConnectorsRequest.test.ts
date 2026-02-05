import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { validateGetConnectorsRequest } from "../validateGetConnectorsRequest";

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

describe("validateGetConnectorsRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error if auth fails", async () => {
    vi.mocked(validateAccountIdHeaders).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const request = new NextRequest("http://localhost/api/connectors");
    const result = await validateGetConnectorsRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
  });

  it("should return accountId as composioEntityId when no entity_id provided", async () => {
    const mockAccountId = "account-123";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });

    const request = new NextRequest("http://localhost/api/connectors");
    const result = await validateGetConnectorsRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      composioEntityId: mockAccountId,
    });
  });

  it("should return entity_id as composioEntityId with allowedToolkits when entity_id provided", async () => {
    const mockAccountId = "account-123";
    const mockEntityId = "550e8400-e29b-41d4-a716-446655440000";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });
    vi.mocked(checkAccountArtistAccess).mockResolvedValue(true);

    const request = new NextRequest(`http://localhost/api/connectors?entity_id=${mockEntityId}`);
    const result = await validateGetConnectorsRequest(request);

    expect(checkAccountArtistAccess).toHaveBeenCalledWith(mockAccountId, mockEntityId);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      composioEntityId: mockEntityId,
      allowedToolkits: ["tiktok"],
    });
  });

  it("should return 403 when entity_id provided but no access", async () => {
    const mockAccountId = "account-123";
    const mockEntityId = "550e8400-e29b-41d4-a716-446655440000";
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: mockAccountId,
    });
    vi.mocked(checkAccountArtistAccess).mockResolvedValue(false);

    const request = new NextRequest(`http://localhost/api/connectors?entity_id=${mockEntityId}`);
    const result = await validateGetConnectorsRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
  });

  it("should return 400 for invalid entity_id format", async () => {
    vi.mocked(validateAccountIdHeaders).mockResolvedValue({
      accountId: "account-123",
    });

    const request = new NextRequest("http://localhost/api/connectors?entity_id=not-a-uuid");
    const result = await validateGetConnectorsRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });
});
