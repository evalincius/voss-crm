import { z } from "zod";

export const campaignTypeValues = [
  "cold_outreach",
  "warm_outreach",
  "content",
  "paid_ads",
] as const;
export const campaignArchiveFilterValues = ["active", "all", "archived"] as const;
export const campaignSortValues = ["updated_desc", "created_desc", "name_asc"] as const;
export const campaignConversionModeValues = [
  "contact_only",
  "contact_and_deal",
  "deal_only",
] as const;
export const bulkDuplicateStrategyValues = ["create_all", "skip_duplicates"] as const;
export const campaignConversionLifecycleValues = [
  "new",
  "contacted",
  "engaged",
  "customer",
] as const;
export const campaignConversionInteractionTypeValues = [
  "email",
  "call",
  "dm",
  "meeting",
  "note",
  "form_submission",
  "other",
] as const;

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function emptyStringToNullNumber(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? trimmed : parsed;
}

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

export const campaignLeadConversionSchema = z
  .object({
    mode: z.enum(campaignConversionModeValues),
    personId: z.preprocess(emptyStringToNull, z.guid().nullable().default(null)),
    fullName: z.preprocess(emptyStringToNull, z.string().max(200).nullable().default(null)),
    email: z.preprocess(emptyStringToNull, z.email("Enter a valid email").nullable().default(null)),
    phone: z.preprocess(emptyStringToNull, z.string().max(80).nullable().default(null)),
    notes: z.preprocess(emptyStringToNull, z.string().max(2000).nullable().default(null)),
    lifecycle: z.enum(campaignConversionLifecycleValues).default("new"),
    productId: z.preprocess(emptyStringToNull, z.guid().nullable().default(null)),
    value: z.preprocess(
      emptyStringToNullNumber,
      z.number().nonnegative("Value must be positive").nullable().default(null),
    ),
    currency: z.preprocess(emptyStringToNull, z.string().max(10).nullable().default(null)),
    nextStepAt: z.preprocess(emptyStringToNull, z.string().nullable().default(null)),
    dealNotes: z.preprocess(emptyStringToNull, z.string().max(2000).nullable().default(null)),
    interactionSummary: z.preprocess(
      emptyStringToNull,
      z.string().max(1000).nullable().default(null),
    ),
    interactionType: z.preprocess(
      emptyStringToNull,
      z.enum(campaignConversionInteractionTypeValues).nullable().default(null),
    ),
  })
  .superRefine((value, context) => {
    const isDealMode = value.mode === "contact_and_deal" || value.mode === "deal_only";
    const isNewLead = !value.personId;

    if (isNewLead && !value.fullName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "Full name is required for new leads",
      });
    }

    if (value.mode === "deal_only" && !value.personId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personId"],
        message: "Existing person is required for deal-only conversion",
      });
    }

    if (isDealMode && !value.productId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Product is required when creating a deal",
      });
    }
  });

export type CampaignLeadConversionInput = z.input<typeof campaignLeadConversionSchema>;
export type CampaignLeadConversionSchema = z.infer<typeof campaignLeadConversionSchema>;

export const campaignBulkConversionSchema = z.object({
  personIds: z.array(z.guid()).min(1, "Select at least one member"),
  productId: z.guid("Product is required"),
  duplicateStrategy: z.enum(bulkDuplicateStrategyValues).default("create_all"),
  value: z.preprocess(
    emptyStringToNullNumber,
    z.number().nonnegative("Value must be positive").nullable().default(null),
  ),
  currency: z.preprocess(emptyStringToNull, z.string().max(10).nullable().default(null)),
  nextStepAt: z.preprocess(emptyStringToNull, z.string().nullable().default(null)),
  dealNotes: z.preprocess(emptyStringToNull, z.string().max(2000).nullable().default(null)),
  interactionSummary: z.preprocess(
    emptyStringToNull,
    z.string().max(1000).nullable().default(null),
  ),
  interactionType: z.preprocess(
    emptyStringToNull,
    z.enum(campaignConversionInteractionTypeValues).nullable().default(null),
  ),
});

export type CampaignBulkConversionInput = z.input<typeof campaignBulkConversionSchema>;
export type CampaignBulkConversionSchema = z.infer<typeof campaignBulkConversionSchema>;
