import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreatePerson,
  mockFindPersonByEmail,
  mockFindPersonByPhone,
  mockUpdatePersonFromImport,
} = vi.hoisted(() => ({
  mockCreatePerson: vi.fn(),
  mockFindPersonByEmail: vi.fn(),
  mockFindPersonByPhone: vi.fn(),
  mockUpdatePersonFromImport: vi.fn(),
}));

vi.mock("@/features/people/services/peopleService", () => ({
  createPerson: mockCreatePerson,
  findPersonByEmail: mockFindPersonByEmail,
  findPersonByPhone: mockFindPersonByPhone,
  updatePersonFromImport: mockUpdatePersonFromImport,
}));

import {
  parseCsvText,
  runPeopleCsvImport,
} from "@/features/people/services/peopleCsvImportService";

describe("parseCsvText", () => {
  it("parses headers and rows", () => {
    const parsed = parseCsvText("full_name,email\nAlice,alice@example.com\nBob,bob@example.com\n");

    expect(parsed.headers).toEqual(["full_name", "email"]);
    expect(parsed.rows).toEqual([
      { full_name: "Alice", email: "alice@example.com" },
      { full_name: "Bob", email: "bob@example.com" },
    ]);
  });
});

describe("runPeopleCsvImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies dedupe order email -> phone -> create and reports summary", async () => {
    mockFindPersonByEmail.mockResolvedValueOnce({ data: { id: "person-1" }, error: null });
    mockFindPersonByEmail.mockResolvedValueOnce({ data: null, error: null });
    mockFindPersonByPhone.mockResolvedValueOnce({ data: { id: "person-2" }, error: null });
    mockFindPersonByEmail.mockResolvedValueOnce({ data: null, error: null });
    mockFindPersonByPhone.mockResolvedValueOnce({ data: null, error: null });

    mockUpdatePersonFromImport.mockResolvedValue({ data: { id: "person-1" }, error: null });
    mockCreatePerson.mockResolvedValue({ data: { id: "person-3" }, error: null });

    const summary = await runPeopleCsvImport({
      organizationId: "org-1",
      userId: "user-1",
      mapping: {
        full_name: "name",
        email: "email",
        phone: "phone",
      },
      rows: [
        { name: "Alice", email: "alice@example.com", phone: "" },
        { name: "Bob", email: "", phone: "+100" },
        { name: "Carol", email: "", phone: "" },
        { name: "", email: "", phone: "" },
      ],
    });

    expect(summary).toEqual({
      created: 1,
      updated: 2,
      skipped: 1,
      errors: 0,
      rowErrors: [],
    });
    expect(mockCreatePerson).toHaveBeenCalledTimes(1);
    expect(mockUpdatePersonFromImport).toHaveBeenCalledTimes(2);
  });

  it("captures row-level errors", async () => {
    mockFindPersonByEmail.mockResolvedValue({ data: null, error: null });
    mockFindPersonByPhone.mockResolvedValue({ data: null, error: null });
    mockCreatePerson.mockResolvedValue({ data: null, error: "insert failed" });

    const summary = await runPeopleCsvImport({
      organizationId: "org-1",
      userId: "user-1",
      mapping: {
        full_name: "name",
      },
      rows: [{ name: "Alice" }],
    });

    expect(summary.errors).toBe(1);
    expect(summary.rowErrors[0]?.message).toContain("insert failed");
  });
});
