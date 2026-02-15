import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryResult, mockRange } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
  mockRange: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => {
      const rangeBuilder = {
        select: vi.fn((): unknown => rangeBuilder),
        eq: vi.fn(() => rangeBuilder),
        or: vi.fn(() => rangeBuilder),
        ilike: vi.fn(() => rangeBuilder),
        order: vi.fn(() => rangeBuilder),
        neq: vi.fn(() => rangeBuilder),
        in: vi.fn(() => rangeBuilder),
        range: mockRange,
      };

      const builder = {
        select: vi.fn((_sel: string, opts?: { count?: string }) => {
          if (opts?.count) return rangeBuilder;
          return builder;
        }),
        eq: vi.fn(() => builder),
        or: vi.fn(() => builder),
        ilike: vi.fn(() => builder),
        order: vi.fn(() => builder),
        neq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        range: mockRange,
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(mockQueryResult()).then(resolve, reject),
      };

      return builder;
    }),
  },
}));

import { listPeople } from "@/features/people/services/peopleService";

const baseParams = {
  organizationId: "org-1",
  search: "",
  lifecycle: "all" as const,
  archiveFilter: "active" as const,
  sort: "updated_desc" as const,
  page: 1,
  pageSize: 20,
  productInterest: null as string | null,
  sourceCampaign: null as string | null,
  hasOpenDeal: null as boolean | null,
};

describe("people derived filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all people when no derived filters are set", async () => {
    mockRange.mockResolvedValue({
      data: [{ id: "p1", full_name: "Alice" }],
      count: 1,
      error: null,
    });

    const result = await listPeople(baseParams);

    expect(result.error).toBeNull();
    expect(result.data?.items).toHaveLength(1);
  });

  it("filters by productInterest using deals lookup", async () => {
    // First call: deals query for product interest
    mockQueryResult.mockResolvedValueOnce({
      data: [{ person_id: "p1" }, { person_id: "p2" }],
      error: null,
    });

    // Main query after filtering
    mockRange.mockResolvedValue({
      data: [{ id: "p1", full_name: "Alice" }],
      count: 1,
      error: null,
    });

    const result = await listPeople({
      ...baseParams,
      productInterest: "prod-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.items).toHaveLength(1);
  });

  it("filters by sourceCampaign using campaign_people lookup", async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ person_id: "p3" }],
      error: null,
    });

    mockRange.mockResolvedValue({
      data: [{ id: "p3", full_name: "Carol" }],
      count: 1,
      error: null,
    });

    const result = await listPeople({
      ...baseParams,
      sourceCampaign: "camp-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.items).toHaveLength(1);
  });

  it("filters by hasOpenDeal=true using deals lookup", async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [{ person_id: "p1" }],
      error: null,
    });

    mockRange.mockResolvedValue({
      data: [{ id: "p1", full_name: "Alice" }],
      count: 1,
      error: null,
    });

    const result = await listPeople({
      ...baseParams,
      hasOpenDeal: true,
    });

    expect(result.error).toBeNull();
    expect(result.data?.items).toHaveLength(1);
  });

  it("short-circuits to empty result when derived filter matches no one", async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await listPeople({
      ...baseParams,
      productInterest: "nonexistent-product",
    });

    expect(result.error).toBeNull();
    expect(result.data?.items).toHaveLength(0);
    expect(result.data?.total).toBe(0);
  });

  it("returns error when derived filter query fails", async () => {
    mockQueryResult.mockResolvedValueOnce({
      data: null,
      error: { message: "Query failed" },
    });

    const result = await listPeople({
      ...baseParams,
      productInterest: "prod-1",
    });

    expect(result.error).toBe("Query failed");
    expect(result.data).toBeNull();
  });
});
