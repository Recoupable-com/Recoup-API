import { Sandbox } from "@vercel/sandbox";
import { runClaudeCodePrompt } from "./runClaudeCodePrompt";

/**
 * Response from creating a sandbox.
 * Uses Sandbox class types from @vercel/sandbox SDK.
 */
export interface SandboxResponse {
  sandboxId: Sandbox["sandboxId"];
  sandboxStatus: Sandbox["status"];
  timeout: Sandbox["timeout"];
  createdAt: string;
}

/**
 * Creates a new ephemeral sandbox environment using Vercel Sandbox SDK.
 * Executes the provided prompt using Claude Code CLI in the sandbox.
 *
 * @param prompt - The prompt to execute in the sandbox
 * @returns The created sandbox details
 * @throws Error if sandbox creation fails
 */
export async function createSandbox(prompt: string): Promise<SandboxResponse> {
  const sandbox = await Sandbox.create();

  await runClaudeCodePrompt(sandbox, prompt);

  return {
    sandboxId: sandbox.sandboxId,
    sandboxStatus: sandbox.status,
    timeout: sandbox.timeout,
    createdAt: sandbox.createdAt.toISOString(),
  };
}
