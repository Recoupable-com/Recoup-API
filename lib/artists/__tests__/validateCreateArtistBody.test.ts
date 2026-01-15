import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { validateCreateArtistBody } from "../validateCreateArtistBody";

describe("validateCreateArtistBody", () => {
  it("returns validated body when name is provided", () => {
    const body = { name: "Test Artist" };
    const result = validateCreateArtistBody(body);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ name: "Test Artist" });
  });

  it("returns validated body with all optional fields", () => {
    const body = {
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
      organization_id: "660e8400-e29b-41d4-a716-446655440001",
    };
    const result = validateCreateArtistBody(body);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(body);
  });

  it("returns error when name is missing", () => {
    const body = {};
    const result = validateCreateArtistBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error when name is empty", () => {
    const body = { name: "" };
    const result = validateCreateArtistBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error when account_id is not a valid UUID", () => {
    const body = { name: "Test Artist", account_id: "invalid-uuid" };
    const result = validateCreateArtistBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error when organization_id is not a valid UUID", () => {
    const body = { name: "Test Artist", organization_id: "invalid-uuid" };
    const result = validateCreateArtistBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("allows account_id to be omitted", () => {
    const body = { name: "Test Artist" };
    const result = validateCreateArtistBody(body);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ name: "Test Artist" });
  });

  it("allows organization_id to be omitted", () => {
    const body = {
      name: "Test Artist",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    };
    const result = validateCreateArtistBody(body);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(body);
  });
});
