import { describe, it, expect, vi, beforeEach } from "vitest";
import { authorizeConnector } from "../authorizeConnector";

vi.mock("../../client", () => ({
  getComposioClient: vi.fn(),
}));

vi.mock("../../getCallbackUrl", () => ({
  getCallbackUrl: vi.fn(),
}));

import { getComposioClient } from "../../client";
import { getCallbackUrl } from "../../getCallbackUrl";

describe("authorizeConnector", () => {
  const mockAuthorize = vi.fn();
  const mockSession = { authorize: mockAuthorize };
  const mockComposio = { create: vi.fn(() => mockSession) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getComposioClient).mockResolvedValue(mockComposio);
    vi.mocked(getCallbackUrl).mockReturnValue("https://example.com/callback");
    mockAuthorize.mockResolvedValue({
      redirectUrl: "https://oauth.example.com/authorize",
    });
  });

  it("should authorize user connector with default options", async () => {
    const result = await authorizeConnector("user-123", "googlesheets");

    expect(getComposioClient).toHaveBeenCalled();
    expect(getCallbackUrl).toHaveBeenCalledWith({ destination: "connectors" });
    expect(mockComposio.create).toHaveBeenCalledWith("user-123", {
      manageConnections: { callbackUrl: "https://example.com/callback" },
    });
    expect(mockAuthorize).toHaveBeenCalledWith("googlesheets");
    expect(result).toEqual({
      connector: "googlesheets",
      redirectUrl: "https://oauth.example.com/authorize",
    });
  });

  it("should use custom callback URL when provided", async () => {
    await authorizeConnector("user-123", "googlesheets", {
      customCallbackUrl: "https://custom.example.com/callback",
    });

    expect(getCallbackUrl).not.toHaveBeenCalled();
    expect(mockComposio.create).toHaveBeenCalledWith("user-123", {
      manageConnections: { callbackUrl: "https://custom.example.com/callback" },
    });
  });

  it("should build artist callback URL for artist entity type", async () => {
    vi.mocked(getCallbackUrl).mockReturnValue(
      "https://example.com/chat?artist_connected=artist-456&toolkit=tiktok",
    );

    await authorizeConnector("artist-456", "tiktok", {
      entityType: "artist",
    });

    expect(getCallbackUrl).toHaveBeenCalledWith({
      destination: "artist-connectors",
      artistId: "artist-456",
      toolkit: "tiktok",
    });
  });

  it("should pass auth configs when provided", async () => {
    await authorizeConnector("user-123", "tiktok", {
      authConfigs: { tiktok: "ac_12345" },
    });

    expect(mockComposio.create).toHaveBeenCalledWith("user-123", {
      authConfigs: { tiktok: "ac_12345" },
      manageConnections: { callbackUrl: "https://example.com/callback" },
    });
  });

  it("should not pass empty auth configs", async () => {
    await authorizeConnector("user-123", "googlesheets", {
      authConfigs: {},
    });

    expect(mockComposio.create).toHaveBeenCalledWith("user-123", {
      manageConnections: { callbackUrl: "https://example.com/callback" },
    });
  });

  it("should use toolkit option for callback URL when provided", async () => {
    await authorizeConnector("artist-456", "tiktok", {
      entityType: "artist",
      toolkit: "custom-toolkit",
    });

    expect(getCallbackUrl).toHaveBeenCalledWith({
      destination: "artist-connectors",
      artistId: "artist-456",
      toolkit: "custom-toolkit",
    });
  });
});
