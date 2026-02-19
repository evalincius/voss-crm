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

export interface TemplateMarkdownImportRowInput {
  rowIndex: number;
  sourceId: string;
  fileName: string;
  title: string;
  category: TemplateCategory;
  status: TemplateStatus;
  body: string;
}

export interface TemplateMarkdownMetadata {
  title: string;
  category: TemplateCategory;
  status: TemplateStatus;
}

export interface TemplateMarkdownLocalParseError {
  sourceId: string;
  fileName: string;
  rowIndex: number;
  messages: string[];
}

export type TemplateMarkdownParsedRow =
  | { ok: true; row: TemplateMarkdownImportRowInput }
  | { ok: false; error: TemplateMarkdownLocalParseError };

export interface PreviewTemplateMarkdownImportInput {
  organizationId: string;
  productId: string;
  rows: TemplateMarkdownImportRowInput[];
}

export type TemplateMarkdownDryRunAction = "create" | "error";

export interface TemplateMarkdownImportPreviewRow {
  row_index: number;
  source_id: string | null;
  file_name: string;
  title: string;
  category: string;
  status: string;
  action: TemplateMarkdownDryRunAction;
  template_id: string | null;
  resolved_product_ids: string[];
  messages: string[];
}

export interface TemplateMarkdownImportPreviewResult {
  total_requested: number;
  valid_rows: number;
  errors: number;
  create_count: number;
  rows: TemplateMarkdownImportPreviewRow[];
}

export type TemplateMarkdownCommitMode = "partial" | "abort_all";
export type TemplateMarkdownCommitRowAction = "created" | "error" | "aborted";

export interface CommitTemplateMarkdownImportInput {
  organizationId: string;
  productId: string;
  rows: TemplateMarkdownImportRowInput[];
  commitMode: TemplateMarkdownCommitMode;
}

export interface TemplateMarkdownImportCommitRow {
  row_index: number;
  source_id: string | null;
  file_name: string;
  title: string;
  dry_run_action: TemplateMarkdownDryRunAction;
  action: TemplateMarkdownCommitRowAction;
  template_id: string | null;
  messages: string[];
}

export interface TemplateMarkdownImportCommitResult {
  mode: TemplateMarkdownCommitMode;
  applied: boolean;
  total_requested: number;
  created: number;
  failed: number;
  aborted: number;
  rows: TemplateMarkdownImportCommitRow[];
}
