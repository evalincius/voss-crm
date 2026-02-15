import type { Tables } from "@/lib/database.types";

export type Product = Tables<"products">;

export type ProductArchiveFilter = "active" | "all" | "archived";
export type ProductSort = "updated_desc" | "created_desc" | "name_asc";

export interface ProductListParams {
  organizationId: string;
  search: string;
  archiveFilter: ProductArchiveFilter;
  sort: ProductSort;
}

export interface CreateProductInput {
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  description: string | null;
}

export const dealStageValues = [
  "prospect",
  "offer_sent",
  "interested",
  "objection",
  "validated",
  "lost",
] as const;

export type DealStage = (typeof dealStageValues)[number];

export type ProductStageCounts = Record<DealStage, number>;

export interface LinkedTemplateSummary {
  id: string;
  title: string;
  category: string;
  status: string;
}

export interface ProductPerformanceSummary {
  stageCounts: ProductStageCounts;
  relatedCampaignCount: number;
  linkedTemplates: LinkedTemplateSummary[];
}
