import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockInteractionsOrder,
  mockInsertSingle,
  mockDeleteEqPerson,
  mockDealsMaybeSingle,
  mockDealsByPersonOrder,
  mockTemplateByProductOrder,
  mockCampaignsOrder,
  mockCampaignProductsOrder,
} = vi.hoisted(() => ({
  mockInteractionsOrder: vi.fn(),
  mockInsertSingle: vi.fn(),
  mockDeleteEqPerson: vi.fn(),
  mockDealsMaybeSingle: vi.fn(),
  mockDealsByPersonOrder: vi.fn(),
  mockTemplateByProductOrder: vi.fn(),
  mockCampaignsOrder: vi.fn(),
  mockCampaignProductsOrder: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "interactions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: mockInteractionsOrder,
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: mockInsertSingle,
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: mockDeleteEqPerson,
              })),
            })),
          })),
        };
      }

      if (table === "deals") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mockDealsMaybeSingle,
                order: mockDealsByPersonOrder,
              })),
            })),
          })),
        };
      }

      if (table === "template_products") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: mockTemplateByProductOrder,
              })),
            })),
          })),
        };
      }

      if (table === "campaigns") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: mockCampaignsOrder,
              })),
            })),
          })),
        };
      }

      if (table === "campaign_products") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockCampaignProductsOrder,
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  },
}));

import {
  createInteraction,
  deleteInteraction,
  getInteractionDealContext,
  listInteractionCampaignOptions,
  listInteractionDealsByPerson,
  listInteractionTemplateOptionsByProduct,
  listInteractionsByPerson,
} from "@/features/interactions/services/interactionsService";

describe("interactionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists interactions by person", async () => {
    mockInteractionsOrder.mockResolvedValue({ data: [{ id: "interaction-1" }], error: null });

    const result = await listInteractionsByPerson("org-1", "person-1", "created_desc");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("creates an interaction", async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: "interaction-1" }, error: null });

    const result = await createInteraction({
      organization_id: "org-1",
      person_id: "person-1",
      type: "note",
      summary: "Followed up",
      next_step_at: null,
      occurred_at: new Date().toISOString(),
      deal_id: null,
      campaign_id: null,
      template_id: null,
      product_id: null,
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("interaction-1");
  });

  it("deletes an interaction", async () => {
    mockDeleteEqPerson.mockResolvedValue({ error: null });

    const result = await deleteInteraction("interaction-1", "org-1", "person-1");

    expect(result.error).toBeNull();
  });

  it("returns deal context with product and campaign names", async () => {
    mockDealsMaybeSingle.mockResolvedValue({
      data: {
        id: "deal-1",
        product_id: "prod-1",
        campaign_id: "camp-1",
        people: { full_name: "Alex Carter" },
        products: { name: "Starter Plan" },
        campaigns: { name: "Q1 Launch" },
      },
      error: null,
    });

    const result = await getInteractionDealContext("org-1", "deal-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(
      expect.objectContaining({
        deal_id: "deal-1",
        product_id: "prod-1",
        campaign_id: "camp-1",
        deal_label: "Alex Carter - Starter Plan",
        product_name: "Starter Plan",
        campaign_name: "Q1 Launch",
      }),
    );
  });

  it("lists deals scoped by person for interaction options", async () => {
    mockDealsByPersonOrder.mockResolvedValue({
      data: [
        {
          id: "deal-1",
          product_id: "prod-1",
          campaign_id: null,
          stage: "prospect",
          products: { name: "Starter Plan" },
        },
      ],
      error: null,
    });

    const result = await listInteractionDealsByPerson("org-1", "person-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      {
        id: "deal-1",
        label: "Starter Plan (prospect)",
        product_id: "prod-1",
        campaign_id: null,
      },
    ]);
  });

  it("lists templates by product and excludes archived templates", async () => {
    mockTemplateByProductOrder.mockResolvedValue({
      data: [
        { templates: { id: "tpl-1", title: "Welcome", status: "approved" } },
        { templates: { id: "tpl-2", title: "Old", status: "archived" } },
        { templates: { id: "tpl-1", title: "Welcome", status: "approved" } },
      ],
      error: null,
    });

    const result = await listInteractionTemplateOptionsByProduct("org-1", "prod-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: "tpl-1", title: "Welcome" }]);
  });

  it("includes campaign-associated product in campaign options", async () => {
    mockCampaignsOrder.mockResolvedValue({
      data: [
        { id: "camp-1", name: "Q1" },
        { id: "camp-2", name: "Q2" },
      ],
      error: null,
    });
    mockCampaignProductsOrder.mockResolvedValue({
      data: [
        { campaign_id: "camp-1", product_id: "prod-1" },
        { campaign_id: "camp-1", product_id: "prod-2" },
      ],
      error: null,
    });

    const result = await listInteractionCampaignOptions("org-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      { id: "camp-1", name: "Q1", product_id: "prod-1" },
      { id: "camp-2", name: "Q2", product_id: null },
    ]);
  });
});
