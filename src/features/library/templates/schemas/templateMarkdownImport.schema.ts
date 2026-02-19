import { z } from "zod";
import { templateCategoryValues, templateStatusValues } from "./templates.schema";

export const templateMarkdownMetadataSchema = z.object({
  title: z.string().trim().min(1, "Template title is required").max(160),
  category: z.enum(templateCategoryValues),
  status: z.enum(templateStatusValues).default("draft"),
});

export type TemplateMarkdownMetadata = z.infer<typeof templateMarkdownMetadataSchema>;

export const templateMarkdownImportRowSchema = z.object({
  rowIndex: z.number().int().positive(),
  sourceId: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160),
  category: z.enum(templateCategoryValues),
  status: z.enum(templateStatusValues).default("draft"),
  body: z
    .string()
    .max(15000)
    .refine((value) => value.trim().length > 0, "Template body is required"),
});

export type TemplateMarkdownImportRowSchema = z.infer<typeof templateMarkdownImportRowSchema>;

export const templateMarkdownImportCommitModeValues = ["partial", "abort_all"] as const;
export const templateMarkdownImportCommitModeSchema = z.enum(
  templateMarkdownImportCommitModeValues,
);

export type TemplateMarkdownImportCommitModeSchema = z.infer<
  typeof templateMarkdownImportCommitModeSchema
>;
