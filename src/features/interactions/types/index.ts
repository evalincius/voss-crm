import type { Enums, Tables } from "@/lib/database.types";

export type Interaction = Tables<"interactions">;
export type InteractionType = Enums<"interaction_type">;
export type InteractionOrderBy = "created_desc" | "created_asc";

export interface PersonInteraction extends Interaction {
  deal_stage: Enums<"deal_stage"> | null;
  deal_product_name: string | null;
}

export interface CreateInteractionInput {
  organization_id: string;
  person_id: string;
  type: InteractionType;
  summary: string;
  next_step_at: string | null;
  occurred_at: string;
  deal_id: string | null;
  campaign_id: string | null;
  template_id: string | null;
  product_id: string | null;
  created_by: string;
}
