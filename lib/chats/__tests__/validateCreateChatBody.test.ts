import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { validateCreateChatBody } from "../validateCreateChatBody";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

describe("validateCreateChatBody", () => {
  it("should accept empty body (all fields optional)", () => {
    const result = validateCreateChatBody({});

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({});
  });

  it("should accept valid artistId UUID", () => {
    const result = validateCreateChatBody({
      artistId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      artistId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("should accept valid chatId UUID", () => {
    const result = validateCreateChatBody({
      chatId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      chatId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("should accept valid accountId UUID", () => {
    const result = validateCreateChatBody({
      accountId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      accountId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("should accept optional firstMessage", () => {
    const result = validateCreateChatBody({
      firstMessage: "Hello, world!",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      firstMessage: "Hello, world!",
    });
  });

  it("should accept all valid fields together", () => {
    const result = validateCreateChatBody({
      artistId: "550e8400-e29b-41d4-a716-446655440001",
      chatId: "550e8400-e29b-41d4-a716-446655440002",
      accountId: "550e8400-e29b-41d4-a716-446655440003",
      firstMessage: "Hello",
    });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      artistId: "550e8400-e29b-41d4-a716-446655440001",
      chatId: "550e8400-e29b-41d4-a716-446655440002",
      accountId: "550e8400-e29b-41d4-a716-446655440003",
      firstMessage: "Hello",
    });
  });

  it("should return 400 for invalid artistId UUID format", () => {
    const result = validateCreateChatBody({
      artistId: "not-a-uuid",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid chatId UUID format", () => {
    const result = validateCreateChatBody({
      chatId: "invalid",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid accountId UUID format", () => {
    const result = validateCreateChatBody({
      accountId: "12345",
    });

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
  });
});
