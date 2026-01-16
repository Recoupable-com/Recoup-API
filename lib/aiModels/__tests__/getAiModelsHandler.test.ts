import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAiModelsHandler } from "../getAiModelsHandler";

import { getAvailableModels } from "@/lib/ai/getAvailableModels";

// Mock dependencies
vi.mock("@/lib/ai/getAvailableModels", () => ({
  getAvailableModels: vi.fn(),
}));

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

describe("getAiModelsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful responses", () => {
    it("returns models from getAvailableModels", async () => {
      const mockModels = [
        { id: "gpt-4", name: "GPT-4", pricing: { input: "0.00003", output: "0.00006" } },
        { id: "claude-3-opus", name: "Claude 3 Opus", pricing: { input: "0.00001", output: "0.00003" } },
      ];
      vi.mocked(getAvailableModels).mockResolvedValue(mockModels as any);

      const response = await getAiModelsHandler();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.models).toEqual(mockModels);
      expect(getAvailableModels).toHaveBeenCalledOnce();
    });

    it("returns empty array when no models available", async () => {
      vi.mocked(getAvailableModels).mockResolvedValue([]);

      const response = await getAiModelsHandler();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.models).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("returns 500 when getAvailableModels throws", async () => {
      vi.mocked(getAvailableModels).mockRejectedValue(new Error("Gateway error"));

      const response = await getAiModelsHandler();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.message).toBe("Gateway error");
    });

    it("returns generic message when error has no message", async () => {
      vi.mocked(getAvailableModels).mockRejectedValue("unknown error");

      const response = await getAiModelsHandler();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.message).toBe("failed");
    });
  });
});
