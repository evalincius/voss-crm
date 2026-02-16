import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
} = vi.hoisted(() => ({
  mockUseCampaignDetail: vi.fn(),
  mockUseCampaignMembers: vi.fn(),
  mockUseArchiveCampaign: vi.fn(),
  mockUseUnarchiveCampaign: vi.fn(),
  mockUseRemovePersonFromCampaign: vi.fn(),
  mockGetCampaignLinkedProducts: vi.fn(),
  mockGetCampaignLinkedTemplates: vi.fn(),
  mockListCampaignMemberDeals: vi.fn(),
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

vi.mock("@/features/campaigns/components/CampaignLeadConversionDialog", () => ({
  CampaignLeadConversionDialog: () => null,
}));

vi.mock("@/features/campaigns/components/CampaignBulkConversionDialog", () => ({
  CampaignBulkConversionDialog: () => null,
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

describe("CampaignDetailView member deal actions", () => {
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
      data: [
        {
          id: "cp-1",
          person_id: "person-1",
          full_name: "Alice",
          email: "alice@example.com",
          lifecycle: "engaged",
          created_at: "2026-02-10T00:00:00Z",
        },
      ],
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

    mockGetCampaignLinkedProducts.mockResolvedValue({
      data: [],
      error: null,
    });

    mockGetCampaignLinkedTemplates.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("shows Deal action and opens deal sheet when campaign-attributed deal exists", async () => {
    mockListCampaignMemberDeals.mockResolvedValue({
      data: [
        {
          id: "deal-1",
          person_id: "person-1",
          person_name: "Alice",
          product_id: "prod-1",
          product_name: "Starter",
          stage: "offer_sent",
          value: 1000,
          currency: "USD",
          next_step_at: "2026-02-20T00:00:00Z",
          notes: "Warm response, preparing offer",
          created_at: "2026-02-10T00:00:00Z",
          updated_at: "2026-02-12T00:00:00Z",
        },
      ],
      error: null,
    });

    renderCampaignDetailView();

    await waitFor(() => expect(screen.getByRole("button", { name: "Deal" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Convert" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deal" })).toHaveClass(
      "bg-primary/15",
      "border-primary/35",
      "text-text-primary",
    );

    fireEvent.click(screen.getByRole("button", { name: "Deal" }));

    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Offer Sent")).toBeInTheDocument();
    expect(screen.getByText("Warm response, preparing offer")).toBeInTheDocument();
  });

  it("keeps Convert action when no campaign-attributed deal exists", async () => {
    mockListCampaignMemberDeals.mockResolvedValue({
      data: [],
      error: null,
    });

    renderCampaignDetailView();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Convert" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Deal" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convert" })).toHaveClass(
      "bg-primary",
      "text-black",
      "hover:bg-primary-hover",
    );
  });
});
