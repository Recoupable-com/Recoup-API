import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Sandbox } from "@vercel/sandbox";
import { installClaudeCode } from "../installClaudeCode";

describe("installClaudeCode", () => {
  const mockSandbox = {
    runCommand: vi.fn(),
  } as unknown as Sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("installs Claude Code CLI globally", async () => {
    vi.mocked(mockSandbox.runCommand).mockResolvedValue({ exitCode: 0 } as never);

    await installClaudeCode(mockSandbox);

    expect(mockSandbox.runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        cmd: "npm",
        args: ["install", "-g", "@anthropic-ai/claude-code"],
        sudo: true,
      }),
    );
  });

  it("installs Anthropic SDK", async () => {
    vi.mocked(mockSandbox.runCommand).mockResolvedValue({ exitCode: 0 } as never);

    await installClaudeCode(mockSandbox);

    expect(mockSandbox.runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        cmd: "npm",
        args: ["install", "@anthropic-ai/sdk"],
      }),
    );
  });

  it("throws error if CLI installation fails", async () => {
    vi.mocked(mockSandbox.runCommand).mockResolvedValueOnce({ exitCode: 1 } as never);

    await expect(installClaudeCode(mockSandbox)).rejects.toThrow(
      "Failed to install Claude Code CLI",
    );
  });

  it("throws error if SDK installation fails", async () => {
    vi.mocked(mockSandbox.runCommand)
      .mockResolvedValueOnce({ exitCode: 0 } as never) // CLI succeeds
      .mockResolvedValueOnce({ exitCode: 1 } as never); // SDK fails

    await expect(installClaudeCode(mockSandbox)).rejects.toThrow("Failed to install Anthropic SDK");
  });
});
