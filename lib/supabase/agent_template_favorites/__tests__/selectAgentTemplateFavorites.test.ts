import { describe, it, expect, vi, beforeEach } from "vitest";

import selectAgentTemplateFavorites from "../selectAgentTemplateFavorites";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase/serverClient", () => ({
  default: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe("selectAgentTemplateFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it("returns empty set when userId is not provided", async () => {
    const result = await selectAgentTemplateFavorites({});

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual(new Set());
  });

  it("returns empty set when userId is empty string", async () => {
    const result = await selectAgentTemplateFavorites({ userId: "" });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual(new Set());
  });

  it("returns favorite template IDs as Set for given userId", async () => {
    const mockFavorites = [
      { template_id: "tmpl-1" },
      { template_id: "tmpl-2" },
      { template_id: "tmpl-3" },
    ];
    mockEq.mockResolvedValue({ data: mockFavorites, error: null });

    const result = await selectAgentTemplateFavorites({ userId: "user-1" });

    expect(mockFrom).toHaveBeenCalledWith("agent_template_favorites");
    expect(mockSelect).toHaveBeenCalledWith("template_id");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual(new Set(["tmpl-1", "tmpl-2", "tmpl-3"]));
  });

  it("throws error when database query fails", async () => {
    const mockError = { message: "Database connection failed" };
    mockEq.mockResolvedValue({ data: null, error: mockError });

    await expect(
      selectAgentTemplateFavorites({ userId: "user-1" })
    ).rejects.toEqual(mockError);
  });

  it("returns empty set when data is null but no error", async () => {
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await selectAgentTemplateFavorites({ userId: "user-1" });

    expect(result).toEqual(new Set());
  });

  it("returns empty set when data is empty array", async () => {
    mockEq.mockResolvedValue({ data: [], error: null });

    const result = await selectAgentTemplateFavorites({ userId: "user-1" });

    expect(result).toEqual(new Set());
  });
});
