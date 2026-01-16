import supabase from "@/lib/supabase/serverClient";
import type { Tables } from "@/types/database.types";

// DRY: Use database types instead of custom interfaces
export type AgentTemplateShare = Tables<"agent_template_shares">;

export type AgentTemplateShareWithTemplate = AgentTemplateShare & {
  templates: Tables<"agent_templates"> | null;
};

/**
 * Select agent template shares by template IDs and/or user ID
 *
 * @param params - The parameters for the query
 * @param params.templateIds - Optional array of template IDs to get shares for
 * @param params.userId - Optional user ID to filter shares by
 * @param params.includeTemplates - Optional flag to include joined agent_templates data
 * @returns Array of share records
 */
export default async function selectAgentTemplateShares({
  templateIds,
  userId,
  includeTemplates = false,
}: {
  templateIds?: string[];
  userId?: string;
  includeTemplates?: boolean;
}): Promise<AgentTemplateShare[] | AgentTemplateShareWithTemplate[]> {
  const hasTemplateIds = Array.isArray(templateIds) && templateIds.length > 0;
  const hasUserId = typeof userId === "string" && userId.length > 0;

  // If neither parameter is provided, return empty array
  if (!hasTemplateIds && !hasUserId) {
    return [];
  }

  // DRY: Use select('*') instead of explicit columns
  const selectFields = includeTemplates ? "*, templates:agent_templates(*)" : "*";
  let query = supabase.from("agent_template_shares").select(selectFields);

  if (hasTemplateIds) {
    query = query.in("template_id", templateIds);
  }

  if (hasUserId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}
