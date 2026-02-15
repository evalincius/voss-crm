import { z } from "zod";
import { personLifecycleSchema } from "@/features/people/schemas/people.schema";

export const csvColumnMappingSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  lifecycle: z.string().min(1).optional(),
});

export type CsvColumnMappingSchema = z.infer<typeof csvColumnMappingSchema>;

export function normalizeCsvLifecycle(value: string | null | undefined) {
  if (!value) {
    return "new" as const;
  }

  const normalized = value.trim().toLowerCase();
  const result = personLifecycleSchema.safeParse(normalized);
  return result.success ? result.data : ("new" as const);
}
