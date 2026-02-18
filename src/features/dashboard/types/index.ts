export interface FollowUpItem {
  id: string;
  source: "deal" | "interaction";
  next_step_at: string;
  deal_id: string | null;
  deal_stage: string | null;
  deal_product_name: string | null;
  person_id: string;
  person_name: string;
  interaction_type: string | null;
  interaction_summary: string | null;
}

export type FollowUpsStatus = "all" | "overdue" | "today" | "upcoming" | "custom";

export interface FollowUpsQueryParams {
  horizonDays: number;
  page: number;
  pageSize: number;
  status: FollowUpsStatus;
  customStart: string | null;
  customEnd: string | null;
}

export interface PaginatedFollowUpsResult {
  items: FollowUpItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaleDeal {
  id: string;
  person_id: string;
  person_name: string;
  product_name: string;
  stage: string;
  value: number | null;
  currency: string | null;
  last_activity_at: string;
  days_stale: number;
}

export interface PipelineStageCount {
  stage: string;
  count: number;
  total_value: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  deal_count: number;
}

export interface TopCampaign {
  campaign_id: string;
  campaign_name: string;
  member_count: number;
}
