import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateGetTaskRunQuery } from "../validateGetTaskRunQuery";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

/**
 * Creates a mock NextRequest with the given URL.
 */
function createMockRequest(url: string): NextRequest {
  return {
    url,
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

describe("validateGetTaskRunQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when runId is missing", () => {
    const request = createMockRequest("http://localhost:3000/api/tasks/runs");

    const result = validateGetTaskRunQuery(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(400);
    }
  });

  it("returns error when runId is empty string", () => {
    const request = createMockRequest("http://localhost:3000/api/tasks/runs?runId=");

    const result = validateGetTaskRunQuery(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(400);
    }
  });

  it("returns validated runId when provided", () => {
    const request = createMockRequest("http://localhost:3000/api/tasks/runs?runId=run_abc123");

    const result = validateGetTaskRunQuery(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ runId: "run_abc123" });
  });

  it("trims whitespace from runId", () => {
    const request = createMockRequest(
      "http://localhost:3000/api/tasks/runs?runId=%20run_abc123%20",
    );

    const result = validateGetTaskRunQuery(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ runId: "run_abc123" });
  });

  it("returns error response with proper error message", async () => {
    const request = createMockRequest("http://localhost:3000/api/tasks/runs");

    const result = validateGetTaskRunQuery(request);

    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      const json = await result.json();
      expect(json.status).toBe("error");
      expect(json.error).toContain("runId");
    }
  });
});
