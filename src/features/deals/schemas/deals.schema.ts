import { z } from "zod";
import { DEAL_STAGE_VALUES } from "@/lib/constants";

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

export const dealFormSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  product_id: z.string().min(1, "Product is required"),
  campaign_id: z.preprocess(emptyStringToNull, z.string().nullable().default(null)),
  value: z.preprocess(
    emptyStringToNullNumber,
    z.number().nonnegative("Value must be positive").nullable().default(null),
  ),
  currency: z.preprocess(emptyStringToNull, z.string().max(10).nullable().default(null)),
  next_step_at: z.preprocess(emptyStringToNull, z.string().nullable().default(null)),
  notes: z.preprocess(emptyStringToNull, z.string().max(2000).nullable().default(null)),
  stage: z.enum(DEAL_STAGE_VALUES).default("prospect"),
});

export type DealFormInput = z.input<typeof dealFormSchema>;
export type DealFormSchema = z.infer<typeof dealFormSchema>;
