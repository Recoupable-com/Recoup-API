import supabase from "@/lib/supabase/serverClient";

/**
 * Removes an agent template from a user's favorites.
 *
 * @param templateId - The ID of the template to unfavorite
 * @param userId - The ID of the user removing the favorite
 * @returns An object with success: true
 * @throws Error if the database operation fails
 */
export async function removeAgentTemplateFavorite(
  templateId: string,
  userId: string,
): Promise<{ success: true }> {
  const { error } = await supabase
    .from("agent_template_favorites")
    .delete()
    .eq("template_id", templateId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return { success: true };
}
