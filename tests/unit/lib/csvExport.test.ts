import { describe, expect, it, vi } from "vitest";
import { generateCsv, downloadCsv, type CsvColumn } from "@/lib/csvExport";

interface TestRow {
  name: string;
  email: string;
  notes: string;
}

const columns: CsvColumn<TestRow>[] = [
  { header: "Name", accessor: (r) => r.name },
  { header: "Email", accessor: (r) => r.email },
  { header: "Notes", accessor: (r) => r.notes },
];

describe("generateCsv", () => {
  it("generates header row with no data rows", () => {
    const csv = generateCsv(columns, []);
    expect(csv).toBe("Name,Email,Notes");
  });

  it("generates rows correctly", () => {
    const csv = generateCsv(columns, [
      { name: "Alice", email: "alice@example.com", notes: "VIP" },
      { name: "Bob", email: "bob@example.com", notes: "" },
    ]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("Name,Email,Notes");
    expect(lines[1]).toBe("Alice,alice@example.com,VIP");
    expect(lines[2]).toBe("Bob,bob@example.com,");
  });

  it("escapes fields containing commas", () => {
    const csv = generateCsv(columns, [{ name: "Doe, Jane", email: "jane@example.com", notes: "" }]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe('"Doe, Jane",jane@example.com,');
  });

  it("escapes fields containing double quotes", () => {
    const csv = generateCsv(columns, [
      { name: 'She said "hi"', email: "x@example.com", notes: "" },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe('"She said ""hi""",x@example.com,');
  });

  it("escapes fields containing newlines", () => {
    const csv = generateCsv(columns, [{ name: "Alice", email: "a@b.com", notes: "line1\nline2" }]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe('Alice,a@b.com,"line1\nline2"');
  });

  it("escapes header values if needed", () => {
    const cols: CsvColumn<TestRow>[] = [{ header: "Full, Name", accessor: (r) => r.name }];
    const csv = generateCsv(cols, []);
    expect(csv).toBe('"Full, Name"');
  });
});

describe("downloadCsv", () => {
  it("creates and clicks a download link", () => {
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.fn();
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      (el as HTMLAnchorElement).click = clickSpy;
      return el;
    });
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    downloadCsv("Name\r\nAlice", "test.csv");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
