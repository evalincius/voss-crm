import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  CreateInteractionInput,
  Interaction,
  InteractionOrderBy,
} from "@/features/interactions/types";

export async function listInteractionsByPerson(
  organizationId: string,
  personId: string,
  orderBy: InteractionOrderBy,
): Promise<ApiResult<Interaction[]>> {
  const isAscending = orderBy === "created_asc";

  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("created_at", { ascending: isAscending });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<ApiResult<Interaction>> {
  const { data, error } = await supabase.from("interactions").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function deleteInteraction(
  interactionId: string,
  organizationId: string,
  personId: string,
): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("interactions")
    .delete()
    .eq("id", interactionId)
    .eq("organization_id", organizationId)
    .eq("person_id", personId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
