import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAccountArtistAccess } from "../checkAccountArtistAccess";

vi.mock("../../serverClient", () => {
  const mockFrom = vi.fn();
  return {
    default: { from: mockFrom },
  };
});

import supabase from "../../serverClient";

describe("checkAccountArtistAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when account has direct access to artist", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { artist_id: "artist-123" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    } as never);

    mockSelect.mockReturnThis();
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });

    const result = await checkAccountArtistAccess("account-123", "artist-123");

    expect(supabase.from).toHaveBeenCalledWith("account_artist_ids");
    expect(result).toBe(true);
  });

  it("should return true when account and artist share an organization", async () => {
    // First call - direct access check (returns null)
    const mockDirectAccess = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    // Second call - artist orgs
    const mockArtistOrgs = vi.fn().mockResolvedValue({
      data: [{ organization_id: "org-1" }],
      error: null,
    });

    // Third call - user org access
    const mockUserOrgAccess = vi.fn().mockResolvedValue({
      data: [{ organization_id: "org-1" }],
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++;
      if (table === "account_artist_ids") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockDirectAccess,
              }),
            }),
          }),
        } as never;
      } else if (table === "artist_organization_ids") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(mockArtistOrgs()),
          }),
        } as never;
      } else if (table === "account_organization_ids") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue(mockUserOrgAccess()),
              }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const result = await checkAccountArtistAccess("account-123", "artist-456");

    expect(result).toBe(true);
  });

  it("should return false when direct access check errors (fail closed)", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      }),
    } as never);

    const result = await checkAccountArtistAccess("account-123", "artist-123");

    expect(result).toBe(false);
  });

  it("should return false when account has no access", async () => {
    // Direct access - none
    const mockDirectAccess = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    // Artist has no orgs
    const mockArtistOrgs = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "account_artist_ids") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockDirectAccess,
              }),
            }),
          }),
        } as never;
      } else if (table === "artist_organization_ids") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(mockArtistOrgs()),
          }),
        } as never;
      }
      return {} as never;
    });

    const result = await checkAccountArtistAccess("account-123", "artist-456");

    expect(result).toBe(false);
  });
});
