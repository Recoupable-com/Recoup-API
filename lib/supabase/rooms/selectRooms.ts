import supabase from "../serverClient";
import type { Tables } from "@/types/database.types";

type Room = Tables<"rooms">;

interface SelectRoomsParams {
  accountId?: string;
  artistId?: string;
}

/**
 * Selects rooms with optional filters.
 *
 * @param params - Optional filter parameters
 * @param params.accountId - Filter by account ID
 * @param params.artistId - Filter by artist ID
 * @returns Array of rooms or null if error
 */
export async function selectRooms(params: SelectRoomsParams = {}): Promise<Room[] | null> {
  const { accountId, artistId } = params;

  let query = supabase.from("rooms").select("*");

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  if (artistId) {
    query = query.eq("artist_id", artistId);
  }

  query = query.order("updated_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[ERROR] selectRooms:", error);
    return null;
  }

  return data || [];
}
