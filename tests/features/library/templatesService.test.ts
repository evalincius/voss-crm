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
  getTemplateUsedInSummary,
  listTemplates,
} from "@/features/library/templates/services/templatesService";

describe("templatesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters templates by product linkage", async () => {
    mockQueryResult
      .mockResolvedValueOnce({
        data: [{ template_id: "template-1" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "template-1", title: "Template A" }],
        error: null,
      });

    const result = await listTemplates({
      organizationId: "org-1",
      search: "",
      statusFilter: "active",
      sort: "updated_desc",
      productId: "product-1",
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("returns used-in summary from interactions", async () => {
    mockQueryResult
      .mockResolvedValueOnce({ count: 7, error: null })
      .mockResolvedValueOnce({ count: 3, error: null })
      .mockResolvedValueOnce({ count: 2, error: null });

    const result = await getTemplateUsedInSummary("org-1", "template-1");

    expect(result.error).toBeNull();
    expect(result.data?.interactionsCount).toBe(7);
    expect(result.data?.interactionsWithDealCount).toBe(3);
    expect(result.data?.dealsIndirectCount).toBe(3);
    expect(result.data?.campaignCount).toBe(2);
  });
});
