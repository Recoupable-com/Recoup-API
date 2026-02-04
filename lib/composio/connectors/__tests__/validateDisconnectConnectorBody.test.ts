import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { validateDisconnectConnectorBody } from "../validateDisconnectConnectorBody";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

describe("validateDisconnectConnectorBody", () => {
  it("should accept valid user disconnect request", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "ca_12345",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      connected_account_id: "ca_12345",
      entity_type: "user",
    });
  });

  it("should accept valid artist disconnect request", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "ca_12345",
      entity_type: "artist",
      entity_id: "artist-123",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      connected_account_id: "ca_12345",
      entity_type: "artist",
      entity_id: "artist-123",
    });
  });

  it("should return 400 when connected_account_id is missing", () => {
    const result = validateDisconnectConnectorBody({});

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 when connected_account_id is empty", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 when entity_type=artist but entity_id is missing", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "ca_12345",
      entity_type: "artist",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid entity_type", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "ca_12345",
      entity_type: "invalid",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should default entity_type to user when not provided", () => {
    const result = validateDisconnectConnectorBody({
      connected_account_id: "ca_12345",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { entity_type: string }).entity_type).toBe("user");
  });
});
