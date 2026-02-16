import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUseCampaignDetail,
  mockUseCampaignMembers,
  mockUseArchiveCampaign,
  mockUseUnarchiveCampaign,
  mockUseRemovePersonFromCampaign,
  mockGetCampaignLinkedProducts,
  mockGetCampaignLinkedTemplates,
  mockListCampaignMemberDeals,
  mockNewLeadConversionDialog,
  mockMemberLeadConversionDialog,
} = vi.hoisted(() => ({
  mockUseCampaignDetail: vi.fn(),
  mockUseCampaignMembers: vi.fn(),
  mockUseArchiveCampaign: vi.fn(),
  mockUseUnarchiveCampaign: vi.fn(),
  mockUseRemovePersonFromCampaign: vi.fn(),
  mockGetCampaignLinkedProducts: vi.fn(),
  mockGetCampaignLinkedTemplates: vi.fn(),
  mockListCampaignMemberDeals: vi.fn(),
  mockNewLeadConversionDialog: vi.fn(),
  mockMemberLeadConversionDialog: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@/features/campaigns/hooks/useCampaigns", () => ({
  useCampaignDetail: mockUseCampaignDetail,
  useCampaignMembers: mockUseCampaignMembers,
  useArchiveCampaign: mockUseArchiveCampaign,
  useUnarchiveCampaign: mockUseUnarchiveCampaign,
  useRemovePersonFromCampaign: mockUseRemovePersonFromCampaign,
}));

vi.mock("@/features/campaigns/services/campaignsService", () => ({
  getCampaignLinkedProducts: mockGetCampaignLinkedProducts,
  getCampaignLinkedTemplates: mockGetCampaignLinkedTemplates,
  listCampaignMemberDeals: mockListCampaignMemberDeals,
}));

vi.mock("@/features/campaigns/components/CampaignFormDialog", () => ({
  CampaignFormDialog: () => null,
}));

vi.mock("@/features/campaigns/components/CampaignMetricsPanel", () => ({
  CampaignMetricsPanel: () => null,
}));

vi.mock("@/features/campaigns/components/CampaignMemberSearch", () => ({
  CampaignMemberSearch: () => null,
}));

vi.mock("@/features/campaigns/components/CampaignBulkConversionDialog", () => ({
  CampaignBulkConversionDialog: () => null,
}));

vi.mock("@/features/campaigns/components/CampaignLeadConversionDialog", () => ({
  CampaignLeadConversionDialog: (props: Record<string, unknown>) => {
    if (Object.prototype.hasOwnProperty.call(props, "memberPrefill")) {
      mockMemberLeadConversionDialog(props);
    } else {
      mockNewLeadConversionDialog(props);
    }
    return null;
  },
}));

import { CampaignDetailView } from "@/features/campaigns/components/CampaignDetailView";

function renderCampaignDetailView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignDetailView organizationId="org-1" userId="user-1" campaignId="camp-1" />
    </QueryClientProvider>,
  );
}

describe("CampaignDetailView product default wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCampaignDetail.mockReturnValue({
      data: {
        id: "camp-1",
        name: "Campaign",
        type: "cold_outreach",
        is_archived: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseCampaignMembers.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseArchiveCampaign.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseUnarchiveCampaign.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseRemovePersonFromCampaign.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockGetCampaignLinkedTemplates.mockResolvedValue({
      data: [],
      error: null,
    });

    mockListCampaignMemberDeals.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("passes defaultProductId when exactly one active linked product exists", async () => {
    mockGetCampaignLinkedProducts.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter", is_archived: false }],
      error: null,
    });

    renderCampaignDetailView();

    await waitFor(() =>
      expect(mockNewLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: "prod-1" }),
      ),
    );
    await waitFor(() =>
      expect(mockMemberLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: "prod-1" }),
      ),
    );
  });

  it("does not pass defaultProductId when no active linked product exists", async () => {
    mockGetCampaignLinkedProducts.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter", is_archived: true }],
      error: null,
    });

    renderCampaignDetailView();

    await waitFor(() =>
      expect(mockNewLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: null }),
      ),
    );
    await waitFor(() =>
      expect(mockMemberLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: null }),
      ),
    );
  });

  it("does not pass defaultProductId when multiple active linked products exist", async () => {
    mockGetCampaignLinkedProducts.mockResolvedValue({
      data: [
        { id: "prod-1", name: "Starter", is_archived: false },
        { id: "prod-2", name: "Pro", is_archived: false },
      ],
      error: null,
    });

    renderCampaignDetailView();

    await waitFor(() =>
      expect(mockNewLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: null }),
      ),
    );
    await waitFor(() =>
      expect(mockMemberLeadConversionDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ defaultProductId: null }),
      ),
    );
  });
});
