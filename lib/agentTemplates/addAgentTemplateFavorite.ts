import supabase from "@/lib/supabase/serverClient";

/**
 * Adds an agent template to a user's favorites.
 *
 * @param templateId - The ID of the template to favorite
 * @param userId - The ID of the user adding the favorite
 * @returns An object with success: true
 * @throws Error if the database operation fails (except for duplicate entries)
 */
export async function addAgentTemplateFavorite(
  templateId: string,
  userId: string,
): Promise<{ success: true }> {
  const { error } = await supabase
    .from("agent_template_favorites")
    .insert({ template_id: templateId, user_id: userId })
    .select("template_id")
    .maybeSingle();

  // Ignore unique violation (23505) - user already favorited this template
  if (error && error.code !== "23505") {
    throw error;
  }

  return { success: true };
}
