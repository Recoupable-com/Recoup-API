import supabase from "../serverClient";
import type { Tables, TablesUpdate } from "@/types/database.types";

/**
 * Updates a pulse account record by account ID.
 *
 * @param accountId - The account ID
 * @param updates - Partial pulse account data to update
 * @returns The updated pulse account record, or null if failed
 */
export async function updatePulseAccount(
  accountId: string,
  updates: TablesUpdate<"pulse_accounts">,
): Promise<Tables<"pulse_accounts"> | null> {
  const { data, error } = await supabase
    .from("pulse_accounts")
    .update(updates)
    .eq("account_id", accountId)
    .select("*")
    .single();

  if (error) {
    console.error("[ERROR] updatePulseAccount:", error);
    return null;
  }

  return data || null;
}
