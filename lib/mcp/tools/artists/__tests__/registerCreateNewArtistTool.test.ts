import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mockCreateArtistInDb = vi.fn();
const mockCopyRoom = vi.fn();
const mockGetApiKeyDetails = vi.fn();
const mockCanAccessAccount = vi.fn();

vi.mock("@/lib/artists/createArtistInDb", () => ({
  createArtistInDb: (...args: unknown[]) => mockCreateArtistInDb(...args),
}));

vi.mock("@/lib/rooms/copyRoom", () => ({
  copyRoom: (...args: unknown[]) => mockCopyRoom(...args),
}));

vi.mock("@/lib/keys/getApiKeyDetails", () => ({
  getApiKeyDetails: (...args: unknown[]) => mockGetApiKeyDetails(...args),
}));

vi.mock("@/lib/organizations/canAccessAccount", () => ({
  canAccessAccount: (...args: unknown[]) => mockCanAccessAccount(...args),
}));

import { registerCreateNewArtistTool } from "../registerCreateNewArtistTool";

describe("registerCreateNewArtistTool", () => {
  let mockServer: McpServer;
  let registeredHandler: (args: unknown) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServer = {
      registerTool: vi.fn((name, config, handler) => {
        registeredHandler = handler;
      }),
    } as unknown as McpServer;

    registerCreateNewArtistTool(mockServer);
  });

  it("registers the create_new_artist tool", () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "create_new_artist",
      expect.objectContaining({
        description: expect.stringContaining("Create a new artist account"),
      }),
      expect.any(Function),
    );
  });

  it("creates an artist and returns success", async () => {
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const result = await registeredHandler({
      name: "Test Artist",
      account_id: "owner-456",
    });

    expect(mockCreateArtistInDb).toHaveBeenCalledWith("Test Artist", "owner-456", undefined);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Successfully created artist"),
        },
      ],
    });
  });

  it("copies room when active_conversation_id is provided", async () => {
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);
    mockCopyRoom.mockResolvedValue("new-room-789");

    const result = await registeredHandler({
      name: "Test Artist",
      account_id: "owner-456",
      active_conversation_id: "source-room-111",
    });

    expect(mockCopyRoom).toHaveBeenCalledWith("source-room-111", "artist-123");
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("new-room-789"),
        },
      ],
    });
  });

  it("passes organization_id to createArtistInDb", async () => {
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    await registeredHandler({
      name: "Test Artist",
      account_id: "owner-456",
      organization_id: "org-999",
    });

    expect(mockCreateArtistInDb).toHaveBeenCalledWith("Test Artist", "owner-456", "org-999");
  });

  it("returns error when artist creation fails", async () => {
    mockCreateArtistInDb.mockResolvedValue(null);

    const result = await registeredHandler({
      name: "Test Artist",
      account_id: "owner-456",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Failed to create artist"),
        },
      ],
    });
  });

  it("returns error with message when exception is thrown", async () => {
    mockCreateArtistInDb.mockRejectedValue(new Error("Database connection failed"));

    const result = await registeredHandler({
      name: "Test Artist",
      account_id: "owner-456",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Database connection failed"),
        },
      ],
    });
  });

  it("resolves account_id from api_key", async () => {
    mockGetApiKeyDetails.mockResolvedValue({
      accountId: "resolved-account-123",
      orgId: null,
    });
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const result = await registeredHandler({
      name: "Test Artist",
      api_key: "valid-api-key",
    });

    expect(mockGetApiKeyDetails).toHaveBeenCalledWith("valid-api-key");
    expect(mockCreateArtistInDb).toHaveBeenCalledWith(
      "Test Artist",
      "resolved-account-123",
      undefined,
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Successfully created artist"),
        },
      ],
    });
  });

  it("returns error for invalid api_key", async () => {
    mockGetApiKeyDetails.mockResolvedValue(null);

    const result = await registeredHandler({
      name: "Test Artist",
      api_key: "invalid-api-key",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Invalid API key"),
        },
      ],
    });
  });

  it("allows account_id override for org API keys with access", async () => {
    mockGetApiKeyDetails.mockResolvedValue({
      accountId: "org-account-id",
      orgId: "org-account-id",
    });
    mockCanAccessAccount.mockResolvedValue(true);
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    await registeredHandler({
      name: "Test Artist",
      api_key: "org-api-key",
      account_id: "target-account-456",
    });

    expect(mockCanAccessAccount).toHaveBeenCalledWith({
      orgId: "org-account-id",
      targetAccountId: "target-account-456",
    });
    expect(mockCreateArtistInDb).toHaveBeenCalledWith(
      "Test Artist",
      "target-account-456",
      undefined,
    );
  });

  it("returns error when org API key lacks access to account_id", async () => {
    mockGetApiKeyDetails.mockResolvedValue({
      accountId: "org-account-id",
      orgId: "org-account-id",
    });
    mockCanAccessAccount.mockResolvedValue(false);

    const result = await registeredHandler({
      name: "Test Artist",
      api_key: "org-api-key",
      account_id: "target-account-456",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Access denied to specified account_id"),
        },
      ],
    });
  });

  it("returns error when neither api_key nor account_id is provided", async () => {
    const result = await registeredHandler({
      name: "Test Artist",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Either api_key or account_id is required"),
        },
      ],
    });
  });
});
