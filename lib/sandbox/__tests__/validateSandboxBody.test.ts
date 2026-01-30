import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { validateSandboxBody } from "../validateSandboxBody";

describe("validateSandboxBody", () => {
  it("returns validated body when script is provided", () => {
    const body = { script: "console.log('hello')" };
    const result = validateSandboxBody(body);

    expect(result).toEqual({ script: "console.log('hello')" });
  });

  it("returns error response when script is missing", () => {
    const body = {};
    const result = validateSandboxBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error response when script is empty string", () => {
    const body = { script: "" };
    const result = validateSandboxBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error response when script is not a string", () => {
    const body = { script: 123 };
    const result = validateSandboxBody(body);

    expect(result).toBeInstanceOf(NextResponse);
  });
});
