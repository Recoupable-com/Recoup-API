import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import {
  validateCreateArtistQuery,
  createArtistQuerySchema,
} from "../validateCreateArtistQuery";

describe("validateCreateArtistQuery", () => {
  describe("name validation", () => {
    it("accepts valid name parameter", () => {
      const searchParams = new URLSearchParams({
        name: "Test Artist",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as any).name).toBe("Test Artist");
    });

    it("rejects missing name parameter", () => {
      const searchParams = new URLSearchParams({
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it("rejects empty name parameter", () => {
      const searchParams = new URLSearchParams({
        name: "",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe("account_id validation", () => {
    it("accepts valid UUID for account_id", () => {
      const searchParams = new URLSearchParams({
        name: "Test Artist",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as any).account_id).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("rejects missing account_id parameter", () => {
      const searchParams = new URLSearchParams({
        name: "Test Artist",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it("rejects invalid UUID for account_id", () => {
      const searchParams = new URLSearchParams({
        name: "Test Artist",
        account_id: "invalid-uuid",
      });

      const result = validateCreateArtistQuery(searchParams);

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe("schema type inference", () => {
    it("schema should require both name and account_id", () => {
      const validParams = {
        name: "Test Artist",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = createArtistQuerySchema.safeParse(validParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Artist");
        expect(result.data.account_id).toBe(
          "123e4567-e89b-12d3-a456-426614174000",
        );
      }
    });
  });
});
