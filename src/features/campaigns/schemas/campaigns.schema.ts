import { z } from "zod";

export const campaignTypeValues = [
  "cold_outreach",
  "warm_outreach",
  "content",
  "paid_ads",
] as const;
export const campaignArchiveFilterValues = ["active", "all", "archived"] as const;
export const campaignSortValues = ["updated_desc", "created_desc", "name_asc"] as const;

export const campaignFormSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(160),
  type: z.enum(campaignTypeValues),
  productIds: z.array(z.string()).default([]),
  templateIds: z.array(z.string()).default([]),
});

export type CampaignFormInput = z.input<typeof campaignFormSchema>;
export type CampaignFormSchema = z.infer<typeof campaignFormSchema>;

export const campaignFiltersSchema = z.object({
  search: z.string().default(""),
  archiveFilter: z.enum(campaignArchiveFilterValues).default("active"),
  sort: z.enum(campaignSortValues).default("updated_desc"),
});

export type CampaignFiltersSchema = z.infer<typeof campaignFiltersSchema>;
