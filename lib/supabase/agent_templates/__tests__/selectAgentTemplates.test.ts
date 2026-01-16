import { describe, it, expect, vi, beforeEach } from "vitest";

import selectAgentTemplates from "../selectAgentTemplates";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOr = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase/serverClient", () => ({
  default: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe("selectAgentTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ or: mockOr, eq: mockEq });
    mockOr.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  describe("with userId provided", () => {
    it("returns templates owned by user OR public templates", async () => {
      const mockTemplates = [
        {
          id: "tmpl-1",
          title: "My Template",
          description: "desc",
          prompt: "prompt",
          tags: [],
          creator: "user-1",
          is_private: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          favorites_count: 5,
        },
        {
          id: "tmpl-2",
          title: "Public Template",
          description: "desc",
          prompt: "prompt",
          tags: [],
          creator: "other-user",
          is_private: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          favorites_count: 10,
        },
      ];
      mockOrder.mockResolvedValue({ data: mockTemplates, error: null });

      const result = await selectAgentTemplates({ userId: "user-1" });

      expect(mockFrom).toHaveBeenCalledWith("agent_templates");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOr).toHaveBeenCalledWith("creator.eq.user-1,is_private.eq.false");
      expect(mockOrder).toHaveBeenCalledWith("title");
      expect(result).toEqual(mockTemplates);
    });

    it("filters out 'undefined' string as userId (treats as anonymous)", async () => {
      const mockTemplates = [
        {
          id: "tmpl-1",
          title: "Public Template",
          description: "desc",
          prompt: "prompt",
          tags: [],
          creator: "someone",
          is_private: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          favorites_count: 0,
        },
      ];
      mockOrder.mockResolvedValue({ data: mockTemplates, error: null });

      const result = await selectAgentTemplates({ userId: "undefined" });

      expect(mockOr).not.toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("is_private", false);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe("without userId (anonymous)", () => {
    it("returns only public templates when userId is null", async () => {
      const mockTemplates = [
        {
          id: "tmpl-1",
          title: "Public Template",
          description: "desc",
          prompt: "prompt",
          tags: [],
          creator: "someone",
          is_private: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          favorites_count: 10,
        },
      ];
      mockOrder.mockResolvedValue({ data: mockTemplates, error: null });

      const result = await selectAgentTemplates({ userId: null });

      expect(mockFrom).toHaveBeenCalledWith("agent_templates");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOr).not.toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("is_private", false);
      expect(mockOrder).toHaveBeenCalledWith("title");
      expect(result).toEqual(mockTemplates);
    });

    it("returns only public templates when userId is undefined", async () => {
      const mockTemplates = [
        {
          id: "tmpl-1",
          title: "Public Template",
          description: "desc",
          prompt: "prompt",
          tags: [],
          creator: "someone",
          is_private: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          favorites_count: 10,
        },
      ];
      mockOrder.mockResolvedValue({ data: mockTemplates, error: null });

      const result = await selectAgentTemplates({});

      expect(mockOr).not.toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("is_private", false);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe("error handling", () => {
    it("throws error when database query fails", async () => {
      const mockError = { message: "Database connection failed" };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(
        selectAgentTemplates({ userId: "user-1" })
      ).rejects.toEqual(mockError);
    });

    it("returns empty array when data is null but no error", async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await selectAgentTemplates({ userId: "user-1" });

      expect(result).toEqual([]);
    });

    it("returns empty array when data is empty array", async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await selectAgentTemplates({ userId: "user-1" });

      expect(result).toEqual([]);
    });
  });
});
