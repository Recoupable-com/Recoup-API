import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Sandbox } from "@vercel/sandbox";
import { runClaudeCodePrompt } from "../runClaudeCodePrompt";

describe("runClaudeCodePrompt", () => {
  const mockSandbox = {
    writeFiles: vi.fn(),
    runCommand: vi.fn(),
  } as unknown as Sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockSandbox.writeFiles).mockResolvedValue(undefined as never);
    vi.mocked(mockSandbox.runCommand).mockResolvedValue({ exitCode: 0 } as never);
  });

  it("writes script to ralph-once.sh with claude command", async () => {
    const prompt = "tell me hello";
    await runClaudeCodePrompt(mockSandbox, prompt);

    expect(mockSandbox.writeFiles).toHaveBeenCalledWith([
      {
        path: "/vercel/sandbox/ralph-once.sh",
        content: Buffer.from(`claude --permission-mode acceptEdits --model opus '${prompt}'`),
      },
    ]);
  });

  it("executes script with sh", async () => {
    await runClaudeCodePrompt(mockSandbox, "tell me hello");

    expect(mockSandbox.runCommand).toHaveBeenCalledWith({
      cmd: "sh",
      args: ["ralph-once.sh"],
      stdout: process.stdout,
      stderr: process.stderr,
      env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "" },
    });
  });
});
