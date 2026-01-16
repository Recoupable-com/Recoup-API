import { describe, it, expect, vi, beforeEach } from "vitest";

import insertAgentTemplateFavorite from "../insertAgentTemplateFavorite";

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/serverClient", () => ({
  default: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe("insertAgentTemplateFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  // DRY: Updated to verify select('*') is used and full record is returned
  it("inserts a favorite and returns the full record using select('*')", async () => {
    const mockRecord = {
      template_id: "tmpl-1",
      user_id: "user-1",
      created_at: "2026-01-16T12:00:00Z",
    };
    mockMaybeSingle.mockResolvedValue({
      data: mockRecord,
      error: null,
    });

    const result = await insertAgentTemplateFavorite({
      templateId: "tmpl-1",
      userId: "user-1",
    });

    expect(mockFrom).toHaveBeenCalledWith("agent_template_favorites");
    expect(mockInsert).toHaveBeenCalledWith({
      template_id: "tmpl-1",
      user_id: "user-1",
    });
    // DRY: Verify select('*') is called instead of explicit columns
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockMaybeSingle).toHaveBeenCalled();
    // DRY: Now returns the full record instead of just { success: true }
    expect(result).toEqual(mockRecord);
  });

  it("returns null when favorite already exists (duplicate key error)", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });

    const result = await insertAgentTemplateFavorite({
      templateId: "tmpl-1",
      userId: "user-1",
    });

    // DRY: Returns null for duplicate entries instead of { success: true }
    expect(result).toBeNull();
  });

  it("throws error when database operation fails with non-duplicate error", async () => {
    const mockError = { code: "42P01", message: "relation does not exist" };
    mockMaybeSingle.mockResolvedValue({ data: null, error: mockError });

    await expect(
      insertAgentTemplateFavorite({
        templateId: "tmpl-1",
        userId: "user-1",
      })
    ).rejects.toEqual(mockError);
  });

  it("throws error when database connection fails", async () => {
    const mockError = { code: "08006", message: "connection_failure" };
    mockMaybeSingle.mockResolvedValue({ data: null, error: mockError });

    await expect(
      insertAgentTemplateFavorite({
        templateId: "tmpl-1",
        userId: "user-1",
      })
    ).rejects.toEqual(mockError);
  });

  it("returns the inserted record with all fields", async () => {
    const mockRecord = {
      template_id: "different-tmpl",
      user_id: "different-user",
      created_at: "2026-01-16T14:30:00Z",
    };
    mockMaybeSingle.mockResolvedValue({
      data: mockRecord,
      error: null,
    });

    const result = await insertAgentTemplateFavorite({
      templateId: "different-tmpl",
      userId: "different-user",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      template_id: "different-tmpl",
      user_id: "different-user",
    });
    // DRY: Verify full record is returned with all fields
    expect(result).toEqual(mockRecord);
    expect(result?.created_at).toBe("2026-01-16T14:30:00Z");
  });
});
