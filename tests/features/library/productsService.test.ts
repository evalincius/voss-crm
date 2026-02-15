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
        order: vi.fn(() => builder),
        neq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        not: vi.fn(() => builder),
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
  createProduct,
  getProductPerformanceSummary,
  listProducts,
} from "@/features/library/products/services/productsService";

describe("productsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists products", async () => {
    mockQueryResult.mockResolvedValue({
      data: [{ id: "product-1", name: "Offer A" }],
      error: null,
    });

    const result = await listProducts({
      organizationId: "org-1",
      search: "",
      archiveFilter: "active",
      sort: "updated_desc",
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("creates a product", async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: "product-1" }, error: null });

    const result = await createProduct({
      organization_id: "org-1",
      name: "Offer A",
      description: null,
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("product-1");
  });

  it("builds zero-safe product performance summary", async () => {
    mockQueryResult
      .mockResolvedValueOnce({
        data: [
          {
            template_id: "template-1",
            templates: {
              id: "template-1",
              title: "Cold opener",
              category: "cold_email",
              status: "approved",
            },
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            campaign_id: "campaign-1",
            campaigns: { id: "campaign-1", name: "Summer Push", type: "cold_outreach" },
          },
          {
            campaign_id: "campaign-2",
            campaigns: { id: "campaign-2", name: "Warm Leads", type: "warm_outreach" },
          },
        ],
        error: null,
      });

    const result = await getProductPerformanceSummary("org-1", "product-1");

    expect(result.error).toBeNull();
    expect(result.data?.stageCounts.prospect).toBe(0);
    expect(result.data?.linkedTemplates).toHaveLength(1);
    expect(result.data?.relatedCampaigns).toHaveLength(2);
    expect(result.data?.relatedCampaigns[0]).toEqual({
      id: "campaign-1",
      name: "Summer Push",
      type: "cold_outreach",
    });
  });
});
