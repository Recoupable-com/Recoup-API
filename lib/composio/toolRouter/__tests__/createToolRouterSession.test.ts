import { describe, it, expect, vi, beforeEach } from "vitest";
import { createToolRouterSession } from "../createToolRouterSession";

import { getComposioClient } from "../../client";
import { getCallbackUrl } from "../../getCallbackUrl";

vi.mock("../../client", () => ({
  getComposioClient: vi.fn(),
}));

vi.mock("../../getCallbackUrl", () => ({
  getCallbackUrl: vi.fn(),
}));

describe("createToolRouterSession", () => {
  const mockSession = { tools: vi.fn() };
  const mockComposio = { create: vi.fn(() => mockSession) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getComposioClient).mockResolvedValue(mockComposio);
    vi.mocked(getCallbackUrl).mockReturnValue("https://example.com/chat?connected=true");
  });

  it("should create session with enabled toolkits", async () => {
    await createToolRouterSession("account-123");

    expect(getComposioClient).toHaveBeenCalled();
    expect(mockComposio.create).toHaveBeenCalledWith("account-123", {
      toolkits: ["googlesheets", "googledrive", "googledocs", "tiktok"],
      manageConnections: {
        callbackUrl: "https://example.com/chat?connected=true",
      },
      connectedAccounts: undefined,
    });
  });

  it("should include roomId in callback URL", async () => {
    await createToolRouterSession("account-123", "room-456");

    expect(getCallbackUrl).toHaveBeenCalledWith({
      destination: "chat",
      roomId: "room-456",
    });
  });

  it("should pass artist connections when provided", async () => {
    const artistConnections = {
      tiktok: "tiktok-account-789",
    };

    await createToolRouterSession("account-123", undefined, artistConnections);

    expect(mockComposio.create).toHaveBeenCalledWith("account-123", {
      toolkits: ["googlesheets", "googledrive", "googledocs", "tiktok"],
      manageConnections: {
        callbackUrl: "https://example.com/chat?connected=true",
      },
      connectedAccounts: artistConnections,
    });
  });

  it("should return session object", async () => {
    const result = await createToolRouterSession("account-123");

    expect(result).toBe(mockSession);
  });

  it("should handle undefined roomId", async () => {
    await createToolRouterSession("account-123", undefined);

    expect(getCallbackUrl).toHaveBeenCalledWith({
      destination: "chat",
      roomId: undefined,
    });
  });
});
