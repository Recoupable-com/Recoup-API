import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { validateGetConnectorsQuery } from "../validateGetConnectorsQuery";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

describe("validateGetConnectorsQuery", () => {
  it("should return default user entity_type when no params provided", () => {
    const searchParams = new URLSearchParams();
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      entity_type: "user",
    });
  });

  it("should accept entity_type=user", () => {
    const searchParams = new URLSearchParams({ entity_type: "user" });
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      entity_type: "user",
    });
  });

  it("should accept entity_type=artist with entity_id", () => {
    const searchParams = new URLSearchParams({
      entity_type: "artist",
      entity_id: "artist-123",
    });
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      entity_type: "artist",
      entity_id: "artist-123",
    });
  });

  it("should return 400 when entity_type=artist but entity_id is missing", () => {
    const searchParams = new URLSearchParams({ entity_type: "artist" });
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid entity_type", () => {
    const searchParams = new URLSearchParams({ entity_type: "invalid" });
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should ignore entity_id when entity_type is user", () => {
    const searchParams = new URLSearchParams({
      entity_type: "user",
      entity_id: "some-id",
    });
    const result = validateGetConnectorsQuery(searchParams);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      entity_type: "user",
      entity_id: "some-id",
    });
  });
});
