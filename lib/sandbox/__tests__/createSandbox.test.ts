import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sandbox } from "@vercel/sandbox";
import { installClaudeCode } from "../installClaudeCode";
import { runClaudeCodePrompt } from "../runClaudeCodePrompt";
import { createSandbox } from "../createSandbox";

vi.mock("@vercel/sandbox", () => ({
  Sandbox: {
    create: vi.fn(),
  },
}));

vi.mock("../installClaudeCode", () => ({
  installClaudeCode: vi.fn(),
}));

vi.mock("../runClaudeCodePrompt", () => ({
  runClaudeCodePrompt: vi.fn(),
}));

describe("createSandbox", () => {
  const mockSandboxInstance = {
    sandboxId: "sbx_test123",
    status: "running",
    timeout: 600000,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    writeFiles: vi.fn(),
    runCommand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Sandbox.create).mockResolvedValue(mockSandboxInstance as never);
    vi.mocked(installClaudeCode).mockResolvedValue(undefined);
    vi.mocked(runClaudeCodePrompt).mockResolvedValue(undefined);
  });

  describe("response format", () => {
    it("returns sandboxId from created sandbox", async () => {
      const result = await createSandbox("test prompt");
      expect(result.sandboxId).toBe("sbx_test123");
    });

    it("returns sandboxStatus (not status)", async () => {
      const result = await createSandbox("test prompt");
      expect(result.sandboxStatus).toBe("running");
      expect((result as Record<string, unknown>).status).toBeUndefined();
    });

    it("returns timeout as integer", async () => {
      const result = await createSandbox("test prompt");
      expect(result.timeout).toBe(600000);
      expect(typeof result.timeout).toBe("number");
    });

    it("returns createdAt as ISO string", async () => {
      const result = await createSandbox("test prompt");
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(typeof result.createdAt).toBe("string");
    });
  });

  describe("sandbox setup", () => {
    it("creates sandbox with Sandbox.create", async () => {
      await createSandbox("test prompt");
      expect(Sandbox.create).toHaveBeenCalled();
    });

    it("installs Claude Code CLI and SDK", async () => {
      await createSandbox("test prompt");
      expect(installClaudeCode).toHaveBeenCalledWith(mockSandboxInstance);
    });

    it("executes prompt using runClaudeCodePrompt", async () => {
      await createSandbox("Create a new file");
      expect(runClaudeCodePrompt).toHaveBeenCalledWith(mockSandboxInstance, "Create a new file");
    });
  });
});
