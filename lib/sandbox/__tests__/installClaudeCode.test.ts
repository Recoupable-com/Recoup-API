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

  it("installs Claude Code CLI globally with sudo", async () => {
    vi.mocked(mockSandbox.runCommand).mockResolvedValue({ exitCode: 0 } as never);

    await installClaudeCode(mockSandbox);

    expect(mockSandbox.runCommand).toHaveBeenCalledWith({
      cmd: "npm",
      args: ["install", "-g", "@anthropic-ai/claude-code"],
      stderr: process.stderr,
      stdout: process.stdout,
      sudo: true,
    });
  });

  it("throws error if installation fails", async () => {
    vi.mocked(mockSandbox.runCommand).mockResolvedValue({ exitCode: 1 } as never);

    await expect(installClaudeCode(mockSandbox)).rejects.toThrow(
      "Failed to install Claude Code CLI",
    );
  });
});
