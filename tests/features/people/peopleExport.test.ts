import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryResult } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(() => builder),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(mockQueryResult()).then(resolve, reject),
      };
      return builder;
    }),
  },
}));

import { listAllPeopleForExport } from "@/features/people/services/peopleService";
import { generateCsv } from "@/lib/csvExport";
import type { CsvColumn } from "@/lib/csvExport";
import type { Person } from "@/features/people/types";

describe("people CSV export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all non-archived people for export", async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: "p1",
          organization_id: "org-1",
          full_name: "Alice",
          email: "alice@test.com",
          phone: null,
          lifecycle: "new",
          notes: null,
          is_archived: false,
          archived_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          created_by: "user-1",
        },
      ],
      error: null,
    });

    const result = await listAllPeopleForExport("org-1");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.full_name).toBe("Alice");
  });

  it("returns error on failure", async () => {
    mockQueryResult.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await listAllPeopleForExport("org-1");
    expect(result.error).toBe("DB error");
    expect(result.data).toBeNull();
  });

  it("generates correct CSV from people data", () => {
    const columns: CsvColumn<Person>[] = [
      { header: "Name", accessor: (r) => r.full_name },
      { header: "Email", accessor: (r) => r.email ?? "" },
      { header: "Lifecycle", accessor: (r) => r.lifecycle },
    ];

    const people = [
      {
        id: "p1",
        organization_id: "org-1",
        full_name: "Alice",
        email: "alice@test.com",
        phone: null,
        lifecycle: "new" as const,
        notes: null,
        is_archived: false,
        archived_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        created_by: "user-1",
      },
    ] satisfies Person[];

    const csv = generateCsv(columns, people);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Name,Email,Lifecycle");
    expect(lines[1]).toBe("Alice,alice@test.com,new");
  });

  it("generates valid empty CSV for empty dataset", () => {
    const columns: CsvColumn<Person>[] = [{ header: "Name", accessor: (r) => r.full_name }];

    const csv = generateCsv(columns, []);
    expect(csv).toBe("Name");
  });
});
