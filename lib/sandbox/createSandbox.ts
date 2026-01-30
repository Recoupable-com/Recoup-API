import ms from "ms";
import { Sandbox } from "@vercel/sandbox";
import { installClaudeCode } from "./installClaudeCode";

export interface SandboxCreatedResponse {
  sandboxId: Sandbox["sandboxId"];
  status: Sandbox["status"];
  timeout: Sandbox["timeout"];
  createdAt: string;
}

/**
 * Creates a Vercel Sandbox, installs Claude Code CLI and Anthropic SDK, then executes a prompt.
 *
 * @param prompt - The prompt to send to Claude
 * @returns The sandbox creation response
 * @throws Error if sandbox creation or dependency installation fails
 */
export async function createSandbox(prompt: string): Promise<SandboxCreatedResponse> {
  const sandbox = await Sandbox.create({
    resources: { vcpus: 4 },
    timeout: ms("10m"),
    runtime: "node22",
  });

  try {
    await installClaudeCode(sandbox);

    const script = `claude --permission-mode acceptEdits --model opus '${prompt}'`;
    await sandbox.writeFiles([
      {
        path: "/vercel/sandbox/ralph-once.sh",
        content: Buffer.from(script),
      },
    ]);

    await sandbox.runCommand({
      cmd: "sh",
      args: ["ralph-once.sh"],
      stdout: process.stdout,
      stderr: process.stderr,
      env: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
      },
    });

    return {
      sandboxId: sandbox.sandboxId,
      status: sandbox.status,
      timeout: sandbox.timeout,
      createdAt: sandbox.createdAt.toISOString(),
    };
  } finally {
    await sandbox.stop();
  }
}
