import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConnectors } from "../getConnectors";

vi.mock("../../client", () => ({
  getComposioClient: vi.fn(),
}));

import { getComposioClient } from "../../client";

describe("getConnectors", () => {
  const mockToolkits = vi.fn();
  const mockSession = { toolkits: mockToolkits };
  const mockComposio = { create: vi.fn(() => mockSession) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getComposioClient).mockResolvedValue(mockComposio);
  });

  it("should return connectors list with connection status", async () => {
    mockToolkits.mockResolvedValue({
      items: [
        {
          slug: "googlesheets",
          name: "Google Sheets",
          connection: { isActive: true, connectedAccount: { id: "ca_123" } },
        },
        {
          slug: "googledrive",
          name: "Google Drive",
          connection: null,
        },
      ],
    });

    const result = await getConnectors("user-123");

    expect(getComposioClient).toHaveBeenCalled();
    expect(mockComposio.create).toHaveBeenCalledWith("user-123", undefined);
    expect(result).toEqual([
      {
        slug: "googlesheets",
        name: "Google Sheets",
        isConnected: true,
        connectedAccountId: "ca_123",
      },
      {
        slug: "googledrive",
        name: "Google Drive",
        isConnected: false,
        connectedAccountId: undefined,
      },
    ]);
  });

  it("should filter by allowed toolkits when provided", async () => {
    mockToolkits.mockResolvedValue({
      items: [
        {
          slug: "tiktok",
          name: "TikTok",
          connection: { isActive: true, connectedAccount: { id: "ca_456" } },
        },
      ],
    });

    await getConnectors("artist-456", {
      allowedToolkits: ["tiktok"],
    });

    expect(mockComposio.create).toHaveBeenCalledWith("artist-456", {
      toolkits: ["tiktok"],
    });
  });

  it("should use custom display names when provided", async () => {
    mockToolkits.mockResolvedValue({
      items: [
        {
          slug: "tiktok",
          name: "tiktok",
          connection: null,
        },
      ],
    });

    const result = await getConnectors("user-123", {
      displayNames: { tiktok: "TikTok" },
    });

    expect(result[0].name).toBe("TikTok");
  });

  it("should add missing allowed toolkits that are not in Composio response", async () => {
    mockToolkits.mockResolvedValue({
      items: [], // Composio returns no toolkits
    });

    const result = await getConnectors("artist-456", {
      allowedToolkits: ["tiktok", "instagram"],
      displayNames: { tiktok: "TikTok", instagram: "Instagram" },
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      { slug: "tiktok", name: "TikTok", isConnected: false, connectedAccountId: undefined },
      { slug: "instagram", name: "Instagram", isConnected: false, connectedAccountId: undefined },
    ]);
  });

  it("should maintain order of allowed toolkits", async () => {
    mockToolkits.mockResolvedValue({
      items: [
        { slug: "instagram", name: "Instagram", connection: null },
        { slug: "tiktok", name: "TikTok", connection: null },
      ],
    });

    const result = await getConnectors("user-123", {
      allowedToolkits: ["tiktok", "instagram"],
    });

    expect(result[0].slug).toBe("tiktok");
    expect(result[1].slug).toBe("instagram");
  });

  it("should handle inactive connections", async () => {
    mockToolkits.mockResolvedValue({
      items: [
        {
          slug: "googlesheets",
          name: "Google Sheets",
          connection: { isActive: false, connectedAccount: { id: "ca_123" } },
        },
      ],
    });

    const result = await getConnectors("user-123");

    expect(result[0].isConnected).toBe(false);
  });
});
