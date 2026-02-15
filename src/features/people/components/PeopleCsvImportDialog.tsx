import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseCsvText,
  runPeopleCsvImport,
  type CsvImportSummary,
  type ParsedCsv,
} from "@/features/people/services/peopleCsvImportService";
import {
  csvColumnMappingSchema,
  type CsvColumnMappingSchema,
} from "@/features/people/schemas/peopleCsv.schema";

const NONE_VALUE = "__none__";

interface PeopleCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
}

function defaultMappingFromHeaders(headers: string[]): CsvColumnMappingSchema {
  const lowerHeaders = headers.map((header) => header.toLowerCase());

  const match = (candidates: string[]) => {
    const idx = lowerHeaders.findIndex((header) => candidates.includes(header));
    return idx >= 0 ? headers[idx] : undefined;
  };

  return {
    full_name: match(["full_name", "name", "full name"]) ?? headers[0] ?? "",
    email: match(["email", "email_address"]),
    phone: match(["phone", "phone_number", "mobile"]),
    notes: match(["notes", "note"]),
    lifecycle: match(["lifecycle", "stage"]),
  };
}

function readField(row: Record<string, string>, column: string | undefined): string {
  if (!column) {
    return "";
  }

  return row[column] ?? "";
}

export function PeopleCsvImportDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
}: PeopleCsvImportDialogProps) {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<CsvColumnMappingSchema | null>(null);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewRows = useMemo(() => {
    if (!parsed || !mapping) {
      return [];
    }

    return parsed.rows.slice(0, 10).map((row, idx) => {
      const fullName = readField(row, mapping.full_name).trim();
      return {
        index: idx + 2,
        fullName,
        email: readField(row, mapping.email),
        phone: readField(row, mapping.phone),
        valid: fullName.length > 0,
      };
    });
  }, [mapping, parsed]);

  async function onFileSelected(file: File | null) {
    setError(null);
    setSummary(null);

    if (!file) {
      return;
    }

    const text = await file.text();
    const csv = parseCsvText(text);

    if (csv.headers.length === 0) {
      setError("CSV file is empty or unreadable.");
      setParsed(null);
      setMapping(null);
      return;
    }

    const initialMapping = defaultMappingFromHeaders(csv.headers);
    const parsedMapping = csvColumnMappingSchema.safeParse(initialMapping);

    if (!parsedMapping.success) {
      setError("Could not infer a valid mapping. Please include a name column.");
      setParsed(csv);
      setMapping(null);
      return;
    }

    setParsed(csv);
    setMapping(parsedMapping.data);
  }

  async function runImport() {
    if (!parsed || !mapping) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const validated = csvColumnMappingSchema.parse(mapping);
      const result = await runPeopleCsvImport({
        organizationId,
        userId,
        rows: parsed.rows,
        mapping: validated,
      });
      setSummary(result);
      toast.success("CSV import complete");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "CSV import failed");
    } finally {
      setBusy(false);
    }
  }

  const canImport = !!parsed && !!mapping && mapping.full_name.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import people from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV, map columns, preview rows, and run import with dedupe by email then phone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="people-csv-file">CSV file</Label>
            <input
              id="people-csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void onFileSelected(file);
              }}
              className="border-border-fintech bg-bg-surface rounded-md border px-3 py-2 text-base"
            />
          </div>

          {parsed && mapping ? (
            <div className="card-surface bg-bg-surface grid gap-3 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Select
                  value={mapping.full_name}
                  onValueChange={(value) => setMapping({ ...mapping, full_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsed.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(["email", "phone", "notes", "lifecycle"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label className="capitalize">{field}</Label>
                  <Select
                    value={mapping[field] ?? NONE_VALUE}
                    onValueChange={(value) =>
                      setMapping({
                        ...mapping,
                        [field]: value === NONE_VALUE ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not mapped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Not mapped</SelectItem>
                      {parsed.headers.map((header) => (
                        <SelectItem key={`${field}-${header}`} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : null}

          {previewRows.length > 0 ? (
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h4 className="text-text-primary text-base font-semibold">Preview (first 10 rows)</h4>
              <div className="space-y-2">
                {previewRows.map((row) => (
                  <div
                    key={row.index}
                    className="border-border-fintech flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <p className="text-text-secondary text-base">
                      Row {row.index}: {row.fullName || "(missing full name)"}
                    </p>
                    <span className={row.valid ? "text-sm text-green-500" : "text-sm text-red-500"}>
                      {row.valid ? "valid" : "invalid"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {summary ? (
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h4 className="text-text-primary text-base font-semibold">Import summary</h4>
              <p className="text-text-secondary text-base">
                Created: {summary.created} · Updated: {summary.updated} · Skipped: {summary.skipped}{" "}
                · Errors: {summary.errors}
              </p>
              {summary.rowErrors.length > 0 ? (
                <ul className="text-text-muted list-disc space-y-1 pl-5 text-sm">
                  {summary.rowErrors.slice(0, 10).map((rowError) => (
                    <li key={`${rowError.row}-${rowError.message}`}>
                      Row {rowError.row}: {rowError.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" disabled={!canImport || busy} onClick={() => void runImport()}>
              {busy ? "Importing..." : "Run import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
