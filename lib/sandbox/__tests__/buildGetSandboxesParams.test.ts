import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildGetSandboxesParams } from "../buildGetSandboxesParams";

import { getAccountOrganizations } from "@/lib/supabase/account_organization_ids/getAccountOrganizations";

vi.mock("@/lib/supabase/account_organization_ids/getAccountOrganizations", () => ({
  getAccountOrganizations: vi.fn(),
}));

vi.mock("@/lib/const", () => ({
  RECOUP_ORG_ID: "recoup-org-id",
}));

describe("buildGetSandboxesParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("personal API key (org_id = null)", () => {
    it("returns accountIds with key owner when no target_account_id", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "account-123",
        org_id: null,
      });

      expect(result).toEqual({
        params: { accountIds: ["account-123"], sandboxId: undefined },
        error: null,
      });
    });

    it("includes sandbox_id filter for personal key", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "account-123",
        org_id: null,
        sandbox_id: "sbx_abc123",
      });

      expect(result).toEqual({
        params: { accountIds: ["account-123"], sandboxId: "sbx_abc123" },
        error: null,
      });
    });
  });

  describe("organization API key", () => {
    it("fetches org member accountIds when no target_account_id", async () => {
      vi.mocked(getAccountOrganizations).mockResolvedValue([
        { account_id: "member-1", organization_id: "org-123", organization: null },
        { account_id: "member-2", organization_id: "org-123", organization: null },
        { account_id: "member-3", organization_id: "org-123", organization: null },
      ]);

      const result = await buildGetSandboxesParams({
        account_id: "org-123",
        org_id: "org-123",
      });

      expect(getAccountOrganizations).toHaveBeenCalledWith({ organizationId: "org-123" });
      expect(result).toEqual({
        params: { accountIds: ["member-1", "member-2", "member-3"], sandboxId: undefined },
        error: null,
      });
    });

    it("returns target_account_id when provided (access validated by caller)", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "account-123",
        org_id: "org-123",
        target_account_id: "member-account",
      });

      expect(result).toEqual({
        params: { accountIds: ["member-account"], sandboxId: undefined },
        error: null,
      });
      // Should not fetch org members when target_account_id is provided
      expect(getAccountOrganizations).not.toHaveBeenCalled();
    });

    it("includes sandbox_id filter for org key", async () => {
      vi.mocked(getAccountOrganizations).mockResolvedValue([
        { account_id: "member-1", organization_id: "org-123", organization: null },
      ]);

      const result = await buildGetSandboxesParams({
        account_id: "account-123",
        org_id: "org-123",
        sandbox_id: "sbx_abc123",
      });

      expect(result).toEqual({
        params: { accountIds: ["member-1"], sandboxId: "sbx_abc123" },
        error: null,
      });
    });

    it("returns empty accountIds when org has no members", async () => {
      vi.mocked(getAccountOrganizations).mockResolvedValue([]);

      const result = await buildGetSandboxesParams({
        account_id: "org-123",
        org_id: "org-123",
      });

      expect(result).toEqual({
        params: { accountIds: [], sandboxId: undefined },
        error: null,
      });
    });

    it("includes both target_account_id and sandbox_id when provided", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "account-123",
        org_id: "org-123",
        target_account_id: "member-account",
        sandbox_id: "sbx_abc123",
      });

      expect(result).toEqual({
        params: { accountIds: ["member-account"], sandboxId: "sbx_abc123" },
        error: null,
      });
    });
  });

  describe("Recoup admin key", () => {
    const recoupOrgId = "recoup-org-id";

    it("returns empty params (no filter) to get all records", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "admin-account",
        org_id: recoupOrgId,
      });

      expect(result).toEqual({
        params: { sandboxId: undefined },
        error: null,
      });
      // Should NOT call getAccountOrganizations for admin
      expect(getAccountOrganizations).not.toHaveBeenCalled();
    });

    it("returns target_account_id when provided (access validated by caller)", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "admin-account",
        org_id: recoupOrgId,
        target_account_id: "any-account",
      });

      expect(result).toEqual({
        params: { accountIds: ["any-account"], sandboxId: undefined },
        error: null,
      });
    });

    it("includes sandbox_id filter for admin key", async () => {
      const result = await buildGetSandboxesParams({
        account_id: "admin-account",
        org_id: recoupOrgId,
        sandbox_id: "sbx_abc123",
      });

      expect(result).toEqual({
        params: { sandboxId: "sbx_abc123" },
        error: null,
      });
    });
  });
});
