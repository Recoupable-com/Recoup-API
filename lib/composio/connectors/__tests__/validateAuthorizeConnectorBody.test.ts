import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { validateAuthorizeConnectorBody } from "../validateAuthorizeConnectorBody";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

describe("validateAuthorizeConnectorBody", () => {
  it("should accept valid user connector request", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "googlesheets",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      connector: "googlesheets",
      entity_type: "user",
    });
  });

  it("should accept valid artist connector request with tiktok", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "tiktok",
      entity_type: "artist",
      entity_id: "artist-123",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      connector: "tiktok",
      entity_type: "artist",
      entity_id: "artist-123",
    });
  });

  it("should accept optional callback_url", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "googlesheets",
      callback_url: "https://example.com/callback",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      connector: "googlesheets",
      entity_type: "user",
      callback_url: "https://example.com/callback",
    });
  });

  it("should return 400 when connector is missing", () => {
    const result = validateAuthorizeConnectorBody({});

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 when connector is empty", () => {
    const result = validateAuthorizeConnectorBody({ connector: "" });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 when entity_type=artist but entity_id is missing", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "tiktok",
      entity_type: "artist",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 when entity_type=artist but connector is not allowed", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "googlesheets",
      entity_type: "artist",
      entity_id: "artist-123",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid callback_url format", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "googlesheets",
      callback_url: "not-a-valid-url",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid entity_type", () => {
    const result = validateAuthorizeConnectorBody({
      connector: "googlesheets",
      entity_type: "invalid",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });
});
