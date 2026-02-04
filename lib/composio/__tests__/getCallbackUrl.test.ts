import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCallbackUrl } from "../getCallbackUrl";

vi.mock("../getFrontendBaseUrl", () => ({
  getFrontendBaseUrl: vi.fn(() => "https://chat.recoupable.com"),
}));

describe("getCallbackUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("connectors destination", () => {
    it("should return settings/connectors URL with connected param", () => {
      const result = getCallbackUrl({ destination: "connectors" });

      expect(result).toBe(
        "https://chat.recoupable.com/settings/connectors?connected=true",
      );
    });
  });

  describe("artist-connectors destination", () => {
    it("should return chat URL with artist_connected and toolkit params", () => {
      const result = getCallbackUrl({
        destination: "artist-connectors",
        artistId: "artist-123",
        toolkit: "tiktok",
      });

      expect(result).toBe(
        "https://chat.recoupable.com/chat?artist_connected=artist-123&toolkit=tiktok",
      );
    });

    it("should handle missing artistId and toolkit gracefully", () => {
      const result = getCallbackUrl({
        destination: "artist-connectors",
      });

      expect(result).toBe(
        "https://chat.recoupable.com/chat?artist_connected=undefined&toolkit=undefined",
      );
    });
  });

  describe("chat destination", () => {
    it("should return chat URL with roomId", () => {
      const result = getCallbackUrl({
        destination: "chat",
        roomId: "room-456",
      });

      expect(result).toBe(
        "https://chat.recoupable.com/chat/room-456?connected=true",
      );
    });

    it("should return base chat URL without roomId", () => {
      const result = getCallbackUrl({
        destination: "chat",
      });

      expect(result).toBe("https://chat.recoupable.com/chat?connected=true");
    });
  });
});
