import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { validateGetSandboxesRequest } from "../validateGetSandboxesRequest";
import { validateAuthContext } from "@/lib/auth/validateAuthContext";

vi.mock("@/lib/auth/validateAuthContext", () => ({
  validateAuthContext: vi.fn(),
}));

/**
 * Creates a mock NextRequest for testing.
 *
 * @param queryParams - Optional query parameters
 * @returns A mock NextRequest object
 */
function createMockRequest(queryParams: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/sandboxes");
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return {
    url: url.toString(),
    headers: new Headers({ "x-api-key": "test-key" }),
  } as unknown as NextRequest;
}

describe("validateGetSandboxesRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when auth fails", async () => {
    vi.mocked(validateAuthContext).mockResolvedValue(
      NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 }),
    );

    const request = createMockRequest();
    const result = await validateGetSandboxesRequest(request);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns params with accountIds for personal key", async () => {
    vi.mocked(validateAuthContext).mockResolvedValue({
      accountId: "acc_123",
      orgId: null,
      authToken: "token",
    });

    const request = createMockRequest();
    const result = await validateGetSandboxesRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      accountIds: ["acc_123"],
      sandboxId: undefined,
    });
  });

  it("returns params with orgId for org key", async () => {
    vi.mocked(validateAuthContext).mockResolvedValue({
      accountId: "acc_123",
      orgId: "org_456",
      authToken: "token",
    });

    const request = createMockRequest();
    const result = await validateGetSandboxesRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      orgId: "org_456",
      sandboxId: undefined,
    });
  });

  it("includes sandbox_id in params when provided", async () => {
    vi.mocked(validateAuthContext).mockResolvedValue({
      accountId: "acc_123",
      orgId: null,
      authToken: "token",
    });

    const request = createMockRequest({ sandbox_id: "sbx_specific" });
    const result = await validateGetSandboxesRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({
      accountIds: ["acc_123"],
      sandboxId: "sbx_specific",
    });
  });

  it("handles empty sandbox_id query param", async () => {
    vi.mocked(validateAuthContext).mockResolvedValue({
      accountId: "acc_123",
      orgId: null,
      authToken: "token",
    });

    const request = createMockRequest();
    const result = await validateGetSandboxesRequest(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { sandboxId?: string }).sandboxId).toBeUndefined();
  });
});
