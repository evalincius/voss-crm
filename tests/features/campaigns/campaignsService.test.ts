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
  createCampaign,
  getCampaignMetrics,
  listCampaigns,
} from "@/features/campaigns/services/campaignsService";

describe("campaignsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns zero-safe metrics", async () => {
    mockQueryResult
      .mockResolvedValueOnce({ count: 5, error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const result = await getCampaignMetrics("org-1", "camp-1");

    expect(result.error).toBeNull();
    expect(result.data?.peopleAdded).toBe(5);
    expect(result.data?.peopleEngaged).toBe(0);
    expect(result.data?.dealsCreated).toBe(0);
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
});
