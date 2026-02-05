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
    it("should return settings/connectors URL", () => {
      const url = getCallbackUrl({ destination: "connectors" });
      expect(url).toBe("https://chat.recoupable.com/settings/connectors?connected=true");
    });
  });

  describe("entity-connectors destination", () => {
    it("should return chat URL with entity and toolkit params", () => {
      const url = getCallbackUrl({
        destination: "entity-connectors",
        entityId: "entity-123",
        toolkit: "tiktok",
      });
      expect(url).toBe("https://chat.recoupable.com/chat?artist_connected=entity-123&toolkit=tiktok");
    });
  });

  describe("chat destination", () => {
    it("should return chat URL without roomId", () => {
      const url = getCallbackUrl({ destination: "chat" });
      expect(url).toBe("https://chat.recoupable.com/chat?connected=true");
    });

    it("should return chat URL with roomId", () => {
      const url = getCallbackUrl({ destination: "chat", roomId: "room-123" });
      expect(url).toBe("https://chat.recoupable.com/chat/room-123?connected=true");
    });
  });
});
