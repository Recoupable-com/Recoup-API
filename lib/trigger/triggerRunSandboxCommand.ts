import { tasks } from "@trigger.dev/sdk";

type RunSandboxCommandPayload = {
  command: string;
  args?: string[];
  cwd?: string;
  sandboxId: string;
  accountId: string;
};

/**
 * Triggers the run-sandbox-command task to execute a command in a sandbox.
 *
 * @param payload - The task payload with command, args, cwd, sandboxId, and accountId
 * @returns The task handle with runId
 */
export async function triggerRunSandboxCommand(payload: RunSandboxCommandPayload) {
  const handle = await tasks.trigger("run-sandbox-command", payload);
  return handle;
}
