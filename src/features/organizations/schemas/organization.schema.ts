import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional()
    .or(z.literal("")),
});

export type CreateOrgSchema = z.infer<typeof createOrgSchema>;
