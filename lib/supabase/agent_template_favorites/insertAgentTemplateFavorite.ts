import supabase from "@/lib/supabase/serverClient";
import type { Tables } from "@/types/database.types";

// DRY: Use database types instead of custom interfaces
export type AgentTemplateFavorite = Tables<"agent_template_favorites">;

/**
 * Insert an agent template favorite for a user
 *
 * @param params - The parameters for the insert
 * @param params.templateId - The ID of the template to favorite
 * @param params.userId - The ID of the user adding the favorite
 * @returns The inserted record, or null if it already exists
 * @throws Error if the database operation fails (except for duplicate entries)
 */
export default async function insertAgentTemplateFavorite({
  templateId,
  userId,
}: {
  templateId: string;
  userId: string;
}): Promise<AgentTemplateFavorite | null> {
  // DRY: Use select('*') instead of explicit columns
  const { data, error } = await supabase
    .from("agent_template_favorites")
    .insert({ template_id: templateId, user_id: userId })
    .select("*")
    .maybeSingle();

  // Ignore unique violation (23505) - user already favorited this template
  if (error && error.code !== "23505") {
    throw error;
  }

  // Return the inserted record, or null if it was a duplicate
  return data;
}
