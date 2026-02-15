import { z } from "zod";

export const interactionTypeValues = [
  "email",
  "call",
  "dm",
  "meeting",
  "note",
  "form_submission",
  "other",
] as const;

export const interactionTypeSchema = z.enum(interactionTypeValues);

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const optionalGuidSchema = z.preprocess(emptyStringToNull, z.guid().nullable());

export const interactionFormSchema = z.object({
  person_id: z.guid(),
  type: interactionTypeSchema,
  summary: z.string().trim().min(1, "Summary is required").max(1000),
  next_step_at: z.preprocess(emptyStringToNull, z.string().nullable()),
  occurred_at: z.preprocess(emptyStringToNull, z.string().nullable()),
  deal_id: optionalGuidSchema,
  campaign_id: optionalGuidSchema,
  template_id: optionalGuidSchema,
  product_id: optionalGuidSchema,
});

export type InteractionFormInput = z.input<typeof interactionFormSchema>;
export type InteractionFormSchema = z.infer<typeof interactionFormSchema>;
