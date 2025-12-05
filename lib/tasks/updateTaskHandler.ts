import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { updateScheduledAction } from "@/lib/supabase/scheduled_actions/updateScheduledAction";
import { selectScheduledActions } from "@/lib/supabase/scheduled_actions/selectScheduledActions";
import { syncTriggerSchedule } from "@/lib/trigger/syncTriggerSchedule";
import { validateUpdateTaskBody } from "@/lib/tasks/validateUpdateTaskBody";
import type { TablesUpdate } from "@/types/database.types";

/**
 * Updates an existing task (scheduled action)
 * Only the `id` field is required; any additional fields will be updated.
 * If `schedule` (cron) is updated, the corresponding Trigger.dev schedule is also updated.
 * Returns the updated task in an array, matching GET response shape
 *
 * Body parameters:
 * - id (required): The task ID to update
 * - title (optional): The title of the task
 * - prompt (optional): The prompt for the task
 * - schedule (optional): The cron schedule string
 * - account_id (optional): The account ID
 * - artist_account_id (optional): The artist account ID
 * - enabled (optional): Whether the task is enabled
 *
 * @param request - The request object containing the task data in the body.
 * @returns A NextResponse with the updated task.
 */
export async function updateTaskHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validatedBody = validateUpdateTaskBody(body);
    if (validatedBody instanceof NextResponse) {
      return validatedBody;
    }

    const { id, title, prompt, schedule, account_id, artist_account_id, enabled } = validatedBody;

    const existingTasks = await selectScheduledActions({ id });
    const existingTask = existingTasks[0];

    if (!existingTask) {
      return NextResponse.json(
        {
          status: "error",
          error: "Task not found",
        },
        {
          status: 404,
          headers: getCorsHeaders(),
        },
      );
    }

    const updateData: Partial<TablesUpdate<"scheduled_actions">> = {};
    if (title !== undefined) updateData.title = title;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (account_id !== undefined) updateData.account_id = account_id;
    if (artist_account_id !== undefined) updateData.artist_account_id = artist_account_id;
    if (enabled !== undefined) updateData.enabled = enabled;

    const finalEnabled = enabled !== undefined ? enabled : (existingTask.enabled ?? true);
    const cronExpression = schedule ?? existingTask.schedule ?? undefined;
    const scheduleChanged = schedule !== undefined;

    const newTriggerScheduleId = await syncTriggerSchedule({
      taskId: id,
      enabled: finalEnabled,
      cronExpression,
      scheduleChanged,
      existingScheduleId: existingTask.trigger_schedule_id ?? null,
    });

    if (newTriggerScheduleId !== existingTask.trigger_schedule_id) {
      updateData.trigger_schedule_id = newTriggerScheduleId;
    }

    const updated = await updateScheduledAction({
      id,
      ...updateData,
    });

    return NextResponse.json(
      {
        status: "success",
        tasks: [updated],
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }
}
