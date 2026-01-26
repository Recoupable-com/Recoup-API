import supabase from "../serverClient";
import type { Tables } from "@/types/database.types";

/**
 * Retrieves a pulse account record by account ID.
 *
 * @param accountId - The account ID to look up
 * @returns The pulse account record, or null if not found
 */
export async function selectPulseAccount(
  accountId: string,
): Promise<Tables<"pulse_accounts"> | null> {
  const { data, error } = await supabase
    .from("pulse_accounts")
    .select("*")
    .eq("account_id", accountId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - account doesn't have pulse enabled
      return null;
    }
    console.error("[ERROR] selectPulseAccount:", error);
    return null;
  }

  return data;
}
