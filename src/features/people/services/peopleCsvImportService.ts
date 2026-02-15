import {
  createPerson,
  findPersonByEmail,
  findPersonByPhone,
  updatePersonFromImport,
} from "@/features/people/services/peopleService";
import {
  normalizeCsvLifecycle,
  type CsvColumnMappingSchema,
} from "@/features/people/schemas/peopleCsv.schema";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export interface CsvImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  rowErrors: Array<{ row: number; message: string }>;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, "").trim());
}

export function parseCsvText(text: string): ParsedCsv {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  if (!firstLine) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvLine(firstLine).map((header) => header.trim());
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};

    for (let idx = 0; idx < headers.length; idx += 1) {
      const header = headers[idx];
      if (!header) {
        continue;
      }

      row[header] = values[idx]?.trim() ?? "";
    }

    rows.push(row);
  }

  return { headers, rows };
}

function getMappedValue(
  row: Record<string, string>,
  mappingKey: keyof CsvColumnMappingSchema,
  mapping: CsvColumnMappingSchema,
): string {
  const sourceColumn = mapping[mappingKey];

  if (!sourceColumn) {
    return "";
  }

  return row[sourceColumn]?.trim() ?? "";
}

function isBlankRow(values: string[]): boolean {
  return values.every((value) => value.trim().length === 0);
}

export interface RunPeopleCsvImportInput {
  organizationId: string;
  userId: string;
  rows: Record<string, string>[];
  mapping: CsvColumnMappingSchema;
}

export async function runPeopleCsvImport({
  organizationId,
  userId,
  rows,
  mapping,
}: RunPeopleCsvImportInput): Promise<CsvImportSummary> {
  const summary: CsvImportSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    rowErrors: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row) {
      continue;
    }

    const fullName = getMappedValue(row, "full_name", mapping);
    const email = getMappedValue(row, "email", mapping);
    const phone = getMappedValue(row, "phone", mapping);
    const notes = getMappedValue(row, "notes", mapping);
    const lifecycle = normalizeCsvLifecycle(getMappedValue(row, "lifecycle", mapping));

    if (isBlankRow([fullName, email, phone, notes])) {
      summary.skipped += 1;
      continue;
    }

    if (fullName.length === 0) {
      summary.errors += 1;
      summary.rowErrors.push({ row: index + 2, message: "Missing required full_name" });
      continue;
    }

    try {
      let matchedId: string | null = null;

      if (email.length > 0) {
        const byEmail = await findPersonByEmail(organizationId, email);
        if (byEmail.error) {
          throw new Error(byEmail.error);
        }

        matchedId = byEmail.data?.id ?? null;
      }

      if (!matchedId && phone.length > 0) {
        const byPhone = await findPersonByPhone(organizationId, phone);
        if (byPhone.error) {
          throw new Error(byPhone.error);
        }

        matchedId = byPhone.data?.id ?? null;
      }

      if (matchedId) {
        const updated = await updatePersonFromImport(matchedId, {
          full_name: fullName,
          email: email.length > 0 ? email : null,
          phone: phone.length > 0 ? phone : null,
          notes: notes.length > 0 ? notes : null,
          lifecycle,
        });

        if (updated.error) {
          throw new Error(updated.error);
        }

        summary.updated += 1;
      } else {
        const created = await createPerson({
          organization_id: organizationId,
          full_name: fullName,
          email: email.length > 0 ? email : null,
          phone: phone.length > 0 ? phone : null,
          notes: notes.length > 0 ? notes : null,
          lifecycle,
          created_by: userId,
        });

        if (created.error) {
          throw new Error(created.error);
        }

        summary.created += 1;
      }
    } catch (error) {
      summary.errors += 1;
      summary.rowErrors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  return summary;
}
