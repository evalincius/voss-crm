import { z } from "zod";

export const templateCategoryValues = [
  "cold_email",
  "warm_outreach",
  "content",
  "paid_ads",
  "offer",
] as const;

export const templateStatusValues = ["draft", "approved", "archived"] as const;
export const templateStatusFilterValues = ["active", "all", "archived"] as const;
export const templateSortValues = ["updated_desc", "created_desc", "title_asc"] as const;

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const templateFormSchema = z.object({
  title: z.string().trim().min(1, "Template title is required").max(160),
  category: z.enum(templateCategoryValues),
  status: z.enum(templateStatusValues),
  body: z.string().trim().min(1, "Template body is required").max(15000),
  productIds: z.array(z.guid()).default([]),
});

export type TemplateFormInput = z.input<typeof templateFormSchema>;
export type TemplateFormSchema = z.infer<typeof templateFormSchema>;

export const templateFiltersSchema = z.object({
  search: z.string().default(""),
  statusFilter: z.enum(templateStatusFilterValues).default("active"),
  sort: z.enum(templateSortValues).default("updated_desc"),
  productId: z.preprocess(emptyStringToNull, z.guid().nullable()).default(null),
});

export type TemplateFiltersSchema = z.infer<typeof templateFiltersSchema>;
