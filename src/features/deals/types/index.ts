import type { Enums, Tables } from "@/lib/database.types";

export type Deal = Tables<"deals">;
export type DealStage = Enums<"deal_stage">;

export interface DealListParams {
  organizationId: string;
  productId: string | null;
  personSearch: string;
}

export interface CreateDealInput {
  organization_id: string;
  person_id: string;
  product_id: string;
  campaign_id: string | null;
  stage?: DealStage;
  value: number | null;
  currency: string | null;
  next_step_at: string | null;
  notes: string | null;
  created_by: string;
}

export interface UpdateDealInput {
  id: string;
  stage?: DealStage;
  value?: number | null;
  currency?: string | null;
  next_step_at?: string | null;
  notes?: string | null;
}

export interface DealCardData {
  id: string;
  organization_id: string;
  person_id: string;
  product_id: string;
  campaign_id: string | null;
  stage: DealStage;
  value: number | null;
  currency: string | null;
  next_step_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  person_name: string;
  product_name: string;
}

export interface DuplicateDealWarning {
  id: string;
  stage: DealStage;
  created_at: string;
}
