import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectRooms } from "../selectRooms";
import supabase from "../../serverClient";

vi.mock("../../serverClient", () => ({
  default: {
    from: vi.fn(),
  },
}));

describe("selectRooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Creates a mock query builder chain that supports method chaining.
   * The mock is thenable to support await.
   *
   * @param data - The data to return
   * @param error - The error to return
   * @returns A mock query builder
   */
  function createMockQueryBuilder(data: unknown, error: unknown = null) {
    const chainableMock = {
      eq: vi.fn(),
      order: vi.fn(),
      then: vi.fn((resolve: (value: { data: unknown; error: unknown }) => void) => {
        resolve({ data, error });
      }),
    };

    chainableMock.eq.mockReturnValue(chainableMock);
    chainableMock.order.mockReturnValue(chainableMock);

    const selectMock = vi.fn().mockReturnValue(chainableMock);
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as ReturnType<
      typeof supabase.from
    >);

    return { selectMock, chainableMock };
  }

  describe("without filters", () => {
    it("returns all rooms when no filters provided", async () => {
      const mockRooms = [
        {
          id: "room-1",
          account_id: "account-1",
          artist_id: null,
          topic: "Room 1",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "room-2",
          account_id: "account-2",
          artist_id: "artist-1",
          topic: "Room 2",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      const result = await selectRooms();

      expect(result).toEqual(mockRooms);
      expect(supabase.from).toHaveBeenCalledWith("rooms");
      expect(chainableMock.eq).not.toHaveBeenCalled();
    });

    it("returns all rooms when empty object provided", async () => {
      const mockRooms = [{ id: "room-1" }];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      const result = await selectRooms({});

      expect(result).toEqual(mockRooms);
      expect(chainableMock.eq).not.toHaveBeenCalled();
    });
  });

  describe("with accountId filter", () => {
    it("filters by accountId when provided", async () => {
      const accountId = "123e4567-e89b-12d3-a456-426614174000";
      const mockRooms = [
        {
          id: "room-1",
          account_id: accountId,
          artist_id: null,
          topic: "Room 1",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      const result = await selectRooms({ accountId });

      expect(result).toEqual(mockRooms);
      expect(chainableMock.eq).toHaveBeenCalledTimes(1);
      expect(chainableMock.eq).toHaveBeenCalledWith("account_id", accountId);
    });
  });

  describe("with artistId filter", () => {
    it("filters by artistId when provided", async () => {
      const artistId = "123e4567-e89b-12d3-a456-426614174001";
      const mockRooms = [
        {
          id: "room-1",
          account_id: "account-1",
          artist_id: artistId,
          topic: "Artist Room",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      const result = await selectRooms({ artistId });

      expect(result).toEqual(mockRooms);
      expect(chainableMock.eq).toHaveBeenCalledTimes(1);
      expect(chainableMock.eq).toHaveBeenCalledWith("artist_id", artistId);
    });
  });

  describe("with combined filters", () => {
    it("filters by both accountId and artistId when provided", async () => {
      const accountId = "123e4567-e89b-12d3-a456-426614174000";
      const artistId = "123e4567-e89b-12d3-a456-426614174001";
      const mockRooms = [
        {
          id: "room-1",
          account_id: accountId,
          artist_id: artistId,
          topic: "Artist Room",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      const result = await selectRooms({ accountId, artistId });

      expect(result).toEqual(mockRooms);
      expect(chainableMock.eq).toHaveBeenCalledTimes(2);
      expect(chainableMock.eq).toHaveBeenCalledWith("account_id", accountId);
      expect(chainableMock.eq).toHaveBeenCalledWith("artist_id", artistId);
    });
  });

  describe("ordering", () => {
    it("orders by updated_at descending", async () => {
      const mockRooms = [{ id: "room-1" }];

      const { chainableMock } = createMockQueryBuilder(mockRooms);

      await selectRooms();

      expect(chainableMock.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    });
  });

  describe("empty results", () => {
    it("returns empty array when no rooms found", async () => {
      createMockQueryBuilder([]);

      const result = await selectRooms({ accountId: "non-existent" });

      expect(result).toEqual([]);
    });

    it("returns empty array when data is null", async () => {
      createMockQueryBuilder(null);

      const result = await selectRooms();

      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("returns null when query fails", async () => {
      createMockQueryBuilder(null, { message: "Database error" });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await selectRooms();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[ERROR] selectRooms:",
        expect.objectContaining({ message: "Database error" }),
      );

      consoleSpy.mockRestore();
    });
  });
});
