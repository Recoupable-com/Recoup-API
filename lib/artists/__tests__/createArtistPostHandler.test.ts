import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCreateArtistInDb = vi.fn();

vi.mock("@/lib/artists/createArtistInDb", () => ({
  createArtistInDb: (...args: unknown[]) => mockCreateArtistInDb(...args),
}));

import { createArtistPostHandler } from "../createArtistPostHandler";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/artists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("createArtistPostHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates artist and returns 201 with artist data", async () => {
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const request = createRequest({
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await createArtistPostHandler(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.artist).toEqual(mockArtist);
    expect(mockCreateArtistInDb).toHaveBeenCalledWith(
      "Test Artist",
      "550e8400-e29b-41d4-a716-446655440000",
      undefined,
    );
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

    const request = createRequest({
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
      organization_id: "660e8400-e29b-41d4-a716-446655440001",
    });

    await createArtistPostHandler(request);

    expect(mockCreateArtistInDb).toHaveBeenCalledWith(
      "Test Artist",
      "550e8400-e29b-41d4-a716-446655440000",
      "660e8400-e29b-41d4-a716-446655440001",
    );
  });

  it("uses accountId from context when not in body", async () => {
    const mockArtist = {
      id: "artist-123",
      account_id: "artist-123",
      name: "Test Artist",
      account_info: [{ image: null }],
      account_socials: [],
    };
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const request = createRequest({ name: "Test Artist" });

    const response = await createArtistPostHandler(
      request,
      "context-account-id",
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateArtistInDb).toHaveBeenCalledWith(
      "Test Artist",
      "context-account-id",
      undefined,
    );
  });

  it("returns 400 when account_id missing and no context", async () => {
    const request = createRequest({ name: "Test Artist" });

    const response = await createArtistPostHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("account_id is required");
  });

  it("returns 400 when name is missing", async () => {
    const request = createRequest({
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await createArtistPostHandler(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest("http://localhost/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });

    const response = await createArtistPostHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 500 when artist creation fails", async () => {
    mockCreateArtistInDb.mockResolvedValue(null);

    const request = createRequest({
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await createArtistPostHandler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create artist");
  });

  it("returns 500 with error message when exception thrown", async () => {
    mockCreateArtistInDb.mockRejectedValue(new Error("Database error"));

    const request = createRequest({
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await createArtistPostHandler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});
