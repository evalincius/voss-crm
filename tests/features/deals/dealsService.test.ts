import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryResult, mockInsertSingle, mockMaybeSingle } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
  mockInsertSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        or: vi.fn(() => builder),
        ilike: vi.fn(() => builder),
        order: vi.fn(() => builder),
        neq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: mockInsertSingle })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({ single: mockInsertSingle })),
          })),
        })),
        maybeSingle: mockMaybeSingle,
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(mockQueryResult()).then(resolve, reject),
      };

      return builder;
    }),
  },
}));

import {
  checkDuplicateDeal,
  createDeal,
  listDeals,
  listInteractionsByDeal,
  updateDealStage,
} from "@/features/deals/services/dealsService";

describe("dealsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists deals with joined names", async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: "deal-1",
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
          updated_at: "2026-01-01T00:00:00Z",
          people: { full_name: "Alice" },
          products: { name: "Widget" },
        },
      ],
      error: null,
    });

    const result = await listDeals({
      organizationId: "org-1",
      productId: null,
      personSearch: "",
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.person_name).toBe("Alice");
    expect(result.data?.[0]?.product_name).toBe("Widget");
  });

  it("returns error on list failure", async () => {
    mockQueryResult.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await listDeals({
      organizationId: "org-1",
      productId: null,
      personSearch: "",
    });

    expect(result.error).toBe("Database error");
    expect(result.data).toBeNull();
  });

  it("creates a deal", async () => {
    const newDeal = {
      id: "deal-new",
      organization_id: "org-1",
      person_id: "p1",
      product_id: "prod-1",
      stage: "prospect",
    };

    mockInsertSingle.mockResolvedValue({ data: newDeal, error: null });

    const result = await createDeal({
      organization_id: "org-1",
      person_id: "p1",
      product_id: "prod-1",
      campaign_id: null,
      value: null,
      currency: null,
      next_step_at: null,
      notes: null,
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("deal-new");
  });

  it("updates deal stage", async () => {
    mockInsertSingle.mockResolvedValue({
      data: { id: "deal-1", stage: "interested" },
      error: null,
    });

    const result = await updateDealStage("deal-1", "interested");

    expect(result.error).toBeNull();
    expect(result.data?.stage).toBe("interested");
  });

  it("checks for duplicate deals", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "deal-existing", stage: "offer_sent", created_at: "2026-01-01T00:00:00Z" },
      error: null,
    });

    const result = await checkDuplicateDeal("org-1", "p1", "prod-1");

    expect(result.error).toBeNull();
    expect(result.data?.stage).toBe("offer_sent");
  });

  it("returns null when no duplicate", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await checkDuplicateDeal("org-1", "p1", "prod-1");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("lists interactions by deal", async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: "int-1",
          type: "email",
          summary: "Follow-up email",
          occurred_at: "2026-01-05T00:00:00Z",
        },
      ],
      error: null,
    });

    const result = await listInteractionsByDeal("org-1", "deal-1");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.type).toBe("email");
  });
});
