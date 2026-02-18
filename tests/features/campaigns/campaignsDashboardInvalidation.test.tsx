import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateCampaign,
  mockUpdateCampaign,
  mockArchiveCampaign,
  mockUnarchiveCampaign,
  mockAddPeopleToCampaign,
  mockRemovePersonFromCampaign,
  mockConvertCampaignLead,
  mockInvalidateDashboardForOrg,
} = vi.hoisted(() => ({
  mockCreateCampaign: vi.fn(),
  mockUpdateCampaign: vi.fn(),
  mockArchiveCampaign: vi.fn(),
  mockUnarchiveCampaign: vi.fn(),
  mockAddPeopleToCampaign: vi.fn(),
  mockRemovePersonFromCampaign: vi.fn(),
  mockConvertCampaignLead: vi.fn(),
  mockInvalidateDashboardForOrg: vi.fn(),
}));

vi.mock("@/features/campaigns/services/campaignsService", () => ({
  addPeopleToCampaign: mockAddPeopleToCampaign,
  archiveCampaign: mockArchiveCampaign,
  bulkConvertCampaignMembersToDeals: vi.fn(),
  convertCampaignLead: mockConvertCampaignLead,
  createCampaign: mockCreateCampaign,
  getCampaignById: vi.fn(),
  getCampaignLinkedProductIds: vi.fn(),
  getCampaignLinkedTemplateIds: vi.fn(),
  getCampaignMetrics: vi.fn(),
  getPersonCampaignMemberships: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaignOptions: vi.fn(),
  listCampaigns: vi.fn(),
  previewBulkCampaignDealDuplicates: vi.fn(),
  removePersonFromCampaign: mockRemovePersonFromCampaign,
  syncCampaignProducts: vi.fn(),
  syncCampaignTemplates: vi.fn(),
  unarchiveCampaign: mockUnarchiveCampaign,
  updateCampaign: mockUpdateCampaign,
}));

vi.mock("@/lib/dashboardInvalidation", () => ({
  invalidateDashboardForOrg: mockInvalidateDashboardForOrg,
}));

import {
  useAddPeopleToCampaign,
  useArchiveCampaign,
  useConvertCampaignLead,
  useCreateCampaign,
  useRemovePersonFromCampaign,
  useUnarchiveCampaign,
  useUpdateCampaign,
} from "@/features/campaigns/hooks/useCampaigns";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}

describe("campaign dashboard invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateDashboardForOrg.mockResolvedValue(undefined);
  });

  it("invalidates dashboard after campaign CRUD mutations", async () => {
    mockCreateCampaign.mockResolvedValue({
      data: { id: "camp-1", organization_id: "org-1" },
      error: null,
    });
    mockUpdateCampaign.mockResolvedValue({
      data: { id: "camp-1", organization_id: "org-1" },
      error: null,
    });
    mockArchiveCampaign.mockResolvedValue({
      data: { id: "camp-1", organization_id: "org-1" },
      error: null,
    });
    mockUnarchiveCampaign.mockResolvedValue({
      data: { id: "camp-1", organization_id: "org-1" },
      error: null,
    });

    const { wrapper } = createWrapper();
    const create = renderHook(() => useCreateCampaign(), { wrapper });
    const update = renderHook(() => useUpdateCampaign(), { wrapper });
    const archive = renderHook(() => useArchiveCampaign(), { wrapper });
    const unarchive = renderHook(() => useUnarchiveCampaign(), { wrapper });

    await act(async () => {
      await create.result.current.mutateAsync({} as never);
      await update.result.current.mutateAsync({} as never);
      await archive.result.current.mutateAsync("camp-1");
      await unarchive.result.current.mutateAsync("camp-1");
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledTimes(4);
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(1, expect.anything(), "org-1");
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(2, expect.anything(), "org-1");
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(3, expect.anything(), "org-1");
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(4, expect.anything(), "org-1");
  });

  it("invalidates dashboard after campaign member mutations", async () => {
    mockAddPeopleToCampaign.mockResolvedValue({ error: null });
    mockRemovePersonFromCampaign.mockResolvedValue({ error: null });

    const { wrapper } = createWrapper();
    const addPeople = renderHook(() => useAddPeopleToCampaign(), { wrapper });
    const removePerson = renderHook(() => useRemovePersonFromCampaign(), { wrapper });

    await act(async () => {
      await addPeople.result.current.mutateAsync({
        organizationId: "org-1",
        campaignId: "camp-1",
        personIds: ["p-1"],
        userId: "user-1",
      });
      await removePerson.result.current.mutateAsync({
        organizationId: "org-1",
        campaignId: "camp-1",
        personId: "p-1",
      });
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledTimes(2);
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(1, expect.anything(), "org-1");
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(2, expect.anything(), "org-1");
  });

  it("keeps invalidating dashboard for lead conversion", async () => {
    mockConvertCampaignLead.mockResolvedValue({
      data: { person_id: "p-1" },
      error: null,
    });

    const { wrapper } = createWrapper();
    const convert = renderHook(() => useConvertCampaignLead(), { wrapper });

    await act(async () => {
      await convert.result.current.mutateAsync({
        organizationId: "org-1",
        campaignId: "camp-1",
        personId: "p-1",
        conversionMode: "single",
        productId: "prod-1",
        stage: "prospect",
      } as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });
});
