import supabase from "../serverClient";
import type { Tables } from "@/types/database.types";

/**
 * Account with account_socials and account_info relations.
 */
export type AccountWithSocials = Tables<"accounts"> & {
  account_socials: Tables<"account_socials">[];
  account_info: Tables<"account_info">[];
};

/**
 * Retrieves an account with its related socials and info.
 *
 * @param accountId - The account's ID (UUID)
 * @returns Account with socials and info arrays, or null if not found/error
 */
export async function selectAccountWithSocials(
  accountId: string,
): Promise<AccountWithSocials | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*, account_socials(*), account_info(*)")
    .eq("id", accountId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AccountWithSocials;
}
