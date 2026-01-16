import supabase from "@/lib/supabase/serverClient";
import type { Tables } from "@/types/database.types";

// DRY: Use database types instead of custom interfaces
export type AgentTemplate = Tables<"agent_templates">;

/**
 * Select agent templates based on user access.
 * - With userId: Returns templates owned by the user OR public templates
 * - Without userId: Returns only public templates
 *
 * @param params - The parameters for the query
 * @param params.userId - Optional user ID to filter templates for
 * @returns Array of agent template records ordered by title
 */
export default async function selectAgentTemplates({
  userId,
}: {
  userId?: string | null;
}): Promise<AgentTemplate[]> {
  const hasValidUserId =
    typeof userId === "string" && userId.length > 0 && userId !== "undefined";

  if (hasValidUserId) {
    // Return templates owned by user OR public templates
    const { data, error } = await supabase
      .from("agent_templates")
      .select("*")
      .or(`creator.eq.${userId},is_private.eq.false`)
      .order("title");

    if (error) throw error;
    return data ?? [];
  }

  // Return only public templates for anonymous users
  const { data, error } = await supabase
    .from("agent_templates")
    .select("*")
    .eq("is_private", false)
    .order("title");

  if (error) throw error;
  return data ?? [];
}
