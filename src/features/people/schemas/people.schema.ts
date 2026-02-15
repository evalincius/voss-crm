import { z } from "zod";

export const personLifecycleValues = ["new", "contacted", "engaged", "customer"] as const;

export const personLifecycleSchema = z.enum(personLifecycleValues);

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const personFormSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  email: z.preprocess(emptyStringToNull, z.email("Enter a valid email").nullable()),
  phone: z.preprocess(emptyStringToNull, z.string().trim().max(50).nullable()),
  notes: z.preprocess(emptyStringToNull, z.string().trim().max(2000).nullable()),
  lifecycle: personLifecycleSchema,
});

export type PersonFormInput = z.input<typeof personFormSchema>;
export type PersonFormSchema = z.infer<typeof personFormSchema>;

export const peopleSortValues = ["updated_desc", "created_desc", "name_asc"] as const;
export const peopleArchiveFilterValues = ["active", "all", "archived"] as const;

export const peopleFiltersSchema = z.object({
  search: z.string().default(""),
  lifecycle: z.enum(["all", ...personLifecycleValues]).default("all"),
  archiveFilter: z.enum(peopleArchiveFilterValues).default("active"),
  sort: z.enum(peopleSortValues).default("updated_desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PeopleFiltersSchema = z.infer<typeof peopleFiltersSchema>;
