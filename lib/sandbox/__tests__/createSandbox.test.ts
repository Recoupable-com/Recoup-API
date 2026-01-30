import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSandbox } from "../createSandbox";
import { Sandbox } from "@vercel/sandbox";
import { installClaudeCode } from "../installClaudeCode";

const mockSandbox = {
  sandboxId: "sbx_test123",
  status: "running",
  timeout: 600000,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  runCommand: vi.fn(),
  writeFiles: vi.fn(),
  stop: vi.fn(),
};

vi.mock("@vercel/sandbox", () => ({
  Sandbox: {
    create: vi.fn(() => Promise.resolve(mockSandbox)),
  },
}));

vi.mock("ms", () => ({
  default: vi.fn((str: string) => {
    if (str === "10m") return 600000;
    return 300000;
  }),
}));

vi.mock("../installClaudeCode", () => ({
  installClaudeCode: vi.fn(),
}));

describe("createSandbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(installClaudeCode).mockResolvedValue(undefined);
    mockSandbox.runCommand.mockResolvedValue({ exitCode: 0 });
    mockSandbox.writeFiles.mockResolvedValue(undefined);
    mockSandbox.stop.mockResolvedValue(undefined);
  });

  it("creates sandbox with correct configuration", async () => {
    await createSandbox("tell me hello");

    expect(Sandbox.create).toHaveBeenCalledWith({
      resources: { vcpus: 4 },
      timeout: 600000,
      runtime: "node22",
    });
  });

  it("calls installClaudeCode", async () => {
    await createSandbox("tell me hello");

    expect(installClaudeCode).toHaveBeenCalledWith(mockSandbox);
  });

  it("writes script to sandbox filesystem with claude command", async () => {
    const prompt = "tell me hello";
    await createSandbox(prompt);

    expect(mockSandbox.writeFiles).toHaveBeenCalledWith([
      {
        path: "/vercel/sandbox/ralph-once.sh",
        content: Buffer.from(`claude --permission-mode acceptEdits --model opus '${prompt}'`),
      },
    ]);
  });

  it("executes script with ANTHROPIC_API_KEY env var", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    await createSandbox("tell me hello");

    expect(mockSandbox.runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        cmd: "sh",
        args: ["ralph-once.sh"],
        env: { ANTHROPIC_API_KEY: "test-key" },
      }),
    );
  });

  it("returns sandbox created response", async () => {
    const result = await createSandbox("tell me hello");

    expect(result).toEqual({
      sandboxId: "sbx_test123",
      status: "running",
      timeout: 600000,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("stops sandbox after execution", async () => {
    await createSandbox("tell me hello");

    expect(mockSandbox.stop).toHaveBeenCalled();
  });

  it("stops sandbox even if script execution fails", async () => {
    mockSandbox.runCommand.mockResolvedValueOnce({ exitCode: 1 });

    const result = await createSandbox("tell me hello");

    expect(result.sandboxId).toBe("sbx_test123");
    expect(mockSandbox.stop).toHaveBeenCalled();
  });

  it("stops sandbox if installClaudeCode fails", async () => {
    vi.mocked(installClaudeCode).mockRejectedValue(new Error("Failed to install"));

    await expect(createSandbox("tell me hello")).rejects.toThrow("Failed to install");
    expect(mockSandbox.stop).toHaveBeenCalled();
  });
});
