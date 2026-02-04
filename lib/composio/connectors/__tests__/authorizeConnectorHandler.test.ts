import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { authorizeConnectorHandler } from "../authorizeConnectorHandler";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

vi.mock("../validateAuthorizeConnectorRequest", () => ({
  validateAuthorizeConnectorRequest: vi.fn(),
}));

vi.mock("../authorizeConnector", () => ({
  authorizeConnector: vi.fn(),
}));

import { validateAuthorizeConnectorRequest } from "../validateAuthorizeConnectorRequest";
import { authorizeConnector } from "../authorizeConnector";

describe("authorizeConnectorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return validation error when request validation fails", async () => {
    vi.mocked(validateAuthorizeConnectorRequest).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
    });
    const result = await authorizeConnectorHandler(request);

    expect(result.status).toBe(401);
  });

  it("should return redirect URL on successful authorization", async () => {
    vi.mocked(validateAuthorizeConnectorRequest).mockResolvedValue({
      composioEntityId: "user-123",
      connector: "googlesheets",
      entityType: "user",
    });

    vi.mocked(authorizeConnector).mockResolvedValue({
      connector: "googlesheets",
      redirectUrl: "https://oauth.example.com/authorize",
    });

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
    });
    const result = await authorizeConnectorHandler(request);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.connector).toBe("googlesheets");
    expect(body.data.redirectUrl).toBe("https://oauth.example.com/authorize");
  });

  it("should pass correct options for artist entity type", async () => {
    vi.mocked(validateAuthorizeConnectorRequest).mockResolvedValue({
      composioEntityId: "artist-456",
      connector: "tiktok",
      callbackUrl: "https://example.com/callback",
      entityType: "artist",
      authConfigs: { tiktok: "ac_123" },
    });

    vi.mocked(authorizeConnector).mockResolvedValue({
      connector: "tiktok",
      redirectUrl: "https://oauth.tiktok.com/authorize",
    });

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
    });
    await authorizeConnectorHandler(request);

    expect(authorizeConnector).toHaveBeenCalledWith("artist-456", "tiktok", {
      customCallbackUrl: "https://example.com/callback",
      entityType: "artist",
      authConfigs: { tiktok: "ac_123" },
    });
  });

  it("should return 500 when authorizeConnector throws", async () => {
    vi.mocked(validateAuthorizeConnectorRequest).mockResolvedValue({
      composioEntityId: "user-123",
      connector: "googlesheets",
      entityType: "user",
    });

    vi.mocked(authorizeConnector).mockRejectedValue(
      new Error("Composio API error"),
    );

    const request = new NextRequest("http://localhost/api/connectors/authorize", {
      method: "POST",
    });
    const result = await authorizeConnectorHandler(request);
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body.error).toBe("Composio API error");
  });
});
