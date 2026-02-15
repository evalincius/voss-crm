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

import { listAllDealsForExport } from "@/features/deals/services/dealsService";
import { generateCsv } from "@/lib/csvExport";
import type { CsvColumn } from "@/lib/csvExport";
import type { DealCardData } from "@/features/deals/types";

describe("deals CSV export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all deals for export", async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: "d1",
          organization_id: "org-1",
          person_id: "p1",
          product_id: "prod-1",
          campaign_id: null,
          stage: "prospect",
          value: 500,
          currency: "USD",
          next_step_at: null,
          notes: "test",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          people: { full_name: "Alice" },
          products: { name: "Widget" },
        },
      ],
      error: null,
    });

    const result = await listAllDealsForExport("org-1");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.person_name).toBe("Alice");
    expect(result.data?.[0]?.value).toBe(500);
  });

  it("returns error on failure", async () => {
    mockQueryResult.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await listAllDealsForExport("org-1");
    expect(result.error).toBe("DB error");
    expect(result.data).toBeNull();
  });

  it("generates correct CSV from deal data", () => {
    const columns: CsvColumn<DealCardData>[] = [
      { header: "Person", accessor: (r) => r.person_name },
      { header: "Product", accessor: (r) => r.product_name },
      { header: "Stage", accessor: (r) => r.stage },
      { header: "Value", accessor: (r) => (r.value != null ? String(r.value) : "") },
    ];

    const deals: DealCardData[] = [
      {
        id: "d1",
        organization_id: "org-1",
        person_id: "p1",
        product_id: "prod-1",
        campaign_id: null,
        stage: "prospect",
        value: 1000,
        currency: "EUR",
        next_step_at: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        person_name: "Alice",
        product_name: "Widget",
      },
    ];

    const csv = generateCsv(columns, deals);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Person,Product,Stage,Value");
    expect(lines[1]).toBe("Alice,Widget,prospect,1000");
  });

  it("generates valid empty CSV", () => {
    const columns: CsvColumn<DealCardData>[] = [
      { header: "Person", accessor: (r) => r.person_name },
      { header: "Stage", accessor: (r) => r.stage },
    ];

    const csv = generateCsv(columns, []);
    expect(csv).toBe("Person,Stage");
  });
});
