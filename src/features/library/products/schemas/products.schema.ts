import { z } from "zod";

export const productArchiveFilterValues = ["active", "all", "archived"] as const;
export const productSortValues = ["updated_desc", "created_desc", "name_asc"] as const;

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  description: z.preprocess(emptyStringToNull, z.string().trim().max(2000).nullable()),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormSchema = z.infer<typeof productFormSchema>;

export const productFiltersSchema = z.object({
  search: z.string().default(""),
  archiveFilter: z.enum(productArchiveFilterValues).default("active"),
  sort: z.enum(productSortValues).default("updated_desc"),
});

export type ProductFiltersSchema = z.infer<typeof productFiltersSchema>;
