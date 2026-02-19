import { z } from "zod";
import {
  templateMarkdownImportRowSchema,
  templateMarkdownMetadataSchema,
} from "@/features/library/templates/schemas/templateMarkdownImport.schema";
import type {
  TemplateMarkdownImportRowInput,
  TemplateMarkdownLocalParseError,
  TemplateMarkdownParsedRow,
} from "@/features/library/templates/types";

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function unquoteScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const starts = trimmed[0];
    const ends = trimmed[trimmed.length - 1];
    if ((starts === '"' && ends === '"') || (starts === "'" && ends === "'")) {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

function splitInlineArray(value: string): string[] {
  const result: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let idx = 0; idx < value.length; idx += 1) {
    const char = value[idx];
    if (!char) {
      continue;
    }

    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
      current += char;
      continue;
    }

    if (quote && char === quote) {
      quote = null;
      current += char;
      continue;
    }

    if (char === "," && quote === null) {
      result.push(unquoteScalar(current));
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    result.push(unquoteScalar(current));
  }

  return result.filter((item) => item.trim().length > 0);
}

function canonicalKey(rawKey: string): string {
  const normalized = rawKey.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "linkedproductids" || normalized === "linked_product_id") {
    return "linked_product_ids";
  }
  if (normalized === "linkedproductnames" || normalized === "linked_product_name") {
    return "linked_product_names";
  }
  if (normalized === "product_ids") {
    return "linked_product_ids";
  }
  if (normalized === "product_names") {
    return "linked_product_names";
  }

  return normalized;
}

const deprecatedProductMetadataKeys = new Set(["linked_product_ids", "linked_product_names"]);

function parseRestrictedYaml(frontMatter: string): {
  data: Record<string, unknown>;
  errors: string[];
} {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];
  const lines = normalizeLineEndings(frontMatter).split("\n");

  let index = 0;
  while (index < lines.length) {
    const lineRaw = lines[index] ?? "";
    const line = lineRaw.trim();

    if (line.length === 0 || line.startsWith("#")) {
      index += 1;
      continue;
    }

    if (/^\s/.test(lineRaw)) {
      errors.push(`Line ${index + 1}: unexpected indentation`);
      index += 1;
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(lineRaw);
    if (!match) {
      errors.push(`Line ${index + 1}: expected key: value`);
      index += 1;
      continue;
    }

    const key = canonicalKey(match[1] ?? "");
    const remainder = (match[2] ?? "").trim();

    if (remainder.length > 0) {
      if (remainder.startsWith("[") && remainder.endsWith("]")) {
        const inline = remainder.slice(1, -1).trim();
        data[key] = inline.length === 0 ? [] : splitInlineArray(inline);
      } else {
        data[key] = unquoteScalar(remainder);
      }
      index += 1;
      continue;
    }

    const listValues: string[] = [];
    let cursor = index + 1;

    while (cursor < lines.length) {
      const listLineRaw = lines[cursor] ?? "";
      const listLine = listLineRaw.trim();

      if (listLine.length === 0) {
        cursor += 1;
        continue;
      }

      if (!listLineRaw.startsWith("  ")) {
        break;
      }

      if (!listLine.startsWith("- ")) {
        errors.push(`Line ${cursor + 1}: expected list item with '- '`);
        cursor += 1;
        continue;
      }

      const item = unquoteScalar(listLine.slice(2));
      if (item.length === 0) {
        errors.push(`Line ${cursor + 1}: list item cannot be empty`);
      } else {
        listValues.push(item);
      }

      cursor += 1;
    }

    data[key] = listValues;
    index = cursor;
  }

  return { data, errors };
}

function extractFrontMatter(
  content: string,
): { metadata: string; body: string } | { error: string } {
  const normalized = normalizeLineEndings(content);
  if (!normalized.startsWith("---\n")) {
    return { error: "Missing YAML front matter opening delimiter (---)." };
  }

  const lines = normalized.split("\n");
  let closingIndex = -1;

  for (let idx = 1; idx < lines.length; idx += 1) {
    if ((lines[idx] ?? "").trim() === "---") {
      closingIndex = idx;
      break;
    }
  }

  if (closingIndex < 0) {
    return { error: "Missing YAML front matter closing delimiter (---)." };
  }

  const metadata = lines.slice(1, closingIndex).join("\n");
  const body = lines.slice(closingIndex + 1).join("\n");

  return { metadata, body };
}

function buildSourceId(file: File, rowIndex: number): string {
  return `${file.name}:${file.size}:${file.lastModified}:${rowIndex}`;
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
}

function formatZodTreeError(error: z.ZodError): string[] {
  const tree = z.treeifyError(error) as {
    errors: string[];
    properties?: Record<string, { errors: string[] }>;
  };
  const messages: string[] = [];

  if (tree.errors.length > 0) {
    messages.push(...tree.errors);
  }

  if (tree.properties) {
    for (const [key, child] of Object.entries(tree.properties)) {
      if (child.errors.length === 0) {
        continue;
      }

      messages.push(...child.errors.map((entry) => `${key}: ${entry}`));
    }
  }

  if (messages.length > 0) {
    return messages;
  }

  return error.issues.map((issue) => issue.message);
}

function normalizeMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const canonical = canonicalKey(key);
    normalized[canonical] = value;
  }

  const category = normalized.category;
  if (typeof category === "string") {
    normalized.category = category.trim().toLowerCase();
  }

  const status = normalized.status;
  if (typeof status === "string") {
    normalized.status = status.trim().toLowerCase();
  }

  return normalized;
}

export async function parseTemplateMarkdownFile(
  file: File,
  rowIndex: number,
): Promise<TemplateMarkdownParsedRow> {
  const sourceId = buildSourceId(file, rowIndex);
  const fileName = file.name;

  let content = "";
  try {
    content = await readFileAsText(file);
  } catch {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: ["Could not read file contents."],
      },
    };
  }

  if (content.trim().length === 0) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: ["Markdown file is empty."],
      },
    };
  }

  const frontMatter = extractFrontMatter(content);
  if ("error" in frontMatter) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: [frontMatter.error],
      },
    };
  }

  const parsedYaml = parseRestrictedYaml(frontMatter.metadata);
  if (parsedYaml.errors.length > 0) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: parsedYaml.errors,
      },
    };
  }

  const normalizedMetadata = normalizeMetadata(parsedYaml.data);
  const deprecatedMetadataInFile = Array.from(deprecatedProductMetadataKeys).filter(
    (key) => key in normalizedMetadata,
  );

  if (deprecatedMetadataInFile.length > 0) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: [
          `Deprecated metadata keys are not allowed: ${deprecatedMetadataInFile.join(", ")}. Select a product in the import dialog instead.`,
        ],
      },
    };
  }

  const metadataResult = templateMarkdownMetadataSchema.safeParse(normalizedMetadata);

  if (!metadataResult.success) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: formatZodTreeError(metadataResult.error),
      },
    };
  }

  const trimmedBody = frontMatter.body;
  const rowResult = templateMarkdownImportRowSchema.safeParse({
    sourceId,
    fileName,
    rowIndex,
    title: metadataResult.data.title,
    category: metadataResult.data.category,
    status: metadataResult.data.status,
    body: trimmedBody,
  });

  if (!rowResult.success) {
    return {
      ok: false,
      error: {
        sourceId,
        fileName,
        rowIndex,
        messages: formatZodTreeError(rowResult.error),
      },
    };
  }

  return { ok: true, row: rowResult.data };
}

export async function parseTemplateMarkdownFiles(
  files: File[],
  startRowIndex = 1,
): Promise<{ rows: TemplateMarkdownImportRowInput[]; errors: TemplateMarkdownLocalParseError[] }> {
  const rows: TemplateMarkdownImportRowInput[] = [];
  const errors: TemplateMarkdownLocalParseError[] = [];

  for (let idx = 0; idx < files.length; idx += 1) {
    const file = files[idx];
    if (!file) {
      continue;
    }

    const rowIndex = startRowIndex + idx;
    const parsed = await parseTemplateMarkdownFile(file, rowIndex);

    if (parsed.ok) {
      rows.push(parsed.row);
    } else {
      errors.push(parsed.error);
    }
  }

  return { rows, errors };
}
