import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { validateGetChatsQuery } from "../validateGetChatsQuery";

describe("validateGetChatsQuery", () => {
  describe("account_id validation", () => {
    it("accepts valid UUID for account_id", () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as { account_id: string }).account_id).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("rejects missing account_id", () => {
      const searchParams = new URLSearchParams({});

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });

    it("rejects invalid UUID for account_id", () => {
      const searchParams = new URLSearchParams({
        account_id: "invalid-uuid",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });
  });

  describe("artist_account_id validation", () => {
    it("accepts valid UUID for artist_account_id", () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        artist_account_id: "123e4567-e89b-12d3-a456-426614174001",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as { artist_account_id?: string }).artist_account_id).toBe(
        "123e4567-e89b-12d3-a456-426614174001",
      );
    });

    it("accepts missing artist_account_id (optional)", () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as { artist_account_id?: string }).artist_account_id).toBeUndefined();
    });

    it("rejects invalid UUID for artist_account_id", () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        artist_account_id: "invalid-uuid",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });
  });

  describe("error response format", () => {
    it("returns helpful error message for missing account_id", async () => {
      const searchParams = new URLSearchParams({});

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.status).toBe("error");
        expect(json.missing_fields).toEqual(["account_id"]);
        expect(json.error).toBe("account_id is required");
      }
    });

    it("returns helpful error message for invalid account_id UUID", async () => {
      const searchParams = new URLSearchParams({ account_id: "not-a-uuid" });

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.status).toBe("error");
        expect(json.error).toBe("account_id must be a valid UUID");
      }
    });

    it("returns helpful error message for invalid artist_account_id UUID", async () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        artist_account_id: "not-a-uuid",
      });

      const result = validateGetChatsQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.status).toBe("error");
        expect(json.error).toBe("artist_account_id must be a valid UUID");
      }
    });
  });
});
