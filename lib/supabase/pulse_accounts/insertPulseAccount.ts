import supabase from "../serverClient";
import type { Tables, TablesInsert } from "@/types/database.types";

/**
 * Inserts a new pulse account record.
 *
 * @param pulseAccount - The pulse account data to insert
 * @returns The inserted pulse account record, or null if failed
 */
export async function insertPulseAccount(
  pulseAccount: TablesInsert<"pulse_accounts">,
): Promise<Tables<"pulse_accounts"> | null> {
  const { data, error } = await supabase
    .from("pulse_accounts")
    .insert(pulseAccount)
    .select()
    .single();

  if (error) {
    console.error("[ERROR] insertPulseAccount:", error);
    return null;
  }

  return data;
}
