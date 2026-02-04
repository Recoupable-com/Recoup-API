import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSandboxesHandler } from "../getSandboxesHandler";
import { validateGetSandboxesRequest } from "../validateGetSandboxesRequest";
import { selectAccountSandboxes } from "@/lib/supabase/account_sandboxes/selectAccountSandboxes";
import { getSandboxStatus } from "../getSandboxStatus";
import { selectAccountSnapshots } from "@/lib/supabase/account_snapshots/selectAccountSnapshots";

vi.mock("../validateGetSandboxesRequest", () => ({
  validateGetSandboxesRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/account_sandboxes/selectAccountSandboxes", () => ({
  selectAccountSandboxes: vi.fn(),
}));

vi.mock("../getSandboxStatus", () => ({
  getSandboxStatus: vi.fn(),
}));

vi.mock("@/lib/supabase/account_snapshots/selectAccountSnapshots", () => ({
  selectAccountSnapshots: vi.fn(),
}));

/**
 * Creates a mock NextRequest for testing.
 *
 * @returns A mock NextRequest object
 */
function createMockRequest(): NextRequest {
  return {
    url: "http://localhost:3000/api/sandboxes",
    headers: new Headers({ "x-api-key": "test-key" }),
  } as unknown as NextRequest;
}

describe("getSandboxesHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for selectAccountSnapshots - no snapshot exists
    vi.mocked(selectAccountSnapshots).mockResolvedValue([]);
  });

  it("returns error response when validation fails", async () => {
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue(
      NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 }),
    );

    const request = createMockRequest();
    const response = await getSandboxesHandler(request);

    expect(response.status).toBe(401);
  });

  it("returns 200 with empty sandboxes array when no sandboxes exist", async () => {
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
      accountIds: ["acc_123"],
    });
    vi.mocked(selectAccountSandboxes).mockResolvedValue([]);

    const request = createMockRequest();
    const response = await getSandboxesHandler(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      status: "success",
      sandboxes: [],
      snapshot_id: null,
      github_repo: null,
    });
  });

  it("returns 200 with sandboxes array on success", async () => {
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
      accountIds: ["acc_123"],
    });
    vi.mocked(selectAccountSandboxes).mockResolvedValue([
      {
        id: "record_1",
        account_id: "acc_123",
        sandbox_id: "sbx_123",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(getSandboxStatus).mockResolvedValue({
      sandboxId: "sbx_123",
      sandboxStatus: "running",
      timeout: 600000,
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const request = createMockRequest();
    const response = await getSandboxesHandler(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      status: "success",
      sandboxes: [
        {
          sandboxId: "sbx_123",
          sandboxStatus: "running",
          timeout: 600000,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      snapshot_id: null,
      github_repo: null,
    });
  });

  it("filters out sandboxes that return null status", async () => {
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
      accountIds: ["acc_123"],
    });
    vi.mocked(selectAccountSandboxes).mockResolvedValue([
      {
        id: "record_1",
        account_id: "acc_123",
        sandbox_id: "sbx_valid",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "record_2",
        account_id: "acc_123",
        sandbox_id: "sbx_deleted",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(getSandboxStatus)
      .mockResolvedValueOnce({
        sandboxId: "sbx_valid",
        sandboxStatus: "running",
        timeout: 600000,
        createdAt: "2024-01-01T00:00:00.000Z",
      })
      .mockResolvedValueOnce(null);

    const request = createMockRequest();
    const response = await getSandboxesHandler(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.sandboxes).toHaveLength(1);
    expect(json.sandboxes[0].sandboxId).toBe("sbx_valid");
  });

  it("calls selectAccountSandboxes with validated params", async () => {
    const validatedParams = {
      accountIds: ["acc_123"],
      sandboxId: "sbx_specific",
    };
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue(validatedParams);
    vi.mocked(selectAccountSandboxes).mockResolvedValue([]);

    const request = createMockRequest();
    await getSandboxesHandler(request);

    expect(selectAccountSandboxes).toHaveBeenCalledWith(validatedParams);
  });

  it("calls getSandboxStatus for each sandbox record", async () => {
    vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
      accountIds: ["acc_123"],
    });
    vi.mocked(selectAccountSandboxes).mockResolvedValue([
      {
        id: "record_1",
        account_id: "acc_123",
        sandbox_id: "sbx_1",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "record_2",
        account_id: "acc_123",
        sandbox_id: "sbx_2",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(getSandboxStatus).mockResolvedValue(null);

    const request = createMockRequest();
    await getSandboxesHandler(request);

    expect(getSandboxStatus).toHaveBeenCalledTimes(2);
    expect(getSandboxStatus).toHaveBeenCalledWith("sbx_1");
    expect(getSandboxStatus).toHaveBeenCalledWith("sbx_2");
  });

  it("fetches sandbox statuses in parallel, not sequentially", async () => {
    const callOrder: string[] = [];

    vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
      accountIds: ["acc_123"],
    });
    vi.mocked(selectAccountSandboxes).mockResolvedValue([
      {
        id: "record_1",
        account_id: "acc_123",
        sandbox_id: "sbx_1",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "record_2",
        account_id: "acc_123",
        sandbox_id: "sbx_2",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "record_3",
        account_id: "acc_123",
        sandbox_id: "sbx_3",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);

    // Mock that tracks when calls start and complete
    vi.mocked(getSandboxStatus).mockImplementation(async (sandboxId: string) => {
      callOrder.push(`start:${sandboxId}`);
      // Simulate async delay
      await new Promise(resolve => setTimeout(resolve, 10));
      callOrder.push(`end:${sandboxId}`);
      return {
        sandboxId,
        sandboxStatus: "running",
        timeout: 600000,
        createdAt: "2024-01-01T00:00:00.000Z",
      };
    });

    const request = createMockRequest();
    await getSandboxesHandler(request);

    // In parallel execution, all starts should happen before any ends
    // Pattern should be: start:1, start:2, start:3, end:1, end:2, end:3
    // In sequential execution: start:1, end:1, start:2, end:2, start:3, end:3
    const startIndices = callOrder
      .map((item, index) => (item.startsWith("start:") ? index : -1))
      .filter(i => i !== -1);
    const endIndices = callOrder
      .map((item, index) => (item.startsWith("end:") ? index : -1))
      .filter(i => i !== -1);

    // All starts should come before all ends (parallel execution)
    const maxStartIndex = Math.max(...startIndices);
    const minEndIndex = Math.min(...endIndices);
    expect(maxStartIndex).toBeLessThan(minEndIndex);
  });

  describe("snapshot_id and github_repo fields", () => {
    it("returns snapshot_id and github_repo when account has a snapshot", async () => {
      vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
        accountIds: ["acc_123"],
      });
      vi.mocked(selectAccountSandboxes).mockResolvedValue([]);
      vi.mocked(selectAccountSnapshots).mockResolvedValue([
        {
          account_id: "acc_123",
          snapshot_id: "snap_abc123",
          github_repo: "https://github.com/user/repo",
          created_at: "2024-01-01T00:00:00.000Z",
          expires_at: "2024-01-08T00:00:00.000Z",
        },
      ]);

      const request = createMockRequest();
      const response = await getSandboxesHandler(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.snapshot_id).toBe("snap_abc123");
      expect(json.github_repo).toBe("https://github.com/user/repo");
    });

    it("returns null for snapshot_id and github_repo when account has no snapshot", async () => {
      vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
        accountIds: ["acc_123"],
      });
      vi.mocked(selectAccountSandboxes).mockResolvedValue([]);
      vi.mocked(selectAccountSnapshots).mockResolvedValue([]);

      const request = createMockRequest();
      const response = await getSandboxesHandler(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.snapshot_id).toBeNull();
      expect(json.github_repo).toBeNull();
    });

    it("returns null github_repo when snapshot exists but has no github_repo", async () => {
      vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
        accountIds: ["acc_123"],
      });
      vi.mocked(selectAccountSandboxes).mockResolvedValue([]);
      vi.mocked(selectAccountSnapshots).mockResolvedValue([
        {
          account_id: "acc_123",
          snapshot_id: "snap_abc123",
          github_repo: null,
          created_at: "2024-01-01T00:00:00.000Z",
          expires_at: "2024-01-08T00:00:00.000Z",
        },
      ]);

      const request = createMockRequest();
      const response = await getSandboxesHandler(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.snapshot_id).toBe("snap_abc123");
      expect(json.github_repo).toBeNull();
    });

    it("does not return snapshot info for org keys (no accountIds)", async () => {
      vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
        orgId: "org_123",
      });
      vi.mocked(selectAccountSandboxes).mockResolvedValue([]);

      const request = createMockRequest();
      const response = await getSandboxesHandler(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.snapshot_id).toBeNull();
      expect(json.github_repo).toBeNull();
      expect(selectAccountSnapshots).not.toHaveBeenCalled();
    });

    it("calls selectAccountSnapshots with the account ID", async () => {
      vi.mocked(validateGetSandboxesRequest).mockResolvedValue({
        accountIds: ["acc_123"],
      });
      vi.mocked(selectAccountSandboxes).mockResolvedValue([]);
      vi.mocked(selectAccountSnapshots).mockResolvedValue([]);

      const request = createMockRequest();
      await getSandboxesHandler(request);

      expect(selectAccountSnapshots).toHaveBeenCalledWith("acc_123");
    });
  });
});
