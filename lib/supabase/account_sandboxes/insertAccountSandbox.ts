import supabase from "../serverClient";
import type { Database } from "@/types/database.types";

/**
 * Inserts an account sandbox record into the database.
 *
 * @param input - The input object containing account_id and sandbox_id
 * @param input.account_id - The account UUID
 * @param input.sandbox_id - The sandbox identifier from Vercel
 * @returns The inserted account sandbox record or error
 */
export async function insertAccountSandbox({
  account_id,
  sandbox_id,
}: Database["public"]["Tables"]["account_sandboxes"]["Insert"]) {
  const { data, error } = await supabase
    .from("account_sandboxes")
    .insert({
      account_id,
      sandbox_id,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  return { data, error: null };
}
