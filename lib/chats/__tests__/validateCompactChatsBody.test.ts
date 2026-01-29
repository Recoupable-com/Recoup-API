import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { validateCompactChatsBody } from "../validateCompactChatsBody";

describe("validateCompactChatsBody", () => {
  describe("valid inputs", () => {
    it("accepts a single valid UUID in chatId array", () => {
      const result = validateCompactChatsBody({
        chatId: ["123e4567-e89b-12d3-a456-426614174000"],
      });

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({
        chatId: ["123e4567-e89b-12d3-a456-426614174000"],
      });
    });

    it("accepts multiple valid UUIDs in chatId array", () => {
      const result = validateCompactChatsBody({
        chatId: [
          "123e4567-e89b-12d3-a456-426614174000",
          "223e4567-e89b-12d3-a456-426614174001",
          "323e4567-e89b-12d3-a456-426614174002",
        ],
      });

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toHaveProperty("chatId");
      const typedResult = result as { chatId: string[] };
      expect(typedResult.chatId).toHaveLength(3);
    });

    it("accepts optional prompt parameter", () => {
      const result = validateCompactChatsBody({
        chatId: ["123e4567-e89b-12d3-a456-426614174000"],
        prompt: "Focus on action items and decisions",
      });

      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({
        chatId: ["123e4567-e89b-12d3-a456-426614174000"],
        prompt: "Focus on action items and decisions",
      });
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing chatId", () => {
      const result = validateCompactChatsBody({});

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(400);
    });

    it("rejects empty chatId array", () => {
      const result = validateCompactChatsBody({
        chatId: [],
      });

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(400);
    });

    it("rejects invalid UUID in chatId array", () => {
      const result = validateCompactChatsBody({
        chatId: ["not-a-valid-uuid"],
      });

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(400);
    });

    it("rejects chatId as a string instead of array", () => {
      const result = validateCompactChatsBody({
        chatId: "123e4567-e89b-12d3-a456-426614174000",
      });

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(400);
    });

    it("rejects array with one invalid UUID among valid ones", () => {
      const result = validateCompactChatsBody({
        chatId: ["123e4567-e89b-12d3-a456-426614174000", "invalid-uuid"],
      });

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(400);
    });
  });
});
