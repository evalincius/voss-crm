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
        gt: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        lte: vi.fn(() => builder),
        or: vi.fn(() => builder),
        order: vi.fn(() => builder),
        neq: vi.fn(() => builder),
        not: vi.fn(() => builder),
        in: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(mockQueryResult()).then(resolve, reject),
      };

      return builder;
    }),
  },
}));

import {
  getPipelineSnapshot,
  getTopProducts,
  getTopCampaigns,
  getFollowUpsDue,
  getStaleDeals,
} from "@/features/dashboard/services/dashboardService";

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPipelineSnapshot", () => {
    it("counts deals per stage with zero-safe stages", async () => {
      mockQueryResult.mockResolvedValue({
        data: [
          { stage: "prospect", value: 1000 },
          { stage: "prospect", value: 2000 },
          { stage: "interested", value: 5000 },
        ],
        error: null,
      });

      const result = await getPipelineSnapshot("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      const prospect = result.data?.find((s) => s.stage === "prospect");
      expect(prospect?.count).toBe(2);
      expect(prospect?.total_value).toBe(3000);

      const interested = result.data?.find((s) => s.stage === "interested");
      expect(interested?.count).toBe(1);

      const lost = result.data?.find((s) => s.stage === "lost");
      expect(lost?.count).toBe(0);
      expect(lost?.total_value).toBe(0);
    });

    it("handles error", async () => {
      mockQueryResult.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const result = await getPipelineSnapshot("org-1");
      expect(result.error).toBe("DB error");
      expect(result.data).toBeNull();
    });
  });

  describe("getTopProducts", () => {
    it("returns products ranked by deal count", async () => {
      // Both queries run in parallel: products + deals
      mockQueryResult.mockResolvedValueOnce({
        data: [
          { id: "p1", name: "Enterprise" },
          { id: "p2", name: "Starter" },
        ],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [
          { product_id: "p1" },
          { product_id: "p1" },
          { product_id: "p2" },
          { product_id: "p1" },
          { product_id: "p2" },
        ],
        error: null,
      });

      const result = await getTopProducts("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.product_name).toBe("Enterprise");
      expect(result.data?.[0]?.deal_count).toBe(3);
      expect(result.data?.[1]?.product_name).toBe("Starter");
      expect(result.data?.[1]?.deal_count).toBe(2);
    });

    it("shows products with zero deals", async () => {
      mockQueryResult.mockResolvedValueOnce({
        data: [{ id: "p1", name: "Enterprise" }],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getTopProducts("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.product_name).toBe("Enterprise");
      expect(result.data?.[0]?.deal_count).toBe(0);
    });

    it("returns empty array when no products", async () => {
      mockQueryResult.mockResolvedValueOnce({ data: [], error: null });
      mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

      const result = await getTopProducts("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it("respects limit", async () => {
      mockQueryResult.mockResolvedValueOnce({
        data: [
          { id: "p1", name: "A" },
          { id: "p2", name: "B" },
          { id: "p3", name: "C" },
        ],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [{ product_id: "p1" }, { product_id: "p2" }, { product_id: "p3" }],
        error: null,
      });

      const result = await getTopProducts("org-1", 1);

      expect(result.data).toHaveLength(1);
    });
  });

  describe("getTopCampaigns", () => {
    it("returns campaigns ranked by member count", async () => {
      // Both queries run in parallel: campaigns + campaign_people
      mockQueryResult.mockResolvedValueOnce({
        data: [
          { id: "c1", name: "Cold Outreach" },
          { id: "c2", name: "Warm Leads" },
        ],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [{ campaign_id: "c1" }, { campaign_id: "c1" }, { campaign_id: "c2" }],
        error: null,
      });

      const result = await getTopCampaigns("org-1");

      expect(result.error).toBeNull();
      expect(result.data?.[0]?.campaign_name).toBe("Cold Outreach");
      expect(result.data?.[0]?.member_count).toBe(2);
      expect(result.data?.[1]?.campaign_name).toBe("Warm Leads");
      expect(result.data?.[1]?.member_count).toBe(1);
    });

    it("shows campaigns with zero members", async () => {
      mockQueryResult.mockResolvedValueOnce({
        data: [{ id: "c1", name: "Cold Outreach" }],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getTopCampaigns("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.campaign_name).toBe("Cold Outreach");
      expect(result.data?.[0]?.member_count).toBe(0);
    });

    it("returns empty array when no campaigns", async () => {
      mockQueryResult.mockResolvedValueOnce({ data: [], error: null });
      mockQueryResult.mockResolvedValueOnce({ data: [], error: null });

      const result = await getTopCampaigns("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("getFollowUpsDue", () => {
    const defaultParams = {
      horizonDays: 7,
      status: "all" as const,
      page: 1,
      pageSize: 25,
      customStart: null,
      customEnd: null,
    };

    it("merges and sorts follow-ups from deals and interactions", async () => {
      // First call: deals with next_step_at
      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "deal-1",
            person_id: "p1",
            stage: "prospect",
            next_step_at: "2026-02-20T00:00:00Z",
            people: { full_name: "Alice" },
            products: { name: "Enterprise" },
          },
        ],
        error: null,
      });
      // Second call: interactions with next_step_at
      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "int-1",
            person_id: "p2",
            deal_id: null,
            type: "call",
            summary: "Follow up",
            next_step_at: "2026-02-18T00:00:00Z",
            people: { full_name: "Bob" },
          },
        ],
        error: null,
      });

      const result = await getFollowUpsDue("org-1", defaultParams);

      expect(result.error).toBeNull();
      expect(result.data?.total).toBe(2);
      expect(result.data?.items).toHaveLength(2);
      // Sorted by next_step_at ascending — interaction first
      expect(result.data?.items[0]?.person_name).toBe("Bob");
      expect(result.data?.items[0]?.source).toBe("interaction");
      expect(result.data?.items[1]?.person_name).toBe("Alice");
      expect(result.data?.items[1]?.source).toBe("deal");
    });

    it("applies pagination after merge and sort", async () => {
      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "deal-1",
            person_id: "p1",
            stage: "prospect",
            next_step_at: "2026-02-18T00:00:00Z",
            people: { full_name: "Alice" },
            products: { name: "Enterprise" },
          },
          {
            id: "deal-2",
            person_id: "p2",
            stage: "prospect",
            next_step_at: "2026-02-19T00:00:00Z",
            people: { full_name: "Bruno" },
            products: { name: "Starter" },
          },
        ],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "int-1",
            person_id: "p3",
            deal_id: null,
            type: "call",
            summary: "Follow up",
            next_step_at: "2026-02-17T00:00:00Z",
            people: { full_name: "Carmen" },
          },
        ],
        error: null,
      });

      const result = await getFollowUpsDue("org-1", {
        ...defaultParams,
        pageSize: 2,
      });

      expect(result.error).toBeNull();
      expect(result.data?.total).toBe(3);
      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.items[0]?.person_name).toBe("Carmen");
      expect(result.data?.items[1]?.person_name).toBe("Alice");
    });

    it("handles error on deals query", async () => {
      mockQueryResult.mockResolvedValueOnce({
        data: null,
        error: { message: "Deal error" },
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getFollowUpsDue("org-1", defaultParams);

      expect(result.error).toBe("Deal error");
    });
  });

  describe("getStaleDeals", () => {
    it("filters deals by staleness threshold", async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      // Deals query
      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "stale-deal",
            person_id: "p1",
            product_id: "prod-1",
            stage: "prospect",
            value: 1000,
            currency: "EUR",
            created_at: thirtyDaysAgo,
            people: { full_name: "Alice" },
            products: { name: "Widget" },
          },
          {
            id: "fresh-deal",
            person_id: "p2",
            product_id: "prod-2",
            stage: "interested",
            value: 2000,
            currency: "EUR",
            created_at: twoDaysAgo,
            people: { full_name: "Bob" },
            products: { name: "Other" },
          },
        ],
        error: null,
      });
      // Interactions query
      mockQueryResult.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getStaleDeals("org-1", 14);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.id).toBe("stale-deal");
      expect(result.data?.[0]?.days_stale).toBeGreaterThanOrEqual(29);
    });

    it("calculates days_stale using latest interaction", async () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      mockQueryResult.mockResolvedValueOnce({
        data: [
          {
            id: "deal-1",
            person_id: "p1",
            product_id: "prod-1",
            stage: "offer_sent",
            value: 5000,
            currency: "EUR",
            created_at: fortyDaysAgo,
            people: { full_name: "Alice" },
            products: { name: "Widget" },
          },
        ],
        error: null,
      });
      mockQueryResult.mockResolvedValueOnce({
        data: [{ deal_id: "deal-1", occurred_at: fiveDaysAgo }],
        error: null,
      });

      const result = await getStaleDeals("org-1", 7);

      // Deal has interaction 5 days ago, threshold is 7 → NOT stale
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it("returns empty array when no deals", async () => {
      mockQueryResult.mockResolvedValue({ data: [], error: null });

      const result = await getStaleDeals("org-1", 14);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
