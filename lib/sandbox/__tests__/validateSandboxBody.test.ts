import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { validateSandboxBody, sandboxBodySchema } from "../validateSandboxBody";

describe("validateSandboxBody", () => {
  describe("schema validation", () => {
    it("requires prompt field", () => {
      const result = sandboxBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty prompt", () => {
      const result = sandboxBodySchema.safeParse({ prompt: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid prompt", () => {
      const result = sandboxBodySchema.safeParse({ prompt: "tell me hello" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ prompt: "tell me hello" });
    });
  });

  describe("validateSandboxBody function", () => {
    it("returns validated data for valid input", () => {
      const result = validateSandboxBody({ prompt: "Create a file" });
      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({ prompt: "Create a file" });
    });

    it("returns error response when prompt is missing", () => {
      const result = validateSandboxBody({});
      expect(result).toBeInstanceOf(NextResponse);
    });

    it("returns error response when prompt is empty", () => {
      const result = validateSandboxBody({ prompt: "" });
      expect(result).toBeInstanceOf(NextResponse);
    });
  });
});
