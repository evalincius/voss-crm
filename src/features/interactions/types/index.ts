import type { Enums, Tables } from "@/lib/database.types";

export type Interaction = Tables<"interactions">;
export type InteractionType = Enums<"interaction_type">;
export type InteractionOrderBy = "created_desc" | "created_asc";

export interface PersonInteraction extends Interaction {
  deal_stage: Enums<"deal_stage"> | null;
  deal_product_name: string | null;
}

export interface InteractionDealOption {
  id: string;
  label: string;
  product_id: string;
  campaign_id: string | null;
}

export interface InteractionCampaignOption {
  id: string;
  name: string;
  product_id: string | null;
}

export interface InteractionProductOption {
  id: string;
  name: string;
}

export interface InteractionTemplateOption {
  id: string;
  title: string;
}

export interface InteractionAssociationOptions {
  deals: InteractionDealOption[];
  campaigns: InteractionCampaignOption[];
  products: InteractionProductOption[];
  templates: InteractionTemplateOption[];
}

export interface InteractionDealContext {
  deal_id: string;
  product_id: string;
  campaign_id: string | null;
  deal_label: string;
  product_name: string;
  campaign_name: string | null;
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
