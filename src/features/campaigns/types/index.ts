import type { Enums, Tables } from "@/lib/database.types";

export type Campaign = Tables<"campaigns">;
export type CampaignType = Enums<"campaign_type">;
export type PersonLifecycle = Enums<"person_lifecycle">;
export type DealStage = Enums<"deal_stage">;
export type InteractionType = Enums<"interaction_type">;

export type CampaignArchiveFilter = "active" | "all" | "archived";
export type CampaignSort = "updated_desc" | "created_desc" | "name_asc";

export interface CampaignListParams {
  organizationId: string;
  search: string;
  archiveFilter: CampaignArchiveFilter;
  typeFilter: CampaignType | "all";
  sort: CampaignSort;
}

export interface CreateCampaignInput {
  organization_id: string;
  name: string;
  type: CampaignType;
  created_by: string;
}

export interface UpdateCampaignInput {
  id: string;
  name: string;
  type: CampaignType;
}

export interface SyncCampaignProductsInput {
  organizationId: string;
  campaignId: string;
  productIds: string[];
  userId: string;
}

export interface SyncCampaignTemplatesInput {
  organizationId: string;
  campaignId: string;
  templateIds: string[];
  userId: string;
}

export interface AddPeopleToCampaignInput {
  organizationId: string;
  campaignId: string;
  personIds: string[];
  userId: string;
}

export interface RemovePersonFromCampaignInput {
  organizationId: string;
  campaignId: string;
  personId: string;
}

export interface CampaignMetrics {
  peopleAdded: number;
  peopleEngaged: number;
  dealsCreated: number;
}

export interface CampaignMemberSummary {
  id: string;
  person_id: string;
  full_name: string;
  email: string | null;
  lifecycle: string;
  created_at: string;
}

export interface CampaignMemberDealSummary {
  id: string;
  person_id: string;
  person_name: string;
  product_id: string;
  product_name: string;
  stage: DealStage;
  value: number | null;
  currency: string | null;
  next_step_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedProductSummary {
  id: string;
  name: string;
  is_archived: boolean;
}

export interface LinkedTemplateSummary {
  id: string;
  title: string;
  category: string;
  status: string;
}

export interface CampaignOption {
  id: string;
  name: string;
}

export interface PersonCampaignMembership {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_type: CampaignType;
  created_at: string;
}

export type CampaignConversionMode = "contact_only" | "contact_and_deal" | "deal_only";
export type BulkDuplicateStrategy = "create_all" | "skip_duplicates";

export interface ConvertCampaignLeadInput {
  organizationId: string;
  campaignId: string;
  mode: CampaignConversionMode;
  personId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lifecycle: PersonLifecycle;
  productId: string | null;
  value: number | null;
  currency: string | null;
  nextStepAt: string | null;
  dealNotes: string | null;
  interactionSummary: string | null;
  interactionType: InteractionType | null;
}

export interface CampaignLeadConversionResult {
  person_id: string;
  created_person: boolean;
  reused_existing_person: boolean;
  added_campaign_membership: boolean;
  deal_id: string | null;
  created_deal: boolean;
  had_open_duplicate: boolean;
  existing_duplicate_deal_id: string | null;
  interaction_id: string;
  interaction_type: InteractionType;
  conversion_mode: CampaignConversionMode;
}

export interface PreviewBulkCampaignDealDuplicatesInput {
  organizationId: string;
  campaignId: string;
  personIds: string[];
  productId: string;
}

export interface BulkCampaignDealDuplicatePreviewRow {
  person_id: string;
  full_name: string;
  duplicate_deal_id: string;
  duplicate_stage: DealStage;
  duplicate_created_at: string;
}

export interface BulkConvertCampaignMembersToDealsInput {
  organizationId: string;
  campaignId: string;
  personIds: string[];
  productId: string;
  duplicateStrategy: BulkDuplicateStrategy;
  value: number | null;
  currency: string | null;
  nextStepAt: string | null;
  dealNotes: string | null;
  interactionSummary: string | null;
  interactionType: InteractionType | null;
}

export interface BulkCampaignConversionResultRow {
  person_id: string;
  person_name: string | null;
  status: "created" | "skipped_duplicate" | "error";
  duplicate_deal_id: string | null;
  deal_id: string | null;
  interaction_id: string | null;
  error: string | null;
}

export interface BulkConvertCampaignMembersToDealsResult {
  total_requested: number;
  created_deals: number;
  skipped_duplicates: number;
  errors: number;
  results: BulkCampaignConversionResultRow[];
}
