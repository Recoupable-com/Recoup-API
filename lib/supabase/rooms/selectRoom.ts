import supabase from "../serverClient";
import type { Tables } from "@/types/database.types";

/**
 * Selects a room from the database.
 *
 * @param roomId - The ID of the room to select
 * @returns The room if found, null otherwise
 */
export default async function selectRoom(roomId: string): Promise<Tables<"rooms"> | null> {
  if (!roomId) {
    return null;
  }

  const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Error fetching room:", error);
    throw error;
  }

  return data;
}
