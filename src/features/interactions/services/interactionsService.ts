import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  CreateInteractionInput,
  Interaction,
  InteractionOrderBy,
  PersonInteraction,
} from "@/features/interactions/types";

export async function listInteractionsByPerson(
  organizationId: string,
  personId: string,
  orderBy: InteractionOrderBy,
): Promise<ApiResult<PersonInteraction[]>> {
  const isAscending = orderBy === "created_asc";

  const { data, error } = await supabase
    .from("interactions")
    .select("*, deals:deals!interactions_deals_fk(stage, products:products!deals_product_fk(name))")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("created_at", { ascending: isAscending });

  if (error) {
    return { data: null, error: error.message };
  }

  const interactions: PersonInteraction[] = (data ?? []).map((row) => {
    const deal = (row as { deals?: unknown }).deals as
      | {
          stage: PersonInteraction["deal_stage"];
          products?: { name: string } | null;
        }
      | null
      | undefined;

    const interaction = row as Interaction;

    return {
      ...interaction,
      deal_stage: deal?.stage ?? null,
      deal_product_name: deal?.products?.name ?? null,
    };
  });

  return { data: interactions, error: null };
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
