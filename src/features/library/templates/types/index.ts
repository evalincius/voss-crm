import type { Enums, Tables } from "@/lib/database.types";

export type Template = Tables<"templates">;
export type TemplateCategory = Enums<"template_category">;
export type TemplateStatus = Enums<"template_status">;

export interface TemplateProductOption {
  id: string;
  name: string;
}

export type TemplateStatusFilter = "active" | "all" | "archived";
export type TemplateSort = "updated_desc" | "created_desc" | "title_asc";

export interface TemplateListParams {
  organizationId: string;
  search: string;
  statusFilter: TemplateStatusFilter;
  sort: TemplateSort;
  productId: string | null;
}

export interface CreateTemplateInput {
  organization_id: string;
  title: string;
  category: TemplateCategory;
  status: TemplateStatus;
  body: string;
  created_by: string;
}

export interface UpdateTemplateInput {
  id: string;
  title: string;
  category: TemplateCategory;
  status: TemplateStatus;
  body: string;
}

export interface SyncTemplateProductsInput {
  organizationId: string;
  templateId: string;
  productIds: string[];
  userId: string;
}

export interface TemplateUsedInSummary {
  interactionsCount: number;
  interactionsWithDealCount: number;
  campaignCount: number;
  dealsIndirectCount: number;
}
