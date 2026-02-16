import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryResult, mockInsertSingle, mockMaybeSingle, mockRpc } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
  mockInsertSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
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
        not: vi.fn(() => builder),
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
  addPeopleToCampaign,
  bulkConvertCampaignMembersToDeals,
  convertCampaignLead,
  createCampaign,
  getCampaignMetrics,
  listCampaignMemberDeals,
  listCampaigns,
  previewBulkCampaignDealDuplicates,
} from "@/features/campaigns/services/campaignsService";

describe("campaignsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockReset();
  });

  it("lists campaigns", async () => {
    mockQueryResult.mockResolvedValue({
      data: [{ id: "camp-1", name: "Cold Q1" }],
      error: null,
    });

    const result = await listCampaigns({
      organizationId: "org-1",
      search: "",
      archiveFilter: "active",
      typeFilter: "all",
      sort: "updated_desc",
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("returns error on list failure", async () => {
    mockQueryResult.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await listCampaigns({
      organizationId: "org-1",
      search: "",
      archiveFilter: "active",
      typeFilter: "all",
      sort: "updated_desc",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("Database error");
  });

  it("creates a campaign", async () => {
    mockInsertSingle.mockResolvedValue({
      data: { id: "camp-1", name: "New Campaign", type: "cold_outreach" },
      error: null,
    });

    const result = await createCampaign({
      organization_id: "org-1",
      name: "New Campaign",
      type: "cold_outreach",
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("camp-1");
  });

  it("computes metrics from members, interactions, and deals", async () => {
    mockQueryResult
      .mockResolvedValueOnce({
        data: [{ person_id: "person-1" }, { person_id: "person-2" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ person_id: "person-2" }, { person_id: "person-3" }],
        error: null,
      })
      .mockResolvedValueOnce({ count: 4, error: null });

    const result = await getCampaignMetrics("org-1", "camp-1");

    expect(result.error).toBeNull();
    expect(result.data?.peopleAdded).toBe(2);
    expect(result.data?.peopleEngaged).toBe(1);
    expect(result.data?.dealsCreated).toBe(4);
  });

  it("lists campaign member deals", async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: "deal-1",
          person_id: "person-1",
          product_id: "product-1",
          stage: "prospect",
          value: 500,
          currency: "USD",
          next_step_at: null,
          notes: "Follow up tomorrow",
          created_at: "2026-02-10T00:00:00Z",
          updated_at: "2026-02-11T00:00:00Z",
          people: { full_name: "Alice" },
          products: { name: "Starter" },
        },
      ],
      error: null,
    });

    const result = await listCampaignMemberDeals("org-1", "camp-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      {
        id: "deal-1",
        person_id: "person-1",
        person_name: "Alice",
        product_id: "product-1",
        product_name: "Starter",
        stage: "prospect",
        value: 500,
        currency: "USD",
        next_step_at: null,
        notes: "Follow up tomorrow",
        created_at: "2026-02-10T00:00:00Z",
        updated_at: "2026-02-11T00:00:00Z",
      },
    ]);
  });

  it("addPeopleToCampaign deduplicates existing members", async () => {
    // First call: check existing members -> return person-1 as existing
    mockQueryResult.mockResolvedValueOnce({
      data: [{ person_id: "person-1" }],
      error: null,
    });

    // Insert should not include person-1 since it already exists
    // The insert mock won't be called if toInsert is empty
    const result = await addPeopleToCampaign({
      organizationId: "org-1",
      campaignId: "camp-1",
      personIds: ["person-1"],
      userId: "user-1",
    });

    expect(result.error).toBeNull();
  });

  it("addPeopleToCampaign inserts new members only", async () => {
    // First call: check existing members -> none exist
    mockQueryResult
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await addPeopleToCampaign({
      organizationId: "org-1",
      campaignId: "camp-1",
      personIds: ["person-2", "person-3"],
      userId: "user-1",
    });

    expect(result.error).toBeNull();
  });

  it("converts a campaign lead via RPC", async () => {
    mockRpc.mockResolvedValue({
      data: {
        person_id: "person-10",
        created_person: true,
        reused_existing_person: false,
        added_campaign_membership: true,
        deal_id: "deal-10",
        created_deal: true,
        had_open_duplicate: false,
        existing_duplicate_deal_id: null,
        interaction_id: "interaction-10",
        interaction_type: "email",
        conversion_mode: "contact_and_deal",
      },
      error: null,
    });

    const result = await convertCampaignLead({
      organizationId: "org-1",
      campaignId: "camp-1",
      mode: "contact_and_deal",
      personId: null,
      fullName: "New Person",
      email: "lead@example.com",
      phone: null,
      notes: null,
      lifecycle: "new",
      productId: "product-1",
      value: 1000,
      currency: "USD",
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    });

    expect(result.error).toBeNull();
    expect(result.data?.person_id).toBe("person-10");
    expect(mockRpc).toHaveBeenCalledWith("convert_campaign_lead", expect.any(Object));
  });

  it("previews bulk duplicates via RPC", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          person_id: "person-1",
          full_name: "Alice",
          duplicate_deal_id: "deal-existing",
          duplicate_stage: "offer_sent",
          duplicate_created_at: "2026-02-01T00:00:00Z",
        },
      ],
      error: null,
    });

    const result = await previewBulkCampaignDealDuplicates({
      organizationId: "org-1",
      campaignId: "camp-1",
      personIds: ["person-1"],
      productId: "product-1",
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.duplicate_stage).toBe("offer_sent");
  });

  it("converts members in bulk via RPC", async () => {
    mockRpc.mockResolvedValue({
      data: {
        total_requested: 2,
        created_deals: 1,
        skipped_duplicates: 1,
        errors: 0,
        results: [
          {
            person_id: "person-1",
            person_name: "Alice",
            status: "created",
            duplicate_deal_id: null,
            deal_id: "deal-1",
            interaction_id: "interaction-1",
            error: null,
          },
          {
            person_id: "person-2",
            person_name: "Bob",
            status: "skipped_duplicate",
            duplicate_deal_id: "deal-existing",
            deal_id: null,
            interaction_id: null,
            error: null,
          },
        ],
      },
      error: null,
    });

    const result = await bulkConvertCampaignMembersToDeals({
      organizationId: "org-1",
      campaignId: "camp-1",
      personIds: ["person-1", "person-2"],
      productId: "product-1",
      duplicateStrategy: "skip_duplicates",
      value: null,
      currency: null,
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    });

    expect(result.error).toBeNull();
    expect(result.data?.created_deals).toBe(1);
    expect(result.data?.skipped_duplicates).toBe(1);
    expect(result.data?.results).toHaveLength(2);
  });
});
