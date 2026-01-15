import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCreateArtistInDb = vi.fn();
const mockValidateCreateArtistQuery = vi.fn();

vi.mock("@/lib/artists/createArtistInDb", () => ({
  createArtistInDb: (...args: unknown[]) => mockCreateArtistInDb(...args),
}));

vi.mock("@/lib/artists/validateCreateArtistQuery", () => ({
  validateCreateArtistQuery: (...args: unknown[]) =>
    mockValidateCreateArtistQuery(...args),
}));

import { createArtistHandler } from "../createArtistHandler";

describe("createArtistHandler", () => {
  const mockArtist = {
    id: "artist-123",
    account_id: "artist-123",
    name: "Test Artist",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    image: null,
    instruction: null,
    knowledges: null,
    label: null,
    organization: null,
    company_name: null,
    job_title: null,
    role_type: null,
    onboarding_status: null,
    onboarding_data: null,
    account_info: [],
    account_socials: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with artist data on successful creation", async () => {
    const validatedQuery = {
      name: "Test Artist",
      account_id: "owner-456",
    };
    mockValidateCreateArtistQuery.mockReturnValue(validatedQuery);
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const request = new NextRequest(
      "http://localhost/api/artist/create?name=Test%20Artist&account_id=owner-456",
    );

    const response = await createArtistHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.artist).toEqual(mockArtist);
    expect(mockCreateArtistInDb).toHaveBeenCalledWith("Test Artist", "owner-456");
  });

  it("returns validation error response when validation fails", async () => {
    const { NextResponse } = await import("next/server");
    const errorResponse = NextResponse.json(
      { status: "error", error: "name is required" },
      { status: 400 },
    );
    mockValidateCreateArtistQuery.mockReturnValue(errorResponse);

    const request = new NextRequest(
      "http://localhost/api/artist/create?account_id=owner-456",
    );

    const response = await createArtistHandler(request);

    expect(response.status).toBe(400);
    expect(mockCreateArtistInDb).not.toHaveBeenCalled();
  });

  it("returns 500 when createArtistInDb returns null", async () => {
    const validatedQuery = {
      name: "Test Artist",
      account_id: "owner-456",
    };
    mockValidateCreateArtistQuery.mockReturnValue(validatedQuery);
    mockCreateArtistInDb.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/artist/create?name=Test%20Artist&account_id=owner-456",
    );

    const response = await createArtistHandler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Failed to create artist");
  });

  it("returns 400 with error message when createArtistInDb throws", async () => {
    const validatedQuery = {
      name: "Test Artist",
      account_id: "owner-456",
    };
    mockValidateCreateArtistQuery.mockReturnValue(validatedQuery);
    mockCreateArtistInDb.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      "http://localhost/api/artist/create?name=Test%20Artist&account_id=owner-456",
    );

    const response = await createArtistHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Database error");
  });

  it("includes CORS headers in successful response", async () => {
    const validatedQuery = {
      name: "Test Artist",
      account_id: "owner-456",
    };
    mockValidateCreateArtistQuery.mockReturnValue(validatedQuery);
    mockCreateArtistInDb.mockResolvedValue(mockArtist);

    const request = new NextRequest(
      "http://localhost/api/artist/create?name=Test%20Artist&account_id=owner-456",
    );

    const response = await createArtistHandler(request);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("includes CORS headers in error response", async () => {
    const validatedQuery = {
      name: "Test Artist",
      account_id: "owner-456",
    };
    mockValidateCreateArtistQuery.mockReturnValue(validatedQuery);
    mockCreateArtistInDb.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/artist/create?name=Test%20Artist&account_id=owner-456",
    );

    const response = await createArtistHandler(request);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
