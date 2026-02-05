import supabase from "../serverClient";
import type { Tables, TablesUpdate } from "@/types/database.types";
import type { PostgrestError } from "@supabase/supabase-js";

interface UpdateAccountSnapshotResult {
  data: Tables<"account_snapshots"> | null;
  error: PostgrestError | null;
}

/**
 * Updates an existing account snapshot record.
 * Use this for partial updates (e.g. setting github_repo without changing snapshot_id).
 *
 * @param accountId - The account ID to update
 * @param params - The fields to update
 * @returns The updated record or error
 */
export async function updateAccountSnapshot(
  accountId: string,
  params: TablesUpdate<"account_snapshots">,
): Promise<UpdateAccountSnapshotResult> {
  const { data, error } = await supabase
    .from("account_snapshots")
    .update(params)
    .eq("account_id", accountId)
    .select("*")
    .single();

  return { data, error };
}
