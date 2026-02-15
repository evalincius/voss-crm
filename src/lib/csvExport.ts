/**
 * CSV export utility: generates RFC 4180 compliant CSV and triggers download.
 */

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string;
}

export function generateCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const headerLine = columns.map((col) => escapeCsvField(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvField(col.accessor(row))).join(","),
  );
  return [headerLine, ...dataLines].join("\r\n");
}

export function downloadCsv(csv: string, filename: string): void {
  // UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
