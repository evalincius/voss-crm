import type { Enums, Tables } from "@/lib/database.types";

export type Campaign = Tables<"campaigns">;
export type CampaignType = Enums<"campaign_type">;

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
