import supabase from "@/lib/supabase/serverClient";

interface TemplateFavorite {
  template_id: string;
}

/**
 * Select agent template favorites for a user
 *
 * @param params - The parameters for the query
 * @param params.userId - The user ID to get favorites for
 * @returns Set of favorite template IDs
 */
export default async function selectAgentTemplateFavorites({
  userId,
}: {
  userId?: string;
}): Promise<Set<string>> {
  const hasUserId = typeof userId === "string" && userId.length > 0;

  // If no userId is provided, return empty set
  if (!hasUserId) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("agent_template_favorites")
    .select("template_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Set<string>(
    (data || []).map((f: TemplateFavorite) => f.template_id)
  );
}
